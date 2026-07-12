import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Bar, BarChart, Cell,
} from "recharts";
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, ShoppingBag,
  Clock, CheckCircle2, RefreshCw, AlertTriangle, Plus, Zap, KeyRound,
} from "lucide-react";
import { useCustomers, useOrders, useProducts, useSubscriptions, formatEGP, avatarColor } from "@/lib/db";
import { StatusPill, Avatar } from "@/components/app/pills";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "الرئيسية — Kodaty" }] }),
});

function Kpi({
  label, value, delta, icon: Icon, tone = "brand", accent,
}: { label: string; value: string; delta?: { v: string; up: boolean }; icon: React.ElementType; tone?: "brand" | "success" | "warning" | "info"; accent?: string }) {
  const toneMap = {
    brand: "text-brand-600 bg-brand-50",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/12",
    info: "text-info bg-info/10",
  } as const;
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface p-4 transition hover:border-border-strong hover:shadow-pop">
      <div className="pointer-events-none absolute -end-8 -top-8 h-24 w-24 rounded-full bg-brand-300/8 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />
      <div className="relative flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={cn("grid h-7 w-7 place-items-center rounded-md", toneMap[tone])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="relative mt-3 font-display text-[26px] font-semibold leading-none tracking-tight num">{value}</div>
      {delta ? (
        <div className={cn("relative mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold", delta.up ? "text-success" : "text-destructive")}>
          {delta.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span className="num">{delta.v}</span>
          <span className="font-normal text-muted-foreground">مقارنة بالأمس</span>
        </div>
      ) : accent ? (
        <div className="relative mt-3 text-[11.5px] text-muted-foreground">{accent}</div>
      ) : (
        <div className="relative mt-3 h-[14px]" />
      )}
    </div>
  );
}

