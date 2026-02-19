"use client";

import { useEffect, useState } from "react";
import { ClientTable } from "@/components/clients/client-table";
import { DocumentUpload } from "@/components/clients/document-upload";
import { AddClientForm } from "@/components/clients/add-client-form";
import { createBrowserClient } from "@/lib/supabase/client";
import { Plus, Users, LayoutGrid } from "lucide-react";

export default function ClientsPage() {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const supabase = createBrowserClient();

    const fetchClients = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const producerId = session?.user?.id;

            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('producer_id', producerId)
                .order('name', { ascending: true });

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const clientItems = clients.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email || "",
        phone: client.phone || "",
        details: client.details || "",
        created_at: client.created_at
    }));

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Users className="h-10 w-10 text-blue-600" />
                        Client CRM
                    </h1>
                    <p className="text-slate-500 font-medium">Manage your buyers and associated contracts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Add New Client</span>
                    </button>
                </div>
            </div>

            {showAddForm && (
                <AddClientForm
                    onSuccess={() => {
                        setShowAddForm(false);
                        fetchClients();
                    }}
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">My Buyers</h2>
                        </div>
                        <ClientTable clients={clientItems} onRefresh={fetchClients} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-2">Upload Document</h2>
                        <p className="text-sm text-slate-500 mb-6 font-medium">Attach contracts, lab results, or invoices to a client.</p>
                        <DocumentUpload />
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 h-24 w-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="flex items-end justify-between">
                                <span className="text-slate-400 text-sm font-medium">Active Buyers</span>
                                <span className="text-3xl font-black">{clientItems.length}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(clientItems.length * 10, 100)}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
