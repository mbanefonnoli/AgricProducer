"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Download } from "lucide-react";
import { TransactionForm } from "@/components/finances/transaction-form";
import { Transaction } from "@/components/finances/transaction-list";

interface FinancesActionsProps {
    producerId: string;
    transactions: Transaction[];
}

function exportCSV(transactions: Transaction[]) {
    const headers = ['Date', 'Type', 'Category', 'Amount (€)', 'Description', 'Client', 'Product'];
    const rows = transactions.map(t => [
        new Date(t.created_at).toLocaleDateString('en-GB'),
        t.type,
        t.category,
        t.amount.toFixed(2),
        t.description ?? '',
        t.client_name ?? '',
        t.product_name ?? '',
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

export function FinancesActions({ producerId, transactions }: FinancesActionsProps) {
    const [showForm, setShowForm] = useState(false);
    const router = useRouter();

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Financial Hub</h1>
                    <p className="text-slate-500 font-medium">Monitor your profit, expenses, and overall financial health.</p>
                </div>
                <div className="flex items-center gap-3 self-start md:self-auto">
                    <button
                        onClick={() => exportCSV(transactions)}
                        disabled={transactions.length === 0}
                        className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 font-medium py-2.5 px-4 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-40"
                        title={transactions.length === 0 ? 'No transactions to export' : `Export ${transactions.length} transactions`}
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Log Transaction
                    </button>
                </div>
            </div>

            {showForm && (
                <TransactionForm
                    producerId={producerId}
                    onSuccess={() => { setShowForm(false); router.refresh(); }}
                    onCancel={() => setShowForm(false)}
                />
            )}
        </div>
    );
}
