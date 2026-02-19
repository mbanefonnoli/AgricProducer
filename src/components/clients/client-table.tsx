"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Trash2, Loader2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export interface Client {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    details: string | null;
    created_at: string;
}

type SortField = 'name' | 'email' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface ClientTableProps {
    clients: Client[];
    onRefresh?: () => void;
}

function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField | null; sortDirection: SortDirection }) {
    if (sortField !== field) return <ChevronsUpDown className="h-3.5 w-3.5 ml-1 text-slate-400 inline" />;
    return sortDirection === 'asc'
        ? <ChevronUp className="h-3.5 w-3.5 ml-1 text-blue-600 inline" />
        : <ChevronDown className="h-3.5 w-3.5 ml-1 text-blue-600 inline" />;
}

export function ClientTable({ clients, onRefresh }: ClientTableProps) {
    const router = useRouter();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const supabase = createBrowserClient();

    const toggleSelectAll = () => {
        if (selected.size === clients.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(clients.map(c => c.id)));
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

    const sortedClients = [...clients].sort((a, b) => {
        if (!sortField) return 0;
        let aVal: any, bVal: any;
        if (sortField === 'created_at') {
            aVal = new Date(a.created_at).getTime();
            bVal = new Date(b.created_at).getTime();
        } else {
            aVal = (a[sortField] || '').toLowerCase();
            bVal = (b[sortField] || '').toLowerCase();
        }
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete these clients? This action cannot be undone.")) return;
        setLoading(true);
        try {
            const ids = Array.from(selected);
            const { error } = await supabase.from('clients').delete().in('id', ids);
            if (error) throw error;
            toast.success("Clients deleted successfully");
            setSelected(new Set());
            if (onRefresh) onRefresh();
            else router.refresh();
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error("Failed to delete clients");
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
                                checked={clients.length > 0 && selected.size === clients.length}
                                onChange={toggleSelectAll}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                        </th>
                        <th className={thSortable} onClick={() => handleSort('name')}>
                            <span className="flex items-center">
                                Name <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
                            </span>
                        </th>
                        <th className={thSortable} onClick={() => handleSort('email')}>
                            <span className="flex items-center">
                                Contact <SortIcon field="email" sortField={sortField} sortDirection={sortDirection} />
                            </span>
                        </th>
                        <th className={thSortable} onClick={() => handleSort('created_at')}>
                            <span className="flex items-center">
                                Created <SortIcon field="created_at" sortField={sortField} sortDirection={sortDirection} />
                            </span>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                    {sortedClients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                                <input
                                    type="checkbox"
                                    checked={selected.has(client.id)}
                                    onChange={() => toggleSelect(client.id)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="text-sm font-medium text-slate-900">{client.name}</div>
                                <div className="text-xs text-slate-500">{client.details}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="text-sm text-slate-600">{client.email || "No email"}</div>
                                <div className="text-xs text-slate-500">{client.phone || "No phone"}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                                {new Date(client.created_at).toLocaleDateString()}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                <button className="text-slate-900 hover:text-slate-700 mr-4">View</button>
                                <button className="text-indigo-600 hover:text-indigo-900">Upload Doc</button>
                            </td>
                        </tr>
                    ))}
                    {clients.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                                No clients found. Add your first buyer to get started.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
