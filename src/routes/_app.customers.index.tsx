import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Download, Loader2 } from "lucide-react";
import { useCustomers, useCreateCustomer, avatarColor } from "@/lib/db";
import { Avatar } from "@/components/app/pills";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/customers/")({
  component: CustomersList,
  head: () => ({ meta: [{ title: "العملاء — Kodaty" }] }),
});

function CustomersList() {
  const [q, setQ] = useState("");
  const { data: customers = [], isLoading } = useCustomers();
  const filtered = useMemo(
    () => customers.filter(c => !q || c.name.includes(q) || (c.email ?? "").includes(q)),
    [q, customers],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">العملاء</h1>
          <p className="text-sm text-muted-foreground num">{customers.length} عميل</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-accent">
            <Download className="h-4 w-4" /> تصدير
          </button>
          <NewCustomerButton />
        </div>
      </div>

      <div className="surface-elevated p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="ابحث بالاسم أو البريد…"
            className="w-full rounded-lg border border-border bg-surface-sunken py-2 ps-9 pe-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="surface-elevated grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-elevated grid place-items-center py-16 text-center">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">لا يوجد عملاء بعد.</div>
            <div className="text-xs text-muted-foreground">ابدأ بإضافة أول عميل لك.</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(c => (
            <Link
              key={c.id}
              to="/customers/$id"
              params={{ id: c.id }}
              className="surface-elevated group p-4 transition hover:border-primary/40 hover:shadow-glow"
            >
              <div className="flex items-start gap-3">
                <Avatar name={c.name} color={avatarColor(c.id)} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{c.name}</div>
                    {c.tier === "vip" && (
                      <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-primary">VIP</span>
                    )}
                  </div>
                  <div className="truncate text-xs text-muted-foreground" dir="ltr">{c.email ?? "—"}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{c.company ?? c.phone ?? ""}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1 border-t border-border pt-3">
                {c.tags.length === 0 && <span className="text-xs text-muted-foreground">لا توجد علامات</span>}
                {c.tags.map(t => (
                  <span key={t} className="rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NewCustomerButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", tier: "regular" });
  const create = useCreateCustomer();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await create.mutateAsync({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        tier: form.tier,
      });
      toast.success("تمت إضافة العميل");
      setForm({ name: "", email: "", phone: "", company: "", tier: "regular" });
      setOpen(false);
    } catch (err) {
      toast.error("تعذّر الإضافة", { description: (err as Error).message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:opacity-90">
          <Plus className="h-4 w-4" /> عميل جديد
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة عميل جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="الاسم *">
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={input} placeholder="مثال: أحمد العتيبي" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="البريد">
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={input} dir="ltr" />
            </Field>
            <Field label="الهاتف">
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={input} dir="ltr" />
            </Field>
          </div>
          <Field label="الشركة">
            <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className={input} />
          </Field>
          <Field label="الفئة">
            <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })} className={input}>
              <option value="regular">عادي</option>
              <option value="vip">VIP</option>
              <option value="wholesale">جملة</option>
            </select>
          </Field>
          <DialogFooter>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-accent">إلغاء</button>
            <button type="submit" disabled={create.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:opacity-90 disabled:opacity-60">
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              حفظ العميل
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
