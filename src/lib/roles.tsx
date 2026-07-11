import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "staff";

type RoleContextValue = {
  role: AppRole | null;
  isAdmin: boolean;
  isStaff: boolean;
  loading: boolean;
};

const RoleContext = createContext<RoleContextValue>({
  role: null,
  isAdmin: false,
  isStaff: false,
  loading: true,
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) {
        if (!cancelled) { setRole(null); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .order("role", { ascending: true }); // admin < staff alphabetically
      if (cancelled) return;
      const roles = (data ?? []).map(r => r.role as AppRole);
      const resolved: AppRole | null = roles.includes("admin")
        ? "admin"
        : roles.includes("staff")
          ? "staff"
          : null;
      setRole(resolved);
      setLoading(false);
    };

    load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        load();
      }
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  const value: RoleContextValue = {
    role,
    isAdmin: role === "admin",
    isStaff: role === "staff",
    loading,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}

export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { isAdmin, loading } = useRole();
  if (loading) return null;
  return <>{isAdmin ? children : fallback}</>;
}
