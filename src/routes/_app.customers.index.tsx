import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Download } from "lucide-react";
import { customers, formatCurrency, formatNumber } from "@/lib/mock/data";
import { Avatar } from "@/components/app/pills";

export const Route = createFileRoute("/_app/customers/")({
  component: CustomersList,
  head: () => ({ meta: [{ title: "العملاء — Kodaty" }] }),
});

function CustomersList() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => customers.filter(c => !q || c.name.includes(q) || c.email.includes(q)), [q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">العملاء</h1>
          <p className="text-sm text-muted-foreground">{formatNumber(customers.length)} عميل نشط</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-accent"><Download className="h-4 w-4" /> تصدير</button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:opacity-90"><Plus className="h-4 w-4" /> عميل جديد</button>
        </div>
      </div>

      <div className="surface-elevated p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث بالاسم أو البريد…" className="w-full rounded-lg border border-border bg-surface-sunken py-2 ps-9 pe-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(c => (
          <Link key={c.id} to="/customers/$id" params={{ id: c.id }} className="surface-elevated group p-4 transition hover:border-primary/40 hover:shadow-glow">
            <div className="flex items-start gap-3">
              <Avatar name={c.name} color={c.avatarColor} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-semibold">{c.name}</div>
                  {c.tags.map(t => <span key={t} className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-primary">{t}</span>)}
                </div>
                <div className="truncate text-xs text-muted-foreground">{c.email}</div>
                <div className="mt-1 text-xs text-muted-foreground">{c.country}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
              <div>
                <div className="text-muted-foreground">إجمالي الإنفاق</div>
                <div className="num font-semibold">{formatCurrency(c.totalSpent)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">عدد الطلبات</div>
                <div className="num font-semibold">{formatNumber(c.ordersCount)}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
