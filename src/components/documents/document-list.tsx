"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Trash2, Loader2, Download, Search, FileText } from "lucide-react";

export interface Document {
    id: string;
    name: string;
    file_path: string;
    type: string | null;
    client_name: string | null;
    created_at: string;
}

interface DocumentListProps {
    documents: Document[];
}

const BUCKET_NAME = 'documents';

export function DocumentList({ documents }: DocumentListProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState(false);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const supabase = createBrowserClient();

    const uniqueTypes = Array.from(new Set(documents.map(d => d.type).filter(Boolean))) as string[];

    const filtered = documents.filter(d => {
        const matchesSearch = !search ||
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            (d.client_name || '').toLowerCase().includes(search.toLowerCase());
        const matchesType = !typeFilter || d.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const toggleSelectAll = () => {
        if (selected.size === filtered.length) setSelected(new Set());
        else setSelected(new Set(filtered.map(d => d.id)));
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selected);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelected(next);
    };

    const handleDownload = async (doc: Document) => {
        setDownloadingId(doc.id);
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(doc.file_path, 60);
            if (error) throw error;
            window.open(data.signedUrl, '_blank');
        } catch {
            toast.error("Failed to generate download link");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Delete selected documents? Files will be permanently removed.")) return;
        setDeleting(true);
        try {
            const ids = Array.from(selected);
            const filePaths = documents.filter(d => ids.includes(d.id)).map(d => d.file_path);

            if (filePaths.length > 0) {
                await supabase.storage.from(BUCKET_NAME).remove(filePaths);
            }

            const { error } = await supabase.from('documents').delete().in('id', ids);
            if (error) throw error;

            toast.success(`${ids.length} document${ids.length !== 1 ? 's' : ''} deleted`);
            setSelected(new Set());
            router.refresh();
        } catch {
            toast.error("Failed to delete documents");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or client…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 bg-white transition-all"
                    />
                </div>
                {uniqueTypes.length > 0 && (
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-white"
                    >
                        <option value="">All Types</option>
                        {uniqueTypes.map(t => (
                            <option key={t} value={t} className="capitalize">{t}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {selected.size > 0 && (
                    <div className="bg-slate-50 px-4 py-2 flex items-center justify-between border-b border-slate-200">
                        <span className="text-xs text-slate-500 font-medium">{selected.size} selected</span>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Delete Selected ({selected.size})
                        </button>
                    </div>
                )}

                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 w-10">
                                <input
                                    type="checkbox"
                                    checked={filtered.length > 0 && selected.size === filtered.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Document</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Client</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Uploaded</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {filtered.map((doc) => (
                            <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(doc.id)}
                                        onChange={() => toggleSelect(doc.id)}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-900">{doc.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    {doc.type ? (
                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 capitalize">
                                            {doc.type}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 text-sm">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600">
                                    {doc.client_name || <span className="text-slate-400">—</span>}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-500">
                                    {new Date(doc.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <button
                                        onClick={() => handleDownload(doc)}
                                        disabled={downloadingId === doc.id}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {downloadingId === doc.id
                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            : <Download className="h-3.5 w-3.5" />
                                        }
                                        Download
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                                    {documents.length === 0
                                        ? "No documents uploaded yet. Upload files from a client's profile."
                                        : "No documents match your search."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
