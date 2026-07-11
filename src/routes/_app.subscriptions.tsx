import { createFileRoute } from "@tanstack/react-router";
import { subscriptions, customerById, productById, formatCurrency, daysUntil } from "@/lib/mock/data";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/app/pills";
import { RefreshCw, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_app/subscriptions")({
  component: SubsPage,
  head: () => ({ meta: [{ title: "الاشتراكات — Kodaty" }] }),
});

const STATUS = {
  active:   { label: "نشط", icon: CheckCircle2, cls: "bg-success/10 text-success border-success/25" },
  expiring: { label: "ينتهي قريباً", icon: AlertTriangle, cls: "bg-warning/15 text-warning border-warning/30" },
  expired:  { label: "منتهي", icon: XCircle, cls: "bg-destructive/10 text-destructive border-destructive/25" },
  cancelled:{ label: "ملغي", icon: XCircle, cls: "bg-muted text-muted-foreground border-border" },
} as const;

function SubsPage() {
  const groups = [
    { key: "expiring", items: subscriptions.filter(s => s.status === "expiring") },
    { key: "active",   items: subscriptions.filter(s => s.status === "active") },
    { key: "expired",  items: subscriptions.filter(s => s.status === "expired") },
  ] as const;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">الاشتراكات</h1>
        <p className="text-sm text-muted-foreground">تابع التجديدات وحالات الاشتراكات لعملائك</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {(["active", "expiring", "expired"] as const).map(k => {
          const meta = STATUS[k]; const Icon = meta.icon;
          const count = subscriptions.filter(s => s.status === k).length;
          return (
            <div key={k} className={cn("surface-elevated flex items-center gap-3 p-4 border-s-4", meta.cls.split(" ").at(-1))}>
              <div className={cn("grid h-10 w-10 place-items-center rounded-lg border", meta.cls)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{meta.label}</div>
                <div className="num text-lg font-semibold">{count}</div>
              </div>
            </div>
          );
        })}
      </div>

      {groups.map(g => g.items.length > 0 && (
        <section key={g.key} className="space-y-2">
          <h2 className="text-sm font-semibold">{STATUS[g.key].label}</h2>
          <div className="surface-elevated overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-sunken/50 text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 text-start font-medium">العميل</th>
                  <th className="px-3 py-2.5 text-start font-medium">المنتج</th>
                  <th className="px-3 py-2.5 text-start font-medium">البريد المستخدم</th>
                  <th className="px-3 py-2.5 text-start font-medium">تاريخ الانتهاء</th>
                  <th className="px-3 py-2.5 text-start font-medium">الأيام المتبقية</th>
                  <th className="px-3 py-2.5 text-start font-medium">سعر التجديد</th>
                  <th className="px-4 py-2.5 text-start font-medium">تجديد تلقائي</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map(s => {
                  const c = customerById(s.customerId);
                  const p = productById(s.productId);
                  const d = daysUntil(s.endAt);
                  return (
                    <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-accent/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={c.name} color={c.avatarColor} size={26} />
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">{p.icon} {p.name}</td>
                      <td className="px-3 py-3 text-muted-foreground text-xs" dir="ltr">{s.email}</td>
                      <td className="px-3 py-3 num">{new Date(s.endAt).toLocaleDateString("ar-EG")}</td>
                      <td className="px-3 py-3">
                        <span className={cn("num font-medium", d < 0 ? "text-destructive" : d <= 14 ? "text-warning" : "text-success")}>
                          {d < 0 ? `−${Math.abs(d)}` : d} يوم
                        </span>
                      </td>
                      <td className="px-3 py-3 num">{formatCurrency(s.renewPrice)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs", s.autoRenew ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                          <RefreshCw className="h-3 w-3" /> {s.autoRenew ? "مفعّل" : "معطّل"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
