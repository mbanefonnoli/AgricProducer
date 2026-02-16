"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, X, Pencil } from "lucide-react";
import { StockItem } from "./inventory-table";

interface EditInventoryDialogProps {
    item: StockItem;
    onSuccess: () => void;
}

export function EditInventoryDialog({ item, onSuccess }: EditInventoryDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [productName, setProductName] = useState(item.product_name);
    const [unit, setUnit] = useState(item.unit);
    const [buyingPrice, setBuyingPrice] = useState(item.buying_price?.toString() || "0");
    const [sellingPrice, setSellingPrice] = useState(item.selling_price?.toString() || "0");

    const supabase = createBrowserClient();

    const handleSave = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('inventory')
                .update({
                    product_name: productName,
                    unit: unit,
                    buying_price: parseFloat(buyingPrice),
                    selling_price: parseFloat(sellingPrice),
                    last_updated: new Date().toISOString()
                } as any)
                .eq('id', item.id);

            if (error) throw error;

            toast.success("Product updated successfully");
            setIsOpen(false);
            onSuccess();
        } catch (error: any) {
            console.error("Error updating product:", error);
            toast.error(error.message || "Failed to update product");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                title="Edit Details"
            >
                <Pencil className="h-4 w-4" />
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-900">Edit Product</h3>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</label>
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Buying Price (Cost)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-slate-400 font-bold">€</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={buyingPrice}
                                    onChange={(e) => setBuyingPrice(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selling Price</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-slate-400 font-bold">€</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={sellingPrice}
                                    onChange={(e) => setSellingPrice(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</label>
                        <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                        >
                            <option value="tons">Tons</option>
                            <option value="kg">kg (Kilogram)</option>
                            <option value="units">Units</option>
                            <option value="liters">Liters</option>
                            <option value="bags">Bags</option>
                            <option value="crates">Crates</option>
                        </select>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                    <button
                        onClick={() => setIsOpen(false)}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
