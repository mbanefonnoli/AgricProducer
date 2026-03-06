"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, X, TrendingUp, TrendingDown } from "lucide-react";

const INCOME_CATEGORIES = ['Crop Sale', 'Livestock Sale', 'Subsidy', 'Grant', 'Rental Income', 'Other Income'];
const EXPENSE_CATEGORIES = ['Seeds', 'Fertilizer', 'Pesticides', 'Equipment', 'Fuel', 'Labor', 'Rent', 'Utilities', 'Transport', 'Other Expense'];

interface TransactionFormProps {
    producerId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function TransactionForm({ producerId, onSuccess, onCancel }: TransactionFormProps) {
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<'income' | 'expense'>('income');
    const [category, setCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [clientId, setClientId] = useState('');
    const [inventoryId, setInventoryId] = useState('');
    const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
    const [inventory, setInventory] = useState<{ id: string; product_name: string }[]>([]);
    const supabase = createBrowserClient();

    useEffect(() => {
        async function fetchRelated() {
            const [{ data: clientsData }, { data: invData }] = await Promise.all([
                supabase.from('clients').select('id, name').eq('producer_id', producerId).order('name'),
                supabase.from('inventory').select('id, product_name').eq('producer_id', producerId).order('product_name'),
            ]);
            setClients((clientsData as any[]) || []);
            setInventory((invData as any[]) || []);
        }
        fetchRelated();
    }, [producerId]);

    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const finalCategory = category || customCategory.trim();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!finalCategory || !amount) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('transactions').insert({
                producer_id: producerId,
                type,
                category: finalCategory,
                amount: parseFloat(amount),
                description: description.trim() || null,
                client_id: clientId || null,
                inventory_id: inventoryId || null,
            } as any);
            if (error) throw error;
            toast.success("Transaction logged successfully");
            onSuccess();
        } catch (err: any) {
            toast.error(err.message || "Failed to log transaction");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all bg-white";
    const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5";

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-slate-900">Log New Transaction</h3>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors rounded-lg p-1 hover:bg-slate-100">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Toggle */}
                <div>
                    <label className={labelClass}>Transaction Type</label>
                    <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl">
                        <button
                            type="button"
                            onClick={() => { setType('income'); setCategory(''); }}
                            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${type === 'income' ? 'bg-green-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <TrendingUp className="h-4 w-4" /> Income
                        </button>
                        <button
                            type="button"
                            onClick={() => { setType('expense'); setCategory(''); }}
                            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <TrendingDown className="h-4 w-4" /> Expense
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Custom…</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {!category && (
                        <div>
                            <label className={labelClass}>Custom Category *</label>
                            <input
                                type="text"
                                required={!category}
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                className={inputClass}
                                placeholder="e.g. Insurance"
                            />
                        </div>
                    )}

                    <div>
                        <label className={labelClass}>Amount (€) *</label>
                        <input
                            type="number"
                            required
                            min="0.01"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className={inputClass}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={inputClass + " resize-none h-16"}
                        placeholder="Optional notes or reference number…"
                    />
                </div>

                {(clients.length > 0 || inventory.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {clients.length > 0 && (
                            <div>
                                <label className={labelClass}>Link to Client</label>
                                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputClass}>
                                    <option value="">None</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}
                        {inventory.length > 0 && (
                            <div>
                                <label className={labelClass}>Link to Product</label>
                                <select value={inventoryId} onChange={(e) => setInventoryId(e.target.value)} className={inputClass}>
                                    <option value="">None</option>
                                    {inventory.map(i => <option key={i.id} value={i.id}>{i.product_name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={loading || !amount || !finalCategory}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Log Transaction
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 border border-slate-200 text-slate-700 font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
