import Link from "next/link";
import { FinancialSummary } from "@/components/finances/financial-summary";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { Package, Users, TrendingUp, AlertCircle } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const supabase = createServerClient();

    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    const producerId = session?.user?.id;

    // Fetch top stock items for critical view
    const { data: inventory } = await supabase
        .from('inventory')
        .select('*')
        .eq('producer_id', producerId)
        .limit(5);

    const stockItems = (inventory as any[])?.map(item => ({
        id: item.id,
        product_name: item.product_name,
        quantity: Number(item.quantity),
        unit: item.unit,
        last_updated: item.last_updated
    })) || [];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Producer Dashboard</h1>
                <p className="text-slate-500">Welcome back! Here's an overview of your farm's operations.</p>
            </div>

            <FinancialSummary />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                            <Package className="h-5 w-5 text-slate-400" />
                            Critical Stock
                        </h2>
                        <Link href="/inventory" className="text-sm text-indigo-600 hover:underline">View all</Link>
                    </div>
                    <InventoryTable items={stockItems} />
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-slate-400" />
                        Recent Activity
                    </h2>
                    <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
                        {stockItems.length > 0 ? (
                            stockItems.slice(0, 3).map((item, i) => (
                                <div key={item.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                        <AlertCircle className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            Stock update: {item.product_name} ({item.quantity} {item.unit})
                                        </p>
                                        <p className="text-xs text-slate-500">{new Date(item.last_updated).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">No recent activity found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
