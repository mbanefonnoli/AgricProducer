"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { CheckCircle2, XCircle, Loader2, Database, ShieldCheck } from "lucide-react";

export default function DebugPage() {
    const [status, setStatus] = useState<{
        auth: 'loading' | 'ok' | 'fail';
        profile: 'loading' | 'ok' | 'fail';
        write: 'loading' | 'ok' | 'fail';
        error?: string;
    }>({
        auth: 'loading',
        profile: 'loading',
        write: 'loading'
    });

    const supabase = createBrowserClient();

    useEffect(() => {
        async function runCheck() {
            try {
                // 1. Auth Check
                const { data: authData, error: authError } = await supabase.auth.getUser();
                if (authError || !authData.user) {
                    setStatus(prev => ({ ...prev, auth: 'fail', error: authError?.message || "Not logged in. Please sign in first." }));
                    return;
                }
                setStatus(prev => ({ ...prev, auth: 'ok', profile: 'loading' }));

                // 2. Profile Check
                const { data: profile, error: profileError } = await supabase
                    .from('producers')
                    .select('*')
                    .eq('id', authData.user.id)
                    .maybeSingle();

                if (profileError) {
                    setStatus(prev => ({
                        ...prev,
                        profile: 'fail',
                        error: `Query failed: ${profileError.message} (Check your Supabase URL/Key in .env.local)`
                    }));
                    return;
                }

                if (!profile) {
                    setStatus(prev => ({
                        ...prev,
                        profile: 'fail',
                        error: "Profile record missing. This user was likely created before the database was correctly set up."
                    }));
                    return;
                }

                // 3. Schema Verification
                const columns = Object.keys(profile);
                console.log("Detected Columns in 'producers' table:", columns);

                const requiredColumns = ['id', 'name', 'surname', 'company_name', 'role'];
                const missingColumns = requiredColumns.filter(col => !columns.includes(col));

                if (missingColumns.length > 0) {
                    setStatus(prev => ({
                        ...prev,
                        profile: 'fail',
                        error: `Schema Mismatch: Missing columns [${missingColumns.join(', ')}]. Available columns: [${columns.join(', ')}]`
                    }));
                    return;
                }

                setStatus(prev => ({ ...prev, profile: 'ok', write: 'loading' }));

                // 4. Data Access Check
                const { error: writeError } = await supabase
                    .from('inventory')
                    .select('count')
                    .limit(1);

                if (writeError) {
                    setStatus(prev => ({ ...prev, write: 'fail', error: `Data access failed: ${writeError.message}` }));
                } else {
                    setStatus(prev => ({ ...prev, write: 'ok' }));
                }
            } catch (err: any) {
                console.error("Critical Debug Error:", err);
                setStatus(prev => ({
                    ...prev,
                    error: `Critical Crash: ${err.message}. Your Supabase environment variables might be invalid.`
                }));
            }
        }

        runCheck();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center font-sans tracking-tight">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-8">
                    <Database className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-slate-900 text-pretty">Database Connectivity Check</h1>
                </div>

                <div className="space-y-6">
                    <StatusItem
                        label="User Authentication"
                        status={status.auth}
                        icon={<ShieldCheck className="h-5 w-5" />}
                    />
                    <StatusItem
                        label="User Profile Record (producers table)"
                        status={status.profile}
                        icon={<Database className="h-5 w-5" />}
                    />
                    <StatusItem
                        label="Data Access (inventory table)"
                        status={status.write}
                        icon={<Database className="h-5 w-5" />}
                    />
                </div>

                {status.error && (
                    <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex gap-3">
                        <XCircle className="h-5 w-5 shrink-0" />
                        <p>{status.error}</p>
                    </div>
                )}

                <div className="mt-10 pt-6 border-t border-slate-100">
                    <h2 className="text-sm font-bold text-slate-900 mb-3 tracking-wider uppercase">How to fix issues:</h2>
                    <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4 leading-relaxed">
                        <li>If <span className="font-bold text-slate-900">Profile Check</span> fails, you need to apply the RLS Policies in the Supabase SQL Editor.</li>
                        <li>If <span className="font-bold text-slate-900">Auth Check</span> fails, please sign in at /login.</li>
                        <li>Table locations: View <span className="font-mono text-blue-600 underline">public.producers</span> and <span className="font-mono text-blue-600 underline">public.inventory</span> in your Supabase browser.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

function StatusItem({ label, status, icon }: { label: string, status: string, icon: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3 text-slate-600 group-hover:text-slate-900 transition-colors">
                {icon}
                <span className="text-sm font-semibold">{label}</span>
            </div>
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin text-blue-400" />}
            {status === 'ok' && <CheckCircle2 className="h-5 w-5 text-green-500 fill-green-50" />}
            {status === 'fail' && <XCircle className="h-5 w-5 text-red-500 fill-red-50" />}
        </div>
    );
}
