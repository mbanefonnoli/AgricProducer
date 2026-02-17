"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export interface Profile {
    id: string;
    name: string;
    surname: string | null;
    company_name: string | null;
    role: "company" | "employee";
    employer_id: string | null;
}

export function useProfile() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createBrowserClient();

        async function fetchProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const { data, error } = await supabase
                        .from('producers')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (!error && data) {
                        setProfile(data as Profile);
                    }
                }
            } catch (e) {
                console.error("Error fetching profile:", e);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, []);

    return { profile, loading };
}
