"use client";

import { useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface DocumentUploadProps {
    clientId?: string;
    onSuccess?: () => void;
}

export function DocumentUpload({ clientId, onSuccess }: DocumentUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const supabase = createBrowserClient();

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const producerId = session?.user?.id;
            if (!producerId) throw new Error("Not authenticated");

            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${producerId}/${Date.now()}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('documents')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Create Database Record
            const { error: dbError } = await supabase
                .from('documents')
                .insert({
                    name: file.name,
                    file_path: uploadData.path,
                    producer_id: producerId,
                    client_id: clientId || null,
                    type: file.type
                } as any);

            if (dbError) throw dbError;

            toast.success("Document uploaded successfully");
            setFile(null);
            onSuccess?.();
        } catch (error: any) {
            toast.error(error.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 bg-slate-50">
            {!file ? (
                <div className="flex flex-col items-center justify-center">
                    <Upload className="h-10 w-10 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600 mb-4 text-center">
                        Click to upload or drag and drop<br />
                        <span className="text-xs text-slate-400">PDF, PNG, JPG (max. 10MB)</span>
                    </p>
                    <input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <label
                        htmlFor="file-upload"
                        className="cursor-pointer rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                    >
                        Select file
                    </label>
                </div>
            ) : (
                <div className="flex items-center justify-between bg-white rounded-md p-3 border">
                    <div className="flex items-center">
                        <FileText className="h-5 w-5 text-indigo-500 mr-2" />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900 truncate max-w-[150px]">
                                {file.name}
                            </span>
                            <span className="text-xs text-slate-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                            {uploading && <Loader2 className="h-3 w-3 animate-spin" />}
                            {uploading ? "Uploading..." : "Upload"}
                        </button>
                        <button
                            onClick={() => setFile(null)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
