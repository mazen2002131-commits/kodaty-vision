import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle, Package, TrendingDown, CheckCircle2 } from "lucide-react";
import { useLicenses, useProducts } from "@/lib/db";

export const Route = createFileRoute("/_app/inventory")({
  component: Inventory,
  head: () => ({ meta: [{ title: "المخزون — Kodaty" }] }),
});

const LOW_THRESHOLD = 5;
const CRITICAL_THRESHOLD = 2;

function Inventory() {
  const { data: products = [] } = useProducts();
  const { data: licenses = [] } = useLicenses();

  const rows = useMemo(() => {
    return products.map(p => {
      const forProduct = licenses.filter(l => l.product_id === p.id);
      const available = forProduct.filter(l => l.status === "available").length;
      const sold = forProduct.filter(l => l.status === "sold").length;
      const reserved = forProduct.filter(l => l.status === "reserved").length;
      const level: "critical" | "low" | "ok" =
        available <= CRITICAL_THRESHOLD ? "critical" : available <= LOW_THRESHOLD ? "low" : "ok";
      return { ...p, available, sold, reserved, level };
    }).sort((a, b) => a.available - b.available);
  }, [products, licenses]);

  const critical = rows.filter(r => r.level === "critical").length;
  const low = rows.filter(r => r.level === "low").length;
  const ok = rows.filter(r => r.level === "ok").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">المخزون</h1>
        <p className="text-sm text-muted-foreground mt-1">تنبيهات المخزون المنخفض ومستوى المفاتيح المتاحة لكل منتج.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="surface-elevated p-5 border-l-4 border-l-danger">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">حرج</span>
            <AlertTriangle className="h-4 w-4 text-danger" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{critical}</div>
          <div className="text-xs text-muted-foreground mt-1">≤ {CRITICAL_THRESHOLD} مفتاح</div>
        </div>
        <div className="surface-elevated p-5 border-l-4 border-l-warning">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">منخفض</span>
            <TrendingDown className="h-4 w-4 text-warning" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{low}</div>
          <div className="text-xs text-muted-foreground mt-1">≤ {LOW_THRESHOLD} مفاتيح</div>
        </div>
        <div className="surface-elevated p-5 border-l-4 border-l-success">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">جيد</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{ok}</div>
          <div className="text-xs text-muted-foreground mt-1">مخزون كافٍ</div>
        </div>
      </div>

      <div className="surface-elevated overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_100px_100px_160px] gap-4 border-b border-border px-5 py-3 text-xs font-medium text-muted-foreground">
          <div>المنتج</div>
          <div className="text-center">متاح</div>
          <div className="text-center">محجوز</div>
          <div className="text-center">مُباع</div>
          <div>الحالة</div>
        </div>
        {rows.map(r => (
          <div key={r.id} className="grid grid-cols-[1fr_100px_100px_100px_160px] gap-4 border-b border-border/60 px-5 py-4 items-center hover:bg-surface-soft transition">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg brand-gradient-soft">
                <Package className="h-4 w-4 text-brand-600" />
              </div>
              <div>
                <div className="text-sm font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.category ?? "بدون فئة"}</div>
              </div>
            </div>
            <div className="text-center font-mono text-sm">{r.available}</div>
            <div className="text-center font-mono text-sm text-muted-foreground">{r.reserved}</div>
            <div className="text-center font-mono text-sm text-muted-foreground">{r.sold}</div>
            <div>
              {r.level === "critical" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 text-danger px-2.5 py-1 text-xs font-medium">
                  <AlertTriangle className="h-3 w-3" /> نفدت المفاتيح
                </span>
              )}
              {r.level === "low" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 text-warning px-2.5 py-1 text-xs font-medium">
                  <TrendingDown className="h-3 w-3" /> تحذير
                </span>
              )}
              {r.level === "ok" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success px-2.5 py-1 text-xs font-medium">
                  <CheckCircle2 className="h-3 w-3" /> جيد
                </span>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">لا توجد منتجات بعد.</div>
        )}
      </div>
    </div>
  );
}
