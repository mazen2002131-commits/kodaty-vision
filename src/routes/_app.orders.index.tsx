import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Download, Plus, Loader2, Trash2, Pencil } from "lucide-react";

import {
  useOrders, useCustomers, useProducts, useCreateOrder, useDeleteOrder,
  avatarColor, formatEGP,
  type OrderStatus, type OrderPriority,
} from "@/lib/db";

import { StatusPill, Avatar, PriorityBadge } from "@/components/app/pills";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/orders/")({
  validateSearch: (s: Record<string, unknown>) => ({ new: s.new === 1 || s.new === "1" ? 1 : undefined }),
  component: OrdersList,
  head: () => ({ meta: [{ title: "الطلبات — Kodaty" }] }),
});

const FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "معلّق" },
  { key: "processing", label: "قيد التنفيذ" },
  { key: "delivered", label: "مُسلَّم" },
  { key: "cancelled", label: "ملغى" },
  { key: "refunded", label: "مسترد" },
];

function OrdersList() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const { data: orders = [], isLoading } = useOrders();

  const filtered = useMemo(() => orders.filter(o => {
    if (filter !== "all" && o.status !== filter) return false;
    if (!q) return true;
    const hay = `${o.code} ${o.customers?.name ?? ""} ${o.order_items?.[0]?.product_name ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }), [q, filter, orders]);

  const relative = (iso: string) => {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return "الآن";
    if (s < 3600) return `منذ ${Math.floor(s / 60)} د`;
    if (s < 86400) return `منذ ${Math.floor(s / 3600)} س`;
    return `منذ ${Math.floor(s / 86400)} يوم`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">الطلبات</h1>
          <p className="text-sm text-muted-foreground num">{filtered.length} طلب</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-accent">
            <Download className="h-4 w-4" /> تصدير
          </button>
          <NewOrderButton />
        </div>
      </div>

      <div className="surface-elevated">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="ابحث برقم الطلب، العميل، أو المنتج…"
              className="w-full rounded-lg border border-border bg-surface-sunken py-2 ps-9 pe-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-1 rounded-lg border border-border bg-surface-sunken p-0.5">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs transition",
                  filter === f.key ? "bg-surface font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >{f.label}</button>
            ))}
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-sunken px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Filter className="h-3.5 w-3.5" /> فلاتر متقدمة
          </button>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="grid place-items-center py-16 text-center text-sm text-muted-foreground">
            لا توجد طلبات. ابدأ بإنشاء أول طلب.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-sunken/50 text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 text-start font-medium">الرقم</th>
                  <th className="px-3 py-2.5 text-start font-medium">العميل</th>
                  <th className="px-3 py-2.5 text-start font-medium">المنتج</th>
                  <th className="px-3 py-2.5 text-start font-medium">الحالة</th>
                  <th className="px-3 py-2.5 text-start font-medium">المبلغ</th>
                  <th className="px-3 py-2.5 text-start font-medium">الأولوية</th>
                  <th className="px-4 py-2.5 text-start font-medium">التاريخ</th>
                  <th className="px-3 py-2.5 text-end font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <OrderRow key={o.id} o={o} relative={relative} />
                ))}

              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function NewOrderButton() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (search.new) {
      setOpen(true);
      navigate({ search: {} as never, replace: true });
    }
  }, [search.new, navigate]);
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
        unit_cost: Number((product as any).cost_price ?? 0),
        qty: form.qty,
        priority: form.priority,
        status: form.status,
        billing_type: (product as any).billing_type ?? "one_time",
      });
      toast.success(
        (product as any).billing_type && (product as any).billing_type !== "one_time"
          ? "تم إنشاء الطلب والاشتراك"
          : "تم إنشاء الطلب"
      );

      setForm({ customer_id: "", product_id: "", qty: 1, priority: "normal", status: "pending" });
      setOpen(false);
    } catch (err) {
      toast.error("تعذّر الإنشاء", { description: (err as Error).message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:opacity-90">
          <Plus className="h-4 w-4" /> طلب جديد
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>إنشاء طلب جديد</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="العميل *">
            <select required value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} className={input}>
              <option value="">اختر عميلاً…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {customers.length === 0 && <p className="text-xs text-muted-foreground">أضف عميلاً أولاً من صفحة العملاء.</p>}
          </Field>
          <Field label="المنتج *">
            <select required value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} className={input}>
              <option value="">اختر منتجاً…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} — {formatEGP(Number(p.price))}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="الكمية">
              <input type="number" min={1} value={form.qty} onChange={e => setForm({ ...form, qty: Math.max(1, Number(e.target.value)) })} className={input} />
            </Field>
            <Field label="الأولوية">
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as OrderPriority })} className={input}>
                <option value="low">منخفضة</option>
                <option value="normal">عادية</option>
                <option value="high">مرتفعة</option>
                <option value="urgent">عاجلة</option>
              </select>
            </Field>
            <Field label="الحالة">
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as OrderStatus })} className={input}>
                <option value="pending">معلّق</option>
                <option value="processing">قيد التنفيذ</option>
                <option value="delivered">مُسلَّم</option>
              </select>
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm">
            <span className="text-muted-foreground">الإجمالي</span>
            <span className="num font-semibold text-primary">{formatEGP(total)}</span>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-accent">إلغاء</button>
            <button type="submit" disabled={create.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:opacity-90 disabled:opacity-60">
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              إنشاء الطلب
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const input =
  "w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function OrderRow({ o, relative }: { o: ReturnType<typeof useOrders>["data"] extends (infer T)[] | undefined ? T : never; relative: (iso: string) => string }) {
  const item = o.order_items?.[0];
  const cName = o.customers?.name ?? "—";
  const del = useDeleteOrder();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!confirming) { setConfirming(true); setTimeout(() => setConfirming(false), 3000); return; }
    try { await del.mutateAsync(o.id); toast.success("تم حذف الطلب"); }
    catch (err) { toast.error("تعذّر الحذف", { description: (err as Error).message }); }
  }

  return (
    <tr className="group border-b border-border/60 last:border-0 hover:bg-accent/30">
      <td className="px-4 py-3">
        <Link to="/orders/$id" params={{ id: o.id }} className="num font-medium text-primary hover:underline">{o.code}</Link>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <Avatar name={cName} color={avatarColor(o.customer_id ?? cName)} size={24} />
          <span className="truncate">{cName}</span>
        </div>
      </td>
      <td className="px-3 py-3">{item?.product_name ?? "—"}</td>
      <td className="px-3 py-3"><StatusPill status={o.status as OrderStatus} /></td>
      <td className="px-3 py-3 num font-medium">{formatEGP(Number(o.total))}</td>
      <td className="px-3 py-3"><PriorityBadge priority={o.priority as OrderPriority} /></td>
      <td className="px-4 py-3 text-muted-foreground">{relative(o.created_at)}</td>
      <td className="px-3 py-3 text-end">
        <div className="inline-flex items-center gap-1">
          <Link
            to="/orders/$id"
            params={{ id: o.id }}
            title="تعديل"
            className="inline-flex items-center rounded-md px-2 py-1 text-xs text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-primary/10 hover:text-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={handleDelete}
            disabled={del.isPending}
            title={confirming ? "اضغط مجدداً للتأكيد" : "حذف"}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition",
              confirming
                ? "bg-destructive text-destructive-foreground"
                : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive",
            )}
          >
            {del.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            {confirming && "تأكيد"}
          </button>
        </div>
      </td>
    </tr>
  );
}

