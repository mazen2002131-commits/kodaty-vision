import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Package, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import {
  useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  formatEGP, type Product, type BillingType,
} from "@/lib/db";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/products")({
  component: Products,
  head: () => ({ meta: [{ title: "المنتجات — Kodaty" }] }),
});

type FormState = { name: string; category: string; price: string; cost_price: string; billing_type: BillingType };
const empty: FormState = { name: "", category: "", price: "", cost_price: "", billing_type: "one_time" };

function Products() {
  const { data: products = [], isLoading } = useProducts();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const remove = useDeleteProduct();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category ?? "",
      price: String(p.price),
      cost_price: String(p.cost_price ?? ""),
      billing_type: p.billing_type ?? "one_time",
    });
    setOpen(true);
  }

  async function submit() {
    if (!form.name || !form.price) { toast.error("املأ الاسم والسعر"); return; }
    const payload = {
      name: form.name,
      category: form.category || null,
      price: Number(form.price),
      cost_price: form.cost_price ? Number(form.cost_price) : 0,
      billing_type: form.billing_type,
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...payload });
        toast.success("تم تحديث المنتج");
      } else {
        await create.mutateAsync({ ...payload, category: payload.category ?? undefined });
        toast.success("تمت الإضافة");
      }
      setOpen(false);
      setForm(empty);
      setEditing(null);
    } catch (e: any) { toast.error(e.message ?? "فشل"); }
  }

  async function handleDelete(p: Product) {
    try {
      await remove.mutateAsync(p.id);
      toast.success("تم حذف المنتج");
    } catch (e: any) {
      toast.error("تعذّر الحذف", { description: e.message?.includes("foreign") ? "المنتج مرتبط بطلبات أو اشتراكات — عطّله بدلاً من حذفه." : e.message });
    }
  }

  const grouped = products.reduce<Record<string, typeof products>>((acc, p) => {
    const k = p.category ?? "عام";
    (acc[k] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">المنتجات</h1>
          <p className="text-sm text-muted-foreground">كتالوج المنتجات القابلة للبيع وأسعارها الرسمية</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(empty); } }}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="brand-gradient text-white shadow-brand"><Plus className="me-1 h-4 w-4" /> منتج جديد</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "تعديل المنتج" : "منتج جديد"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>الاسم</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>الفئة</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Office, Design, Streaming…" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>سعر البيع (ج.م)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
                <div><Label>سعر الشراء (ج.م)</Label><Input type="number" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))} placeholder="التكلفة" /></div>
              </div>
              <div>
                <Label>نوع الفوترة</Label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {([
                    { k: "one_time", label: "مرة واحدة" },
                    { k: "monthly", label: "شهري" },
                    { k: "yearly", label: "سنوي" },
                  ] as const).map(o => (
                    <button
                      type="button"
                      key={o.k}
                      onClick={() => setForm(f => ({ ...f, billing_type: o.k }))}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${form.billing_type === o.k ? "border-primary bg-primary/10 font-medium text-primary" : "border-border bg-surface-sunken text-muted-foreground hover:text-foreground"}`}
                    >{o.label}</button>
                  ))}
                </div>
                {form.billing_type !== "one_time" && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">سيتم إنشاء اشتراك تلقائياً عند بيع هذا المنتج.</p>
                )}
              </div>
              {form.price && form.cost_price && (
                <div className="rounded-lg bg-primary/5 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">هامش الربح المتوقع: </span>
                  <span className="num font-semibold text-primary">
                    {formatEGP(Number(form.price) - Number(form.cost_price))} ({Number(form.price) > 0 ? Math.round(((Number(form.price) - Number(form.cost_price)) / Number(form.price)) * 100) : 0}%)
                  </span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button onClick={submit} disabled={create.isPending || update.isPending}>
                {(create.isPending || update.isPending) && <Loader2 className="me-1 h-4 w-4 animate-spin" />}
                {editing ? "حفظ التعديلات" : "حفظ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="surface-elevated grid place-items-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="surface-elevated grid place-items-center py-16 text-sm text-muted-foreground">لا توجد منتجات.</div>
      ) : Object.entries(grouped).map(([cat, items]) => (
        <section key={cat} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">{cat}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(p => {
              const margin = Number(p.price) - Number(p.cost_price ?? 0);
              const pct = Number(p.price) > 0 ? Math.round((margin / Number(p.price)) * 100) : 0;
              return (
                <div key={p.id} className="surface-elevated group relative flex items-start justify-between gap-3 p-4 transition hover:border-primary/40">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg brand-gradient-soft text-primary">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium leading-tight">{p.name}</span>
                        {p.billing_type && p.billing_type !== "one_time" && (
                          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            {p.billing_type === "monthly" ? "شهري" : "سنوي"}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{p.category ?? "—"}</div>
                      {Number(p.cost_price ?? 0) > 0 && (
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          تكلفة: <span className="num">{formatEGP(Number(p.cost_price))}</span> · ربح: <span className="num text-success">{formatEGP(margin)} ({pct}%)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="num text-lg font-semibold text-primary">{formatEGP(Number(p.price))}</div>
                    <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => openEdit(p)}
                        title="تعديل"
                        className="grid h-7 w-7 place-items-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            title="حذف"
                            className="grid h-7 w-7 place-items-center rounded-md border border-destructive/40 bg-destructive/5 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف «{p.name}»؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              إذا كان المنتج مرتبطاً بطلبات أو اشتراكات فلن يمكن حذفه — الأفضل تعطيله بدلاً من ذلك.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(p)} className="bg-destructive text-destructive-foreground hover:opacity-90">حذف</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
