import { createServerClient } from "@/lib/supabase/server";

export async function FinancialSummary() {
    const supabase = createServerClient();

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const producerId = session?.user?.id;

    // Fetch transactions for calculation filtered by producer_id
    const { data: transactions } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('producer_id', producerId);

    const totals = ((transactions as any[]) || []).reduce((acc, t) => {
        if (t.type === 'income') acc.income += Number(t.amount);
        else acc.expenses += Number(t.amount);
        return acc;
    }, { income: 0, expenses: 0 });

    const netProfit = totals.income - totals.expenses;

    const stats = [
        { name: "Total Income", value: `€${totals.income.toLocaleString()}`, trend: "up" },
        { name: "Total Expenses", value: `€${totals.expenses.toLocaleString()}`, trend: "down" },
        { name: "Net Profit", value: `€${netProfit.toLocaleString()}`, trend: netProfit >= 0 ? "up" : "down" },
        { name: "Transaction Count", value: `${(transactions || []).length}`, trend: "neutral" },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <div key={stat.name} className="rounded-lg border bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                    <div className="mt-2 flex items-baseline justify-between">
                        <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                        <span className={`text-xs font-medium ${stat.trend === "up" ? "text-green-600" :
                            stat.trend === "down" ? "text-red-600" : "text-slate-600"
                            }`}>
                            {stat.trend === "neutral" ? "Active" : stat.trend === "up" ? "↑" : "↓"}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
