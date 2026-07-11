import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Package, Plus, Loader2 } from "lucide-react";
import { useProducts, useCreateProduct, formatEGP } from "@/lib/db";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/products")({
  component: Products,
  head: () => ({ meta: [{ title: "المنتجات — Kodaty" }] }),
});

function Products() {
  const { data: products = [], isLoading } = useProducts();
  const create = useCreateProduct();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", price: "", cost_price: "" });

  async function submit() {
    if (!form.name || !form.price) { toast.error("املأ الاسم والسعر"); return; }
    try {
      await create.mutateAsync({
        name: form.name,
        category: form.category || undefined,
        price: Number(form.price),
        cost_price: form.cost_price ? Number(form.cost_price) : 0,
      });
      toast.success("تمت الإضافة");
      setOpen(false);
      setForm({ name: "", category: "", price: "", cost_price: "" });
    } catch (e: any) { toast.error(e.message ?? "فشل"); }
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="brand-gradient text-white shadow-brand"><Plus className="me-1 h-4 w-4" /> منتج جديد</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>منتج جديد</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>الاسم</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>الفئة</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Office, Design, Streaming…" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>سعر البيع (ج.م)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
                <div><Label>سعر الشراء (ج.م)</Label><Input type="number" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))} placeholder="التكلفة" /></div>
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
              <Button onClick={submit} disabled={create.isPending}>حفظ</Button>
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
            {items.map(p => (
              <div key={p.id} className="surface-elevated group flex items-start justify-between gap-3 p-4 transition hover:border-primary/40">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg brand-gradient-soft text-primary">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium leading-tight">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.category ?? "—"}</div>
                  </div>
                </div>
                <div className="num text-lg font-semibold text-primary">{formatEGP(Number(p.price))}</div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
