import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bell, ShoppingBag, AlertTriangle, KeyRound, MessageSquare, CheckCheck } from "lucide-react";
import { useOrders, useLicenses, useTickets, useSubscriptions } from "@/lib/db";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/notifications")({
  component: Notifications,
  head: () => ({ meta: [{ title: "الإشعارات — Kodaty" }] }),
});

type Notif = { id: string; type: string; title: string; desc: string; time: string; icon: React.ElementType; tone: string; href?: string };

function relative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
  return `منذ ${Math.floor(diff / 86400)} ي`;
}

function Notifications() {
  const { data: orders = [] } = useOrders();
  const { data: tickets = [] } = useTickets();
  const { data: subs = [] } = useSubscriptions();
  const { data: licenses = [] } = useLicenses();

  const items = useMemo<Notif[]>(() => {
    const arr: Notif[] = [];
    orders.slice(0, 5).forEach(o => arr.push({
      id: `o-${o.id}`, type: "order", title: `طلب جديد ${o.code}`,
      desc: `${o.customers?.name ?? "عميل"} — ${Number(o.total).toLocaleString("ar-EG")} ج.م`,
      time: o.created_at, icon: ShoppingBag, tone: "text-brand-600", href: `/orders/${o.id}`,
    }));
    tickets.slice(0, 4).forEach(t => arr.push({
      id: `t-${t.id}`, type: "ticket", title: `تذكرة ${t.code}`,
      desc: t.subject, time: t.created_at, icon: MessageSquare, tone: "text-info", href: `/support`,
    }));
    subs.filter(s => {
      const d = (new Date(s.ends_at).getTime() - Date.now()) / 86400000;
      return d < 14 && d > 0;
    }).slice(0, 3).forEach(s => arr.push({
      id: `s-${s.id}`, type: "expiring", title: "اشتراك على وشك الانتهاء",
      desc: `${s.product_name} — ${s.customers?.name ?? ""}`,
      time: s.ends_at, icon: AlertTriangle, tone: "text-warning", href: `/subscriptions`,
    }));
    const critical = new Map<string, number>();
    licenses.filter(l => l.status === "available").forEach(l => critical.set(l.product_name, (critical.get(l.product_name) || 0) + 1));
    Array.from(critical.entries()).filter(([, c]) => c <= 2).slice(0, 3).forEach(([name, c]) => arr.push({
      id: `l-${name}`, type: "stock", title: "مخزون منخفض",
      desc: `${name} — ${c} مفاتيح متبقية`,
      time: new Date().toISOString(), icon: KeyRound, tone: "text-danger", href: `/inventory`,
    }));
    return arr.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [orders, tickets, subs, licenses]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">الإشعارات</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} إشعار حديث</p>
        </div>
        <button className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-600">
          <CheckCheck className="h-4 w-4" /> تعليم الكل كمقروء
        </button>
      </div>

      <div className="surface-elevated overflow-hidden">
        {items.length === 0 && (
          <div className="p-12 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <div className="text-sm text-muted-foreground">لا توجد إشعارات جديدة</div>
          </div>
        )}
        {items.map(n => {
          const Icon = n.icon;
          const content = (
            <div className="flex items-start gap-4 p-4 hover:bg-surface-soft transition border-b border-border/60 last:border-b-0">
              <div className={`grid h-10 w-10 place-items-center rounded-xl brand-gradient-soft ${n.tone}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{n.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{n.desc}</div>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">{relative(n.time)}</div>
            </div>
          );
          return n.href ? (
            <Link key={n.id} to={n.href as never} className="block">{content}</Link>
          ) : (
            <div key={n.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
