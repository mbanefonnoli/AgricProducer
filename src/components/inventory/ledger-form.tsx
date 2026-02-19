"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { convertUnit, UNIT_MAP } from "@/lib/utils/conversions";

interface LedgerFormProps {
    onSuccess?: () => void;
}

export function LedgerForm({ onSuccess }: LedgerFormProps) {
    const [amount, setAmount] = useState<string>("");
    const [reason, setReason] = useState<string>("");
    const [product, setProduct] = useState<string>("");
    const [type, setType] = useState<"add" | "subtract">("add");
    const [unit, setUnit] = useState<string>("tons");
    const [price, setPrice] = useState<string>("");
    const [selectedClient, setSelectedClient] = useState<string>("");
    const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
    const [loading, setLoading] = useState(false);

    const supabase = createBrowserClient();
    const router = useRouter();

    // Fetch clients on mount
    useEffect(() => {
        const fetchClients = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('clients')
                .select('id, name')
                .eq('producer_id', user.id)
                .order('name');

            if (data) setClients(data);
        };
        fetchClients();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const producerId = user?.id;

            if (!producerId) throw new Error("Not authenticated");

            // 1. Proactive Profile Check (Prevent FK error)
            const { error: profileError } = await supabase
                .from('producers')
                .upsert({
                    id: producerId,
                    name: user.email?.split('@')[0] || "User",
                    surname: "Producer",
                    company_name: "My Farm",
                    role: "company"
                } as any, { onConflict: 'id' });

            if (profileError) {
                console.error("Proactive profile creation failed:", profileError);
                throw new Error(`Profile setup failed: ${profileError.message}`);
            }

            // 2. Check/Upsert Inventory
            // 2. Check/Upsert Inventory
            // We use ilike to find the product case-insensitively to prevent duplicates like "Wheat" vs "wheat"
            const { data: existingItems, error: fetchError } = await supabase
                .from('inventory')
                .select('id, quantity, unit')
                .ilike('product_name', product.trim())
                .eq('producer_id', producerId);

            if (fetchError) throw fetchError;

            // If duplicates exist, pick the first one to merge into
            const inventoryItem = existingItems && existingItems.length > 0 ? existingItems[0] : null;

            let finalInputAmount = parseFloat(amount);
            let targetUnit = unit;

            // Normalize amount if units differ
            if (inventoryItem && inventoryItem.unit !== unit) {
                const converted = convertUnit(finalInputAmount, unit, inventoryItem.unit);
                if (converted !== finalInputAmount) {
                    toast.info(`Converted ${amount} ${unit} to ${converted.toFixed(2)} ${inventoryItem.unit} (Target Unit: ${inventoryItem.unit})`);
                    finalInputAmount = converted;
                    targetUnit = inventoryItem.unit;
                }
            }

            const signedAmount = type === "add" ? finalInputAmount : -finalInputAmount;

            let itemId;
            if (!inventoryItem) {
                if (type === "subtract") throw new Error("Product not found in inventory");

                const insertData: any = {
                    product_name: product,
                    quantity: finalInputAmount,
                    unit: unit,
                    producer_id: producerId
                };

                // Add price if provided
                if (price && parseFloat(price) > 0) {
                    if (type === 'add') {
                        insertData.buying_price = parseFloat(price);
                    } else {
                        insertData.selling_price = parseFloat(price);
                    }
                }

                const { data: newItem, error: createError } = await supabase
                    .from('inventory')
                    .insert(insertData)
                    .select()
                    .single();

                if (createError) throw createError;
                itemId = newItem.id;
            } else {
                itemId = inventoryItem.id;
                const newQuantity = Number(inventoryItem.quantity) + signedAmount;

                if (newQuantity < 0) throw new Error("Insufficient stock");

                const updateData: any = {
                    quantity: newQuantity,
                    last_updated: new Date().toISOString()
                };

                // Update price if provided
                if (price && parseFloat(price) > 0) {
                    if (type === 'add') {
                        updateData.buying_price = parseFloat(price);
                    } else {
                        updateData.selling_price = parseFloat(price);
                    }
                }

                const { error: updateError } = await supabase
                    .from('inventory')
                    .update(updateData)
                    .eq('id', itemId);

                if (updateError) throw updateError;
            }

            // 3. Log to Ledger
            const { data: ledgerData, error: ledgerError } = await supabase
                .from('inventory_ledger')
                .insert({
                    inventory_id: itemId,
                    amount: signedAmount,
                    reason: reason
                } as any)
                .select()
                .single();

            if (ledgerError) throw ledgerError;

            const ledgerId = ledgerData?.id;

            // 4. Create Financial Transaction (if price is provided)
            if (price && parseFloat(price) > 0) {
                const transactionAmount = finalInputAmount * parseFloat(price);
                const transactionType = type === 'subtract' ? 'income' : 'expense';
                const transactionCategory = type === 'subtract' ? 'sales' : 'purchases';

                const { data: transactionData, error: transactionError } = await supabase
                    .from('transactions')
                    .insert({
                        producer_id: producerId,
                        type: transactionType,
                        amount: transactionAmount,
                        category: transactionCategory,
                        description: `${reason} - ${product} (${finalInputAmount} ${targetUnit} @ €${price}/${unit})`,
                        inventory_id: itemId,
                        client_id: selectedClient || null
                    } as any)
                    .select()
                    .single();

                if (transactionError) {
                    console.error("Transaction creation failed:", transactionError);
                    toast.warning("Inventory updated but financial transaction failed");
                } else {
                    // 5. Link ledger entry to transaction
                    if (ledgerId && transactionData?.id) {
                        await supabase
                            .from('inventory_ledger')
                            .update({ transaction_id: transactionData.id })
                            .eq('id', ledgerId);
                    }
                    toast.success(`Successfully logged ${type === 'add' ? 'production' : 'sale'} and created transaction`);
                }
            } else {
                toast.success(`Successfully logged ${type === 'add' ? 'production' : 'sale'}`);
            }

            setAmount("");
            setReason("");
            setProduct("");
            setPrice("");
            setSelectedClient("");

            // Refresh to show new data
            router.refresh();
            onSuccess?.();
        } catch (error: any) {
            console.error("Mutation error:", error);
            toast.error(error.message || "Failed to log entry");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-slate-900">Log Production / Sale</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-md">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => setType("add")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors",
                            type === "add" ? "bg-white shadow-sm text-green-600" : "text-slate-600 hover:bg-white/50"
                        )}
                    >
                        <Plus className="h-4 w-4" /> Add Stock
                    </button>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => setType("subtract")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors",
                            type === "subtract" ? "bg-white shadow-sm text-red-600" : "text-slate-600 hover:bg-white/50"
                        )}
                    >
                        <Minus className="h-4 w-4" /> Subtract Stock
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
                        <input
                            type="text"
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
                            placeholder="e.g., Wheat"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                        <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
                            required
                            disabled={loading}
                        >
                            <option value="tons">Tons</option>
                            <option value="kg">kg (Kilogram)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
                            placeholder="0.00"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Price per {unit}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 font-bold">€</span>
                            <input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full rounded-md border border-slate-300 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
                                placeholder="0.00"
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
                            required
                            disabled={loading}
                        >
                            <option value="">Select reason</option>
                            {type === "add" ? (
                                <>
                                    <option value="harvest">Harvest</option>
                                    <option value="purchase">Purchase</option>
                                    <option value="return">Return</option>
                                </>
                            ) : (
                                <>
                                    <option value="sale">Sale</option>
                                    <option value="spoilage">Spoilage</option>
                                    <option value="usage">Own Usage</option>
                                </>
                            )}
                        </select>
                    </div>
                </div>

                {/* Client Selection - Only for Sales */}
                {type === 'subtract' && clients.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Client (Optional)
                        </label>
                        <select
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
                            disabled={loading}
                        >
                            <option value="">-- No Client --</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-slate-500">
                            Select a client if this sale is for a specific customer
                        </p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-md bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {type === "add" ? "Log Production" : "Log Sale"}
                </button>
            </form>
        </div>
    );
}
