import { InventoryTable } from "@/components/inventory/inventory-table";
import { LedgerForm } from "@/components/inventory/ledger-form";
import { LedgerList } from "@/components/inventory/ledger-list";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
    const supabase = createServerClient();

    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    // Fetch Profile to determine whose inventory to show
    const { data: profile } = await supabase
        .from('producers')
        .select('id, role, employer_id')
        .eq('id', session.user.id)
        .single();

    // Determine the target producer ID (Self or Employer)
    const targetProducerId = profile?.role === 'employee' && profile?.employer_id
        ? profile.employer_id
        : session.user.id;

    // Fetch Ledger History to get "Last Reason"
    // We need to fetch ledgers linked to the *target* producer's inventory
    const { data: ledger } = await supabase
        .from('inventory_ledger')
        .select('*, inventory!inner(producer_id)')
        .eq('inventory.producer_id', targetProducerId)
        .order('created_at', { ascending: false });

    // Fetch real inventory data filtered by producer_id
    // We join with inventory_ledger to get the latest reason
    const { data: inventory, error } = await supabase
        .from('inventory')
        .select(`
            *,
            inventory_ledger (
                reason,
                created_at
            )
        `)
        .eq('producer_id', targetProducerId)
        .order('product_name', { ascending: true });

    if (error) {
        console.error("Error fetching inventory:", error);
    }

    // Fetch recent ledger entries for the activity feed
    const { data: ledgerRaw, error: ledgerError } = await supabase
        .from('inventory_ledger')
        .select(`
            id,
            amount,
            reason,
            created_at,
            inventory (
                product_name,
                producer_id
            )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    // Filter ledger entries to only show those belonging to the current producer
    const recentLedger = (ledgerRaw as any[])
        ?.filter(l => l.inventory?.producer_id === targetProducerId)
        ?.map(l => ({
            id: l.id,
            product_name: l.inventory?.product_name || "Unknown",
            amount: l.amount,
            reason: l.reason,
            created_at: l.created_at
        })) || [];

    // Map database types to UI StockItem type
    const stockItems = (inventory as any[])?.map(item => {
        // Sort ledger entries by date to get the absolute latest
        const sortedLedger = item.inventory_ledger?.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return {
            id: item.id,
            product_name: item.product_name,
            quantity: Number(item.quantity),
            unit: item.unit,
            last_updated: item.last_updated,
            last_reason: sortedLedger?.[0]?.reason || "",
            buying_price: item.buying_price || 0,
            selling_price: item.selling_price || 0
        };
    }) || [];

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Inventory Hub</h1>
                    <p className="text-slate-500 font-medium">Precision tracking for your agricultural production.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider">Live System Sync</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
                {/* Main Stock Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">Real-time Stock Levels</h2>
                        </div>
                        <InventoryTable items={stockItems} />
                    </div>

                    {/* Transaction History Section */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Transaction History</h2>
                        <LedgerList entries={recentLedger} />
                    </div>
                </div>

                {/* Form Section */}
                <div className="space-y-6">
                    <div className="sticky top-8">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Operations</h2>
                        <LedgerForm />

                        {/* Quick Stats Mini-Card */}
                        <div className="mt-6 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 h-24 w-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Total SKUs</h4>
                            <div className="flex items-end gap-2">
                                <span className="text-5xl font-black tabular-nums leading-none">{stockItems.length}</span>
                                <span className="text-slate-400 font-bold mb-1">Products</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
