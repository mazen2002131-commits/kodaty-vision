import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle, Package, TrendingDown, CheckCircle2, Search,
  ArrowUpDown, LayoutGrid, List as ListIcon, Boxes, Sparkles,
} from "lucide-react";
import { useLicenses, useProducts } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/inventory")({
  component: Inventory,
  head: () => ({ meta: [{ title: "المخزون — Kodaty" }] }),
});

const LOW_THRESHOLD = 5;
const CRITICAL_THRESHOLD = 2;
type Level = "critical" | "low" | "ok";
type SortKey = "available" | "name" | "sold";
type Filter = "all" | Level;

function levelOf(available: number): Level {
  if (available <= CRITICAL_THRESHOLD) return "critical";
  if (available <= LOW_THRESHOLD) return "low";
  return "ok";
}

const LEVEL_META: Record<Level, { label: string; dot: string; ring: string; bg: string; text: string; bar: string }> = {
  critical: {
    label: "نفدت المفاتيح",
    dot: "bg-destructive",
    ring: "ring-destructive/30",
    bg: "bg-destructive/10",
    text: "text-destructive",
    bar: "bg-gradient-to-r from-destructive to-destructive/70",
  },
  low: {
    label: "منخفض",
    dot: "bg-warning",
    ring: "ring-warning/30",
    bg: "bg-warning/10",
    text: "text-warning",
    bar: "bg-gradient-to-r from-warning to-warning/70",
  },
  ok: {
    label: "متوفر",
    dot: "bg-success",
    ring: "ring-success/25",
    bg: "bg-success/10",
    text: "text-success",
    bar: "bg-gradient-to-r from-success to-success/70",
  },
};

