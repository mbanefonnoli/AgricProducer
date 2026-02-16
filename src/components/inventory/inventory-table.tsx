export interface StockItem {
    id: string;
    product_name: string;
    quantity: number;
    unit: string;
    last_updated: string;
    last_reason: string;
}

interface InventoryTableProps {
    items: StockItem[];
}

export function InventoryTable({ items }: InventoryTableProps) {
    return (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Current Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Last Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Last Updated</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                    {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
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
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 italic">
                                {item.last_reason || "—"}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                                {new Date(item.last_updated).toLocaleDateString()}
                            </td>
                        </tr>
                    ))}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                                No inventory items found. Log some production to get started.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
