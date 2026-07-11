import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MessageCircle, Clock, CheckCircle2, AlertCircle, Send, Paperclip, Search, Plus, Loader2 } from "lucide-react";
import { useTickets, useCreateTicket, useCustomers, avatarColor, type Ticket } from "@/lib/db";
import { Avatar } from "@/components/app/pills";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/support")({
  component: Support,
  head: () => ({ meta: [{ title: "الدعم الفني — Kodaty" }] }),
});

const STATUS = {
  open:     { label: "مفتوحة",        cls: "bg-info/10 text-info border-info/25", icon: MessageCircle },
  pending:  { label: "بانتظار العميل", cls: "bg-warning/10 text-warning border-warning/25", icon: Clock },
  resolved: { label: "مغلقة",         cls: "bg-success/10 text-success border-success/25", icon: CheckCircle2 },
  closed:   { label: "مؤرشفة",        cls: "bg-muted text-muted-foreground border-border", icon: CheckCircle2 },
} as const;

const PRIO = {
  low:    "bg-muted text-muted-foreground",
  normal: "bg-secondary text-secondary-foreground",
  high:   "bg-warning/15 text-warning",
  urgent: "bg-destructive/15 text-destructive",
} as const;

const PRIO_LBL = { low: "منخفض", normal: "عادي", high: "عالٍ", urgent: "عاجل" } as const;

function Support() {
  const { data: tickets = [], isLoading } = useTickets();
  const { data: customers = [] } = useCustomers();
  const createTicket = useCreateTicket();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<keyof typeof STATUS | "all">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer_id: "", subject: "", priority: "normal" as const });

  const filtered = useMemo(() => tickets.filter(t => {
    if (filter !== "all" && t.status !== filter) return false;
    if (q && !t.subject.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [tickets, filter, q]);

  const selected: Ticket | undefined = filtered.find(t => t.id === selectedId) ?? filtered[0];

  const stats = {
    open: tickets.filter(t => t.status === "open").length,
    pending: tickets.filter(t => t.status === "pending").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    urgent: tickets.filter(t => t.priority === "urgent").length,
  };

  async function submit() {
    if (!form.customer_id || !form.subject) { toast.error("املأ الحقول"); return; }
    try {
      await createTicket.mutateAsync(form);
      toast.success("تم إنشاء التذكرة");
      setOpen(false);
      setForm({ customer_id: "", subject: "", priority: "normal" });
    } catch (e: any) { toast.error(e.message ?? "فشل"); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">الدعم الفني</h1>
          <p className="mt-1 text-sm text-muted-foreground">تذاكر العملاء ومحادثات الدعم في واجهة واحدة.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="brand-gradient text-white shadow-brand"><Plus className="me-1 h-4 w-4" /> تذكرة جديدة</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>تذكرة جديدة</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>العميل</Label>
                <Select value={form.customer_id} onValueChange={v => setForm(f => ({ ...f, customer_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر عميل" /></SelectTrigger>
                  <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>الموضوع</Label><Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
              <div>
                <Label>الأولوية</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["low","normal","high","urgent"] as const).map(p => <SelectItem key={p} value={p}>{PRIO_LBL[p]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button onClick={submit} disabled={createTicket.isPending}>حفظ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "تذاكر مفتوحة", value: stats.open, icon: MessageCircle, tone: "text-info" },
          { label: "بانتظار العميل", value: stats.pending, icon: Clock, tone: "text-warning" },
          { label: "مُغلقة", value: stats.resolved, icon: CheckCircle2, tone: "text-success" },
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

      <div className="surface-elevated grid overflow-hidden lg:grid-cols-[340px_1fr]">
        <div className="border-b border-border lg:border-b-0 lg:border-e">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث في التذاكر…" className="w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 pe-9 text-sm outline-none focus:border-primary" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {(["all", "open", "pending", "resolved"] as const).map(k => (
                <button key={k} onClick={() => setFilter(k)} className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  filter === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
                )}>
                  {k === "all" ? "الكل" : STATUS[k].label}
                </button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div className="grid place-items-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="grid place-items-center py-12 text-sm text-muted-foreground">لا توجد تذاكر.</div>
          ) : (
          <ul className="max-h-[540px] overflow-y-auto">
            {filtered.map(t => {
              const cname = t.customers?.name ?? "—";
              const S = STATUS[t.status];
              return (
                <li key={t.id}>
                  <button onClick={() => setSelectedId(t.id)} className={cn(
                    "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-start transition-colors",
                    selected?.id === t.id ? "bg-brand-50/60" : "hover:bg-surface-sunken",
                  )}>
                    <Avatar name={cname} color={avatarColor(cname)} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{cname}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">{t.subject}</div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]", S.cls)}>{S.label}</span>
                        <span className={cn("rounded px-1.5 py-0.5 text-[10px]", PRIO[t.priority])}>{PRIO_LBL[t.priority]}</span>
                        <span className="ms-auto text-[10px] text-muted-foreground num">{t.code}</span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          )}
        </div>

        <div className="flex flex-col">
          {selected ? (
            <>
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={selected.customers?.name ?? "—"} color={avatarColor(selected.customers?.name ?? "-")} size={38} />
                  <div>
                    <div className="text-sm font-semibold">{selected.customers?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{selected.customers?.email ?? ""} · {selected.code}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-secondary">تعيين</button>
                  <button className="rounded-md bg-success px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90">إغلاق</button>
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-5" style={{ maxHeight: 420 }}>
                <div className="flex justify-start">
                  <div className="max-w-[70%] rounded-2xl bg-surface-sunken px-4 py-2.5 text-sm">
                    <div>{selected.subject}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground">{new Date(selected.created_at).toLocaleString("ar-EG")}</div>
                  </div>
                </div>
              </div>
              <div className="border-t border-border p-3">
                <div className="flex items-end gap-2 rounded-xl border border-border bg-surface-sunken p-2">
                  <button className="rounded-md p-2 text-muted-foreground hover:bg-secondary" aria-label="مرفق"><Paperclip className="h-4 w-4" /></button>
                  <textarea rows={1} placeholder="اكتب ردك…" className="flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" />
                  <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-brand hover:opacity-90">
                    <Send className="h-3.5 w-3.5" /> إرسال
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-12 text-sm text-muted-foreground">اختر تذكرة لعرض المحادثة.</div>
          )}
        </div>
      </div>
    </div>
  );
}
