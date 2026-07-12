import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  RefreshCw, AlertTriangle, CheckCircle2, XCircle, Loader2,
  Search, Filter, Download, Plus, Calendar, TrendingUp, Sparkles,
} from "lucide-react";
import { useSubscriptions, useCreateSubscription, useCustomers, useProducts, formatEGP, daysBetween, avatarColor } from "@/lib/db";
import { Avatar } from "@/components/app/pills";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/subscriptions")({
  component: SubsPage,
  head: () => ({ meta: [{ title: "الاشتراكات — Kodaty" }] }),
});

type StatusKey = "active" | "expiring" | "expired" | "cancelled";

const STATUS: Record<StatusKey, {
  label: string;
  icon: typeof CheckCircle2;
  ring: string;
  tint: string;
  dot: string;
  chip: string;
}> = {
  active: {
    label: "نشط",
    icon: CheckCircle2,
    ring: "ring-emerald-200/70 dark:ring-emerald-500/20",
    tint: "from-emerald-50 to-white dark:from-emerald-500/10 dark:to-transparent",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
  },
  expiring: {
    label: "ينتهي قريباً",
    icon: AlertTriangle,
    ring: "ring-amber-200/70 dark:ring-amber-500/20",
    tint: "from-amber-50 to-white dark:from-amber-500/10 dark:to-transparent",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
  },
  expired: {
    label: "منتهي",
    icon: XCircle,
    ring: "ring-rose-200/70 dark:ring-rose-500/20",
    tint: "from-rose-50 to-white dark:from-rose-500/10 dark:to-transparent",
    dot: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30",
  },
  cancelled: {
    label: "ملغي",
    icon: XCircle,
    ring: "ring-muted",
    tint: "from-muted/40 to-transparent",
    dot: "bg-muted-foreground",
    chip: "bg-muted text-muted-foreground border-border",
  },
};

