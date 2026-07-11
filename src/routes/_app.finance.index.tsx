import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Download, Plus, Receipt, BookOpen, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useOrders, useCustomers, useProducts, useCreateOrder,
  avatarColor, formatEGP, type OrderStatus, type OrderPriority,
} from "@/lib/db";
import { Avatar } from "@/components/app/pills";
import { RequireAdmin } from "@/components/app/require-admin";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/finance/")({
  component: () => (<RequireAdmin><Finance /></RequireAdmin>),
  head: () => ({ meta: [{ title: "المالية والمحاسبة — Kodaty" }] }),
});

const PAYMENT_LABELS: Record<string, string> = {
  instapay: "InstaPay",
  vodafone_cash: "فودافون كاش",
  usdt: "USDT",
  bank: "تحويل بنكي",
  stripe: "Stripe",
  cash: "نقدي",
};

function Finance() {
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: journal = [] } = useJournal();

  const stats = useMemo(() => {
    const revenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const paid = orders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0);
    const unpaid = orders.filter(o => o.status === "pending" || o.status === "processing")
      .reduce((s, o) => s + Number(o.total), 0);
    const expenses = journal
      .filter(e => e.debit_account.startsWith("5"))
      .reduce((s, e) => s + Number(e.amount), 0);
    const profit = paid - expenses;
    return { revenue, paid, unpaid, expenses, profit, unpaidCount: orders.filter(o => o.status !== "delivered" && o.status !== "cancelled" && o.status !== "refunded").length };
  }, [orders, journal]);

  // Cash flow series (last 30 days)
  const cashSeries = useMemo(() => {
    const days: { day: string; revenue: number; expenses: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const revenue = orders
        .filter(o => o.created_at.slice(0, 10) === key)
        .reduce((s, o) => s + Number(o.total), 0);
      const expenses = journal
        .filter(e => e.entry_date === key && e.debit_account.startsWith("5"))
        .reduce((s, e) => s + Number(e.amount), 0);
      days.push({ day: d.getDate().toString(), revenue, expenses });
    }
    return days;
  }, [orders, journal]);

  const paymentSplit = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => {
      const k = o.payment_method || "cash";
      map.set(k, (map.get(k) ?? 0) + Number(o.total));
    });
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0) || 1;
    const palette = ["var(--brand-600)", "var(--brand-400)", "var(--brand-500)", "var(--brand-700)", "var(--brand-300)", "var(--brand-800)"];
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([k, v], i) => ({
        name: PAYMENT_LABELS[k] ?? k,
        value: Math.round((v / total) * 100),
        amount: v,
        color: palette[i % palette.length],
      }));
  }, [orders]);

  const recentInvoices = orders.slice(0, 12);

  const exportInvoicesCsv = () => {
    const rows = ["الفاتورة,العميل,المبلغ,الحالة,التاريخ"]
      .concat(recentInvoices.map(o =>
        `${o.code},${o.customers?.name ?? "—"},${o.total},${o.status},${new Date(o.created_at).toISOString()}`,
      )).join("\n");
    const blob = new Blob(["\uFEFF" + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `invoices-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">المالية والمحاسبة</h1>
          <p className="mt-1 text-sm text-muted-foreground">تدفقاتك النقدية، فواتيرك، مصاريفك، والقيود المحاسبية.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/finance/journal"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition hover:bg-accent"
          >
            <BookOpen className="h-4 w-4" /> القيود المحاسبية
          </Link>
          <button
            onClick={exportInvoicesCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition hover:bg-accent"
          >
            <Download className="h-4 w-4" /> تصدير CSV
          </button>
          <NewInvoiceDialog />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="إجمالي الإيرادات" value={formatEGP(stats.revenue)} delta={{ v: `${orders.length} طلب`, up: true }} icon={Wallet} tone="brand" />
        <Kpi label="مقبوضات" value={formatEGP(stats.paid)} delta={{ v: "طلبات مُسلّمة", up: true }} icon={TrendingUp} tone="success" />
        <Kpi label="مصروفات" value={formatEGP(stats.expenses)} delta={{ v: "من القيود", up: false }} icon={TrendingDown} tone="warning" />
        <Kpi label="فواتير غير مدفوعة" value={formatEGP(stats.unpaid)} delta={{ v: `${stats.unpaidCount} فاتورة`, up: false }} icon={Receipt} tone="info" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-elevated p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">التدفق النقدي</h3>
              <p className="text-xs text-muted-foreground">آخر 30 يوماً — الإيرادات مقابل المصروفات</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "var(--brand-600)" }} />الإيرادات</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" />المصروفات</span>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer>
              <AreaChart data={cashSeries}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-600)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--brand-600)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} width={50} />
                <Tooltip
                  contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number) => formatEGP(v)}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--brand-600)" strokeWidth={2} fill="url(#rev)" />
                <Area type="monotone" dataKey="expenses" stroke="var(--color-warning)" strokeWidth={1.5} fill="transparent" strokeDasharray="4 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="surface-elevated p-5">
          <h3 className="text-sm font-semibold">وسائل الدفع</h3>
          <p className="text-xs text-muted-foreground">توزيع الإيرادات</p>
          <div className="mt-4 space-y-3">
            {paymentSplit.length === 0 && (
              <p className="text-xs text-muted-foreground">لا توجد بيانات بعد.</p>
            )}
            {paymentSplit.map(p => (
              <div key={p.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-foreground">{p.name}</span>
                  <span className="num text-muted-foreground">{p.value}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                  <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${p.value}%`, background: p.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses trend */}
      <div className="surface-elevated p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">المصروفات اليومية</h3>
            <p className="text-xs text-muted-foreground">من القيود المحاسبية (حسابات 5xxx)</p>
          </div>
          <Link to="/finance/journal" className="text-xs font-medium text-primary hover:underline">إدارة القيود ←</Link>
        </div>
        <div className="h-[180px]">
          <ResponsiveContainer>
            <BarChart data={cashSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} width={50} />
              <Tooltip
                contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 12 }}
                formatter={(v: number) => formatEGP(v)}
              />
              <Bar dataKey="expenses" fill="var(--brand-600)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Invoices */}
      <div className="surface-elevated overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold">أحدث الفواتير</h3>
            <p className="text-xs text-muted-foreground">مأخوذة مباشرة من الطلبات</p>
          </div>
          <Link to="/orders" className="text-xs font-medium text-primary hover:underline">عرض كل الطلبات ←</Link>
        </div>
        {ordersLoading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : recentInvoices.length === 0 ? (
          <div className="grid place-items-center gap-3 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">لا توجد فواتير بعد</div>
              <p className="mt-1 text-xs text-muted-foreground">ابدأ بإنشاء فاتورة جديدة من الزر أعلاه.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-t border-border bg-surface-sunken/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 text-start font-medium">الفاتورة</th>
                  <th className="px-3 py-2.5 text-start font-medium">العميل</th>
                  <th className="px-3 py-2.5 text-start font-medium">المنتج</th>
                  <th className="px-3 py-2.5 text-start font-medium">الدفع</th>
                  <th className="px-3 py-2.5 text-start font-medium">المبلغ</th>
                  <th className="px-3 py-2.5 text-start font-medium">الحالة</th>
                  <th className="px-5 py-2.5 text-start font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(o => {
                  const cName = o.customers?.name ?? "—";
                  const item = o.order_items?.[0];
                  const paid = o.status === "delivered";
                  return (
                    <tr key={o.id} className="border-t border-border/60 hover:bg-accent/30">
                      <td className="px-5 py-3">
                        <Link to="/orders/$id" params={{ id: o.id }} className="font-mono text-xs text-primary hover:underline">
                          {o.code}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={cName} color={avatarColor(o.customer_id ?? cName)} size={24} />
                          <span className="truncate">{cName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{item?.product_name ?? "—"}</td>
                      <td className="px-3 py-3 text-xs">{PAYMENT_LABELS[o.payment_method ?? "cash"] ?? "—"}</td>
                      <td className="px-3 py-3 num font-medium">{formatEGP(Number(o.total))}</td>
                      <td className="px-3 py-3">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs",
                          paid ? "border-success/25 bg-success/10 text-success" : "border-warning/25 bg-warning/10 text-warning",
                        )}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {paid ? "مدفوعة" : "قيد الدفع"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ar-EG")}</td>
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

// ---------- Journal hook ----------
function useJournal() {
  return useQuery({
    queryKey: ["journal_entries"],
    queryFn: async () => {
      const { data, error } = await (supabase as never as ReturnType<typeof supabase.from>)
        .from("journal_entries" as never)
        .select("id, entry_date, debit_account, credit_account, amount");
      if (error) throw error;
      return (data ?? []) as { id: string; entry_date: string; debit_account: string; credit_account: string; amount: number }[];
    },
  });
}

// ---------- KPI card ----------
function Kpi({ label, value, delta, icon: Icon, tone }: {
  label: string; value: string; delta?: { v: string; up: boolean }; icon: React.ElementType; tone: "brand" | "success" | "warning" | "info";
}) {
  const toneMap = {
    brand: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    info: "text-info bg-info/10",
  } as const;
  return (
    <div className="surface-elevated relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-2xl font-semibold tracking-tight num">{value}</div>
        </div>
        <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", toneMap[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {delta && (
        <div className={cn("mt-3 inline-flex items-center gap-1 text-xs", delta.up ? "text-success" : "text-muted-foreground")}>
          {delta.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span>{delta.v}</span>
        </div>
      )}
    </div>
  );
}

// ---------- New Invoice dialog (inline, no navigation) ----------
function NewInvoiceDialog() {
  const [open, setOpen] = useState(false);
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const create = useCreateOrder();
  const [form, setForm] = useState({
    customer_id: "", product_id: "", qty: 1,
    priority: "normal" as OrderPriority, status: "pending" as OrderStatus,
  });
  const product = products.find(p => p.id === form.product_id);
  const total = product ? Number(product.price) * form.qty : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id || !product) return;
    try {
      await create.mutateAsync({
        customer_id: form.customer_id,
        product_id: product.id,
        product_name: product.name,
        unit_price: Number(product.price),
        qty: form.qty,
        priority: form.priority,
        status: form.status,
      });
      toast.success("تم إنشاء الفاتورة");
      setForm({ customer_id: "", product_id: "", qty: 1, priority: "normal", status: "pending" });
      setOpen(false);
    } catch (err) {
      toast.error("تعذّر الإنشاء", { description: (err as Error).message });
    }
  };

  const input = "w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95">
          <Plus className="h-4 w-4" /> فاتورة جديدة
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>إنشاء فاتورة جديدة</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">العميل *</span>
            <select required value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} className={input}>
              <option value="">اختر عميلاً…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {customers.length === 0 && <p className="mt-1 text-xs text-muted-foreground">أضف عميلاً أولاً من صفحة العملاء.</p>}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">المنتج *</span>
            <select required value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} className={input}>
              <option value="">اختر منتجاً…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} — {formatEGP(Number(p.price))}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">الكمية</span>
              <input type="number" min={1} value={form.qty} onChange={e => setForm({ ...form, qty: Math.max(1, Number(e.target.value)) })} className={input} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">الأولوية</span>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as OrderPriority })} className={input}>
                <option value="low">منخفضة</option>
                <option value="normal">عادية</option>
                <option value="high">مرتفعة</option>
                <option value="urgent">عاجلة</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">الحالة</span>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as OrderStatus })} className={input}>
                <option value="pending">قيد الدفع</option>
                <option value="processing">قيد التنفيذ</option>
                <option value="delivered">مدفوعة/مُسلّمة</option>
              </select>
            </label>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm">
            <span className="text-muted-foreground">إجمالي الفاتورة</span>
            <span className="num font-semibold text-primary">{formatEGP(total)}</span>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-accent">إلغاء</button>
            <button type="submit" disabled={create.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              إنشاء الفاتورة
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
