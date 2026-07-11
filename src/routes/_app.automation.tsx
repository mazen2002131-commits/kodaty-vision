import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Zap, Plus, Play, Pause, ArrowLeft, Mail, MessageSquare, KeyRound, Bell, RefreshCw, Sparkles, Bot, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/automation")({
  component: Automation,
  head: () => ({ meta: [{ title: "الأتمتة — Kodaty" }] }),
});

type Trigger = { icon: React.ElementType; label: string };
type Action = { icon: React.ElementType; label: string; color: string };

const flows: {
  id: string;
  name: string;
  desc: string;
  active: boolean;
  runs: number;
  trigger: Trigger;
  actions: Action[];
}[] = [
  {
    id: "f1",
    name: "تسليم فوري للمفتاح بعد الدفع",
    desc: "عند اكتمال الدفع، يتم اختيار مفتاح من الخزنة وإرساله للعميل عبر البريد وواتساب.",
    active: true,
    runs: 1284,
    trigger: { icon: RefreshCw, label: "طلب مدفوع" },
    actions: [
      { icon: KeyRound, label: "احجز مفتاحاً", color: "text-brand-600" },
      { icon: Mail, label: "أرسل بريد", color: "text-info" },
      { icon: MessageSquare, label: "أرسل واتساب", color: "text-success" },
    ],
  },
  {
    id: "f2",
    name: "تذكير تجديد قبل 7 أيام",
    desc: "قبل انتهاء الاشتراك بأسبوع يُرسل تذكير مخصص مع رابط دفع مباشر.",
    active: true,
    runs: 342,
    trigger: { icon: RefreshCw, label: "اشتراك قارب على الانتهاء" },
    actions: [
      { icon: Mail, label: "أرسل بريد", color: "text-info" },
      { icon: Bell, label: "أشعر الفريق", color: "text-warning" },
    ],
  },
  {
    id: "f3",
    name: "تنبيه مخزون منخفض",
    desc: "إذا نزل المخزون تحت 5 مفاتيح، يُنشأ تذكرة داخلية ويُشعر مدير المشتريات.",
    active: true,
    runs: 27,
    trigger: { icon: Zap, label: "المخزون < 5" },
    actions: [
      { icon: Bell, label: "أنشئ مهمة", color: "text-warning" },
      { icon: MessageSquare, label: "سلاك #procurement", color: "text-info" },
    ],
  },
  {
    id: "f4",
    name: "متابعة العميل غير الراضي",
    desc: "عند وصول تذكرة بأولوية عاجلة، يُعيَّن لمنال ويرسل تنبيه في التطبيق.",
    active: false,
    runs: 96,
    trigger: { icon: Bell, label: "تذكرة عاجلة" },
    actions: [
      { icon: Bot, label: "عيّن لمنال", color: "text-brand-600" },
      { icon: MessageSquare, label: "رسالة داخلية", color: "text-info" },
    ],
  },
  {
    id: "f5",
    name: "ملخص أسبوعي ذكي",
    desc: "كل يوم أحد صباحاً، يولّد Kodaty AI ملخصاً للأداء ويرسله للإدارة.",
    active: true,
    runs: 8,
    trigger: { icon: RefreshCw, label: "كل أحد 9:00" },
    actions: [
      { icon: Sparkles, label: "تحليل AI", color: "text-brand-600" },
      { icon: FileText, label: "تقرير PDF", color: "text-foreground" },
      { icon: Mail, label: "أرسل للإدارة", color: "text-info" },
    ],
  },
];

const templates = [
  { name: "استرداد سلة مهجورة", icon: RefreshCw, badge: "شائع" },
  { name: "ترحيب بعميل جديد", icon: Sparkles, badge: "جديد" },
  { name: "توزيع تذاكر الدعم", icon: Bell, badge: "" },
  { name: "متابعة تقييم بعد الشراء", icon: MessageSquare, badge: "" },
];

function Automation() {
  const [flowsState, setFlowsState] = useState(flows);
  const toggle = (id: string) =>
    setFlowsState(prev => prev.map(f => (f.id === id ? { ...f, active: !f.active } : f)));

  const active = flowsState.filter(f => f.active).length;
  const runs = flowsState.reduce((s, f) => s + f.runs, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">مركز الأتمتة</h1>
          <p className="mt-1 text-sm text-muted-foreground">ابنِ سير عمل ذكياً للتسليم، التذكيرات، والتنبيهات الداخلية.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:bg-brand-700">
          <Plus className="h-4 w-4" /> سير عمل جديد
        </button>
      </div>

      {/* Metrics */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="surface-elevated p-5">
          <div className="text-xs text-muted-foreground">سير عمل نشط</div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="font-display text-2xl font-bold num">{active}</div>
            <div className="text-xs text-muted-foreground">من {flowsState.length}</div>
          </div>
        </div>
        <div className="surface-elevated p-5">
          <div className="text-xs text-muted-foreground">إجمالي التشغيلات</div>
          <div className="mt-1 font-display text-2xl font-bold num">{runs.toLocaleString("ar-EG")}</div>
        </div>
        <div className="surface-elevated p-5">
          <div className="text-xs text-muted-foreground">ساعات موفّرة (تقديري)</div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="font-display text-2xl font-bold num">247</div>
            <div className="text-xs text-success">+18% هذا الشهر</div>
          </div>
        </div>
      </div>

      {/* Flows */}
      <div className="space-y-3">
        {flowsState.map(f => {
          const T = f.trigger.icon;
          return (
            <div key={f.id} className="surface-elevated group p-5 transition-shadow hover:shadow-elevated">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{f.name}</h3>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px]",
                      f.active
                        ? "border-success/25 bg-success/10 text-success"
                        : "border-border bg-muted text-muted-foreground",
                    )}>
                      <span className={cn("h-1 w-1 rounded-full bg-current", f.active && "animate-pulse")} />
                      {f.active ? "نشط" : "متوقف"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>

                  {/* Flow steps */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-brand-500/30 bg-brand-50 px-2.5 py-1.5 text-xs">
                      <T className="h-3.5 w-3.5 text-brand-600" />
                      <span className="font-medium text-brand-700">{f.trigger.label}</span>
                    </div>
                    {f.actions.map((a, i) => {
                      const A = a.icon;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <ArrowLeft className="h-3 w-3 text-muted-foreground" />
                          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs">
                            <A className={cn("h-3.5 w-3.5", a.color)} />
                            <span className="text-foreground">{a.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-xs text-muted-foreground">
                    <span className="num font-medium text-foreground">{f.runs.toLocaleString("ar-EG")}</span> تشغيل
                  </div>
                  <button
                    onClick={() => toggle(f.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                      f.active
                        ? "border border-border text-foreground hover:bg-secondary"
                        : "bg-primary text-primary-foreground hover:bg-brand-700",
                    )}
                  >
                    {f.active ? <><Pause className="h-3 w-3" /> إيقاف</> : <><Play className="h-3 w-3" /> تفعيل</>}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Templates */}
      <div className="surface-elevated p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">قوالب جاهزة</h3>
            <p className="text-xs text-muted-foreground">ابدأ من قالب واحفظ الوقت.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map(t => {
            const I = t.icon;
            return (
              <button key={t.name} className="group flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-start transition-colors hover:border-brand-500/50 hover:bg-brand-50/40">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600 transition-transform group-hover:scale-110">
                  <I className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{t.name}</div>
                    {t.badge && <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] text-brand-700">{t.badge}</span>}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">اضغط للاستخدام</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
