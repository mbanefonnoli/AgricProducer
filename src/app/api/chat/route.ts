import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

// DeepSeek is OpenAI-compatible
const deepseek = createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();
    const supabase = createServerClient();

    // Get current user session for data isolation
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
        return new Response('Unauthorized', { status: 401 });
    }

    // Fetch Profile to determine producer context (Self or Employer)
    const { data: profile } = await supabase
        .from('producers')
        .select('employer_id, role')
        .eq('id', userId)
        .single();

    // Determine target producer ID
    const targetProducerId = profile?.role === 'employee' && profile?.employer_id
        ? profile.employer_id
        : userId;

    const result = await streamText({
        model: deepseek('deepseek-chat') as any,
        messages,
        system: `You are an AI assistant for a European Agricultural Producer Dashboard. 
    You help farmers manage stock, clients, and finances. 
    Your current producer ID is ${targetProducerId}. All operations must be restricted to this ID.
    Be professional, concise, and helpful.`,
        tools: {
            get_stock_levels: {
                description: 'Get current stock levels for products from the database',
                parameters: z.object({}),
                execute: async () => {
                    const { data, error } = await supabase
                        .from('inventory')
                        .select('product_name, quantity, unit')
                        .eq('producer_id', targetProducerId);

                    if (error) throw error;
                    return data as any[];
                },
            },
            add_stock_entry: {
                description: 'Log a new stock entry into the inventory and ledger',
                parameters: z.object({
                    amount: z.number().describe('Amount to add or subtract'),
                    product_name: z.string().describe('Name of the product'),
                    reason: z.string().describe('Reason for the entry (harvest, sale, etc.)'),
                }),
                execute: async ({ amount, product_name, reason }: any) => {
                    let { data: items } = await supabase
                        .from('inventory')
                        .select('id, quantity')
                        .eq('product_name', product_name)
                        .eq('producer_id', targetProducerId)
                        .limit(1) as any;

                    let itemId;
                    let currentQuantity = 0;

                    if (!items || items.length === 0) {
                        const { data: newItem, error: createError } = await supabase
                            .from('inventory')
                            .insert({
                                product_name,
                                quantity: amount,
                                unit: 'units',
                                producer_id: targetProducerId
                            } as any)
                            .select()
                            .single() as any;
                        if (createError) throw createError;
                        itemId = newItem.id;
                    } else {
                        itemId = items[0].id;
                        currentQuantity = Number(items[0].quantity);

                        const { error: updateError } = await supabase
                            .from('inventory')
                            .update({ quantity: currentQuantity + amount, last_updated: new Date().toISOString() } as any)
                            .eq('id', itemId)
                            .eq('producer_id', targetProducerId);
                        if (updateError) throw updateError;
                    }

                    const { error: ledgerError } = await supabase
                        .from('inventory_ledger')
                        .insert({
                            inventory_id: itemId,
                            amount: amount,
                            reason: reason
                        } as any);

                    if (ledgerError) throw ledgerError;

                    return { success: true, message: `Successfully updated ${product_name} by ${amount}.` };
                },
            },
            create_client: {
                description: 'Create a new client record in the database',
                parameters: z.object({
                    name: z.string().describe('Name of the client'),
                    email: z.string().optional().describe('Email of the client'),
                    details: z.string().optional().describe('Additional details about the client'),
                }),
                execute: async ({ name, email, details }: any) => {
                    const { data, error } = await supabase
                        .from('clients')
                        .insert({ name, email, details, producer_id: targetProducerId } as any)
                        .select()
                        .single() as any;

                    if (error) throw error;
                    return { success: true, client: data, message: `Client ${name} created successfully.` };
                },
            },
            summarize_finances: {
                description: 'Aggregate financial data from the transactions table',
                parameters: z.object({}),
                execute: async () => {
                    const { data, error } = await supabase
                        .from('transactions')
                        .select('type, amount')
                        .eq('producer_id', targetProducerId);

                    if (error) throw error;

                    const summary = ((data as any[]) || []).reduce((acc: any, t) => {
                        if (t.type === 'income') acc.income += Number(t.amount);
                        else acc.expenses += Number(t.amount);
                        return acc;
                    }, { income: 0, expenses: 0 });

                    return {
                        total_income: summary.income,
                        total_expenses: summary.expenses,
                        net_profit: summary.income - summary.expenses,
                        currency: 'EUR'
                    };
                },
            },
        } as any,
    });

    return (result as any).toDataStreamResponse();
}
