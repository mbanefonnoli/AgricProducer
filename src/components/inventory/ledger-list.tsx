import { cn } from "@/lib/utils";
import { History, ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface LedgerEntry {
    id: string;
    product_name: string;
    amount: number;
    reason: string;
    created_at: string;
}

interface LedgerListProps {
    entries: LedgerEntry[];
}

export function LedgerList({ entries }: LedgerListProps) {
    return (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b bg-slate-50/50">
                <History className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Recent Activity</h3>
            </div>

            <div className="divide-y divide-slate-100">
                {entries.map((entry) => (
                    <div key={entry.id} className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center",
                                entry.amount > 0
                                    ? "bg-green-50 text-green-600 border border-green-100"
                                    : "bg-red-50 text-red-600 border border-red-100"
                            )}>
                                {entry.amount > 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 leading-none mb-1">
                                    {entry.product_name}
                                </p>
                                <p className="text-xs text-slate-500 font-medium italic">
                                    {entry.reason || "Inventory Adjustment"}
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className={cn(
                                "text-sm font-black mb-1",
                                entry.amount > 0 ? "text-green-600" : "text-red-600"
                            )}>
                                {entry.amount > 0 ? "+" : ""}{entry.amount.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                {new Date(entry.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {entries.length === 0 && (
                    <div className="px-6 py-10 text-center text-sm text-slate-500 italic">
                        No recent activity recorded.
                    </div>
                )}
            </div>
        </div>
    );
}
