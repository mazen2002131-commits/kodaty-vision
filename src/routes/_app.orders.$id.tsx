import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Download, KeyRound, Copy, Trash2, Save, Loader2 } from "lucide-react";
import {
  useOrder, useUpdateOrder, useUpdateOrderItem, useDeleteOrder,
  avatarColor, formatEGP,
  type OrderStatus, type OrderPriority,
} from "@/lib/db";
import { StatusPill, Avatar, PriorityBadge } from "@/components/app/pills";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/orders/$id")({
  component: OrderDetail,
  head: ({ params }) => ({ meta: [{ title: `طلب ${params.id.slice(0, 8)} — Kodaty` }] }),
});

const STATUSES: { v: OrderStatus; label: string }[] = [
  { v: "pending", label: "معلّق" },
  { v: "processing", label: "قيد التنفيذ" },
  { v: "delivered", label: "مُسلَّم" },
  { v: "cancelled", label: "ملغى" },
  { v: "refunded", label: "مسترد" },
];
const PRIORITIES: { v: OrderPriority; label: string }[] = [
  { v: "low", label: "منخفضة" },
  { v: "normal", label: "عادية" },
  { v: "high", label: "مرتفعة" },
  { v: "urgent", label: "عاجلة" },
];

function OrderDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: o, isLoading } = useOrder(id);
  const updateOrder = useUpdateOrder();
  const updateItem = useUpdateOrderItem();
  const removeOrder = useDeleteOrder();

  const item = o?.order_items?.[0];
  const [price, setPrice] = useState<string>("");
  const [qty, setQty] = useState<string>("");
  const [cost, setCost] = useState<string>("");

  useEffect(() => {
    if (item) {
      setPrice(String(item.unit_price ?? ""));
      setQty(String(item.qty ?? ""));
      setCost(String(item.unit_cost ?? ""));
    }
  }, [item?.id, item?.unit_price, item?.qty, item?.unit_cost]);

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">جارِ التحميل…</div>;
  if (!o) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <div className="text-lg font-semibold">الطلب غير موجود</div>
        <Link to="/orders" className="mt-3 inline-block text-sm text-primary hover:underline">← الرجوع للطلبات</Link>
      </div>
    );
  }

  const c = o.customers;
  const total = Number(o.total ?? 0);
  const mockKey = `KDT-${o.code.replace(/[^0-9]/g, "").padStart(5, "0")}-${o.id.slice(0, 4).toUpperCase()}-DEMO`;

  const dirty = item && (
    Number(price) !== Number(item.unit_price) ||
    Number(qty) !== Number(item.qty) ||
    Number(cost) !== Number(item.unit_cost ?? 0)
  );

  async function saveItem() {
    if (!item) return;
    try {
      await updateItem.mutateAsync({
        id: item.id, order_id: o!.id,
        unit_price: Number(price), qty: Math.max(1, Number(qty)), unit_cost: Number(cost || 0),
      });
      toast.success("تم حفظ التعديلات");
    } catch (e) { toast.error("تعذّر الحفظ", { description: (e as Error).message }); }
  }

  async function changeStatus(status: OrderStatus) {
    try { await updateOrder.mutateAsync({ id: o!.id, status }); toast.success("تم تحديث الحالة"); }
    catch (e) { toast.error((e as Error).message); }
  }
  async function changePriority(priority: OrderPriority) {
    try { await updateOrder.mutateAsync({ id: o!.id, priority }); toast.success("تم تحديث الأولوية"); }
    catch (e) { toast.error((e as Error).message); }
  }

  async function doDelete() {
    try {
      await removeOrder.mutateAsync(o!.id);
      toast.success("تم حذف الطلب");
      navigate({ to: "/orders" });
    } catch (e) { toast.error("تعذّر الحذف", { description: (e as Error).message }); }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-4 w-4 rotate-180" /> جميع الطلبات
      </Link>

      {/* Header */}
      <div className="surface-elevated flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl brand-gradient text-2xl text-white shadow-brand">🔑</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold num">{o.code}</h1>
              <StatusPill status={o.status} />
              <PriorityBadge priority={o.priority} />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{item?.product_name ?? "—"} · {c?.name ?? "—"}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-accent"><Download className="h-4 w-4" /> الفاتورة</button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:opacity-90">إرسال المفتاح</button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" /> حذف
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>حذف الطلب {o.code}؟</AlertDialogTitle>
                <AlertDialogDescription>لا يمكن التراجع عن هذا الإجراء. سيتم حذف الطلب وكل بنوده.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:opacity-90">حذف</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Items + totals — editable */}
          <div className="surface-elevated p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">تفاصيل الطلب</div>
              {dirty && (
                <button
                  onClick={saveItem}
                  disabled={updateItem.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground shadow-brand hover:opacity-90 disabled:opacity-60"
                >
                  {updateItem.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  حفظ التعديلات
                </button>
              )}
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-sunken/60 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">المنتج</th>
                    <th className="px-3 py-2 text-start font-medium">الكمية</th>
                    <th className="px-3 py-2 text-start font-medium">التكلفة</th>
                    <th className="px-3 py-2 text-start font-medium">سعر البيع</th>
                    <th className="px-3 py-2 text-start font-medium">الربح</th>
                    <th className="px-3 py-2 text-start font-medium">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {item && (() => {
                    const p = Number(price || 0);
                    const q = Math.max(1, Number(qty || 1));
                    const co = Number(cost || 0);
                    const profit = (p - co) * q;
                    return (
                      <tr>
                        <td className="px-3 py-3">{item.product_name}</td>
                        <td className="px-3 py-3"><input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} className={numInput} /></td>
                        <td className="px-3 py-3"><input type="number" min={0} value={cost} onChange={e => setCost(e.target.value)} className={numInput} /></td>
                        <td className="px-3 py-3"><input type="number" min={0} value={price} onChange={e => setPrice(e.target.value)} className={numInput} /></td>
                        <td className="px-3 py-3 num text-success">{formatEGP(profit)}</td>
                        <td className="px-3 py-3 num font-medium">{formatEGP(p * q)}</td>
                      </tr>
                    );
                  })()}
                  {(o.order_items ?? []).slice(1).map(it => {
                    const cst = Number(it.unit_cost ?? 0);
                    const prc = Number(it.unit_price);
                    const profit = (prc - cst) * it.qty;
                    return (
                      <tr key={it.id}>
                        <td className="px-3 py-3">{it.product_name}</td>
                        <td className="px-3 py-3 num">{it.qty}</td>
                        <td className="px-3 py-3 num text-muted-foreground">{formatEGP(cst)}</td>
                        <td className="px-3 py-3 num">{formatEGP(prc)}</td>
                        <td className="px-3 py-3 num text-success">{formatEGP(profit)}</td>
                        <td className="px-3 py-3 num font-medium">{formatEGP(prc * it.qty)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {(() => {
              const totalCost = (o.order_items ?? []).reduce((s, it) => s + Number(it.unit_cost ?? 0) * it.qty, 0);
              const totalProfit = total - totalCost;
              return (
                <dl className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground"><dt>إجمالي التكلفة</dt><dd className="num">{formatEGP(totalCost)}</dd></div>
                  <div className="flex justify-between text-success"><dt>صافي الربح</dt><dd className="num">{formatEGP(totalProfit)}</dd></div>
                  <div className="flex justify-between border-t border-border pt-2 text-base font-semibold"><dt>الإجمالي</dt><dd className="num">{formatEGP(total)}</dd></div>
                </dl>
              );
            })()}
          </div>

          {/* Delivered key (placeholder) */}
          <div className="surface-elevated p-5">
            <div className="mb-3 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">مفتاح التفعيل</div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-brand-50/60 px-3 py-2.5">
              <code className="num flex-1 select-all text-sm tracking-wider">{mockKey}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(mockKey); toast.success("تم نسخ المفتاح"); }}
                className="rounded-md border border-border bg-surface px-2 py-1 text-xs hover:bg-accent"
              ><Copy className="me-1 inline h-3 w-3" /> نسخ</button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">سيُستبدل بالمفتاح الفعلي من الخزنة عند التسليم.</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Customer card */}
          {c && (
            <div className="surface-elevated p-5">
              <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">العميل</div>
              <Link to="/customers/$id" params={{ id: c.id }} className="flex items-center gap-3">
                <Avatar name={c.name} color={avatarColor(c.id)} size={40} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{c.name}</div>
                  {c.email && <div className="truncate text-xs text-muted-foreground">{c.email}</div>}
                </div>
              </Link>
              <dl className="mt-4 space-y-2 text-xs">
                {c.company && <div className="flex justify-between"><dt className="text-muted-foreground">الشركة</dt><dd>{c.company}</dd></div>}
                {c.phone && <div className="flex justify-between"><dt className="text-muted-foreground">الهاتف</dt><dd className="num" dir="ltr">{c.phone}</dd></div>}
                <div className="flex justify-between"><dt className="text-muted-foreground">التصنيف</dt><dd>{c.tier}</dd></div>
              </dl>
            </div>
          )}

          {/* Editable meta */}
          <div className="surface-elevated p-5">
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">التفاصيل</div>
            <div className="space-y-3 text-xs">
              <label className="block space-y-1">
                <span className="text-muted-foreground">الحالة</span>
                <select value={o.status} onChange={e => changeStatus(e.target.value as OrderStatus)} className={selectInput}>
                  {STATUSES.map(s => <option key={s.v} value={s.v}>{s.label}</option>)}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-muted-foreground">الأولوية</span>
                <select value={o.priority} onChange={e => changePriority(e.target.value as OrderPriority)} className={selectInput}>
                  {PRIORITIES.map(p => <option key={p.v} value={p.v}>{p.label}</option>)}
                </select>
              </label>
              {o.payment_method && <div className="flex justify-between"><span className="text-muted-foreground">الدفع</span><span>{o.payment_method}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">أُنشئ</span><span>{new Date(o.created_at).toLocaleString("ar-EG")}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const numInput = "w-24 rounded-md border border-border bg-surface-sunken px-2 py-1 text-sm num outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const selectInput = "w-full rounded-md border border-border bg-surface-sunken px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
