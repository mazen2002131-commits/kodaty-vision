import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Trophy, Gift, Crown, Medal, Award, Download, ArrowRight, Search, Check, Calendar } from "lucide-react";
import { useOrders, useCustomers, avatarColor, formatEGP } from "@/lib/db";
import { Avatar } from "@/components/app/pills";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/customers/top")({
  component: TopCustomers,
  head: () => ({ meta: [{ title: "أفضل العملاء — Kodaty" }] }),
});

type Period = "30" | "90" | "180" | "365" | "all" | "custom";
type SortBy = "spend" | "orders" | "aov";

const GIFT_KEY = "kodaty:gifts:v1";
type GiftLog = Record<string, string>; // customer_id -> last gift ISO date

function loadGifts(): GiftLog {
  try { return JSON.parse(localStorage.getItem(GIFT_KEY) || "{}"); } catch { return {}; }
}
function saveGifts(g: GiftLog) {
  localStorage.setItem(GIFT_KEY, JSON.stringify(g));
}

function TopCustomers() {
  const { data: orders = [] } = useOrders();
  const { data: customers = [] } = useCustomers();

  const [period, setPeriod] = useState<Period>("90");
  const [customFrom, setCustomFrom] = useState(() => new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10));
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [sortBy, setSortBy] = useState<SortBy>("spend");
  const [q, setQ] = useState("");
  const [giftCycleDays, setGiftCycleDays] = useState(90);
  const [gifts, setGifts] = useState<GiftLog>({});

  useEffect(() => setGifts(loadGifts()), []);

  const { fromMs, toMs, label } = useMemo(() => {
    if (period === "custom") {
      return {
        fromMs: new Date(customFrom + "T00:00:00").getTime(),
        toMs: new Date(customTo + "T23:59:59").getTime(),
        label: `${customFrom} → ${customTo}`,
      };
    }
    if (period === "all") return { fromMs: 0, toMs: Date.now(), label: "كامل السجل" };
    const n = Number(period);
    return { fromMs: Date.now() - n * 86400000, toMs: Date.now(), label: `آخر ${n} يوم` };
  }, [period, customFrom, customTo]);

  const ranked = useMemo(() => {
    const map = new Map<string, {
      id: string; name: string; email: string | null;
      orders: number; spend: number; profit: number;
      lastOrder: string | null; firstOrder: string | null;
    }>();
    orders.forEach(o => {
      const t = new Date(o.created_at).getTime();
      if (t < fromMs || t > toMs) return;
      if (!o.customer_id) return;
      const cust = customers.find(c => c.id === o.customer_id);
      const name = o.customers?.name ?? cust?.name ?? "—";
      const email = (o.customers?.email ?? cust?.email) ?? null;
      const cur = map.get(o.customer_id) ?? {
        id: o.customer_id, name, email,
        orders: 0, spend: 0, profit: 0, lastOrder: null, firstOrder: null,
      };
      cur.orders += 1;
      cur.spend += Number(o.total);
      cur.profit += (o.order_items ?? []).reduce((s, it) =>
        s + (Number(it.unit_price) - Number(it.unit_cost ?? 0)) * Number(it.qty), 0);
      if (!cur.lastOrder || o.created_at > cur.lastOrder) cur.lastOrder = o.created_at;
      if (!cur.firstOrder || o.created_at < cur.firstOrder) cur.firstOrder = o.created_at;
      map.set(o.customer_id, cur);
    });
    const arr = Array.from(map.values()).map(c => ({ ...c, aov: c.orders > 0 ? c.spend / c.orders : 0 }));
    arr.sort((a, b) => {
      if (sortBy === "orders") return b.orders - a.orders;
      if (sortBy === "aov") return b.aov - a.aov;
      return b.spend - a.spend;
    });
    return arr;
  }, [orders, customers, fromMs, toMs, sortBy]);

  const filtered = useMemo(
    () => ranked.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()) || (c.email ?? "").toLowerCase().includes(q.toLowerCase())),
    [ranked, q],
  );

  const totals = useMemo(() => ({
    activeCustomers: ranked.length,
    totalSpend: ranked.reduce((s, c) => s + c.spend, 0),
    totalOrders: ranked.reduce((s, c) => s + c.orders, 0),
    top10Share: ranked.length > 0
      ? (ranked.slice(0, 10).reduce((s, c) => s + c.spend, 0) / (ranked.reduce((s, c) => s + c.spend, 0) || 1)) * 100
      : 0,
  }), [ranked]);

  const dueForGift = useMemo(() => {
    const cutoff = Date.now() - giftCycleDays * 86400000;
    return filtered.filter(c => {
      const last = gifts[c.id];
      if (!last) return c.spend > 0;
      return new Date(last).getTime() < cutoff;
    });
  }, [filtered, gifts, giftCycleDays]);

  const markGiftSent = (id: string, name: string) => {
    const next = { ...gifts, [id]: new Date().toISOString() };
    setGifts(next); saveGifts(next);
    toast.success(`تم تسجيل إرسال هدية إلى ${name}`);
  };
  const unmarkGift = (id: string, name: string) => {
    const next = { ...gifts }; delete next[id];
    setGifts(next); saveGifts(next);
    toast.message(`ألغيت هدية ${name}`);
  };

  const exportCsv = () => {
    const rows = ["الترتيب,الاسم,البريد,عدد الطلبات,إجمالي الإنفاق,متوسط الطلب,صافي الربح,آخر طلب,آخر هدية"];
    filtered.forEach((c, i) => {
      rows.push([
        i + 1, c.name, c.email ?? "", c.orders, c.spend.toFixed(2), c.aov.toFixed(2),
        c.profit.toFixed(2),
        c.lastOrder ? new Date(c.lastOrder).toISOString().slice(0, 10) : "—",
        gifts[c.id] ? new Date(gifts[c.id]).toISOString().slice(0, 10) : "لم تُرسل",
      ].join(","));
    });
    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `top-customers-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/customers" className="hover:text-foreground inline-flex items-center gap-1">
              <ArrowRight className="h-3.5 w-3.5" /> العملاء
            </Link>
            <span>›</span>
            <span>أفضل العملاء</span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">أفضل العملاء</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            رتّب عملاءك حسب الإنفاق أو عدد الطلبات، وتتبّع مواعيد الهدايا الدورية.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-border bg-surface-sunken p-0.5 text-xs">
            {([["30","30 يوم"],["90","90 يوم"],["180","6 شهور"],["365","سنة"],["all","الكل"],["custom","مخصص"]] as const).map(([k, t]) => (
              <button
                key={k}
                onClick={() => setPeriod(k as Period)}
                className={cn(
                  "rounded-md px-2.5 py-1 transition",
                  period === k ? "bg-surface font-medium shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >{t}</button>
            ))}
          </div>
          {period === "custom" && (
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1 text-xs">
              <input type="date" value={customFrom} max={customTo}
                onChange={e => setCustomFrom(e.target.value)}
                className="bg-transparent px-1 py-0.5 outline-none" />
              <span className="text-muted-foreground">→</span>
              <input type="date" value={customTo} min={customFrom} max={new Date().toISOString().slice(0, 10)}
                onChange={e => setCustomTo(e.target.value)}
                className="bg-transparent px-1 py-0.5 outline-none" />
            </div>
          )}
          <button onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-accent">
            <Download className="h-4 w-4" /> تصدير CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Crown} label="عملاء نشطون" value={totals.activeCustomers.toString()} tone="brand" hint={label} />
        <Kpi icon={Trophy} label="إجمالي الإنفاق" value={formatEGP(totals.totalSpend)} tone="success" hint={`${totals.totalOrders} طلب`} />
        <Kpi icon={Award} label="حصة أفضل 10" value={`${totals.top10Share.toFixed(0)}%`} tone="warning" hint="من إجمالي الإيرادات" />
        <Kpi icon={Gift} label="مستحقّ هدية" value={dueForGift.length.toString()} tone="info" hint={`كل ${giftCycleDays} يوم`} />
      </div>

      {/* Gift cycle + search */}
      <div className="surface-elevated flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="ابحث بالاسم أو البريد…"
            className="w-full rounded-lg border border-border bg-surface-sunken py-2 ps-9 pe-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-sunken p-0.5 text-xs">
          {([["spend","الإنفاق"],["orders","الطلبات"],["aov","متوسط الطلب"]] as const).map(([k, t]) => (
            <button key={k} onClick={() => setSortBy(k as SortBy)}
              className={cn("rounded-md px-2.5 py-1 transition",
                sortBy === k ? "bg-surface font-medium shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs">
          <Gift className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">دورة الهدية:</span>
          {[30, 60, 90, 180].map(d => (
            <button key={d} onClick={() => setGiftCycleDays(d)}
              className={cn("rounded-md px-2 py-0.5",
                giftCycleDays === d ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground")}>
              {d}ي
            </button>
          ))}
        </div>
      </div>

      {/* Podium */}
      {filtered.slice(0, 3).length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {filtered.slice(0, 3).map((c, i) => (
            <PodiumCard key={c.id} rank={i + 1} c={c}
              lastGift={gifts[c.id]}
              onGift={() => markGiftSent(c.id, c.name)} />
          ))}
        </div>
      )}

      {/* Table */}
      <div className="surface-elevated overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold">الترتيب الكامل</h3>
            <p className="text-xs text-muted-foreground">اضغط «تم إرسال هدية» لتسجيل تاريخ الإرسال محلياً</p>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="grid place-items-center gap-3 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="text-sm text-muted-foreground">لا توجد طلبات في هذه الفترة.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-t border-border bg-surface-sunken/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 text-start font-medium">#</th>
                  <th className="px-3 py-2.5 text-start font-medium">العميل</th>
                  <th className="px-3 py-2.5 text-start font-medium">الطلبات</th>
                  <th className="px-3 py-2.5 text-start font-medium">إجمالي الإنفاق</th>
                  <th className="px-3 py-2.5 text-start font-medium">متوسط الطلب</th>
                  <th className="px-3 py-2.5 text-start font-medium">آخر طلب</th>
                  <th className="px-3 py-2.5 text-start font-medium">حالة الهدية</th>
                  <th className="px-5 py-2.5 text-end font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const lastGift = gifts[c.id];
                  const overdue = !lastGift || (Date.now() - new Date(lastGift).getTime()) / 86400000 >= giftCycleDays;
                  return (
                    <tr key={c.id} className="border-t border-border/60 hover:bg-accent/30">
                      <td className="px-5 py-3 num text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-3">
                        <Link to="/customers/$id" params={{ id: c.id }} className="flex items-center gap-2 hover:text-primary">
                          <Avatar name={c.name} color={avatarColor(c.id)} size={28} />
                          <div className="min-w-0">
                            <div className="truncate font-medium">{c.name}</div>
                            {c.email && <div className="truncate text-xs text-muted-foreground">{c.email}</div>}
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3 num">{c.orders}</td>
                      <td className="px-3 py-3 num font-semibold">{formatEGP(c.spend)}</td>
                      <td className="px-3 py-3 num text-muted-foreground">{formatEGP(c.aov)}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {c.lastOrder ? new Date(c.lastOrder).toLocaleDateString("ar-EG") : "—"}
                      </td>
                      <td className="px-3 py-3">
                        {lastGift ? (
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs",
                            overdue ? "border-warning/25 bg-warning/10 text-warning" : "border-success/25 bg-success/10 text-success",
                          )}>
                            <Calendar className="h-3 w-3" />
                            {new Date(lastGift).toLocaleDateString("ar-EG")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-sunken px-2 py-0.5 text-xs text-muted-foreground">
                            لم تُرسل بعد
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-end">
                        {overdue ? (
                          <button onClick={() => markGiftSent(c.id, c.name)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                            <Gift className="h-3.5 w-3.5" /> تم إرسال هدية
                          </button>
                        ) : (
                          <button onClick={() => unmarkGift(c.id, c.name)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent">
                            <Check className="h-3.5 w-3.5" /> مُرسَلة
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone, hint }: {
  icon: React.ElementType; label: string; value: string; hint?: string;
  tone: "brand" | "success" | "warning" | "info";
}) {
  const toneMap = {
    brand: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    info: "text-info bg-info/10",
  } as const;
  return (
    <div className="surface-elevated p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight num">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div className={cn("grid h-9 w-9 place-items-center rounded-xl", toneMap[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function PodiumCard({ rank, c, lastGift, onGift }: {
  rank: number;
  c: { id: string; name: string; email: string | null; orders: number; spend: number; aov: number };
  lastGift?: string;
  onGift: () => void;
}) {
  const meta = rank === 1
    ? { Icon: Crown, ring: "ring-warning/40", grad: "from-warning/20 via-warning/5 to-transparent", chip: "الذهبي" }
    : rank === 2
    ? { Icon: Medal, ring: "ring-muted-foreground/30", grad: "from-muted-foreground/15 to-transparent", chip: "الفضي" }
    : { Icon: Award, ring: "ring-brand-500/30", grad: "from-brand-500/15 to-transparent", chip: "البرونزي" };
  const Icon = meta.Icon;
  return (
    <div className={cn("surface-elevated relative overflow-hidden p-5 ring-1", meta.ring)}>
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-b", meta.grad)} />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={c.name} color={avatarColor(c.id)} size={44} />
          <div className="min-w-0">
            <Link to="/customers/$id" params={{ id: c.id }} className="block truncate font-semibold hover:text-primary">
              {c.name}
            </Link>
            {c.email && <div className="truncate text-xs text-muted-foreground">{c.email}</div>}
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-xs">
          <Icon className="h-3.5 w-3.5" />
          <span>#{rank} · {meta.chip}</span>
        </div>
      </div>
      <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="إنفاق" value={formatEGP(c.spend)} />
        <Stat label="طلبات" value={c.orders.toString()} />
        <Stat label="متوسط" value={formatEGP(c.aov)} />
      </div>
      <div className="relative mt-4 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {lastGift ? `آخر هدية: ${new Date(lastGift).toLocaleDateString("ar-EG")}` : "لم تُرسل هدية بعد"}
        </span>
        <button onClick={onGift}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 font-medium text-primary-foreground hover:bg-primary/90">
          <Gift className="h-3.5 w-3.5" /> هدية
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface-sunken px-2 py-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="num text-sm font-semibold">{value}</div>
    </div>
  );
}
