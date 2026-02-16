"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, UserPlus, X, Plus } from "lucide-react";

interface AddClientFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function AddClientForm({ onSuccess, onCancel }: AddClientFormProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [details, setDetails] = useState("");

    const supabase = createBrowserClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from('clients')
                .insert({
                    name,
                    email,
                    phone,
                    details,
                    producer_id: user.id
                });

            if (error) throw error;

            toast.success("Client added successfully");
            onSuccess();
        } catch (error: any) {
            console.error("Error adding client:", error);
            toast.error(error.message || "Failed to add client");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Add New Buyer</h3>
                </div>
                <button
                    onClick={onCancel}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X className="h-5 w-5 text-slate-400" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        placeholder="John Doe"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        placeholder="john@example.com"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        placeholder="+33 6 12 34 56 78"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Additional Details</label>
                    <input
                        type="text"
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        placeholder="e.g. Major buyer for wheat"
                    />
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <Plus className="h-5 w-5" />
                                <span>Save Client</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
