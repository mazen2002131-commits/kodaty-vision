import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Download, Plus, CreditCard, Receipt, Landmark } from "lucide-react";
import { orders, customers, formatCurrency, salesSeries, paymentLabels, customerById, productById, relativeTime } from "@/lib/mock/data";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/app/pills";
import { RequireAdmin } from "@/components/app/require-admin";

export const Route = createFileRoute("/_app/finance")({
  component: () => (<RequireAdmin><Finance /></RequireAdmin>),
  head: () => ({ meta: [{ title: "المالية — Kodaty" }] }),
});

const expenses = [
  { day: "1", value: 1200 }, { day: "5", value: 1800 }, { day: "10", value: 950 },
  { day: "15", value: 2100 }, { day: "20", value: 1450 }, { day: "25", value: 2600 }, { day: "30", value: 1900 },
];

const invoices = orders.slice(0, 12).map((o, i) => ({
  ...o,
  invoice: `INV-${2600 + i}`,
  paid: i % 4 !== 0,
}));

const paymentSplit = [
  { name: "InstaPay", value: 34, color: "#4F04AC" },
  { name: "USDT", value: 22, color: "#9333EA" },
  { name: "فودافون كاش", value: 18, color: "#7C3AED" },
  { name: "بنكي", value: 14, color: "#A855F7" },
  { name: "Stripe", value: 12, color: "#C084FC" },
];

function Kpi({ label, value, delta, icon: Icon, tone }: {
  label: string; value: string; delta?: { v: string; up: boolean }; icon: React.ElementType; tone: "brand" | "success" | "warning" | "info";
}) {
  const toneMap = {
    brand: "text-brand-600", success: "text-success", warning: "text-warning", info: "text-info",
  } as const;
  return (
    <div className="surface-elevated relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-2xl font-bold tracking-tight num">{value}</div>
        </div>
        <div className={cn("grid h-9 w-9 place-items-center rounded-xl bg-surface-sunken", toneMap[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {delta && (
        <div className={cn("mt-3 inline-flex items-center gap-1 text-xs", delta.up ? "text-success" : "text-destructive")}>
          {delta.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span className="num">{delta.v}</span>
          <span className="text-muted-foreground">مقارنة بالشهر السابق</span>
        </div>
      )}
    </div>
  );
}

function Finance() {
  const totalRevenue = orders.reduce((s, o) => s + o.amount, 0);
  const totalCost = orders.reduce((s, o) => s + o.cost, 0);
  const profit = totalRevenue - totalCost;
  const unpaid = invoices.filter(i => !i.paid).reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">المالية</h1>
          <p className="mt-1 text-sm text-muted-foreground">تدفقاتك النقدية، فواتيرك، ومصاريفك في مكان واحد.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground hover:bg-secondary">
            <Download className="h-4 w-4" /> تصدير CSV
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:bg-brand-700">
            <Plus className="h-4 w-4" /> فاتورة جديدة
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="إجمالي الإيرادات" value={formatCurrency(totalRevenue)} delta={{ v: "+14.2%", up: true }} icon={Wallet} tone="brand" />
        <Kpi label="صافي الأرباح" value={formatCurrency(profit)} delta={{ v: "+9.8%", up: true }} icon={TrendingUp} tone="success" />
        <Kpi label="إجمالي المصروفات" value={formatCurrency(totalCost)} delta={{ v: "+3.4%", up: false }} icon={TrendingDown} tone="warning" />
        <Kpi label="فواتير غير مدفوعة" value={formatCurrency(unpaid)} delta={{ v: "5 فواتير", up: false }} icon={Receipt} tone="info" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-elevated p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">التدفق النقدي</h3>
              <p className="text-xs text-muted-foreground">آخر 30 يوماً</p>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer>
              <AreaChart data={salesSeries}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F04AC" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4F04AC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} width={40} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="sales" stroke="#4F04AC" strokeWidth={2} fill="url(#rev)" />
                <Area type="monotone" dataKey="profit" stroke="#22C55E" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="surface-elevated p-5">
          <h3 className="text-sm font-semibold">وسائل الدفع</h3>
          <p className="text-xs text-muted-foreground">توزيع الإيرادات</p>
          <div className="mt-4 space-y-3">
            {paymentSplit.map(p => (
              <div key={p.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-foreground">{p.name}</span>
                  <span className="num text-muted-foreground">{p.value}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                  <div className="h-full rounded-full" style={{ width: `${p.value}%`, background: p.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses */}
      <div className="surface-elevated p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">المصروفات اليومية</h3>
            <p className="text-xs text-muted-foreground">تكاليف الشراء والاشتراكات والعمولات</p>
          </div>
        </div>
        <div className="h-[180px]">
          <ResponsiveContainer>
            <BarChart data={expenses}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} width={40} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" fill="#4F04AC" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Invoices */}
      <div className="surface-elevated overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold">الفواتير الأخيرة</h3>
            <p className="text-xs text-muted-foreground">أحدث المعاملات المالية</p>
          </div>
          <button className="text-xs font-medium text-primary hover:underline">عرض الكل</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-sunken text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-start font-medium">الفاتورة</th>
                <th className="px-5 py-3 text-start font-medium">العميل</th>
                <th className="px-5 py-3 text-start font-medium">المنتج</th>
                <th className="px-5 py-3 text-start font-medium">وسيلة الدفع</th>
                <th className="px-5 py-3 text-start font-medium">المبلغ</th>
                <th className="px-5 py-3 text-start font-medium">الحالة</th>
                <th className="px-5 py-3 text-start font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const c = customerById(inv.customerId);
                const p = productById(inv.productId);
                return (
                  <tr key={inv.id} className="border-t border-border hover:bg-surface-sunken/60">
                    <td className="px-5 py-3 font-mono text-xs text-primary">{inv.invoice}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={c.name} color={c.avatarColor} size={26} />
                        <span className="text-sm">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{p.name}</td>
                    <td className="px-5 py-3 text-xs">{paymentLabels[inv.payment]}</td>
                    <td className="px-5 py-3 num font-medium">{formatCurrency(inv.amount)}</td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs",
                        inv.paid ? "border-success/25 bg-success/10 text-success" : "border-warning/25 bg-warning/10 text-warning",
                      )}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {inv.paid ? "مدفوعة" : "قيد الدفع"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{relativeTime(inv.createdAt)}</td>
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
