import { FinancialSummary } from "@/components/finances/financial-summary";
import { TransactionList } from "@/components/finances/transaction-list";
import { FinancesActions } from "@/components/finances/finances-actions";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FinancesPage() {
    const supabase = createServerClient();

    const { data: { session } } = await supabase.auth.getSession();
    const producerId = session?.user?.id;

    const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
            *,
            inventory:inventory_id (product_name),
            client:client_id (name)
        `)
        .eq('producer_id', producerId)
        .order('created_at', { ascending: false });

    if (error) console.error("Error fetching transactions:", error);

    const transactionItems = ((transactions as any[]) || []).map(t => ({
        id: t.id,
        type: t.type as 'income' | 'expense',
        category: t.category,
        amount: Number(t.amount),
        description: t.description,
        product_name: t.inventory?.product_name || null,
        client_name: t.client?.name || null,
        created_at: t.created_at,
    }));

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <FinancesActions producerId={producerId!} transactions={transactionItems} />

            <FinancialSummary />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-800">Transaction History</h2>
                    <span className="text-xs text-slate-400">
                        {transactionItems.length} record{transactionItems.length !== 1 ? 's' : ''}
                    </span>
                </div>
                {transactionItems.length > 0 ? (
                    <TransactionList transactions={transactionItems} />
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                        <p className="text-slate-500 text-sm">No transactions yet. Click "Log Transaction" to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
