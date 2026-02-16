"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    Users,
    CircleDollarSign,
    MessageSquare,
    Settings,
    LogOut,
    Menu,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Clients", href: "/clients", icon: Users },
    { name: "Finances", href: "/finances", icon: CircleDollarSign },
    { name: "AI Assistant", href: "/ai", icon: MessageSquare },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden flex h-16 items-center justify-between px-6 bg-slate-900 text-white sticky top-0 z-50">
                <span className="text-xl font-bold tracking-tight">AgricProducer</span>
                <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-400 hover:text-white">
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 overflow-y-auto",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-16 items-center px-6 invisible lg:visible">
                    <span className="text-xl font-bold tracking-tight">AgricProducer</span>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-slate-800 text-white"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <item.icon className={cn(
                                    "mr-3 h-5 w-5 flex-shrink-0",
                                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                                )} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-slate-800 p-4">
                    <Link
                        href="/settings"
                        onClick={() => setIsOpen(false)}
                        className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <Settings className="mr-3 h-5 w-5 text-slate-400 group-hover:text-white" />
                        Settings
                    </Link>
                    <button
                        onClick={async () => {
                            const { createBrowserClient } = await import('@/lib/supabase/client');
                            const supabase = createBrowserClient();
                            await supabase.auth.signOut();
                            window.location.href = '/login';
                        }}
                        className="group mt-1 flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-white" />
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
}
