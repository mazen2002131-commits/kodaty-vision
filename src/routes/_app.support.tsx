import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LifeBuoy, MessageCircle, Clock, CheckCircle2, AlertCircle, Send, Paperclip, Search, Filter } from "lucide-react";
import { customers, customerById, relativeTime } from "@/lib/mock/data";
import { Avatar } from "@/components/app/pills";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/support")({
  component: Support,
  head: () => ({ meta: [{ title: "الدعم الفني — Kodaty" }] }),
});

type TicketStatus = "open" | "pending" | "resolved";
type TicketPriority = "low" | "normal" | "high" | "urgent";

const subjects = [
  "المفتاح لا يعمل مع Office 365",
  "أرغب باسترجاع اشتراكي",
  "لم يصلني رمز التفعيل بعد الدفع",
  "طلب فاتورة ضريبية باسم الشركة",
  "المفتاح مستخدم من قبل",
  "استفسار عن تجديد اشتراك Adobe",
  "مشكلة في الدفع عبر فودافون كاش",
  "كيف أنقل الترخيص لجهاز جديد؟",
];
const messages = [
  "شكراً على تواصلك، سأتحقق من الطلب فوراً.",
  "مرحباً بك، الرجاء إرسال رقم الطلب.",
  "تم إرسال المفتاح الجديد عبر البريد.",
  "نرحب باستفسارك، جاري المراجعة.",
];

const tickets = Array.from({ length: 14 }, (_, i) => ({
  id: `T-${1240 + i}`,
  subject: subjects[i % subjects.length],
  customerId: customers[i % customers.length].id,
  status: (["open", "pending", "resolved", "open", "pending"] as TicketStatus[])[i % 5],
  priority: (["urgent", "high", "normal", "low", "normal", "high"] as TicketPriority[])[i % 6],
  lastMessage: messages[i % messages.length],
  createdAt: new Date(1783036800000 - i * 3600_000 * 3).toISOString(),
  unread: i % 3 === 0,
}));

const STATUS: Record<TicketStatus, { label: string; cls: string; icon: React.ElementType }> = {
  open: { label: "مفتوحة", cls: "bg-info/10 text-info border-info/25", icon: MessageCircle },
  pending: { label: "بانتظار العميل", cls: "bg-warning/10 text-warning border-warning/25", icon: Clock },
  resolved: { label: "مغلقة", cls: "bg-success/10 text-success border-success/25", icon: CheckCircle2 },
};

const PRIO: Record<TicketPriority, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-secondary text-secondary-foreground",
  high: "bg-warning/15 text-warning",
  urgent: "bg-destructive/15 text-destructive",
};

function Support() {
  const [selectedId, setSelectedId] = useState(tickets[0].id);
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const filtered = tickets.filter(t => filter === "all" || t.status === filter);
  const selected = tickets.find(t => t.id === selectedId) ?? tickets[0];
  const customer = customerById(selected.customerId);

  const conversation = [
    { by: "customer", text: selected.subject, at: "منذ 3 ساعات" },
    { by: "agent", text: "شكراً على تواصلك، هل يمكنك تزويدنا برقم الطلب؟", at: "منذ 2 ساعة" },
    { by: "customer", text: "رقم الطلب KD-10251، حاولت أكثر من مرة والمفتاح يعطي خطأ.", at: "منذ ساعة" },
    { by: "agent", text: "تم فحص المفتاح، سأصدر مفتاحاً جديداً وأرسله لك الآن.", at: "منذ 30 د" },
  ];

  const stats = {
    open: tickets.filter(t => t.status === "open").length,
    pending: tickets.filter(t => t.status === "pending").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    urgent: tickets.filter(t => t.priority === "urgent").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">الدعم الفني</h1>
          <p className="mt-1 text-sm text-muted-foreground">تذاكر العملاء ومحادثات الدعم في واجهة واحدة.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "تذاكر مفتوحة", value: stats.open, icon: MessageCircle, tone: "text-info" },
          { label: "بانتظار العميل", value: stats.pending, icon: Clock, tone: "text-warning" },
          { label: "مُغلقة اليوم", value: stats.resolved, icon: CheckCircle2, tone: "text-success" },
          { label: "عاجلة", value: stats.urgent, icon: AlertCircle, tone: "text-destructive" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="surface-elevated flex items-center gap-3 p-4">
              <div className={cn("grid h-10 w-10 place-items-center rounded-xl bg-surface-sunken", s.tone)}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="num font-display text-xl font-bold">{s.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inbox */}
      <div className="surface-elevated grid overflow-hidden lg:grid-cols-[340px_1fr]">
        {/* List */}
        <div className="border-b border-border lg:border-b-0 lg:border-e">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input placeholder="ابحث في التذاكر…" className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 pe-9 text-sm outline-none focus:border-primary" />
            </div>
            <div className="mt-2 flex items-center gap-1">
              {(["all", "open", "pending", "resolved"] as const).map(k => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                    filter === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {k === "all" ? "الكل" : STATUS[k].label}
                </button>
              ))}
            </div>
          </div>
          <ul className="max-h-[540px] overflow-y-auto">
            {filtered.map(t => {
              const c = customerById(t.customerId);
              const S = STATUS[t.status];
              return (
                <li key={t.id}>
                  <button
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-start transition-colors",
                      selectedId === t.id ? "bg-brand-50/60" : "hover:bg-surface-sunken",
                    )}
                  >
                    <Avatar name={c.name} color={c.avatarColor} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-medium">{c.name}</div>
                        {t.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">{t.subject}</div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]", S.cls)}>
                          {S.label}
                        </span>
                        <span className={cn("rounded px-1.5 py-0.5 text-[10px]", PRIO[t.priority])}>
                          {t.priority === "urgent" ? "عاجل" : t.priority === "high" ? "عالٍ" : t.priority === "normal" ? "عادي" : "منخفض"}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Conversation */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-3">
              <Avatar name={customer.name} color={customer.avatarColor} size={38} />
              <div>
                <div className="text-sm font-semibold">{customer.name}</div>
                <div className="text-xs text-muted-foreground">{customer.email} · {selected.id}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-secondary">تعيين</button>
              <button className="rounded-md bg-success px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90">إغلاق التذكرة</button>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-5" style={{ maxHeight: 420 }}>
            {conversation.map((m, i) => (
              <div key={i} className={cn("flex", m.by === "agent" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                  m.by === "agent"
                    ? "bg-primary text-primary-foreground rounded-ee-sm"
                    : "bg-surface-sunken text-foreground rounded-es-sm",
                )}>
                  <div>{m.text}</div>
                  <div className={cn("mt-1 text-[10px]", m.by === "agent" ? "text-primary-foreground/60" : "text-muted-foreground")}>{m.at}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-surface-sunken p-2">
              <button className="rounded-md p-2 text-muted-foreground hover:bg-secondary" aria-label="مرفق">
                <Paperclip className="h-4 w-4" />
              </button>
              <textarea
                rows={1}
                placeholder="اكتب ردك… يمكنك استخدام / لإدراج قوالب جاهزة"
                className="flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
              />
              <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-brand hover:bg-brand-700">
                <Send className="h-3.5 w-3.5" /> إرسال
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
