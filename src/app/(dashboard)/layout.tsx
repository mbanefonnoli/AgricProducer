import { Sidebar } from "@/components/sidebar";
import { EnsureProfile } from "@/components/auth/ensure-profile";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-50">
            <EnsureProfile />
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}
