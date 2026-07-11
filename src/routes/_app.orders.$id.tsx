import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Paperclip, MessageSquare, Send, Download, Copy, KeyRound } from "lucide-react";
import { orderById, customerById, productById, formatCurrency, paymentLabels, statusLabels, relativeTime, type Order } from "@/lib/mock/data";
import { StatusPill, Avatar, PriorityBadge } from "@/components/app/pills";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/orders/$id")({
  component: OrderDetail,
  head: ({ params }) => ({ meta: [{ title: `طلب ${params.id} — Kodaty` }] }),
  loader: ({ params }): Order => {
    const o = orderById(params.id);
    if (!o) throw notFound();
    return o;
  },
});

function OrderDetail() {
  const o: Order = Route.useLoaderData();
  const c = customerById(o.customerId);
  const p = productById(o.productId);
  const profit = o.amount - o.cost;
  const mockKey = "XQKF9-P83LM-RN47V-QW9BD-ZZ12A";

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-4 w-4 rotate-180" /> جميع الطلبات
      </Link>

      {/* Header */}
      <div className="surface-elevated flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--gradient-brand)] text-2xl shadow-brand">{p.icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold num">{o.code}</h1>
              <StatusPill status={o.status} />
              <PriorityBadge priority={o.priority} />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{p.name} · {c.name}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-accent"><Download className="h-4 w-4" /> الفاتورة</button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:opacity-90">إرسال المفتاح</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Item + totals */}
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
                  <tr>
                    <td className="px-3 py-3">{p.icon} {p.name}</td>
                    <td className="px-3 py-3 num">{o.qty}</td>
                    <td className="px-3 py-3 num">{formatCurrency(p.price)}</td>
                    <td className="px-3 py-3 num font-medium">{formatCurrency(o.amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">التكلفة</dt><dd className="num">{formatCurrency(o.cost)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">الربح</dt><dd className="num text-success">{formatCurrency(profit)}</dd></div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold"><dt>الإجمالي</dt><dd className="num">{formatCurrency(o.amount)}</dd></div>
            </dl>
          </div>

          {/* Delivered key */}
          <div className="surface-elevated p-5">
            <div className="mb-3 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">مفتاح التفعيل المسلَّم</div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-brand-50/60 px-3 py-2.5">
              <code className="num flex-1 select-all text-sm tracking-wider">{mockKey}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(mockKey); toast.success("تم نسخ المفتاح"); }}
                className="rounded-md border border-border bg-surface px-2 py-1 text-xs hover:bg-accent"
              ><Copy className="me-1 inline h-3 w-3" /> نسخ</button>
            </div>
          </div>

          {/* Timeline */}
          <div className="surface-elevated p-5">
            <div className="mb-4 text-sm font-semibold">السجل الزمني</div>
            <ol className="relative space-y-4 ps-4">
              <div className="absolute inset-y-1 start-[7px] w-px bg-border" />
              {o.timeline.map((t, i) => (
                <li key={i} className="relative">
                  <div className="absolute start-[-14px] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                  <div className="text-sm">{t.text}</div>
                  <div className="text-xs text-muted-foreground">{t.by} · {relativeTime(t.at)}</div>
                </li>
              ))}
            </ol>
          </div>

          {/* Notes */}
          <div className="surface-elevated p-5">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">ملاحظات داخلية</div>
            </div>
            <div className="flex items-start gap-2">
              <textarea placeholder="أضف ملاحظة للفريق…" className="flex-1 resize-none rounded-lg border border-border bg-surface-sunken p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" rows={3} />
              <button className="rounded-lg bg-primary p-2 text-primary-foreground hover:opacity-90"><Send className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Customer card */}
          <div className="surface-elevated p-5">
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">العميل</div>
            <Link to="/customers/$id" params={{ id: c.id }} className="flex items-center gap-3">
              <Avatar name={c.name} color={c.avatarColor} size={40} />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{c.name}</div>
                <div className="truncate text-xs text-muted-foreground">{c.email}</div>
              </div>
            </Link>
            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between"><dt className="text-muted-foreground">الدولة</dt><dd>{c.country}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">واتساب</dt><dd className="num" dir="ltr">{c.whatsapp}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">عدد الطلبات</dt><dd className="num">{c.ordersCount}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">الإنفاق الكلي</dt><dd className="num">{formatCurrency(c.totalSpent)}</dd></div>
            </dl>
          </div>

          {/* Meta */}
          <div className="surface-elevated p-5">
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">التفاصيل</div>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between"><dt className="text-muted-foreground">الحالة</dt><dd>{statusLabels[o.status]}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">طريقة الدفع</dt><dd>{paymentLabels[o.payment]}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">تاريخ الإنشاء</dt><dd>{relativeTime(o.createdAt)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">الأولوية</dt><dd><PriorityBadge priority={o.priority} /></dd></div>
            </dl>
          </div>

          {/* Attachments */}
          <div className="surface-elevated p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Paperclip className="h-3.5 w-3.5" /> المرفقات
            </div>
            <button className="w-full rounded-lg border border-dashed border-border py-4 text-xs text-muted-foreground hover:border-primary hover:text-primary">
              اسحب ملفاً هنا أو انقر للرفع
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
