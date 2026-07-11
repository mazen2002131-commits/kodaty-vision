import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Filter, Download, Plus, ArrowUpDown } from "lucide-react";
import { orders, customerById, productById, formatCurrency, relativeTime, statusLabels, paymentLabels, type OrderStatus } from "@/lib/mock/data";
import { StatusPill, Avatar, PriorityBadge } from "@/components/app/pills";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/orders/")({
  component: OrdersList,
  head: () => ({ meta: [{ title: "الطلبات — Kodaty" }] }),
});

const FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "new", label: "جديد" },
  { key: "processing", label: "قيد التنفيذ" },
  { key: "completed", label: "مكتمل" },
  { key: "pending", label: "معلّق" },
  { key: "refunded", label: "مسترد" },
];

function OrdersList() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => orders.filter(o => {
    if (filter !== "all" && o.status !== filter) return false;
    if (!q) return true;
    const c = customerById(o.customerId);
    const p = productById(o.productId);
    const hay = `${o.code} ${c.name} ${p.name}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }), [q, filter]);

  const toggle = (id: string) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">الطلبات</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} طلب — إدارة جميع طلبات المبيعات</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-accent"><Download className="h-4 w-4" /> تصدير</button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:opacity-90"><Plus className="h-4 w-4" /> طلب جديد</button>
        </div>
      </div>

      <div className="surface-elevated">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="ابحث برقم الطلب، العميل، أو المنتج…"
              className="w-full rounded-lg border border-border bg-surface-sunken py-2 ps-9 pe-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-1 rounded-lg border border-border bg-surface-sunken p-0.5">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs transition",
                  filter === f.key ? "bg-surface font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >{f.label}</button>
            ))}
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-sunken px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Filter className="h-3.5 w-3.5" /> فلاتر متقدمة
          </button>
        </div>

        {/* Bulk bar */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between border-b border-border bg-primary/5 px-4 py-2 text-sm">
            <span className="font-medium num">{selected.size} طلب محدد</span>
            <div className="flex gap-2">
              <button className="rounded-md border border-border bg-surface px-2 py-1 text-xs hover:bg-accent">تحديث الحالة</button>
              <button className="rounded-md border border-border bg-surface px-2 py-1 text-xs hover:bg-accent">تصدير المحدد</button>
              <button className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/15">حذف</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken/50 text-xs text-muted-foreground">
                <th className="w-10 px-4 py-2.5"><input type="checkbox" className="accent-primary" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(o => o.id)) : new Set())} /></th>
                <th className="px-3 py-2.5 text-start font-medium">
                  <button className="inline-flex items-center gap-1 hover:text-foreground">الرقم <ArrowUpDown className="h-3 w-3" /></button>
                </th>
                <th className="px-3 py-2.5 text-start font-medium">العميل</th>
                <th className="px-3 py-2.5 text-start font-medium">المنتج</th>
                <th className="px-3 py-2.5 text-start font-medium">الحالة</th>
                <th className="px-3 py-2.5 text-start font-medium">الدفع</th>
                <th className="px-3 py-2.5 text-start font-medium">المبلغ</th>
                <th className="px-3 py-2.5 text-start font-medium">الربح</th>
                <th className="px-3 py-2.5 text-start font-medium">الأولوية</th>
                <th className="px-4 py-2.5 text-start font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const c = customerById(o.customerId);
                const p = productById(o.productId);
                const isSel = selected.has(o.id);
                return (
                  <tr key={o.id} className={cn("border-b border-border/60 last:border-0 hover:bg-accent/30", isSel && "bg-primary/5")}>
                    <td className="px-4 py-3"><input type="checkbox" className="accent-primary" checked={isSel} onChange={() => toggle(o.id)} /></td>
                    <td className="px-3 py-3"><Link to="/orders/$id" params={{ id: o.id }} className="num font-medium text-primary hover:underline">{o.code}</Link></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={c.name} color={c.avatarColor} size={24} />
                        <span className="truncate">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3"><span className="me-1">{p.icon}</span>{p.name}</td>
                    <td className="px-3 py-3"><StatusPill status={o.status} /></td>
                    <td className="px-3 py-3 text-muted-foreground">{paymentLabels[o.payment]}</td>
                    <td className="px-3 py-3 num font-medium">{formatCurrency(o.amount)}</td>
                    <td className="px-3 py-3 num text-success">{formatCurrency(o.amount - o.cost)}</td>
                    <td className="px-3 py-3"><PriorityBadge priority={o.priority} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{relativeTime(o.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span>عرض <span className="num text-foreground">{filtered.length}</span> من <span className="num text-foreground">{orders.length}</span></span>
          <div className="flex gap-1">
            <button className="rounded-md border border-border px-2 py-1 hover:bg-accent">السابق</button>
            <button className="rounded-md border border-border px-2 py-1 hover:bg-accent">التالي</button>
          </div>
        </div>
      </div>
    </div>
  );
}
