"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function EnsureProfile() {
    const supabase = createBrowserClient();

    useEffect(() => {
        async function checkProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Use upsert to be safe and avoid race conditions/duplicate errors
                const { error: syncError } = await supabase
                    .from('producers')
                    .upsert({
                        id: user.id,
                        name: user.email?.split('@')[0] || "User",
                        surname: "Producer",
                        company_name: "My Farm",
                        role: "company"
                    } as any, { onConflict: 'id' });

                if (syncError) {
                    console.error("[EnsureProfile] Sync error:", syncError);
                    // Only show error if it's not a common "already exists" or RLS issue that we can't solve
                    if (syncError.code !== '23505') { // 23505 is unique violation, though upsert handles it
                        toast.error(`Sync failed: ${syncError.message}`);
                    }
                } else {
                    console.log("[EnsureProfile] Synchronization successful.");
                }
            } catch (err: any) {
                console.error("Critical error in EnsureProfile:", err);
            }
        }

        checkProfile();
    }, []);

    return null; // This component doesn't render anything
}
