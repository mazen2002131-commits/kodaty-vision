import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ALL_PERMISSIONS, type PermissionKey } from "@/lib/permissions";

export type AppRole = "admin" | "staff";

type RoleContextValue = {
  role: AppRole | null;
  isAdmin: boolean;
  isStaff: boolean;
  loading: boolean;
  permissions: Set<string>;
  can: (perm: PermissionKey) => boolean;
};

const RoleContext = createContext<RoleContextValue>({
  role: null,
  isAdmin: false,
  isStaff: false,
  loading: true,
  permissions: new Set(),
  can: () => false,
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) {
        if (!cancelled) { setRole(null); setPermissions(new Set()); setLoading(false); }
        return;
      }
      const [{ data: rolesData }, { data: permsData }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        (supabase as any).from("user_permissions").select("permission").eq("user_id", uid),
      ]);
      if (cancelled) return;
      const roles = (rolesData ?? []).map(r => r.role as AppRole);
      const resolved: AppRole | null = roles.includes("admin")
        ? "admin"
        : roles.includes("staff") ? "staff" : null;
      setRole(resolved);
      setPermissions(new Set(((permsData ?? []) as { permission: string }[]).map(p => p.permission)));
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

  const isAdmin = role === "admin";
  const value: RoleContextValue = {
    role,
    isAdmin,
    isStaff: role === "staff",
    loading,
    permissions,
    can: (perm) => isAdmin || permissions.has(perm),
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

export function Can({
  perm, children, fallback = null,
}: { perm: PermissionKey; children: ReactNode; fallback?: ReactNode }) {
  const { can, loading } = useRole();
  if (loading) return null;
  return <>{can(perm) ? children : fallback}</>;
}

export { ALL_PERMISSIONS };
