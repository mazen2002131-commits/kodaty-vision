import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TriggerType =
  | "order_paid"
  | "subscription_expiring"
  | "low_stock"
  | "urgent_ticket"
  | "manual";

export type ActionType = "assign_license" | "notify" | "create_ticket" | "mark_delivered";

export type AutomationAction = {
  type: ActionType;
  channel?: "in_app" | "email";
  message?: string;
  params?: Record<string, unknown>;
};

export type Automation = {
  id: string;
  name: string;
  description: string | null;
  trigger_type: TriggerType;
  config: Record<string, unknown>;
  actions: AutomationAction[];
  active: boolean;
  runs_count: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AutomationRun = {
  id: string;
  automation_id: string;
  status: "success" | "failed" | "skipped";
  trigger_data: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
};

export function useAutomations() {
  return useQuery({
    queryKey: ["automations"],
    queryFn: async (): Promise<Automation[]> => {
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Automation[];
    },
  });
}

export function useAutomationRuns(automationId?: string) {
  return useQuery({
    queryKey: ["automation_runs", automationId ?? "all"],
    queryFn: async (): Promise<AutomationRun[]> => {
      let q = supabase.from("automation_runs").select("*").order("created_at", { ascending: false }).limit(50);
      if (automationId) q = q.eq("automation_id", automationId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as AutomationRun[];
    },
  });
}

export function useCreateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      trigger_type: TriggerType;
      actions: AutomationAction[];
      active?: boolean;
      config?: Record<string, unknown>;
    }) => {
      const { error } = await supabase.from("automations").insert({
        name: input.name,
        description: input.description ?? null,
        trigger_type: input.trigger_type,
        actions: input.actions as unknown as never,
        active: input.active ?? true,
        config: (input.config ?? {}) as unknown as never,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
  });
}

export function useUpdateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Automation> }) => {
      const { error } = await supabase.from("automations").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
  });
}

export function useDeleteAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
  });
}

// ---------- Engine ----------

type RunContext = {
  order_id?: string;
  customer_id?: string;
  product_id?: string;
  product_name?: string;
  subscription_id?: string;
  ticket_id?: string;
  [k: string]: unknown;
};

async function executeAction(
  action: AutomationAction,
  ctx: RunContext,
): Promise<{ ok: boolean; detail: string }> {
  switch (action.type) {
    case "assign_license": {
      if (!ctx.product_id || !ctx.order_id || !ctx.customer_id) {
        return { ok: false, detail: "بيانات ناقصة لتعيين مفتاح" };
      }
      // Pick first available license for the product
      const { data: license, error: e1 } = await supabase
        .from("licenses")
        .select("id")
        .eq("product_id", ctx.product_id)
        .eq("status", "available")
        .limit(1)
        .maybeSingle();
      if (e1) return { ok: false, detail: e1.message };
      if (!license) return { ok: false, detail: "لا توجد مفاتيح متاحة" };
      const { error: e2 } = await supabase
        .from("licenses")
        .update({
          status: "sold",
          sold_to: ctx.customer_id,
          sold_order_id: ctx.order_id,
          sold_at: new Date().toISOString(),
        })
        .eq("id", license.id);
      if (e2) return { ok: false, detail: e2.message };
      return { ok: true, detail: `تم تعيين المفتاح ${license.id.slice(0, 8)}` };
    }
    case "mark_delivered": {
      if (!ctx.order_id) return { ok: false, detail: "بدون طلب" };
      const { error } = await supabase.from("orders").update({ status: "delivered" }).eq("id", ctx.order_id);
      if (error) return { ok: false, detail: error.message };
      return { ok: true, detail: "تم تحديد الطلب كمُسلَّم" };
    }
    case "create_ticket": {
      if (!ctx.customer_id) return { ok: false, detail: "بدون عميل" };
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("tickets").insert({
        code: "",
        customer_id: ctx.customer_id,
        subject: action.message ?? "تذكرة أتمتة",
        status: "open",
        priority: "normal",
        assignee_id: u.user?.id ?? null,
      });
      if (error) return { ok: false, detail: error.message };
      return { ok: true, detail: "تم إنشاء تذكرة" };
    }
    case "notify": {
      // In-app notification via console + return message; UI reads runs log
      return { ok: true, detail: action.message ?? "إشعار" };
    }
    default:
      return { ok: false, detail: `إجراء غير معروف: ${action.type}` };
  }
}

export async function runAutomationsFor(trigger: TriggerType, ctx: RunContext) {
  const { data: automations, error } = await supabase
    .from("automations")
    .select("*")
    .eq("trigger_type", trigger)
    .eq("active", true);
  if (error || !automations) return;

  for (const auto of automations) {
    const actions = (auto.actions as unknown as AutomationAction[]) ?? [];
    const results: { action: string; ok: boolean; detail: string }[] = [];
    let anyFailed = false;
    for (const action of actions) {
      const r = await executeAction(action, ctx);
      results.push({ action: action.type, ...r });
      if (!r.ok) anyFailed = true;
    }
    await supabase.from("automation_runs").insert({
      automation_id: auto.id,
      status: anyFailed ? "failed" : "success",
      trigger_data: ctx as unknown as never,
      result: { results } as unknown as never,
      error: anyFailed ? results.find(r => !r.ok)?.detail ?? null : null,
    });
    await supabase
      .from("automations")
      .update({
        runs_count: (auto.runs_count ?? 0) + 1,
        last_run_at: new Date().toISOString(),
      })
      .eq("id", auto.id);
  }
}
