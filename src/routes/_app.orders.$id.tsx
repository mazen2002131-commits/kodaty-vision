import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download, KeyRound, Copy } from "lucide-react";
import { useOrder, avatarColor, formatEGP } from "@/lib/db";
import { StatusPill, Avatar, PriorityBadge } from "@/components/app/pills";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/orders/$id")({
  component: OrderDetail,
  head: ({ params }) => ({ meta: [{ title: `طلب ${params.id.slice(0, 8)} — Kodaty` }] }),
});

function OrderDetail() {
  const { id } = Route.useParams();
  const { data: o, isLoading } = useOrder(id);

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">جارِ التحميل…</div>;
  if (!o) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <div className="text-lg font-semibold">الطلب غير موجود</div>
        <Link to="/orders" className="mt-3 inline-block text-sm text-primary hover:underline">← الرجوع للطلبات</Link>
      </div>
    );
  }

  const item = o.order_items?.[0];
  const c = o.customers;
  const total = Number(o.total ?? 0);
  const mockKey = `KDT-${o.code.replace(/[^0-9]/g, "").padStart(5, "0")}-${o.id.slice(0, 4).toUpperCase()}-DEMO`;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-4 w-4 rotate-180" /> جميع الطلبات
      </Link>

      {/* Header */}
      <div className="surface-elevated flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--gradient-brand)] text-2xl text-white shadow-brand">🔑</div>
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Items + totals */}
          <div className="surface-elevated p-5">
            <div className="mb-3 text-sm font-semibold">تفاصيل الطلب</div>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-sunken/60 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">المنتج</th>
                    <th className="px-3 py-2 text-start font-medium">الكمية</th>
                    <th className="px-3 py-2 text-start font-medium">السعر</th>
                    <th className="px-3 py-2 text-start font-medium">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {(o.order_items ?? []).map(it => (
                    <tr key={it.id}>
                      <td className="px-3 py-3">{it.product_name}</td>
                      <td className="px-3 py-3 num">{it.qty}</td>
                      <td className="px-3 py-3 num">{formatEGP(Number(it.unit_price))}</td>
                      <td className="px-3 py-3 num font-medium">{formatEGP(Number(it.unit_price) * it.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold"><dt>الإجمالي</dt><dd className="num">{formatEGP(total)}</dd></div>
            </dl>
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

          {/* Meta */}
          <div className="surface-elevated p-5">
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">التفاصيل</div>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between"><dt className="text-muted-foreground">الحالة</dt><dd><StatusPill status={o.status} /></dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">الأولوية</dt><dd><PriorityBadge priority={o.priority} /></dd></div>
              {o.payment_method && <div className="flex justify-between"><dt className="text-muted-foreground">الدفع</dt><dd>{o.payment_method}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted-foreground">أُنشئ</dt><dd>{new Date(o.created_at).toLocaleString("ar-EG")}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
