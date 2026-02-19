import { FinancialSummary } from "@/components/finances/financial-summary";
import { TransactionList } from "@/components/finances/transaction-list";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FinancesPage() {
    const supabase = createServerClient();

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const producerId = session?.user?.id;

    // Fetch real transactions with linked inventory and client data
    const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
            *,
            inventory:inventory_id (
                product_name
            ),
            client:client_id (
                name
            )
        `)
        .eq('producer_id', producerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching transactions:", error);
    }

    const transactionItems = ((transactions as any[]) || []).map(t => ({
        id: t.id,
        type: t.type as 'income' | 'expense',
        category: t.category,
        amount: Number(t.amount),
        description: t.description,
        product_name: t.inventory?.product_name || null,
        client_name: t.client?.name || null,
        created_at: t.created_at
    }));

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Financial Hub</h1>
                    <p className="text-slate-500">Monitor your profit, expenses, and overall financial health.</p>
                </div>
                <div className="flex gap-3">
                    <button className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors">
                        Export PDF (Demo)
                    </button>
                    <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">
                        Log Transaction
                    </button>
                </div>
            </div>

            <FinancialSummary />

            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-800">Recent Transactions</h2>
                {transactionItems.length > 0 ? (
                    <TransactionList transactions={transactionItems} />
                ) : (
                    <div className="rounded-lg border bg-white p-12 text-center text-slate-500">
                        No transactions found. Log a sale or expense to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
