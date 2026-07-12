import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Download, Plus, Loader2, Trash2, Pencil } from "lucide-react";

import {
  useOrders, useCustomers, useProducts, useCreateOrder, useCreateCustomer, useDeleteOrder,
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
  const createCustomer = useCreateCustomer();
  const [form, setForm] = useState({
    customer_name: "", customer_email: "", customer_phone: "",
    product_id: "", qty: 1,
    priority: "normal" as OrderPriority, status: "pending" as OrderStatus,
    payment_method: "" as string,
    order_date: new Date().toISOString().slice(0, 10),
    unit_price: "" as string,
    unit_cost: "" as string,
    price_edited: false,
  });


  // Subscription duration state (only used when product is subscription)
  const today = new Date().toISOString().slice(0, 10);
  const [startsAt, setStartsAt] = useState(today);
  const [durationPreset, setDurationPreset] = useState<string>("1");
  const [customMonths, setCustomMonths] = useState<string>("18");
  const [endsAt, setEndsAt] = useState("");
  const [endEdited, setEndEdited] = useState(false);

  const product = products.find(p => p.id === form.product_id);
  const effectivePrice = form.unit_price !== "" ? Number(form.unit_price) : (product ? Number(product.price) : 0);
  const effectiveCost = form.unit_cost !== "" ? Number(form.unit_cost) : (product ? Number((product as any).cost_price ?? 0) : 0);
  const total = effectivePrice * form.qty;
  const isSub = !!product && (product as any).billing_type && (product as any).billing_type !== "one_time";

  const months = useMemo(() => {
    if (durationPreset === "custom") return Math.max(1, parseInt(customMonths || "0", 10) || 0);
    return parseInt(durationPreset, 10);
  }, [durationPreset, customMonths]);

  // When product changes, seed the duration preset from billing_type and price fields
  useEffect(() => {
    if (!product) return;
    const bt = (product as any).billing_type;
    if (bt === "yearly") setDurationPreset("12");
    else if (bt === "monthly") setDurationPreset("1");
    setEndEdited(false);
    setForm(f => f.price_edited ? f : {
      ...f,
      unit_price: String(product.price ?? ""),
      unit_cost: String((product as any).cost_price ?? 0),
    });
  }, [form.product_id]);


  // Auto-compute end date
  useEffect(() => {
    if (!isSub) return;
    if (endEdited) return;
    if (!startsAt || !months) return;
    const d = new Date(startsAt);
    d.setMonth(d.getMonth() + months);
    setEndsAt(d.toISOString().slice(0, 10));
  }, [startsAt, months, endEdited, isSub]);

  const trimmedName = form.customer_name.trim();
  const matched = trimmedName
    ? customers.find(c => c.name.trim().toLowerCase() === trimmedName.toLowerCase())
    : null;

  // Suggest up to 5 close matches while typing
  const suggestions = useMemo(() => {
    if (!trimmedName || matched) return [];
    const q = trimmedName.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q)).slice(0, 5);
  }, [customers, trimmedName, matched]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedName || !product) return;
    try {
      let customerId = matched?.id;
      if (!customerId) {
        const created = await createCustomer.mutateAsync({
          name: trimmedName,
          email: form.customer_email.trim() || undefined,
          phone: form.customer_phone.trim() || undefined,
        });
        customerId = created.id;
        toast.success(`تم إضافة عميل جديد: ${trimmedName}`);
      }

      await create.mutateAsync({
        customer_id: customerId!,
        product_id: product.id,
        product_name: product.name,
        unit_price: Number(product.price),
        unit_cost: Number((product as any).cost_price ?? 0),
        qty: form.qty,
        priority: form.priority,
        status: form.status,
        billing_type: (product as any).billing_type ?? "one_time",
        payment_method: form.payment_method || null,
        order_date: form.order_date || undefined,
        ...(isSub ? {
          starts_at: new Date(startsAt).toISOString(),
          ends_at: endsAt ? new Date(endsAt).toISOString() : undefined,
          duration_months: months,
        } : {}),
      });
      toast.success(
        isSub ? "تم إنشاء الطلب والاشتراك" : "تم إنشاء الطلب"
      );

      setForm({
        customer_name: "", customer_email: "", customer_phone: "",
        product_id: "", qty: 1, priority: "normal", status: "pending",
        payment_method: "", order_date: new Date().toISOString().slice(0, 10),
        unit_price: "", unit_cost: "", price_edited: false,
      });

      setStartsAt(today); setDurationPreset("1"); setCustomMonths("18");
      setEndsAt(""); setEndEdited(false);
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
          <Field label="اسم العميل *">
            <input
              required
              value={form.customer_name}
              onChange={e => setForm({ ...form, customer_name: e.target.value })}
              placeholder="اكتب اسم العميل…"
              className={input}
              autoComplete="off"
              list="orders-customer-suggestions"
            />
            <datalist id="orders-customer-suggestions">
              {customers.map(c => <option key={c.id} value={c.name} />)}
            </datalist>
            {trimmedName && (
              matched ? (
                <p className="text-xs text-emerald-600">✓ عميل موجود — سيُستخدم حسابه مباشرة</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  عميل جديد — سيتم إنشاؤه تلقائياً
                  {suggestions.length > 0 && (
                    <> · هل تقصد:{" "}
                      {suggestions.map((s, i) => (
                        <button
                          key={s.id}
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => setForm({ ...form, customer_name: s.name })}
                        >
                          {s.name}{i < suggestions.length - 1 ? "، " : ""}
                        </button>
                      ))}
                      ؟
                    </>
                  )}
                </p>
              )
            )}
          </Field>
          {trimmedName && !matched && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="إيميل (اختياري)">
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={e => setForm({ ...form, customer_email: e.target.value })}
                  className={input}
                  placeholder="name@example.com"
                />
              </Field>
              <Field label="جوال (اختياري)">
                <input
                  value={form.customer_phone}
                  onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                  className={input}
                  placeholder="+20…"
                />
              </Field>
            </div>
          )}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="تاريخ الطلب">
              <input
                type="date"
                value={form.order_date}
                onChange={e => setForm({ ...form, order_date: e.target.value })}
                className={input}
              />
            </Field>
            <Field label="طريقة الدفع">
              <select
                value={form.payment_method}
                onChange={e => setForm({ ...form, payment_method: e.target.value })}
                className={input}
              >
                <option value="">— غير محدد —</option>
                <option value="cash">نقدي</option>
                <option value="instapay">إنستا باي</option>
                <option value="vodafone_cash">فودافون كاش</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="visa">فيزا / ماستر</option>
                <option value="paypal">PayPal</option>
                <option value="usdt">USDT / كريبتو</option>
                <option value="other">أخرى</option>
              </select>
            </Field>
          </div>

          {isSub && (
            <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">مدة الاشتراك</div>
                <span className="text-[11px] rounded-full bg-primary/10 text-primary px-2 py-0.5">
                  {(product as any)?.billing_type === "yearly" ? "سنوي" : "شهري"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="تاريخ البداية">
                  <input
                    type="date"
                    value={startsAt}
                    onChange={e => { setStartsAt(e.target.value); setEndEdited(false); }}
                    className={input}
                  />
                </Field>
                <Field label="تاريخ الانتهاء">
                  <input
                    type="date"
                    value={endsAt}
                    onChange={e => { setEndsAt(e.target.value); setEndEdited(true); }}
                    className={input}
                  />
                </Field>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">المدة</span>
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
                          : "border-border bg-surface-sunken text-muted-foreground hover:text-foreground"
                      )}
                    >{o.l}</button>
                  ))}
                </div>
                {durationPreset === "custom" && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number" min={1}
                      value={customMonths}
                      onChange={e => { setCustomMonths(e.target.value); setEndEdited(false); }}
                      className={cn(input, "w-28")}
                    />
                    <span className="text-xs text-muted-foreground">شهر</span>
                  </div>
                )}
              </div>
            </div>
          )}
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

