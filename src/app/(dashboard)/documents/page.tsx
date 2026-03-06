import { createServerClient } from "@/lib/supabase/server";
import { DocumentsPageClient } from "@/components/documents/documents-page-client";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
    const supabase = createServerClient();

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    const { data: profile } = await supabase
        .from('producers')
        .select('role, employer_id')
        .eq('id', userId)
        .single();

    const producerId = profile?.role === 'employee' && profile?.employer_id
        ? profile.employer_id
        : userId;

    const { data: documents } = await supabase
        .from('documents')
        .select('*, client:client_id(name)')
        .eq('producer_id', producerId)
        .order('created_at', { ascending: false });

    const docs = ((documents as any[]) || []).map(d => ({
        id: d.id,
        name: d.name,
        file_path: d.file_path,
        type: d.type,
        client_name: d.client?.name || null,
        created_at: d.created_at,
    }));

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <FileText className="h-10 w-10 text-blue-600" />
                    Documents
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                    Manage contracts, lab results, and client files in one place.
                </p>
            </div>

            <DocumentsPageClient
                documents={docs}
                producerId={producerId!}
                totalCount={docs.length}
            />
        </div>
    );
}
