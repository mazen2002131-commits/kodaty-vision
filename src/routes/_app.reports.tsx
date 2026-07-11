import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { Download, FileSpreadsheet, TrendingUp, Users, ShoppingBag, KeyRound } from "lucide-react";
import { useOrders, useCustomers, useLicenses, useSubscriptions, formatEGP } from "@/lib/db";
import { RequireAdmin } from "@/components/app/require-admin";

export const Route = createFileRoute("/_app/reports")({
  component: () => (<RequireAdmin><Reports /></RequireAdmin>),
  head: () => ({ meta: [{ title: "التقارير — Kodaty" }] }),
});

function Reports() {
  const { data: orders = [] } = useOrders();
  const { data: customers = [] } = useCustomers();
  const { data: licenses = [] } = useLicenses();
  const { data: subs = [] } = useSubscriptions();

  const stats = useMemo(() => {
    const revenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0);
    const pending = orders.filter(o => o.status === "pending" || o.status === "processing").length;
    const soldLicenses = licenses.filter(l => l.status === "sold").length;
    return { revenue, pending, soldLicenses };
  }, [orders, licenses]);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      map.set(d.toISOString().slice(5, 10), 0);
    }
    orders.forEach(o => {
      const k = o.created_at.slice(5, 10);
      if (map.has(k)) map.set(k, (map.get(k) || 0) + Number(o.total));
    });
    return Array.from(map, ([day, value]) => ({ day, value }));
  }, [orders]);

  const byProduct = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => o.order_items?.forEach(it => {
      map.set(it.product_name, (map.get(it.product_name) || 0) + Number(it.unit_price) * it.qty);
    }));
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [orders]);

  const exportCSV = (name: string, rows: Record<string, unknown>[]) => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(","), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${name}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const kpis = [
    { label: "الإيرادات المحققة", value: formatEGP(stats.revenue), icon: TrendingUp, tone: "text-success" },
    { label: "العملاء الكلي", value: String(customers.length), icon: Users, tone: "text-brand-600" },
    { label: "طلبات قيد التنفيذ", value: String(stats.pending), icon: ShoppingBag, tone: "text-warning" },
    { label: "مفاتيح مُباعة", value: String(stats.soldLicenses), icon: KeyRound, tone: "text-info" },
  ];

  const reports = [
    { name: "sales-orders", label: "تقرير الطلبات", rows: orders.map(o => ({ code: o.code, customer: o.customers?.name, status: o.status, total: o.total, date: o.created_at })) },
    { name: "customers", label: "تقرير العملاء", rows: customers.map(c => ({ name: c.name, email: c.email, phone: c.phone, tier: c.tier, created_at: c.created_at })) },
    { name: "licenses", label: "تقرير المفاتيح", rows: licenses.map(l => ({ product: l.product_name, status: l.status, cost: l.cost, created_at: l.created_at })) },
    { name: "subscriptions", label: "تقرير الاشتراكات", rows: subs.map(s => ({ product: s.product_name, customer: s.customers?.name, status: s.status, ends_at: s.ends_at })) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">التقارير</h1>
          <p className="text-sm text-muted-foreground mt-1">تقارير قابلة للتصدير عن المبيعات والعملاء والمخزون.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="surface-elevated p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{k.label}</span>
              <k.icon className={`h-4 w-4 ${k.tone}`} />
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-elevated p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">الإيرادات — آخر 30 يوم</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={byDay}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F04AC" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#4F04AC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Area type="monotone" dataKey="value" stroke="#4F04AC" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-elevated p-5">
          <h3 className="text-sm font-medium mb-4">الأكثر مبيعاً</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={byProduct} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={120} />
                <Tooltip contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {byProduct.map((_, i) => <Cell key={i} fill={i === 0 ? "#4F04AC" : "#7C3AED"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="surface-elevated p-5">
        <h3 className="text-sm font-medium mb-4">تصدير التقارير</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reports.map(r => (
            <button
              key={r.name}
              onClick={() => exportCSV(r.name, r.rows)}
              className="group flex items-center justify-between rounded-xl border border-border bg-surface p-4 hover:border-brand-500/50 hover:shadow-brand transition"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl brand-gradient-soft">
                  <FileSpreadsheet className="h-5 w-5 text-brand-600" />
                </div>
                <div className="text-start">
                  <div className="text-sm font-medium">{r.label}</div>
                  <div className="text-xs text-muted-foreground">{r.rows.length} سجل</div>
                </div>
              </div>
              <Download className="h-4 w-4 text-muted-foreground group-hover:text-brand-600" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