function Dashboard() {
  const { data: orders = [] } = useOrders();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const { data: subscriptions = [] } = useSubscriptions();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const todaySales = orders.filter(o => new Date(o.created_at) >= startOfToday).reduce((sum, o) => sum + Number(o.total || 0), 0);
  const monthSales = orders.filter(o => new Date(o.created_at) >= startOfMonth).reduce((sum, o) => sum + Number(o.total || 0), 0);
  const netProfit = orders.reduce((sum, o) => sum + (o.order_items ?? []).reduce((s, item) => s + ((Number(item.unit_price) - Number(item.unit_cost ?? 0)) * Number(item.qty)), 0), 0);
  const projectedProfit = Math.round(netProfit * 1.12);
  const newOrders = orders.filter(o => o.status === "pending").length;
  const pendingOrders = orders.filter(o => o.status === "processing").length;
  const completedOrders = orders.filter(o => o.status === "delivered").length;
  const activeSubs = subscriptions.filter(s => s.status === "active").length;
  const expiringSubs = subscriptions.filter(s => daysUntil(s.ends_at) <= 14 && daysUntil(s.ends_at) >= 0).slice(0, 5);

  const salesSeries = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    const dayOrders = orders.filter(o => o.created_at.slice(0, 10) === key);
    return {
      day: d.toLocaleDateString("ar-EG", { day: "2-digit", month: "short" }),
      sales: dayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
      profit: dayOrders.reduce((sum, o) => sum + (o.order_items ?? []).reduce((s, item) => s + ((Number(item.unit_price) - Number(item.unit_cost ?? 0)) * Number(item.qty)), 0), 0),
    };
  });

  const productStats = new Map<string, { name: string; sold: number; revenue: number }>();
  orders.forEach(o => (o.order_items ?? []).forEach(item => {
    const current = productStats.get(item.product_name) ?? { name: item.product_name, sold: 0, revenue: 0 };
    current.sold += Number(item.qty || 0);
    current.revenue += Number(item.unit_price || 0) * Number(item.qty || 0);
    productStats.set(item.product_name, current);
  }));
  const topProducts = [...productStats.values()].sort((a, b) => b.sold - a.sold).slice(0, 5);

  const customerTotals = customers.map(c => ({
    ...c,
    totalSpent: orders.filter(o => o.customer_id === c.id).reduce((sum, o) => sum + Number(o.total || 0), 0),
  })).filter(c => c.totalSpent > 0).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  const categoryMap = new Map<string, number>();
  products.forEach(p => categoryMap.set(p.category || "أخرى", (categoryMap.get(p.category || "أخرى") ?? 0) + Number(p.price || 0)));
  const categorySplit = [...categoryMap.entries()].map(([name, value]) => ({ name, value })).slice(0, 6);

  const todayHijri = now.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-5">
      {/* Hero — royal command bar */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-900/20 royal-gradient text-white shadow-[0_20px_60px_-30px_oklch(0.19_0.12_296/0.7)]">
        <div className="pointer-events-none absolute inset-0 hero-mesh opacity-90" />
        <div className="pointer-events-none absolute inset-0 grid-dots opacity-40" />
        <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-6 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-200">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-white/10 backdrop-blur">👋</span>
              {todayHijri}
            </div>
            <h1 className="mt-2 font-display text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">
              مرحباً بعودتك إلى <span className="brand-gradient-text bg-gradient-to-r from-brand-200 to-white bg-clip-text text-transparent">Kodaty</span>
            </h1>
            <p className="mt-1 text-[13px] text-white/70">لمحة شاملة عن أداء مبيعاتك واشتراكاتك اليوم.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/orders" className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-[13px] font-semibold text-brand-800 shadow-lg transition hover:bg-white/95 active:scale-[0.98]">
              <Plus className="h-4 w-4" /> طلب جديد
            </Link>
            <Link to="/licenses" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.08] px-3.5 py-2 text-[13px] font-medium text-white backdrop-blur transition hover:bg-white/15">
              <KeyRound className="h-4 w-4" /> إضافة مفتاح
            </Link>
            <Link to="/automation" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.08] px-3.5 py-2 text-[13px] font-medium text-white backdrop-blur transition hover:bg-white/15">
              <Zap className="h-4 w-4" /> أتمتة
            </Link>
          </div>
        </div>

        {/* Live metric strip */}
        <div className="relative grid grid-cols-2 border-t border-white/10 sm:grid-cols-4">
          {[
            { label: "مبيعات اليوم", value: formatEGP(todaySales) },
            { label: "مبيعات الشهر", value: formatEGP(monthSales) },
            { label: "صافي الأرباح", value: formatEGP(netProfit) },
            { label: "اشتراكات نشطة", value: activeSubs.toLocaleString("ar-EG") },
          ].map((m, i) => (
            <div key={i} className={cn("px-6 py-4", i < 3 && "border-e border-white/10")}>
              <div className="text-[10.5px] font-medium uppercase tracking-wider text-white/60">{m.label}</div>
              <div className="mt-1 font-display text-[20px] font-semibold tracking-tight text-white num">{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="مبيعات اليوم" value={formatEGP(todaySales)} icon={ShoppingBag} tone="brand" delta={{ v: "+12.4%", up: true }} />
        <Kpi label="مبيعات الشهر" value={formatEGP(monthSales)} icon={TrendingUp} tone="info" delta={{ v: "+3.8%", up: true }} />
        <Kpi label="صافي الأرباح" value={formatEGP(netProfit)} icon={Wallet} tone="success" accent="بعد خصم التكاليف" />
        <Kpi label="أرباح متوقّعة" value={formatEGP(projectedProfit)} icon={TrendingUp} tone="warning" accent="نهاية الشهر" />
      </div>

      {/* Orders mini-KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "طلبات جديدة", value: newOrders, icon: ShoppingBag, tone: "text-info", bg: "bg-info/10" },
          { label: "طلبات معلّقة", value: pendingOrders, icon: Clock, tone: "text-warning", bg: "bg-warning/12" },
          { label: "طلبات مكتملة", value: completedOrders, icon: CheckCircle2, tone: "text-success", bg: "bg-success/10" },
          { label: "اشتراكات نشطة", value: activeSubs, icon: RefreshCw, tone: "text-primary", bg: "bg-brand-50" },
        ].map((k, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5 transition hover:border-border-strong">
            <div className={cn("grid h-9 w-9 place-items-center rounded-lg", k.bg)}>
              <k.icon className={cn("h-4 w-4", k.tone)} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{k.label}</div>
              <div className="font-display text-lg font-semibold num">{formatNumber(k.value)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="surface-elevated col-span-1 p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">المبيعات والأرباح</div>
              <div className="text-xs text-muted-foreground">آخر 30 يوماً</div>
            </div>
            <div className="flex gap-1 rounded-lg border border-border bg-surface-sunken p-0.5 text-xs">
              {["يوم", "أسبوع", "شهر", "سنة"].map((t, i) => (
                <button key={t} className={cn("rounded-md px-2.5 py-1 transition", i === 2 ? "bg-surface font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={salesSeries} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-500)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--brand-500)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "var(--color-muted-foreground)" }}
                />
                <Area type="monotone" dataKey="sales" stroke="var(--brand-500)" strokeWidth={2} fill="url(#gSales)" />
                <Area type="monotone" dataKey="profit" stroke="var(--chart-4)" strokeWidth={2} fill="url(#gProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-elevated p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold">توزيع المبيعات حسب الفئة</div>
            <div className="text-xs text-muted-foreground">النسبة من إجمالي هذا الشهر</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={categorySplit.length ? categorySplit : [{ name: "لا توجد بيانات", value: 0 }]} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                  {(categorySplit.length ? categorySplit : [{ name: "لا توجد بيانات", value: 0 }]).map((_, i) => (
                    <Cell key={i} fill={`oklch(${0.72 - i * 0.05} 0.2 ${296 - i * 8})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lists row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="surface-elevated p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">أفضل المنتجات</div>
            <Link to="/products" className="text-xs text-primary hover:underline">عرض الكل</Link>
          </div>
          <ul className="space-y-3">
            {topProducts.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">لا توجد منتجات مباعة بعد</li>}
            {topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-sunken text-lg">📦</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground num">{formatNumber(p.sold)} عملية بيع</div>
                </div>
                <div className="text-xs font-medium text-muted-foreground">#{i + 1}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-elevated p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">أكثر العملاء شراءً</div>
            <Link to="/customers" className="text-xs text-primary hover:underline">عرض الكل</Link>
          </div>
          <ul className="space-y-3">
            {customerTotals.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">لا توجد مشتريات للعملاء بعد</li>}
            {customerTotals.map(c => (
              <li key={c.id}>
                <Link to="/customers/$id" params={{ id: c.id }} className="flex items-center gap-3 rounded-lg -mx-2 px-2 py-1 hover:bg-accent/40">
                  <Avatar name={c.name} color={avatarColor(c.name)} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.email || "عميل"}</div>
                  </div>
                  <div className="text-xs font-semibold num">{formatEGP(c.totalSpent)}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-elevated p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">اشتراكات تنتهي قريباً</div>
            <Link to="/subscriptions" className="text-xs text-primary hover:underline">إدارة</Link>
          </div>
          {expiringSubs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">لا شيء عاجل. أحسنت 👏</div>
          ) : (
            <ul className="space-y-3">
              {expiringSubs.map(s => {
                const d = daysUntil(s.ends_at);
                return (
                  <li key={s.id} className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-warning/10">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{s.customers?.name || "عميل"}</div>
                      <div className="truncate text-xs text-muted-foreground">{s.product_name}</div>
                    </div>
                    <div className="text-xs font-medium text-warning num">{d} يوم</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="surface-elevated overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <div className="text-sm font-semibold">آخر العمليات</div>
            <div className="text-xs text-muted-foreground">أحدث الطلبات في مساحتك</div>
          </div>
          <Link to="/orders" className="text-xs text-primary hover:underline">عرض جميع الطلبات</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border bg-surface-sunken/50 text-xs text-muted-foreground">
                <th className="px-5 py-2 text-start font-medium">الرقم</th>
                <th className="px-3 py-2 text-start font-medium">العميل</th>
                <th className="px-3 py-2 text-start font-medium">المنتج</th>
                <th className="px-3 py-2 text-start font-medium">الحالة</th>
                <th className="px-3 py-2 text-start font-medium">المبلغ</th>
                <th className="px-5 py-2 text-start font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">لا توجد طلبات حالياً — ابدأ بإضافة بياناتك الحقيقية.</td>
                </tr>
              ) : orders.slice(0, 8).map(o => {
                const firstItem = o.order_items?.[0];
                return (
                  <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-accent/30">
                    <td className="px-5 py-3">
                      <Link to="/orders/$id" params={{ id: o.id }} className="num font-medium text-primary hover:underline">{o.code}</Link>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={o.customers?.name || "عميل"} color={avatarColor(o.customers?.name || o.id)} size={24} />
                        <span className="truncate">{o.customers?.name || "عميل"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">📦 <span className="truncate">{firstItem?.product_name || "—"}</span></td>
                    <td className="px-3 py-3"><StatusPill status={o.status} /></td>
                    <td className="px-3 py-3 num font-medium">{formatEGP(Number(o.total || 0))}</td>
                    <td className="px-5 py-3 text-muted-foreground">{relativeTime(o.created_at)}</td>
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

function formatNumber(n: number): string {
  return new Intl.NumberFormat("ar-EG").format(n);
}

function daysUntil(date: string): number {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.max(1, Math.round(diff / 60_000));
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.round(hours / 24);
  return `منذ ${days} يوم`;
}
