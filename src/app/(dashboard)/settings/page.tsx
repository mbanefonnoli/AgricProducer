import { createServerClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/settings/profile-form";
import { Settings } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const supabase = createServerClient();

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) redirect('/login');

    const { data: profile, error } = await supabase
        .from('producers')
        .select('name, surname, company_name, location, produce, num_employees, role')
        .eq('id', userId)
        .single();

    if (error || !profile) redirect('/');

    return (
        <div className="space-y-8 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Settings className="h-10 w-10 text-blue-600" />
                    Settings
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                    Update your profile and farm details.
                </p>
            </div>

            {/* Role badge */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
                <div className={`h-2.5 w-2.5 rounded-full ${profile.role === 'company' ? 'bg-blue-500' : 'bg-green-500'}`} />
                <p className="text-sm text-slate-700">
                    Logged in as <strong>{profile.role === 'company' ? 'Company Owner' : 'Employee'}</strong>
                    {profile.company_name && profile.role === 'company' && (
                        <span className="text-slate-500"> · {profile.company_name}</span>
                    )}
                </p>
            </div>

            <ProfileForm
                initialData={profile as any}
                userId={userId}
            />
        </div>
    );
}
