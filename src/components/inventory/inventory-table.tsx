"use client";

import { useState } from "react";
import { EditInventoryDialog } from "./edit-inventory-dialog";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Trash2, Loader2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export interface StockItem {
    id: string;
    product_name: string;
    quantity: number;
    unit: string;
    last_updated: string;
    last_reason: string;
    buying_price?: number;
    selling_price?: number;
}

type SortField = 'product_name' | 'quantity' | 'unit' | 'total_value' | 'last_updated';
type SortDirection = 'asc' | 'desc';

interface InventoryTableProps {
    items: StockItem[];
}

function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField | null; sortDirection: SortDirection }) {
    if (sortField !== field) return <ChevronsUpDown className="h-3.5 w-3.5 ml-1 text-slate-400 inline" />;
    return sortDirection === 'asc'
        ? <ChevronUp className="h-3.5 w-3.5 ml-1 text-blue-600 inline" />
        : <ChevronDown className="h-3.5 w-3.5 ml-1 text-blue-600 inline" />;
}

export function InventoryTable({ items }: InventoryTableProps) {
    const router = useRouter();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const supabase = createBrowserClient();

    const toggleSelectAll = () => {
        if (selected.size === items.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(items.map(item => item.id)));
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

    const sortedItems = [...items].sort((a, b) => {
        if (!sortField) return 0;
        let aVal: any, bVal: any;
        switch (sortField) {
            case 'product_name': aVal = a.product_name.toLowerCase(); bVal = b.product_name.toLowerCase(); break;
            case 'quantity': aVal = a.quantity; bVal = b.quantity; break;
            case 'unit': aVal = a.unit.toLowerCase(); bVal = b.unit.toLowerCase(); break;
            case 'total_value': aVal = a.quantity * (a.selling_price || 0); bVal = b.quantity * (b.selling_price || 0); break;
            case 'last_updated': aVal = new Date(a.last_updated).getTime(); bVal = new Date(b.last_updated).getTime(); break;
            default: return 0;
        }
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete these items? This action cannot be undone.")) return;
        setLoading(true);
        try {
            const ids = Array.from(selected);
            await supabase.from('inventory_ledger').delete().in('inventory_id', ids);

            const { error } = await supabase.from('inventory').delete().in('id', ids);
            if (error) throw error;

            toast.success("Items deleted successfully");
            setSelected(new Set());
            router.refresh();
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error("Failed to delete items");
        } finally {
            setLoading(false);
        }
    };

    const thSortable = "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700 select-none";

    return (
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
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
                                checked={items.length > 0 && selected.size === items.length}
                                onChange={toggleSelectAll}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                        </th>
                        <th className={thSortable} onClick={() => handleSort('product_name')}>
                            <span className="flex items-center">
                                Product <SortIcon field="product_name" sortField={sortField} sortDirection={sortDirection} />
                            </span>
                        </th>
                        <th className={thSortable} onClick={() => handleSort('quantity')}>
                            <span className="flex items-center">
                                Current Stock <SortIcon field="quantity" sortField={sortField} sortDirection={sortDirection} />
                            </span>
                        </th>
                        <th className={thSortable} onClick={() => handleSort('unit')}>
                            <span className="flex items-center">
                                Unit <SortIcon field="unit" sortField={sortField} sortDirection={sortDirection} />
                            </span>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                            Avg Cost / Sell Price
                        </th>
                        <th className={thSortable} onClick={() => handleSort('total_value')}>
                            <span className="flex items-center">
                                Total Value <SortIcon field="total_value" sortField={sortField} sortDirection={sortDirection} />
                            </span>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                            Last Reason
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                    {sortedItems.map((item) => {
                        const totalValue = item.quantity * (item.selling_price || 0);
                        return (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(item.id)}
                                        onChange={() => toggleSelect(item.id)}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{item.product_name}</td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                    <span className={item.quantity > 10 ? "text-slate-900" : "font-semibold text-amber-600"}>
                                        {item.quantity.toLocaleString()}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 uppercase">
                                        {item.unit}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                    <div className="flex flex-col">
                                        <span className="text-emerald-600 font-medium">Sell: €{item.selling_price || 0}</span>
                                        <span className="text-slate-400 text-xs">Buy: €{item.buying_price || 0}</span>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-slate-900">
                                    €{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 italic">
                                    {item.last_reason || "—"}
                                </td>
                            </tr>
                        );
                    })}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                                No inventory items found. Log some production to get started.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
