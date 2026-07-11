import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Bar, BarChart, Cell,
} from "recharts";
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, ShoppingBag,
  Clock, CheckCircle2, RefreshCw, AlertTriangle, Plus, Zap, KeyRound,
} from "lucide-react";
import { orders, customers, products, subscriptions, salesSeries, categorySplit, formatCurrency, formatNumber, relativeTime, customerById, productById, daysUntil } from "@/lib/mock/data";
import { StatusPill, Avatar } from "@/components/app/pills";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "الرئيسية — Kodaty" }] }),
});

function Kpi({
  label, value, delta, icon: Icon, tone = "brand",
}: { label: string; value: string; delta?: { v: string; up: boolean }; icon: React.ElementType; tone?: "brand" | "success" | "warning" | "info" }) {
  const toneMap = {
    brand: "from-brand-500/10 to-brand-500/0 text-brand-600",
    success: "from-success/10 to-success/0 text-success",
    warning: "from-warning/15 to-warning/0 text-warning",
    info: "from-info/10 to-info/0 text-info",
  } as const;
  return (
    <div className="surface-elevated relative overflow-hidden p-5">
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-bl opacity-60", toneMap[tone])} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight num">{value}</div>
          {delta && (
            <div className={cn("mt-2 inline-flex items-center gap-1 text-xs font-medium", delta.up ? "text-success" : "text-destructive")}>
              {delta.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span className="num">{delta.v}</span>
              <span className="text-muted-foreground font-normal">مقارنة بالأمس</span>
            </div>
          )}
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface")}>
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const todaySales = 24680;
  const monthSales = 486320;
  const netProfit = 172450;
  const projectedProfit = 218900;
  const newOrders = orders.filter(o => o.status === "new").length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const completedOrders = orders.filter(o => o.status === "completed").length;
  const activeSubs = subscriptions.filter(s => s.status === "active").length;
  const expiringSubs = subscriptions.filter(s => s.status === "expiring");
  const topProducts = [...products].sort((a, b) => b.sold - a.sold).slice(0, 5);
  const topCustomers = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="surface-elevated relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 mesh-bg opacity-70" />
        <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-primary">مرحباً بعودتك، منال 👋</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">لوحة القيادة</h1>
            <p className="mt-1 text-sm text-muted-foreground">لمحة شاملة عن أداء مبيعاتك اليوم.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/orders" className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-brand transition hover:opacity-90">
              <Plus className="h-4 w-4" /> طلب جديد
            </Link>
            <Link to="/licenses" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition hover:bg-accent">
              <KeyRound className="h-4 w-4" /> إضافة مفتاح
            </Link>
            <Link to="/automation" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition hover:bg-accent">
              <Zap className="h-4 w-4" /> أتمتة
            </Link>
          </div>

        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="مبيعات اليوم" value={formatCurrency(todaySales)} delta={{ v: "+18.4%", up: true }} icon={ShoppingBag} tone="brand" />
        <Kpi label="مبيعات الشهر" value={formatCurrency(monthSales)} delta={{ v: "+9.2%", up: true }} icon={TrendingUp} tone="info" />
        <Kpi label="صافي الأرباح" value={formatCurrency(netProfit)} delta={{ v: "+12.7%", up: true }} icon={Wallet} tone="success" />
        <Kpi label="الأرباح المتوقعة" value={formatCurrency(projectedProfit)} delta={{ v: "−2.1%", up: false }} icon={TrendingUp} tone="warning" />
      </div>

      {/* Orders mini-KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "طلبات جديدة", value: newOrders, icon: ShoppingBag, tone: "text-info" },
          { label: "طلبات معلّقة", value: pendingOrders, icon: Clock, tone: "text-warning" },
          { label: "طلبات مكتملة", value: completedOrders, icon: CheckCircle2, tone: "text-success" },
          { label: "اشتراكات نشطة", value: activeSubs, icon: RefreshCw, tone: "text-primary" },
        ].map((k, i) => (
          <div key={i} className="surface-elevated flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-sunken">
              <k.icon className={cn("h-4 w-4", k.tone)} />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground truncate">{k.label}</div>
              <div className="num text-lg font-semibold">{formatNumber(k.value)}</div>
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
              <BarChart data={categorySplit} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                  {categorySplit.map((_, i) => (
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
            {topProducts.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-sunken text-lg">{p.icon}</div>
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
            {topCustomers.map(c => (
              <li key={c.id}>
                <Link to="/customers/$id" params={{ id: c.id }} className="flex items-center gap-3 rounded-lg -mx-2 px-2 py-1 hover:bg-accent/40">
                  <Avatar name={c.name} color={c.avatarColor} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.country}</div>
                  </div>
                  <div className="text-xs font-semibold num">{formatCurrency(c.totalSpent)}</div>
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
                const c = customerById(s.customerId);
                const p = productById(s.productId);
                const d = daysUntil(s.endAt);
                return (
                  <li key={s.id} className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-warning/10">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{c.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{p.name}</div>
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
              {orders.slice(0, 8).map(o => {
                const c = customerById(o.customerId);
                const p = productById(o.productId);
                return (
                  <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-accent/30">
                    <td className="px-5 py-3">
                      <Link to="/orders/$id" params={{ id: o.id }} className="num font-medium text-primary hover:underline">{o.code}</Link>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={c.name} color={c.avatarColor} size={24} />
                        <span className="truncate">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{p.icon} <span className="truncate">{p.name}</span></td>
                    <td className="px-3 py-3"><StatusPill status={o.status} /></td>
                    <td className="px-3 py-3 num font-medium">{formatCurrency(o.amount)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{relativeTime(o.createdAt)}</td>
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
