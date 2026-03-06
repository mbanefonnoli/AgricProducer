"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, X } from "lucide-react";
import { DocumentList, Document } from "@/components/documents/document-list";
import { DocumentUpload } from "@/components/clients/document-upload";

interface DocumentsPageClientProps {
    documents: Document[];
    producerId: string;
    totalCount: number;
}

export function DocumentsPageClient({ documents, producerId, totalCount }: DocumentsPageClientProps) {
    const [showUpload, setShowUpload] = useState(false);
    const router = useRouter();

    return (
        <div className="space-y-6">
            {/* Stats + Upload button */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900">{totalCount}</p>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                            Document{totalCount !== 1 ? 's' : ''} stored
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowUpload(!showUpload)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-2"
                >
                    {showUpload ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {showUpload ? 'Cancel' : 'Upload Document'}
                </button>
            </div>

            {/* Upload panel */}
            {showUpload && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Upload New Document</h3>
                    <DocumentUpload
                        onSuccess={() => {
                            setShowUpload(false);
                            router.refresh();
                        }}
                    />
                    <p className="text-xs text-slate-400 mt-3">
                        Uploading here creates a general document not linked to any client. To link a document to a client, upload from that client's profile.
                    </p>
                </div>
            )}

            {/* Document list */}
            <DocumentList documents={documents} />
        </div>
    );
}
