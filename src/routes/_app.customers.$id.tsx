import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Mail, MessageCircle, MapPin } from "lucide-react";
import { customers, orders, subscriptions, productById, formatCurrency, formatNumber, relativeTime, type Customer } from "@/lib/mock/data";
import { Avatar, StatusPill } from "@/components/app/pills";

export const Route = createFileRoute("/_app/customers/$id")({
  component: CustomerProfile,
  head: ({ params }) => ({ meta: [{ title: `عميل ${params.id} — Kodaty` }] }),
  loader: ({ params }): Customer => {
    const c = customers.find(c => c.id === params.id);
    if (!c) throw notFound();
    return c;
  },
});

function CustomerProfile() {
  const c = Route.useLoaderData();
  const custOrders = orders.filter(o => o.customerId === c.id);
  const custSubs = subscriptions.filter(s => s.customerId === c.id);
  const aov = custOrders.length ? custOrders.reduce((s, o) => s + o.amount, 0) / custOrders.length : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Link to="/customers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-4 w-4 rotate-180" /> جميع العملاء
      </Link>

      {/* Hero */}
      <div className="surface-elevated relative overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-0 mesh-bg opacity-60" />
        <div className="relative flex flex-wrap items-center gap-4">
          <Avatar name={c.name} color={c.avatarColor} size={72} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{c.name}</h1>
              {c.tags.map(t => <span key={t} className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-primary">{t}</span>)}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>
              <span className="inline-flex items-center gap-1 num" dir="ltr"><MessageCircle className="h-3 w-3" />{c.whatsapp}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{c.country}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-accent">مراسلة</button>
            <button className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:opacity-90">طلب جديد</button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { l: "إجمالي الإنفاق", v: formatCurrency(c.totalSpent) },
          { l: "عدد الطلبات", v: formatNumber(c.ordersCount) },
          { l: "متوسط قيمة الطلب", v: formatCurrency(aov) },
          { l: "الاشتراكات النشطة", v: formatNumber(custSubs.filter(s => s.status !== "expired").length) },
        ].map(k => (
          <div key={k.l} className="surface-elevated p-4">
            <div className="text-xs text-muted-foreground">{k.l}</div>
            <div className="mt-1 num text-lg font-semibold">{k.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Orders */}
          <div className="surface-elevated overflow-hidden">
            <div className="p-4 pb-3 text-sm font-semibold">سجل الطلبات</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border bg-surface-sunken/50 text-xs text-muted-foreground">
                  <th className="px-4 py-2 text-start font-medium">الرقم</th>
                  <th className="px-3 py-2 text-start font-medium">المنتج</th>
                  <th className="px-3 py-2 text-start font-medium">الحالة</th>
                  <th className="px-3 py-2 text-start font-medium">المبلغ</th>
                  <th className="px-4 py-2 text-start font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {custOrders.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">لا طلبات بعد.</td></tr>
                )}
                {custOrders.map(o => {
                  const p = productById(o.productId);
                  return (
                    <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-accent/30">
                      <td className="px-4 py-2.5"><Link to="/orders/$id" params={{ id: o.id }} className="num text-primary hover:underline">{o.code}</Link></td>
                      <td className="px-3 py-2.5">{p.icon} {p.name}</td>
                      <td className="px-3 py-2.5"><StatusPill status={o.status} /></td>
                      <td className="px-3 py-2.5 num">{formatCurrency(o.amount)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{relativeTime(o.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Timeline */}
          <div className="surface-elevated p-5">
            <div className="mb-4 text-sm font-semibold">السجل الزمني</div>
            <ol className="relative space-y-4 ps-4">
              <div className="absolute inset-y-1 start-[7px] w-px bg-border" />
              {[
                { t: "أضاف العميل ملاحظة: يفضل التواصل عبر واتساب.", at: new Date(Date.now() - 2 * 3600_000).toISOString() },
                { t: `طلب جديد ${custOrders[0]?.code || "—"} تم استلامه`, at: new Date(Date.now() - 26 * 3600_000).toISOString() },
                { t: "تم تجديد اشتراك Microsoft 365 تلقائياً", at: new Date(Date.now() - 5 * 86400_000).toISOString() },
                { t: `انضم للمنصة`, at: c.joinedAt },
              ].map((x, i) => (
                <li key={i} className="relative">
                  <div className="absolute start-[-14px] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                  <div className="text-sm">{x.t}</div>
                  <div className="text-xs text-muted-foreground">{relativeTime(x.at)}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-4">
          {/* Subs */}
          <div className="surface-elevated p-5">
            <div className="mb-3 text-sm font-semibold">الاشتراكات</div>
            {custSubs.length === 0 ? (
              <div className="text-sm text-muted-foreground">لا اشتراكات.</div>
            ) : (
              <ul className="space-y-3">
                {custSubs.map(s => {
                  const p = productById(s.productId);
                  return (
                    <li key={s.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2 text-sm font-medium">{p.icon} {p.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">ينتهي {new Date(s.endAt).toLocaleDateString("ar-EG")}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Notes */}
          <div className="surface-elevated p-5">
            <div className="mb-2 text-sm font-semibold">ملاحظات</div>
            <textarea placeholder="أضف ملاحظة داخلية عن هذا العميل…" className="w-full rounded-lg border border-border bg-surface-sunken p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" rows={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
