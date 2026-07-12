import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Response("Forbidden", { status: 403 });
}

export const listTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("admin_list_team");
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      id: string;
      email: string;
      created_at: string;
      last_sign_in_at: string | null;
      confirmed: boolean;
      full_name: string | null;
      avatar_url: string | null;
      role: "admin" | "staff" | null;
      permissions: string[];
    }>;
  });

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1).max(120),
  role: z.enum(["admin", "staff"]),
  permissions: z.array(z.string()).default([]),
});

export const createTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => createSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { data: uid, error } = await context.supabase.rpc("admin_create_user", {
      _email: data.email,
      _password: data.password,
      _full_name: data.full_name,
      _role: data.role,
      _perms: data.role === "admin" ? [] : data.permissions,
    });
    if (error) throw new Error(error.message);
    return { id: uid as string };
  });

const updateRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["admin", "staff"]),
});

export const updateTeamRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => updateRoleSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc("admin_set_role", {
      _user_id: data.user_id,
      _role: data.role,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const setPermsSchema = z.object({
  user_id: z.string().uuid(),
  permissions: z.array(z.string()),
});

export const updateTeamPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => setPermsSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await (context.supabase as any).rpc("admin_set_permissions", {
      _user_id: data.user_id,
      _perms: data.permissions,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const deleteSchema = z.object({ user_id: z.string().uuid() });

export const deleteTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => deleteSchema.parse(data))
  .handler(async ({ context, data }) => {
    if (data.user_id === context.userId) {
      throw new Response("لا يمكنك حذف حسابك", { status: 400 });
    }
    const { error } = await context.supabase.rpc("admin_delete_user", {
      _user_id: data.user_id,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
