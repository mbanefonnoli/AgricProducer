export interface Transaction {
    id: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description: string | null;
    created_at: string;
}

interface TransactionListProps {
    transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
    return (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Description</th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                    {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                                {new Date(t.created_at).toLocaleDateString()}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {t.category}
                                </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                {t.description || "-"}
                            </td>
                            <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {t.type === 'income' ? '+' : '-'}€{t.amount.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
