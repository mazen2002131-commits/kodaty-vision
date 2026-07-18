import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";

// Expense categories → debit account code (5xxx)
export const EXPENSE_CATEGORIES: { code: string; label: string }[] = [
  { code: "5100", label: "مصاريف تشغيلية" },
  { code: "5200", label: "عمولات وسائل الدفع" },
  { code: "5300", label: "رواتب وأجور" },
  { code: "5400", label: "تسويق وإعلانات" },
  { code: "5500", label: "إيجار المكتب" },
  { code: "5600", label: "مرافق (كهرباء/ماء)" },
  { code: "5700", label: "اتصالات وإنترنت" },
  { code: "5800", label: "معدات وأجهزة" },
  { code: "5900", label: "مصاريف أخرى" },
];

// Payment source → credit account code
const PAYMENT_SOURCES: { code: string; label: string }[] = [
  { code: "1010", label: "نقدي / الصندوق" },
  { code: "1020", label: "تحويل بنكي" },
  { code: "1030", label: "InstaPay / محافظ إلكترونية" },
  { code: "2100", label: "على الحساب (ذمم دائنة)" },
];

type Props = {
  variant?: "primary" | "secondary";
  label?: string;
};

export function AddExpenseDialog({ variant = "primary", label = "إضافة مصروف" }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    category: "5100",
    source: "1010",
    amount: "",
    description: "",
    reference: "",
    notes: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const cat = EXPENSE_CATEGORIES.find(c => c.code === form.category);
      const payload = {
        entry_date: form.entry_date,
        description: form.description.trim() || (cat?.label ?? "مصروف"),
        debit_account: form.category,
        credit_account: form.source,
        amount: Number(form.amount),
        reference: form.reference.trim() || null,
        notes: form.notes.trim() || null,
        created_by: userRes.user?.id ?? null,
      };
      const { error } = await (supabase as never as ReturnType<typeof supabase.from>)
        .from("journal_entries" as never).insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      toast.success("تم تسجيل المصروف — سيظهر فوراً في المالية");
      setOpen(false);
      setForm({
        entry_date: new Date().toISOString().slice(0, 10),
        category: "5100", source: "1010", amount: "", description: "", reference: "", notes: "",
      });
    },
    onError: (e: Error) => toast.error("تعذّر التسجيل", { description: e.message }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("أدخل مبلغاً صحيحاً");
      return;
    }
    create.mutate();
  };

  const input = "w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  const trigger = variant === "primary" ? (
    <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95">
      <Plus className="h-4 w-4" /> {label}
    </button>
  ) : (
    <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition hover:bg-accent">
      <Receipt className="h-4 w-4" /> {label}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تسجيل مصروف جديد</DialogTitle>
          <p className="text-xs text-muted-foreground">
            يُسجَّل تلقائياً كقيد محاسبي مزدوج ويؤثر فوراً على تقارير المالية.
          </p>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="التاريخ *">
              <input type="date" required value={form.entry_date}
                onChange={e => setForm({ ...form, entry_date: e.target.value })} className={input} />
            </Field>
            <Field label="المبلغ (ج.م) *">
              <input type="number" step="0.01" min="0.01" required value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })} className={input} />
            </Field>
          </div>
          <Field label="نوع المصروف *">
            <select required value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })} className={input}>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="مصدر الدفع *">
            <select required value={form.source}
              onChange={e => setForm({ ...form, source: e.target.value })} className={input}>
              {PAYMENT_SOURCES.map(s => (
                <option key={s.code} value={s.code}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="البيان">
            <input value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="مثال: فاتورة كهرباء شهر يوليو" className={input} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="رقم المرجع">
              <input value={form.reference}
                onChange={e => setForm({ ...form, reference: e.target.value })}
                placeholder="INV-2024" className={input} />
            </Field>
            <Field label="ملاحظات">
              <input value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })} className={input} />
            </Field>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setOpen(false)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-accent">إلغاء</button>
            <button type="submit" disabled={create.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              حفظ المصروف
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
