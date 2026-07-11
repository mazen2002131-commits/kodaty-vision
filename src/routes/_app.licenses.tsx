import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Upload, Download, Plus, Copy, KeyRound, Shield, Lock } from "lucide-react";
import { keys, productById, formatNumber } from "@/lib/mock/data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/licenses")({
  component: Licenses,
  head: () => ({ meta: [{ title: "التراخيص والمفاتيح — Kodaty" }] }),
});

function Licenses() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "available" | "sold" | "reserved">("all");
  const [reveal, setReveal] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => keys.filter(k => {
    if (tab !== "all" && k.status !== tab) return false;
    if (!q) return true;
    return k.key.toLowerCase().includes(q.toLowerCase()) || productById(k.productId).name.includes(q);
  }), [q, tab]);

  const counts = {
    all: keys.length,
    available: keys.filter(k => k.status === "available").length,
    sold: keys.filter(k => k.status === "sold").length,
    reserved: keys.filter(k => k.status === "reserved").length,
  };

  const mask = (k: string) => k.split("-").map((s, i) => (i < 3 ? "•••••" : s)).join("-");
  const toggleReveal = (id: string) => setReveal(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="space-y-4">
      {/* Vault header */}
      <div className="surface-elevated relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 mesh-bg opacity-70" />
        <div className="relative flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl brand-gradient shadow-brand">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">خزنة التراخيص</h1>
              <p className="text-sm text-muted-foreground">تخزين آمن ومشفّر لجميع مفاتيح التفعيل</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-accent"><Upload className="h-4 w-4" /> استيراد CSV</button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-accent"><Download className="h-4 w-4" /> تصدير CSV</button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:opacity-90"><Plus className="h-4 w-4" /> إضافة مفتاح</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { l: "إجمالي المفاتيح", v: counts.all, cls: "text-primary" },
          { l: "متاحة", v: counts.available, cls: "text-success" },
          { l: "مباعة", v: counts.sold, cls: "text-info" },
          { l: "محجوزة", v: counts.reserved, cls: "text-warning" },
        ].map(s => (
          <div key={s.l} className="surface-elevated p-4">
            <div className="text-xs text-muted-foreground">{s.l}</div>
            <div className={cn("mt-1 num text-2xl font-semibold", s.cls)}>{formatNumber(s.v)}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="surface-elevated">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث بمفتاح أو منتج…" className="w-full rounded-lg border border-border bg-surface-sunken py-2 ps-9 pe-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex gap-1 rounded-lg border border-border bg-surface-sunken p-0.5 text-xs">
            {(["all", "available", "sold", "reserved"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={cn("rounded-md px-2.5 py-1 transition", tab === t ? "bg-surface font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {({ all: "الكل", available: "متاحة", sold: "مباعة", reserved: "محجوزة" } as const)[t]}
                <span className="ms-1 num text-muted-foreground">{counts[t]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken/50 text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-start font-medium">المنتج</th>
                <th className="px-3 py-2.5 text-start font-medium">المفتاح</th>
                <th className="px-3 py-2.5 text-start font-medium">الحالة</th>
                <th className="px-3 py-2.5 text-start font-medium">أُضيف</th>
                <th className="px-4 py-2.5 text-start font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(k => {
                const p = productById(k.productId);
                const shown = reveal.has(k.id);
                return (
                  <tr key={k.id} className="border-b border-border/60 last:border-0 hover:bg-accent/30">
                    <td className="px-4 py-3">{p.icon} <span className="ms-1">{p.name}</span></td>
                    <td className="px-3 py-3">
                      <button onClick={() => toggleReveal(k.id)} className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-sunken px-2 py-1 font-mono text-xs tracking-wider hover:border-primary/40">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        <span className="num">{shown ? k.key : mask(k.key)}</span>
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
                        k.status === "available" && "bg-success/10 text-success border-success/25",
                        k.status === "sold" && "bg-info/10 text-info border-info/25",
                        k.status === "reserved" && "bg-warning/15 text-warning border-warning/30",
                      )}>
                        <KeyRound className="h-3 w-3" />
                        {({ available: "متاح", sold: "مباع", reserved: "محجوز" } as const)[k.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{new Date(k.addedAt).toLocaleDateString("ar-EG")}</td>
                    <td className="px-4 py-3 text-end">
                      <button onClick={() => { navigator.clipboard.writeText(k.key); toast.success("تم النسخ"); }} className="rounded-md border border-border bg-surface px-2 py-1 text-xs hover:bg-accent">
                        <Copy className="me-1 inline h-3 w-3" /> نسخ
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
