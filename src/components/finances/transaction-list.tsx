"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Trash2, Loader2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export interface Transaction {
    id: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description: string | null;
    product_name?: string | null;
    client_name?: string | null;
    created_at: string;
}

type SortField = 'created_at' | 'category' | 'amount' | 'product_name' | 'client_name';
type SortDirection = 'asc' | 'desc';

interface TransactionListProps {
    transactions: Transaction[];
}

function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField | null; sortDirection: SortDirection }) {
    if (sortField !== field) return <ChevronsUpDown className="h-3.5 w-3.5 ml-1 text-slate-400 inline" />;
    return sortDirection === 'asc'
        ? <ChevronUp className="h-3.5 w-3.5 ml-1 text-blue-600 inline" />
        : <ChevronDown className="h-3.5 w-3.5 ml-1 text-blue-600 inline" />;
}

export function TransactionList({ transactions }: TransactionListProps) {
    const router = useRouter();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const supabase = createBrowserClient();

    const toggleSelectAll = () => {
        if (selected.size === transactions.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(transactions.map(t => t.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selected);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelected(newSelected);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedTransactions = [...transactions].sort((a, b) => {
        if (!sortField) return 0;
        let aVal: any, bVal: any;
        switch (sortField) {
            case 'created_at': aVal = new Date(a.created_at).getTime(); bVal = new Date(b.created_at).getTime(); break;
            case 'amount': aVal = a.amount; bVal = b.amount; break;
            case 'category': aVal = (a.category || '').toLowerCase(); bVal = (b.category || '').toLowerCase(); break;
            case 'product_name': aVal = (a.product_name || '').toLowerCase(); bVal = (b.product_name || '').toLowerCase(); break;
            case 'client_name': aVal = (a.client_name || '').toLowerCase(); bVal = (b.client_name || '').toLowerCase(); break;
            default: return 0;
        }
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete these transactions? This action cannot be undone.")) return;
        setLoading(true);
        try {
            const ids = Array.from(selected);
            const { error } = await supabase.from('transactions').delete().in('id', ids);
            if (error) throw error;
            toast.success("Transactions deleted successfully");
            setSelected(new Set());
            router.refresh();
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error("Failed to delete transactions");
        } finally {
            setLoading(false);
        }
    };

    const thSortable = "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700 select-none";

    return (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            {selected.size > 0 && (
                <div className="bg-slate-50 p-2 flex justify-end border-b border-slate-200">
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="flex items-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Delete Selected ({selected.size})
                    </button>
                </div>
            )}
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 w-10">
                            <input
                                type="checkbox"
                                checked={transactions.length > 0 && selected.size === transactions.length}
                                onChange={toggleSelectAll}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                        </th>
                        <th className={thSortable} onClick={() => handleSort('created_at')}>
                            <span className="flex items-center">
                                Date <SortIcon field="created_at" sortField={sortField} sortDirection={sortDirection} />
                            </span>
                        </th>
                        <th className={thSortable} onClick={() => handleSort('category')}>
                            <span className="flex items-center">
                                Category <SortIcon field="category" sortField={sortField} sortDirection={sortDirection} />
                            </span>
                        </th>
                        <th className={thSortable} onClick={() => handleSort('product_name')}>
                            <span className="flex items-center">
                                Product <SortIcon field="product_name" sortField={sortField} sortDirection={sortDirection} />
                            </span>
                        </th>
                        <th className={thSortable} onClick={() => handleSort('client_name')}>
                            <span className="flex items-center">
                                Client <SortIcon field="client_name" sortField={sortField} sortDirection={sortDirection} />
                            </span>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                            Description
                        </th>
                        <th className={thSortable + " text-right"} onClick={() => handleSort('amount')}>
                            <span className="flex items-center justify-end">
                                Amount <SortIcon field="amount" sortField={sortField} sortDirection={sortDirection} />
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                    {sortedTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                                <input
                                    type="checkbox"
                                    checked={selected.has(t.id)}
                                    onChange={() => toggleSelect(t.id)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                                {new Date(t.created_at).toLocaleDateString()}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {t.category}
                                </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900 font-medium">
                                {t.product_name || <span className="text-slate-400">—</span>}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                {t.client_name || <span className="text-slate-400">—</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                                {t.description || "—"}
                            </td>
                            <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {t.type === 'income' ? '+' : '-'}€{t.amount.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    {transactions.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                                No transactions found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
