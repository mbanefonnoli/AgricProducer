"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Leaf, Building2, UserCircle2, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Profile state (Signup only)
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [role, setRole] = useState<"company" | "employee">("company");
    const [companyName, setCompanyName] = useState("");
    const [produce, setProduce] = useState("");
    const [numEmployees, setNumEmployees] = useState("");

    const supabase = createBrowserClient();
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push("/");
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            display_name: `${name} ${surname}`.trim() + (companyName ? ` - ${companyName}` : ''),
                            full_name: `${name} ${surname}`.trim(),
                            name: name,
                            surname: surname,
                            role: role,
                            company_name: companyName,
                        },
                    },
                });
                if (error) throw error;

                if (data.user) {
                    let employerId = null;

                    // If Employee, verify company exists
                    if (role === "employee") {
                        const { data: company, error: companyError } = await supabase
                            .from('producers')
                            .select('id')
                            .eq('company_name', companyName) // User enters company name in the 'Specialization' field? No, we need to handle inputs.
                            .eq('role', 'company')
                            .single();

                        if (companyError || !company) {
                            console.error("Company lookup failed:", companyError);
                            toast.error("Company not found! Please ensure your employer has an account with this exact name.");
                            return; // Stop signup (User is created in Auth but not in Producers... this is a partial state issue but acceptable for MVP)
                        }
                        employerId = company.id;
                    }

                    const { error: profileError } = await supabase
                        .from("producers")
                        .insert({
                            id: data.user.id,
                            name,
                            surname,
                            company_name: role === "company" ? companyName : null, // Employees don't have a 'company_name' of their own, they link to one.
                            produce, // Specialization for employee
                            role,
                            employer_id: employerId,
                            num_employees: role === "company" ? (numEmployees ? parseInt(numEmployees) : 0) : null,
                        } as any);

                    if (profileError) {
                        console.error("Profile creation error:", profileError);
                        toast.error(`Account created but profile setup failed: ${profileError.message}`);
                        return;
                    }
                }
                toast.success("Account created! You can now sign in.");
                setIsLogin(true);
            }
        } catch (error: any) {
            toast.error(error.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row items-center justify-center p-4 lg:p-0 selection:bg-blue-500/30">
            {/* Branding Section - Hidden on mobile */}
            <div className="hidden lg:flex w-1/2 h-screen flex-col justify-between p-12 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fee74a62?q=80&w=2664&auto=format&fit=crop')] opacity-20 bg-cover bg-center mix-blend-overlay" />
                <div className="absolute inset-0 bg-slate-900/40" />

                <div className="relative z-10 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-lg">
                        <Leaf className="h-7 w-7 text-blue-300" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-white">AgricProducer</span>
                </div>

                <div className="relative z-10">
                    <h1 className="text-6xl font-extrabold text-white tracking-tight leading-none mb-6">
                        Cultivate Success with <br />
                        <span className="text-blue-300">Data Intelligence.</span>
                    </h1>
                    <div className="space-y-4 max-w-md">
                        <p className="text-xl text-blue-100/80 leading-relaxed font-light">
                            Empowering European agricultural leaders with real-time stock management and financial agility.
                        </p>
                        <div className="flex flex-wrap gap-4 mt-8">
                            {[
                                "GDPR Compliant",
                                "AI Assisted",
                                "Multi-tenant",
                                "Supply Chain Optimized"
                            ].map((label) => (
                                <div key={label} className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-white/70 backdrop-blur-sm">
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-blue-200/50 text-sm font-medium">
                    © 2026 Agric Marketplace. All rights reserved.
                </div>
            </div>

            {/* Form Section */}
            <div className="w-full lg:w-1/2 flex items-center justify-center">
                <div className="w-full max-w-md bg-white/[0.02] border border-white/[0.08] backdrop-blur-3xl rounded-[2.5rem] p-8 lg:p-12 shadow-2xl relative">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="lg:hidden flex justify-center mb-6">
                            <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center">
                                <Leaf className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-3">
                            {isLogin ? "Welcome Back" : "Grow Your Future"}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {isLogin ? "Sign in to manage your production ecosystem." : "Create your producer profile to get started."}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        {!isLogin && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                                        placeholder="First Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Surname</label>
                                    <input
                                        type="text"
                                        required
                                        value={surname}
                                        onChange={(e) => setSurname(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                                        placeholder="Last Name"
                                    />
                                </div>
                            </div>
                        )}

                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Account Role</label>
                                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-900/50 border border-white/10 rounded-[1.25rem]">
                                    <button
                                        type="button"
                                        onClick={() => setRole("company")}
                                        className={cn(
                                            "flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all",
                                            role === "company" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        <Building2 className="h-4 w-4" /> Company
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole("employee")}
                                        className={cn(
                                            "flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all",
                                            role === "employee" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        <UserCircle2 className="h-4 w-4" /> Employee
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                                placeholder="name@farm.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                                placeholder="••••••••"
                            />
                        </div>

                        {!isLogin && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                                        {role === "company" ? "Company Name" : "Employer Company Name"}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                                        placeholder={role === "company" ? "AgriCorp Ltd." : "Enter exact company name"}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                                        {role === "company" ? "Primary Produce" : "Your Specialization"}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={produce}
                                        onChange={(e) => setProduce(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                                        placeholder={role === "company" ? "Wheat, Corn" : "Harvest Manager"}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group overflow-hidden relative"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <span>{isLogin ? "Sign Into Dashboard" : "Create Account"}</span>
                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer Toggle */}
                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            {isLogin ? (
                                <>Don't have an account? <span className="text-blue-400 font-bold ml-1">Register now</span></>
                            ) : (
                                <>Already have an account? <span className="text-blue-400 font-bold ml-1">Sign in</span></>
                            )}
                        </button>
                    </div>

                    {/* Minimal Features List - Mobile Friendly */}
                    {!isLogin && (
                        <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-y-3">
                            {[
                                "Real-time AI Analysis",
                                "Secure Ledger System",
                                "Client Vault",
                                "Financial Hub"
                            ].map((feature) => (
                                <div key={feature} className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{feature}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
}
