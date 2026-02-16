export interface Client {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    details: string | null;
    created_at: string;
}

interface ClientTableProps {
    clients: Client[];
}

export function ClientTable({ clients }: ClientTableProps) {
    return (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Created</th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                    {clients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="text-sm font-medium text-slate-900">{client.name}</div>
                                <div className="text-xs text-slate-500">{client.details}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="text-sm text-slate-600">{client.email || "No email"}</div>
                                <div className="text-xs text-slate-500">{client.phone || "No phone"}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                                {new Date(client.created_at).toLocaleDateString()}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                <button className="text-slate-900 hover:text-slate-700 mr-4">View</button>
                                <button className="text-indigo-600 hover:text-indigo-900">Upload Doc</button>
                            </td>
                        </tr>
                    ))}
                    {clients.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                                No clients found. Add your first buyer to get started.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
