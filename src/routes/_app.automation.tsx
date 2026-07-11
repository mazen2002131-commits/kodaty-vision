import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Zap, Plus, Play, Pause, Trash2, KeyRound, Bell, RefreshCw, Sparkles, Bot, CheckCircle2, XCircle, Clock, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { RequireAdmin } from "@/components/app/require-admin";
import {
  useAutomations,
  useAutomationRuns,
  useCreateAutomation,
  useUpdateAutomation,
  useDeleteAutomation,
  runAutomationsFor,
  type TriggerType,
  type AutomationAction,
  type ActionType,
} from "@/lib/automation";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/automation")({
  component: () => (<RequireAdmin><Automation /></RequireAdmin>),
  head: () => ({ meta: [{ title: "الأتمتة — Kodaty" }] }),
});

const TRIGGERS: { value: TriggerType; label: string; icon: any }[] = [
  { value: "order_paid", label: "طلب مدفوع / تم التسليم", icon: RefreshCw },
  { value: "subscription_expiring", label: "اشتراك قارب على الانتهاء", icon: Clock },
  { value: "low_stock", label: "مخزون منخفض", icon: Zap },
  { value: "urgent_ticket", label: "تذكرة عاجلة", icon: Bell },
  { value: "manual", label: "تشغيل يدوي فقط", icon: PlayCircle },
];

const ACTIONS: { value: ActionType; label: string; icon: any; color: string }[] = [
  { value: "assign_license", label: "تعيين مفتاح من الخزنة", icon: KeyRound, color: "text-brand-600" },
  { value: "mark_delivered", label: "تحديد كمُسلَّم", icon: CheckCircle2, color: "text-success" },
  { value: "create_ticket", label: "إنشاء تذكرة دعم", icon: Bell, color: "text-warning" },
  { value: "notify", label: "إشعار داخلي", icon: Sparkles, color: "text-info" },
];

function triggerMeta(t: TriggerType) {
  return TRIGGERS.find(x => x.value === t) ?? TRIGGERS[0];
}
function actionMeta(t: ActionType) {
  return ACTIONS.find(x => x.value === t) ?? ACTIONS[0];
}

