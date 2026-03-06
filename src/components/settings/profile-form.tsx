"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface ProfileFormProps {
    initialData: {
        name: string;
        surname: string | null;
        company_name: string | null;
        location: string | null;
        produce: string | null;
        num_employees: number | null;
        role: string;
    };
    userId: string;
}

export function ProfileForm({ initialData, userId }: ProfileFormProps) {
    const router = useRouter();
    const supabase = createBrowserClient();
    const isOwner = initialData.role === 'company';

    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(initialData.name ?? '');
    const [surname, setSurname] = useState(initialData.surname ?? '');
    const [companyName, setCompanyName] = useState(initialData.company_name ?? '');
    const [location, setLocation] = useState(initialData.location ?? '');
    const [produce, setProduce] = useState(initialData.produce ?? '');
    const [numEmployees, setNumEmployees] = useState(
        initialData.num_employees != null ? String(initialData.num_employees) : ''
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const update: Record<string, any> = {
                name: name.trim(),
                surname: surname.trim() || null,
                location: location.trim() || null,
                produce: produce.trim() || null,
            };

            if (isOwner) {
                update.company_name = companyName.trim() || null;
                update.num_employees = numEmployees ? parseInt(numEmployees) : null;
            }

            const { error } = await supabase
                .from('producers')
                .update(update)
                .eq('id', userId);

            if (error) throw error;

            toast.success("Profile updated successfully");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all bg-white";
    const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5">Personal Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>First Name *</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClass}
                            placeholder="e.g. Jan"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Surname</label>
                        <input
                            type="text"
                            value={surname}
                            onChange={(e) => setSurname(e.target.value)}
                            className={inputClass}
                            placeholder="e.g. Kowalski"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Location</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className={inputClass}
                            placeholder="e.g. Warsaw, Poland"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>
                            {isOwner ? 'Primary Produce' : 'Specialization'}
                        </label>
                        <input
                            type="text"
                            value={produce}
                            onChange={(e) => setProduce(e.target.value)}
                            className={inputClass}
                            placeholder={isOwner ? 'e.g. Wheat, Corn' : 'e.g. Harvest Manager'}
                        />
                    </div>
                </div>
            </div>

            {/* Company (owners only) */}
            {isOwner && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5">Farm / Company</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Company Name</label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className={inputClass}
                                placeholder="e.g. AgriCorp Ltd."
                            />
                            <p className="text-xs text-amber-600 mt-1.5 font-medium">
                                Changing the company name will break existing employee links.
                            </p>
                        </div>
                        <div>
                            <label className={labelClass}>Number of Employees</label>
                            <input
                                type="number"
                                min="0"
                                value={numEmployees}
                                onChange={(e) => setNumEmployees(e.target.value)}
                                className={inputClass}
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </button>
            </div>
        </form>
    );
}
