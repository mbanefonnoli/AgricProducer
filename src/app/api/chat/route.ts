import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages } from 'ai';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

const deepseek = createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
});

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();
    const supabase = createServerClient();

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { data: profile } = await supabase
        .from('producers')
        .select('employer_id, role')
        .eq('id', userId)
        .single();

    const targetProducerId = profile?.role === 'employee' && profile?.employer_id
        ? profile.employer_id
        : userId;

    const isEmployee = profile?.role === 'employee';

    const result = await streamText({
        model: deepseek('deepseek-chat') as any,
        messages: await convertToModelMessages(messages),
        maxSteps: 5,
        system: `You are an AI assistant for a European Agricultural Producer Dashboard.
You help farmers manage stock, clients, finances, and tasks.
Current producer ID: ${targetProducerId}. User role: ${profile?.role || 'company'}.
All data operations must be scoped to this producer ID. Be concise and professional.`,
        tools: {
            // ── INVENTORY ──────────────────────────────────────────────────
            get_stock_levels: {
                description: 'Get current stock levels for all products',
                parameters: z.object({}),
                execute: async () => {
                    const { data, error } = await supabase
                        .from('inventory')
                        .select('product_name, quantity, unit, buying_price, selling_price')
                        .eq('producer_id', targetProducerId);
                    if (error) throw error;
                    return data as any[];
                },
            },
            add_stock_entry: {
                description: 'Log a new stock entry into inventory and ledger',
                parameters: z.object({
                    amount: z.number().describe('Amount to add (positive) or subtract (negative)'),
                    product_name: z.string().describe('Name of the product'),
                    reason: z.string().describe('Reason: harvest, sale, spoilage, purchase, etc.'),
                }),
                execute: async ({ amount, product_name, reason }: any) => {
                    let { data: items } = await supabase
                        .from('inventory')
                        .select('id, quantity')
                        .ilike('product_name', product_name)
                        .eq('producer_id', targetProducerId)
                        .limit(1) as any;

                    let itemId: string;

                    if (!items || items.length === 0) {
                        const { data: newItem, error } = await supabase
                            .from('inventory')
                            .insert({ product_name, quantity: amount, unit: 'units', producer_id: targetProducerId } as any)
                            .select().single() as any;
                        if (error) throw error;
                        itemId = newItem.id;
                    } else {
                        itemId = items[0].id;
                        const { error } = await supabase
                            .from('inventory')
                            .update({ quantity: Number(items[0].quantity) + amount, last_updated: new Date().toISOString() } as any)
                            .eq('id', itemId).eq('producer_id', targetProducerId);
                        if (error) throw error;
                    }

                    const { error: ledgerError } = await supabase
                        .from('inventory_ledger')
                        .insert({ inventory_id: itemId, amount, reason } as any);
                    if (ledgerError) throw ledgerError;

                    return { success: true, message: `Updated ${product_name} by ${amount}.` };
                },
            },

            // ── CLIENTS ─────────────────────────────────────────────────────
            create_client: {
                description: 'Create a new client record',
                parameters: z.object({
                    name: z.string(),
                    email: z.string().optional(),
                    details: z.string().optional(),
                }),
                execute: async ({ name, email, details }: any) => {
                    const { data, error } = await supabase
                        .from('clients')
                        .insert({ name, email, details, producer_id: targetProducerId } as any)
                        .select().single() as any;
                    if (error) throw error;
                    return { success: true, client: data };
                },
            },

            // ── FINANCES ────────────────────────────────────────────────────
            summarize_finances: {
                description: 'Get a financial summary with total income, expenses, and net profit',
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
                        currency: 'EUR',
                    };
                },
            },

            // ── TASKS ───────────────────────────────────────────────────────
            get_tasks: {
                description: 'Fetch tasks for the current producer. Optionally filter by status.',
                parameters: z.object({
                    status: z.enum(['pending', 'in_progress', 'done', 'all']).optional()
                        .describe('Filter by status, or "all" for everything'),
                }),
                execute: async ({ status }: any) => {
                    let query = supabase
                        .from('tasks')
                        .select('id, title, description, status, priority, due_date, start_date, assignee:assigned_to(name, surname)')
                        .eq('producer_id', targetProducerId)
                        .order('created_at', { ascending: false });

                    if (status && status !== 'all') {
                        query = query.eq('status', status);
                    }

                    const { data, error } = await query;
                    if (error) throw error;
                    return data as any[];
                },
            },
            create_task: {
                description: 'Create a new task. Optionally assign to an employee by partial name.',
                parameters: z.object({
                    title: z.string().describe('Task title'),
                    description: z.string().optional().describe('Task description'),
                    priority: z.enum(['low', 'normal', 'high']).optional().describe('Priority level'),
                    due_date: z.string().optional().describe('Due date in YYYY-MM-DD format'),
                    assign_to_name: z.string().optional()
                        .describe('Partial first name of the employee to assign to'),
                }),
                execute: async ({ title, description, priority, due_date, assign_to_name }: any) => {
                    let assignedToId: string | null = null;

                    if (assign_to_name) {
                        const { data: employees } = await supabase
                            .from('producers')
                            .select('id, name')
                            .eq('employer_id', targetProducerId)
                            .eq('role', 'employee')
                            .ilike('name', `%${assign_to_name}%`)
                            .limit(1);

                        if (employees && employees.length > 0) {
                            assignedToId = (employees[0] as any).id;
                        }
                    } else if (isEmployee) {
                        assignedToId = userId;
                    }

                    const { data, error } = await supabase
                        .from('tasks')
                        .insert({
                            producer_id: targetProducerId,
                            title,
                            description: description || null,
                            priority: priority || 'normal',
                            assigned_to: assignedToId,
                            due_date: due_date || null,
                            status: 'pending',
                        } as any)
                        .select()
                        .single();

                    if (error) throw error;
                    return { success: true, task: data, message: `Task "${title}" created successfully.` };
                },
            },
            update_task_status: {
                description: 'Update the status of a task. Find it by title (partial match) or exact ID.',
                parameters: z.object({
                    status: z.enum(['pending', 'in_progress', 'done']).describe('New status'),
                    task_id: z.string().optional().describe('Exact task UUID'),
                    task_title: z.string().optional().describe('Partial task title to search for'),
                }),
                execute: async ({ status, task_id, task_title }: any) => {
                    if (!task_id && !task_title) {
                        throw new Error('Provide either task_id or task_title');
                    }

                    let query = supabase.from('tasks').update({ status });

                    if (task_id) {
                        query = query.eq('id', task_id);
                    } else {
                        query = query
                            .ilike('title', `%${task_title}%`)
                            .eq('producer_id', targetProducerId);
                    }

                    const { error } = await query;
                    if (error) throw error;
                    return { success: true, message: `Task marked as "${status}".` };
                },
            },
        } as any,
    });

    return result.toUIMessageStreamResponse();
}