function Automation() {
  const { data: automations = [], isLoading } = useAutomations();
  const { data: runs = [] } = useAutomationRuns();
  const update = useUpdateAutomation();
  const del = useDeleteAutomation();
  const [showNew, setShowNew] = useState(false);

  const active = automations.filter(a => a.active).length;
  const totalRuns = automations.reduce((s, a) => s + (a.runs_count ?? 0), 0);
  const successRate = runs.length
    ? Math.round((runs.filter(r => r.status === "success").length / runs.length) * 100)
    : 100;

  const toggle = (id: string, active: boolean) =>
    update.mutate({ id, patch: { active: !active } }, {
      onSuccess: () => toast.success(active ? "تم إيقاف الأتمتة" : "تم تفعيل الأتمتة"),
    });

  const remove = (id: string) => {
    if (!confirm("حذف هذه الأتمتة نهائياً؟")) return;
    del.mutate(id, { onSuccess: () => toast.success("تم الحذف") });
  };

  const runNow = async (id: string, trigger: TriggerType) => {
    toast.info("جارٍ التشغيل…");
    await runAutomationsFor(trigger, {});
    toast.success("تم التشغيل — راجع السجل");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">مركز الأتمتة</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            سير عمل حقيقي متصل بقاعدة البيانات — يعمل تلقائياً عند وقوع الأحداث.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> سير عمل جديد
        </button>
      </div>

      {/* Metrics */}
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="سير عمل نشط" value={`${active} من ${automations.length}`} />
        <MetricCard label="إجمالي التشغيلات" value={totalRuns.toLocaleString("ar-EG")} />
        <MetricCard label="نسبة النجاح" value={`${successRate}%`} tone={successRate >= 90 ? "success" : "warning"} />
      </div>

      {/* Flows */}
      <div className="space-y-3">
        {isLoading && <div className="text-sm text-muted-foreground">جاري التحميل…</div>}
        {!isLoading && automations.length === 0 && (
          <div className="surface-elevated p-8 text-center">
            <Bot className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">لا توجد أتمتات بعد. أنشئ أول سير عمل.</p>
          </div>
        )}
        {automations.map(a => {
          const tm = triggerMeta(a.trigger_type);
          const T = tm.icon;
          return (
            <div key={a.id} className="surface-elevated group p-5 transition-shadow hover:shadow-elevated">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold">{a.name}</h3>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px]",
                      a.active
                        ? "border-success/25 bg-success/10 text-success"
                        : "border-border bg-muted text-muted-foreground",
                    )}>
                      <span className={cn("h-1 w-1 rounded-full bg-current", a.active && "animate-pulse")} />
                      {a.active ? "نشط" : "متوقف"}
                    </span>
                    {a.last_run_at && (
                      <span className="text-[10px] text-muted-foreground">
                        آخر تشغيل: {new Date(a.last_run_at).toLocaleString("ar-EG")}
                      </span>
                    )}
                  </div>
                  {a.description && <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>}

                  {/* Flow steps */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-brand-500/30 bg-brand-50 px-2.5 py-1.5 text-xs">
                      <T className="h-3.5 w-3.5 text-brand-600" />
                      <span className="font-medium text-brand-700">{tm.label}</span>
                    </div>
                    {(a.actions ?? []).map((act, i) => {
                      const am = actionMeta(act.type);
                      const A = am.icon;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-muted-foreground">←</span>
                          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs">
                            <A className={cn("h-3.5 w-3.5", am.color)} />
                            <span>{act.message || am.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-xs text-muted-foreground">
                    <span className="num font-medium text-foreground">{(a.runs_count ?? 0).toLocaleString("ar-EG")}</span> تشغيل
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => runNow(a.id, a.trigger_type)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs hover:bg-secondary"
                      title="تشغيل الآن"
                    >
                      <PlayCircle className="h-3.5 w-3.5" /> تشغيل
                    </button>
                    <button
                      onClick={() => toggle(a.id, a.active)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium",
                        a.active
                          ? "border border-border hover:bg-secondary"
                          : "bg-primary text-primary-foreground hover:bg-brand-700",
                      )}
                    >
                      {a.active ? <><Pause className="h-3 w-3" /> إيقاف</> : <><Play className="h-3 w-3" /> تفعيل</>}
                    </button>
                    <button
                      onClick={() => remove(a.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border p-1.5 text-xs text-danger hover:bg-danger/10"
                      title="حذف"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Run history */}
      <div className="surface-elevated p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">سجل التشغيلات الأخير</h3>
          <span className="text-xs text-muted-foreground">آخر 50</span>
        </div>
        {runs.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">لا توجد تشغيلات بعد.</div>
        ) : (
          <div className="divide-y divide-border">
            {runs.map(r => {
              const auto = automations.find(a => a.id === r.automation_id);
              const ok = r.status === "success";
              return (
                <div key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {ok ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> : <XCircle className="h-4 w-4 text-danger shrink-0" />}
                    <span className="truncate">{auto?.name ?? r.automation_id.slice(0, 8)}</span>
                    {r.error && <span className="text-xs text-danger truncate">— {r.error}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(r.created_at).toLocaleString("ar-EG")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNew && <NewAutomationDialog onClose={() => setShowNew(false)} />}
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string | number; tone?: "success" | "warning" }) {
  return (
    <div className="surface-elevated p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn(
        "mt-1 font-display text-2xl font-bold num",
        tone === "success" && "text-success",
        tone === "warning" && "text-warning",
      )}>{value}</div>
    </div>
  );
}

function NewAutomationDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateAutomation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<TriggerType>("order_paid");
  const [selectedActions, setSelectedActions] = useState<ActionType[]>(["notify"]);
  const [notifyMessage, setNotifyMessage] = useState("");

  const toggleAction = (t: ActionType) =>
    setSelectedActions(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const submit = () => {
    if (!name.trim()) return toast.error("أدخل اسم الأتمتة");
    if (selectedActions.length === 0) return toast.error("اختر إجراءً واحداً على الأقل");
    const actions: AutomationAction[] = selectedActions.map(t => ({
      type: t,
      ...(t === "notify" && notifyMessage ? { message: notifyMessage } : {}),
    }));
    create.mutate(
      { name, description, trigger_type: trigger, actions, active: true },
      {
        onSuccess: () => { toast.success("تم إنشاء الأتمتة"); onClose(); },
        onError: (e: any) => toast.error(e?.message ?? "فشل الإنشاء"),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-elevated" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold">سير عمل جديد</h2>
        <p className="mt-1 text-xs text-muted-foreground">حدد المُشغّل والإجراءات — سيعمل تلقائياً عند وقوع الحدث.</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium">الاسم</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="مثال: تسليم فوري بعد الدفع"
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium">الوصف (اختياري)</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium">المُشغّل</label>
            <select
              value={trigger}
              onChange={e => setTrigger(e.target.value as TriggerType)}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">الإجراءات</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {ACTIONS.map(a => {
                const A = a.icon;
                const on = selectedActions.includes(a.value);
                return (
                  <button
                    key={a.value}
                    onClick={() => toggleAction(a.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-start transition-colors",
                      on ? "border-brand-500 bg-brand-50" : "border-border hover:bg-secondary",
                    )}
                  >
                    <A className={cn("h-4 w-4", a.color)} />
                    <span>{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {selectedActions.includes("notify") && (
            <div>
              <label className="text-xs font-medium">نص الإشعار</label>
              <input
                value={notifyMessage}
                onChange={e => setNotifyMessage(e.target.value)}
                placeholder="سيُعرض في سجل التشغيل"
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">إلغاء</button>
          <button
            onClick={submit}
            disabled={create.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:bg-brand-700 disabled:opacity-50"
          >
            {create.isPending ? "جارٍ الحفظ…" : "إنشاء الأتمتة"}
          </button>
        </div>
      </div>
    </div>
  );
}
