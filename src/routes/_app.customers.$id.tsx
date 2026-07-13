import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Mail, MessageCircle, Building2, Pencil, Trash2, Loader2 } from "lucide-react";
import { useCustomer, useCustomerOrders, useUpdateCustomer, useDeleteCustomer, avatarColor, formatEGP, type Customer } from "@/lib/db";
import { Avatar, StatusPill } from "@/components/app/pills";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/customers/$id")({
  component: CustomerProfile,
  head: ({ params }) => ({ meta: [{ title: `عميل ${params.id.slice(0, 8)} — Kodaty` }] }),
});

function CustomerProfile() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: c, isLoading } = useCustomer(id);
  const { data: orders = [] } = useCustomerOrders(id);
  const del = useDeleteCustomer();

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">جارِ التحميل…</div>;
  }
  if (!c) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <div className="text-lg font-semibold">العميل غير موجود</div>
        <Link to="/customers" className="mt-3 inline-block text-sm text-primary hover:underline">← الرجوع للعملاء</Link>
      </div>
    );
  }

  const totalSpent = orders.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const aov = orders.length ? totalSpent / orders.length : 0;
  const color = avatarColor(c.id);

  const onDelete = async () => {
    try {
      await del.mutateAsync(c.id);
      toast.success("تم حذف العميل");
      navigate({ to: "/customers" });
    } catch (err) {
      toast.error("تعذّر الحذف", { description: (err as Error).message });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Link to="/customers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-4 w-4 rotate-180" /> جميع العملاء
      </Link>

      {/* Hero */}
      <div className="surface-elevated relative overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-0 mesh-bg opacity-60" />
        <div className="relative flex flex-wrap items-center gap-4">
          <Avatar name={c.name} color={color} size={72} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{c.name}</h1>
              {(c.tags ?? []).map(t => <span key={t} className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-primary">{t}</span>)}
              <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{c.tier}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {c.email ? <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span> : <span className="text-muted-foreground/60">— لا يوجد بريد —</span>}
              {c.phone && <span className="inline-flex items-center gap-1 num" dir="ltr"><MessageCircle className="h-3 w-3" />{c.phone}</span>}
              {c.company && <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{c.company}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <EditCustomerDialog customer={c} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" /> حذف
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>حذف العميل؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم حذف بيانات العميل نهائياً. لا يمكن التراجع.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { l: "إجمالي الإنفاق", v: formatEGP(totalSpent) },
          { l: "عدد الطلبات", v: orders.length.toString() },
          { l: "متوسط قيمة الطلب", v: formatEGP(aov) },
          { l: "منذ", v: new Date(c.created_at).toLocaleDateString("ar-EG") },
        ].map(k => (
          <div key={k.l} className="surface-elevated p-4">
            <div className="text-xs text-muted-foreground">{k.l}</div>
            <div className="mt-1 num text-lg font-semibold">{k.v}</div>
          </div>
        ))}
      </div>

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
            {orders.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">لا طلبات بعد.</td></tr>
            )}
            {orders.map(o => {
              const item = o.order_items?.[0];
              return (
                <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-accent/30">
                  <td className="px-4 py-2.5"><Link to="/orders/$id" params={{ id: o.id }} className="num text-primary hover:underline">{o.code}</Link></td>
                  <td className="px-3 py-2.5">{item?.product_name ?? "—"}</td>
                  <td className="px-3 py-2.5"><StatusPill status={o.status} /></td>
                  <td className="px-3 py-2.5 num">{formatEGP(Number(o.total ?? 0))}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ar-EG")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Edit dialog ----------
function EditCustomerDialog({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);
  const update = useUpdateCustomer();
  const [form, setForm] = useState({
    name: customer.name,
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    company: customer.company ?? "",
    tier: customer.tier ?? "regular",
    notes: customer.notes ?? "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("الاسم مطلوب");
      return;
    }
    try {
      await update.mutateAsync({
        id: customer.id,
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        tier: form.tier,
        notes: form.notes.trim() || null,
      });
      toast.success("تم تحديث بيانات العميل");
      setOpen(false);
    } catch (err) {
      toast.error("تعذّر التحديث", { description: (err as Error).message });
    }
  };

  const input = "input-base";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-95">
          <Pencil className="h-4 w-4" /> تعديل البيانات
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>تعديل بيانات العميل</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">الاسم *</span>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={input} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">البريد الإلكتروني</span>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={input} placeholder="name@example.com" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">رقم الجوال</span>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={input} dir="ltr" placeholder="+20 1x xxxx xxxx" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">الشركة</span>
              <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className={input} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">الفئة</span>
              <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })} className={input}>
                <option value="regular">عادي</option>
                <option value="silver">فضي</option>
                <option value="gold">ذهبي</option>
                <option value="vip">VIP</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">ملاحظات</span>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className={input + " resize-none"} />
          </label>
          <DialogFooter>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-accent">إلغاء</button>
            <button type="submit" disabled={update.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              حفظ التغييرات
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