function SubsPage() {
  const { data: subs = [], isLoading } = useSubscriptions();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusKey | "all">("all");

  const counts = useMemo(() => ({
    active: subs.filter(s => s.status === "active").length,
    expiring: subs.filter(s => s.status === "expiring").length,
    expired: subs.filter(s => s.status === "expired").length,
    cancelled: subs.filter(s => s.status === "cancelled").length,
  }), [subs]);

  const mrr = useMemo(
    () => subs.filter(s => s.status === "active" || s.status === "expiring")
             .reduce((sum, s) => sum + Number(s.price ?? 0), 0),
    [subs]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subs.filter(s => {
      if (filter !== "all" && s.status !== filter) return false;
      if (!q) return true;
      return (
        (s.customers?.name ?? "").toLowerCase().includes(q) ||
        (s.product_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [subs, query, filter]);

  const groups = (["expiring", "active", "expired", "cancelled"] as const)
    .map(k => ({ key: k, items: filtered.filter(s => s.status === k) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <header className="surface-elevated relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -end-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -start-16 -bottom-24 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-primary/80">
              <Sparkles className="h-3.5 w-3.5" />
              <span>مركز الاشتراكات</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">الاشتراكات</h1>
            <p className="text-sm text-muted-foreground">
              تابع التجديدات ودورات الاشتراكات لعملائك في مكان واحد
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-4 w-4" /> تصدير
            </Button>
            <NewSubDialog>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> اشتراك جديد
              </Button>
            </NewSubDialog>
          </div>
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="نشط"
          value={counts.active}
          hint="اشتراكات فعّالة"
          Icon={CheckCircle2}
          meta={STATUS.active}
          onClick={() => setFilter(filter === "active" ? "all" : "active")}
          active={filter === "active"}
        />
        <KpiCard
          label="ينتهي قريباً"
          value={counts.expiring}
          hint="خلال ١٤ يوم"
          Icon={AlertTriangle}
          meta={STATUS.expiring}
          onClick={() => setFilter(filter === "expiring" ? "all" : "expiring")}
          active={filter === "expiring"}
        />
        <KpiCard
          label="منتهي"
          value={counts.expired}
          hint="تحتاج متابعة"
          Icon={XCircle}
          meta={STATUS.expired}
          onClick={() => setFilter(filter === "expired" ? "all" : "expired")}
          active={filter === "expired"}
        />
        <div className="surface-elevated relative overflow-hidden p-4">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">إيراد متكرر شهري</div>
              <div className="num text-2xl font-semibold tracking-tight">{formatEGP(mrr)}</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" /> اشتراكات فعّالة
              </div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="surface-elevated flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            leadingIcon={<Search className="h-4 w-4" />}
            placeholder="ابحث باسم العميل أو المنتج…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip label="الكل" active={filter === "all"} onClick={() => setFilter("all")} count={subs.length} />
          <FilterChip label="نشط" active={filter === "active"} onClick={() => setFilter("active")} count={counts.active} tone="emerald" />
          <FilterChip label="ينتهي قريباً" active={filter === "expiring"} onClick={() => setFilter("expiring")} count={counts.expiring} tone="amber" />
          <FilterChip label="منتهي" active={filter === "expired"} onClick={() => setFilter("expired")} count={counts.expired} tone="rose" />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="surface-elevated grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && subs.length === 0 && (
        <div className="surface-elevated relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <div className="relative grid place-items-center gap-4 py-20 text-center">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-2xl bg-primary/10 blur-xl" />
              <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <RefreshCw className="h-7 w-7" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-base font-semibold">لا توجد اشتراكات بعد</div>
              <div className="mx-auto max-w-sm text-sm text-muted-foreground">
                ستظهر هنا الاشتراكات تلقائياً عند بيع منتج بنوع فوترة شهري أو سنوي.
              </div>
            </div>
            <NewSubDialog>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> إضافة اشتراك يدوي
              </Button>
            </NewSubDialog>
          </div>
        </div>
      )}

      {/* Filtered empty */}
      {!isLoading && subs.length > 0 && filtered.length === 0 && (
        <div className="surface-elevated grid place-items-center gap-2 py-14 text-center">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">لا توجد نتائج مطابقة للفلتر أو البحث.</div>
        </div>
      )}

      {/* Groups */}
      {groups.map(g => {
        const meta = STATUS[g.key];
        return (
          <section key={g.key} className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
              <h2 className="text-sm font-semibold">{meta.label}</h2>
              <span className="text-xs text-muted-foreground">({g.items.length})</span>
            </div>
            <div className="surface-elevated overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                      <th className="px-4 py-3 text-start font-medium">العميل</th>
                      <th className="px-3 py-3 text-start font-medium">المنتج</th>
                      <th className="px-3 py-3 text-start font-medium">تاريخ الانتهاء</th>
                      <th className="px-3 py-3 text-start font-medium">المدة</th>
                      <th className="px-3 py-3 text-start font-medium">سعر التجديد</th>
                      <th className="px-4 py-3 text-start font-medium">تجديد تلقائي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map(s => {
                      const d = daysBetween(s.ends_at);
                      const cname = s.customers?.name ?? "—";
                      const total = 30;
                      const pct = Math.max(0, Math.min(100, (d / total) * 100));
                      const barTone =
                        d < 0 ? "bg-rose-500" : d <= 7 ? "bg-rose-400" : d <= 14 ? "bg-amber-400" : "bg-emerald-500";
                      return (
                        <tr key={s.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-primary/[0.03]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={cname} color={avatarColor(cname)} size={30} />
                              <div className="min-w-0">
                                <div className="truncate font-medium">{cname}</div>
                                {s.customers?.email && (
                                  <div className="truncate text-[11px] text-muted-foreground">{s.customers.email}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs">
                              {s.product_name}
                            </span>
                          </td>
                          <td className="px-3 py-3 num text-muted-foreground">
                            {new Date(s.ends_at).toLocaleDateString("ar-EG")}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-col gap-1.5">
                              <span className={cn(
                                "num text-xs font-semibold",
                                d < 0 ? "text-rose-600 dark:text-rose-400"
                                  : d <= 14 ? "text-amber-600 dark:text-amber-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              )}>
                                {d < 0 ? `متأخر ${Math.abs(d)} يوم` : `${d} يوم`}
                              </span>
                              <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
                                <div className={cn("h-full rounded-full transition-all", barTone)} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 num font-medium">
                            {s.price ? formatEGP(Number(s.price)) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              s.auto_renew
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : "border-border bg-muted text-muted-foreground"
                            )}>
                              <RefreshCw className={cn("h-3 w-3", s.auto_renew && "animate-[spin_6s_linear_infinite]")} />
                              {s.auto_renew ? "مفعّل" : "معطّل"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function KpiCard({
  label, value, hint, Icon, meta, onClick, active,
}: {
  label: string;
  value: number;
  hint: string;
  Icon: typeof CheckCircle2;
  meta: typeof STATUS[StatusKey];
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "surface-elevated group relative overflow-hidden p-4 text-start transition-all",
        "hover:-translate-y-0.5 hover:shadow-lg",
        active && "ring-2 ring-primary/40"
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70", meta.tint)} />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="num text-2xl font-semibold tracking-tight">{value}</div>
          <div className="text-[11px] text-muted-foreground">{hint}</div>
        </div>
        <div className={cn(
          "grid h-10 w-10 place-items-center rounded-xl border transition-transform group-hover:scale-110",
          meta.chip
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </button>
  );
}

function FilterChip({
  label, active, onClick, count, tone,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
  tone?: "emerald" | "amber" | "rose";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}
    >
      {label}
      <span className={cn(
        "num rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
        active ? "bg-white/20 text-primary-foreground"
          : tone === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          : tone === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
          : tone === "rose" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
          : "bg-muted text-muted-foreground"
      )}>
        {count}
      </span>
    </button>
  );
}

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

function NewSubDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const create = useCreateSubscription();

  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState<string>("");
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [autoRenew, setAutoRenew] = useState(true);
  const [notes, setNotes] = useState("");

  // Duration state
  const [startsAt, setStartsAt] = useState<string>(toDateInput(new Date()));
  const [durationPreset, setDurationPreset] = useState<string>("1"); // months, "custom" for custom
  const [customMonths, setCustomMonths] = useState<string>("18");
  const [endsAt, setEndsAt] = useState<string>("");
  const [endEdited, setEndEdited] = useState(false);

  const months = useMemo(() => {
    if (durationPreset === "custom") return Math.max(1, parseInt(customMonths || "0", 10) || 0);
    return parseInt(durationPreset, 10);
  }, [durationPreset, customMonths]);

  // Auto-compute end date when start/duration changes (unless user edited manually)
  useMemo(() => {
    if (endEdited) return;
    if (!startsAt || !months) return;
    const d = new Date(startsAt);
    d.setMonth(d.getMonth() + months);
    setEndsAt(toDateInput(d));
  }, [startsAt, months, endEdited]);

  function reset() {
    setCustomerId(""); setProductId(""); setProductName("");
    setPrice(""); setAutoRenew(true); setNotes("");
    setStartsAt(toDateInput(new Date()));
    setDurationPreset("1"); setCustomMonths("18");
    setEndsAt(""); setEndEdited(false);
  }

  function pickProduct(id: string) {
    setProductId(id);
    const p = products.find(pp => pp.id === id);
    if (p) {
      setProductName(p.name);
      setPrice(String(p.price ?? ""));
      if (p.billing_type === "yearly") setDurationPreset("12");
      else if (p.billing_type === "monthly") setDurationPreset("1");
    }
  }

  async function submit() {
    if (!customerId) return toast.error("اختر العميل");
    if (!productName.trim()) return toast.error("أدخل اسم المنتج");
    if (!months || months < 1) return toast.error("أدخل مدة صحيحة بالأشهر");
    try {
      await create.mutateAsync({
        customer_id: customerId,
        product_id: productId || null,
        product_name: productName.trim(),
        price: price ? Number(price) : null,
        billing_type: months >= 12 && months % 12 === 0 ? "yearly" : "monthly",
        auto_renew: autoRenew,
        notes: notes.trim() || null,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : undefined,
        duration_months: months,
      });
      toast.success("تم إنشاء الاشتراك");
      reset();
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "فشل الإنشاء");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>اشتراك جديد</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>العميل</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="اختر عميل…" /></SelectTrigger>
              <SelectContent>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>المنتج (اختياري)</Label>
            <Select value={productId} onValueChange={pickProduct}>
              <SelectTrigger><SelectValue placeholder="اختر من الكتالوج أو أدخل يدوياً" /></SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="اسم المنتج" value={productName} onChange={(e) => setProductName(e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label>سعر التجديد (ج.م)</Label>
            <Input type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
          </div>

          {/* Duration section */}
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
            <div className="text-sm font-medium">مدة الاشتراك</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">تاريخ البداية</Label>
                <Input
                  type="date"
                  value={startsAt}
                  onChange={(e) => { setStartsAt(e.target.value); setEndEdited(false); }}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">تاريخ الانتهاء</Label>
                <Input
                  type="date"
                  value={endsAt}
                  onChange={(e) => { setEndsAt(e.target.value); setEndEdited(true); }}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">المدة</Label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { v: "1", l: "شهر" },
                  { v: "3", l: "3 شهور" },
                  { v: "6", l: "6 شهور" },
                  { v: "12", l: "سنة" },
                  { v: "24", l: "سنتين" },
                  { v: "custom", l: "مخصص" },
                ].map(o => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => { setDurationPreset(o.v); setEndEdited(false); }}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition",
                      durationPreset === o.v
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
              {durationPreset === "custom" && (
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    type="number"
                    min={1}
                    value={customMonths}
                    onChange={(e) => { setCustomMonths(e.target.value); setEndEdited(false); }}
                    className="w-28"
                  />
                  <span className="text-xs text-muted-foreground">شهر</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
            <div>
              <div className="text-sm font-medium">تجديد تلقائي</div>
              <div className="text-[11px] text-muted-foreground">يتجدد الاشتراك تلقائياً في تاريخ الانتهاء</div>
            </div>
            <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
          </div>

          <div className="grid gap-1.5">
            <Label>ملاحظات</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="اختياري" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? "جاري الحفظ…" : "إنشاء الاشتراك"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