function Inventory() {
  const { data: products = [] } = useProducts();
  const { data: licenses = [] } = useLicenses();

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("available");
  const [view, setView] = useState<"grid" | "table">("grid");

  const rows = useMemo(() => {
    const enriched = products.map(p => {
      const forProduct = licenses.filter(l => l.product_id === p.id);
      const available = forProduct.filter(l => l.status === "available").length;
      const sold = forProduct.filter(l => l.status === "sold").length;
      const reserved = forProduct.filter(l => l.status === "reserved").length;
      const total = forProduct.length;
      const level = levelOf(available);
      const health = total === 0 ? 0 : Math.round((available / Math.max(total, LOW_THRESHOLD * 2)) * 100);
      return { ...p, available, sold, reserved, total, level, health: Math.min(health, 100) };
    });
    const filtered = enriched
      .filter(r => (filter === "all" ? true : r.level === filter))
      .filter(r => (q ? (r.name + " " + (r.category ?? "")).toLowerCase().includes(q.toLowerCase()) : true));
    return filtered.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "ar");
      if (sort === "sold") return b.sold - a.sold;
      return a.available - b.available;
    });
  }, [products, licenses, filter, q, sort]);

  const stats = useMemo(() => {
    const all = products.map(p => {
      const av = licenses.filter(l => l.product_id === p.id && l.status === "available").length;
      return levelOf(av);
    });
    return {
      critical: all.filter(l => l === "critical").length,
      low: all.filter(l => l === "low").length,
      ok: all.filter(l => l === "ok").length,
      totalKeys: licenses.filter(l => l.status === "available").length,
    };
  }, [products, licenses]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-6 text-white">
        <div className="absolute -end-16 -top-16 h-64 w-64 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-20 start-1/3 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-white/70">
              <Sparkles className="h-3.5 w-3.5" /> صحة المخزون
            </div>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">إدارة المخزون</h1>
            <p className="mt-1 text-sm text-white/70">راقب مستوى المفاتيح المتاحة لكل منتج وتصرّف قبل النفاد.</p>
          </div>
          <div className="flex items-center gap-6 text-white/90">
            <div>
              <div className="text-xs text-white/60">إجمالي المفاتيح المتاحة</div>
              <div className="num mt-0.5 font-display text-3xl font-semibold">{stats.totalKeys}</div>
            </div>
            <div className="hidden h-12 w-px bg-white/15 sm:block" />
            <div className="hidden sm:block">
              <div className="text-xs text-white/60">المنتجات المتابعة</div>
              <div className="num mt-0.5 font-display text-3xl font-semibold">{products.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards (also act as filters) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FilterKpi
          active={filter === "critical"}
          onClick={() => setFilter(filter === "critical" ? "all" : "critical")}
          tone="critical"
          icon={<AlertTriangle className="h-4 w-4" />}
          label="حرج"
          value={stats.critical}
          hint={`≤ ${CRITICAL_THRESHOLD} مفتاح`}
        />
        <FilterKpi
          active={filter === "low"}
          onClick={() => setFilter(filter === "low" ? "all" : "low")}
          tone="low"
          icon={<TrendingDown className="h-4 w-4" />}
          label="منخفض"
          value={stats.low}
          hint={`≤ ${LOW_THRESHOLD} مفاتيح`}
        />
        <FilterKpi
          active={filter === "ok"}
          onClick={() => setFilter(filter === "ok" ? "all" : "ok")}
          tone="ok"
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="متوفر"
          value={stats.ok}
          hint="مخزون كافٍ"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="ابحث عن منتج أو فئة…"
            className="ps-9 border-0 bg-transparent shadow-none focus-visible:ring-0 h-9"
          />
        </div>
        {filter !== "all" && (
          <button
            onClick={() => setFilter("all")}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            مسح الفلتر
          </button>
        )}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-sunken p-0.5">
          <button
            onClick={() => setSort(sort === "available" ? "sold" : sort === "sold" ? "name" : "available")}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            title="ترتيب"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sort === "available" ? "الأقل توفراً" : sort === "sold" ? "الأكثر مبيعاً" : "أبجدياً"}
          </button>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-surface-sunken p-0.5">
          <button
            onClick={() => setView("grid")}
            className={cn("grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition", view === "grid" && "bg-surface text-foreground shadow-sm")}
            title="بطاقات"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setView("table")}
            className={cn("grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition", view === "table" && "bg-surface text-foreground shadow-sm")}
            title="جدول"
          >
            <ListIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {rows.length === 0 ? (
        <div className="surface-elevated flex flex-col items-center justify-center gap-2 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-sunken text-muted-foreground">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="text-sm font-medium">لا توجد نتائج</div>
          <div className="text-xs text-muted-foreground">جرّب تعديل البحث أو مسح الفلتر.</div>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(r => {
            const meta = LEVEL_META[r.level];
            return (
              <div
                key={r.id}
                className={cn(
                  "surface-elevated group relative overflow-hidden p-5 transition hover:border-primary/40 hover:shadow-md",
                )}
              >
                <div className={cn("absolute inset-x-0 top-0 h-0.5", meta.bar)} />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("grid h-11 w-11 place-items-center rounded-xl ring-1", meta.bg, meta.ring, meta.text)}>
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium leading-tight">{r.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{r.category ?? "بدون فئة"}</div>
                    </div>
                  </div>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium", meta.bg, meta.text)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                    {meta.label}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <Stat label="متاح" value={r.available} strong tone={meta.text} />
                  <Stat label="محجوز" value={r.reserved} />
                  <Stat label="مُباع" value={r.sold} />
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>مستوى المخزون</span>
                    <span className="num">{r.available} / {r.total || "—"}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                    <div
                      className={cn("h-full rounded-full transition-all", meta.bar)}
                      style={{ width: `${Math.max(r.health, r.available > 0 ? 8 : 4)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="surface-elevated overflow-hidden">
          <div className="grid grid-cols-[1.4fr_90px_90px_90px_1fr_140px] gap-4 border-b border-border bg-surface-sunken/50 px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <div>المنتج</div>
            <div className="text-center">متاح</div>
            <div className="text-center">محجوز</div>
            <div className="text-center">مُباع</div>
            <div>المستوى</div>
            <div>الحالة</div>
          </div>
          {rows.map(r => {
            const meta = LEVEL_META[r.level];
            return (
              <div
                key={r.id}
                className="grid grid-cols-[1.4fr_90px_90px_90px_1fr_140px] gap-4 border-b border-border/60 px-5 py-3.5 items-center transition hover:bg-surface-sunken/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("grid h-9 w-9 place-items-center rounded-lg ring-1", meta.bg, meta.ring, meta.text)}>
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.category ?? "بدون فئة"}</div>
                  </div>
                </div>
                <div className={cn("num text-center text-sm font-semibold", meta.text)}>{r.available}</div>
                <div className="num text-center text-sm text-muted-foreground">{r.reserved}</div>
                <div className="num text-center text-sm text-muted-foreground">{r.sold}</div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                    <div className={cn("h-full", meta.bar)} style={{ width: `${Math.max(r.health, r.available > 0 ? 8 : 4)}%` }} />
                  </div>
                  <span className="num w-10 text-end text-[11px] text-muted-foreground">{r.health}%</span>
                </div>
                <div>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", meta.bg, meta.text)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                    {meta.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, strong, tone }: { label: string; value: number; strong?: boolean; tone?: string }) {
  return (
    <div className="rounded-lg bg-surface-sunken/60 py-2">
      <div className={cn("num font-display text-lg", strong ? cn("font-semibold", tone) : "font-medium text-foreground/80")}>{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function FilterKpi({
  active, onClick, tone, icon, label, value, hint,
}: {
  active: boolean; onClick: () => void; tone: Level;
  icon: React.ReactNode; label: string; value: number; hint: string;
}) {
  const meta = LEVEL_META[tone];
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-surface p-5 text-start transition",
        active ? "border-primary/50 shadow-md ring-2 ring-primary/20" : "border-border hover:border-border-strong hover:shadow-sm",
      )}
    >
      <div className={cn("absolute inset-y-0 start-0 w-1", meta.bar)} />
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn("grid h-7 w-7 place-items-center rounded-lg", meta.bg, meta.text)}>{icon}</span>
      </div>
      <div className="num mt-2 font-display text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </button>
  );
}
