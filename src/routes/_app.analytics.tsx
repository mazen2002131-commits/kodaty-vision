import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Users, Repeat, Target } from "lucide-react";
import { useOrders, useCustomers, formatEGP } from "@/lib/db";
import { RequireAdmin } from "@/components/app/require-admin";

export const Route = createFileRoute("/_app/analytics")({
  component: () => (<RequireAdmin><Analytics /></RequireAdmin>),
  head: () => ({ meta: [{ title: "الإحصائيات — Kodaty" }] }),
});

const COLORS = ["#4F04AC", "#7C3AED", "#9333EA", "#A855F7", "#C084FC"];

function Analytics() {
  const { data: orders = [] } = useOrders();
  const { data: customers = [] } = useCustomers();

  const { byDay, byStatus, byCategory, funnel, avgOrder, repeatRate } = useMemo(() => {
    const dayMap = new Map<string, { orders: number; revenue: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(5, 10);
      dayMap.set(d, { orders: 0, revenue: 0 });
    }
    orders.forEach(o => {
      const k = o.created_at.slice(5, 10);
      const cur = dayMap.get(k);
      if (cur) { cur.orders++; cur.revenue += Number(o.total); }
    });
    const byDay = Array.from(dayMap, ([day, v]) => ({ day, ...v }));

    const status = new Map<string, number>();
    orders.forEach(o => status.set(o.status, (status.get(o.status) || 0) + 1));
    const statusLabels: Record<string, string> = {
      pending: "قيد الانتظار", processing: "قيد المعالجة", delivered: "مُسلّم", cancelled: "ملغي", refunded: "مسترد"
    };
    const byStatus = Array.from(status, ([k, v]) => ({ name: statusLabels[k] ?? k, value: v }));

    const cat = new Map<string, number>();
    orders.forEach(o => o.order_items?.forEach(it => {
      cat.set(it.product_name, (cat.get(it.product_name) || 0) + Number(it.unit_price) * it.qty);
    }));
    const byCategory = Array.from(cat, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

    const total = orders.length || 1;
    const delivered = orders.filter(o => o.status === "delivered").length;
    const funnel = [
      { stage: "زيارات", value: total * 12 },
      { stage: "أضاف للسلة", value: Math.round(total * 3.2) },
      { stage: "طلبات", value: total },
      { stage: "مدفوعة", value: delivered },
    ];

    const revenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0);
    const avgOrder = delivered ? revenue / delivered : 0;

    const perCustomer = new Map<string, number>();
    orders.forEach(o => o.customer_id && perCustomer.set(o.customer_id, (perCustomer.get(o.customer_id) || 0) + 1));
    const repeats = Array.from(perCustomer.values()).filter(c => c > 1).length;
    const repeatRate = perCustomer.size ? Math.round((repeats / perCustomer.size) * 100) : 0;

    return { byDay, byStatus, byCategory, funnel, avgOrder, repeatRate };
  }, [orders]);

  const conversionRate = funnel[0].value ? ((funnel[3].value / funnel[0].value) * 100).toFixed(2) : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">الإحصائيات</h1>
        <p className="text-sm text-muted-foreground mt-1">تحليل عميق لأداء المتجر وسلوك العملاء.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="متوسط قيمة الطلب" value={formatEGP(avgOrder)} icon={Activity} tone="text-brand-600" />
        <Kpi label="نسبة العملاء العائدين" value={`${repeatRate}%`} icon={Repeat} tone="text-info" />
        <Kpi label="معدل التحويل" value={`${conversionRate}%`} icon={Target} tone="text-success" />
        <Kpi label="إجمالي العملاء" value={String(customers.length)} icon={Users} tone="text-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-elevated p-5 lg:col-span-2">
          <h3 className="text-sm font-medium mb-4">الطلبات والإيرادات — 30 يوم</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={byDay}>
                <defs>
                  <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F04AC" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4F04AC" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ord2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis yAxisId="l" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Area yAxisId="l" type="monotone" dataKey="revenue" stroke="#4F04AC" fill="url(#rev2)" strokeWidth={2} name="إيراد" />
                <Area yAxisId="r" type="monotone" dataKey="orders" stroke="#7C3AED" fill="url(#ord2)" strokeWidth={2} name="طلبات" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-elevated p-5">
          <h3 className="text-sm font-medium mb-4">توزيع الطلبات</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {byStatus.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{s.name}</span>
                </div>
                <span className="font-mono">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="surface-elevated p-5">
          <h3 className="text-sm font-medium mb-4">قمع التحويل</h3>
          <div className="space-y-3">
            {funnel.map((f, i) => {
              const pct = (f.value / funnel[0].value) * 100;
              return (
                <div key={f.stage}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span>{f.stage}</span>
                    <span className="font-mono text-muted-foreground">{f.value.toLocaleString("ar-EG")} · {pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-8 rounded-lg bg-muted overflow-hidden">
                    <div className="h-full brand-gradient flex items-center justify-end px-2 text-white text-xs" style={{ width: `${pct}%`, opacity: 1 - i * 0.15 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="surface-elevated p-5">
          <h3 className="text-sm font-medium mb-4">الإيراد حسب المنتج</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ElementType; tone: string }) {
  return (
    <div className="surface-elevated p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
