import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, BookOpen, Trash2, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin } from "@/components/app/require-admin";
import { formatEGP } from "@/lib/db";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AddExpenseDialog } from "@/components/app/expense-dialog";

export const Route = createFileRoute("/_app/finance/journal")({
  component: () => (<RequireAdmin><JournalPage /></RequireAdmin>),
  head: () => ({ meta: [{ title: "القيود المحاسبية — Kodaty" }] }),
});

// دليل حسابات مبسّط
const ACCOUNTS = [
  { code: "1010", name: "الصندوق" },
  { code: "1020", name: "البنك" },
  { code: "1030", name: "InstaPay / محافظ إلكترونية" },
  { code: "1200", name: "العملاء (ذمم مدينة)" },
  { code: "1400", name: "المخزون (مفاتيح التراخيص)" },
  { code: "2100", name: "الموردون (ذمم دائنة)" },
  { code: "2200", name: "ضرائب مستحقة" },
  { code: "3000", name: "رأس المال" },
  { code: "4000", name: "إيرادات المبيعات" },
  { code: "4100", name: "إيرادات الاشتراكات" },
  { code: "5000", name: "تكلفة البضاعة المباعة" },
  { code: "5100", name: "مصاريف تشغيلية" },
  { code: "5200", name: "عمولات وسائل الدفع" },
  { code: "5300", name: "رواتب وأجور" },
  { code: "5400", name: "تسويق وإعلانات" },
];

type Entry = {
  id: string;
  entry_date: string;
  description: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  notes: string | null;
  reference: string | null;
  created_at: string;
};

function JournalPage() {
  const qc = useQueryClient();
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["journal_entries"],
    queryFn: async () => {
      const { data, error } = await (supabase as never as ReturnType<typeof supabase.from>)
        .from("journal_entries" as never)
        .select("*")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Entry[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as never as ReturnType<typeof supabase.from>)
        .from("journal_entries" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      toast.success("تم حذف القيد");
    },
    onError: (e: Error) => toast.error("تعذّر الحذف", { description: e.message }),
  });

  const totalDebit = entries.reduce((s, e) => s + Number(e.amount), 0);

  const exportCsv = () => {
    const rows = ["التاريخ,البيان,مدين,دائن,المبلغ,مرجع,ملاحظات"]
      .concat(entries.map(e => `${e.entry_date},"${e.description}",${e.debit_account},${e.credit_account},${e.amount},"${e.reference ?? ""}","${e.notes ?? ""}"`))
      .join("\n");
    const blob = new Blob(["\uFEFF" + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `journal-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/finance" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-3 w-3 rotate-180" /> العودة إلى المالية
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight">القيود المحاسبية اليدوية</h1>
          <p className="mt-1 text-sm text-muted-foreground">قيود القيد المزدوج (Debit / Credit) للحركات غير المرتبطة بطلب بيع.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-secondary">
            <Download className="h-4 w-4" /> تصدير
          </button>
          <AddExpenseDialog variant="secondary" />
          <NewJournalDialog />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="إجمالي القيود" value={String(entries.length)} icon={BookOpen} />
        <StatCard label="إجمالي مبالغ القيود" value={formatEGP(totalDebit)} icon={BookOpen} />
        <StatCard label="آخر قيد" value={entries[0]?.entry_date ?? "—"} icon={BookOpen} />
      </div>

      {/* Table */}
      <div className="surface-elevated overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold">سجل القيود</h3>
            <p className="text-xs text-muted-foreground">مرتبة من الأحدث إلى الأقدم</p>
          </div>
        </div>
        {isLoading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : entries.length === 0 ? (
          <div className="grid place-items-center gap-3 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">لا توجد قيود بعد</div>
              <p className="mt-1 text-xs text-muted-foreground">ابدأ بإضافة أول قيد يدوي من الزر أعلاه.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-sunken text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-start font-medium">التاريخ</th>
                  <th className="px-5 py-3 text-start font-medium">البيان</th>
                  <th className="px-5 py-3 text-start font-medium">مدين</th>
                  <th className="px-5 py-3 text-start font-medium">دائن</th>
                  <th className="px-5 py-3 text-start font-medium">المبلغ</th>
                  <th className="px-5 py-3 text-start font-medium">المرجع</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-t border-border hover:bg-surface-sunken/60">
                    <td className="px-5 py-3 text-xs num text-muted-foreground">{e.entry_date}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{e.description}</div>
                      {e.notes && <div className="mt-0.5 text-xs text-muted-foreground">{e.notes}</div>}
                    </td>
                    <td className="px-5 py-3 text-xs"><AccountBadge code={e.debit_account} tone="debit" /></td>
                    <td className="px-5 py-3 text-xs"><AccountBadge code={e.credit_account} tone="credit" /></td>
                    <td className="px-5 py-3 num font-medium">{formatEGP(Number(e.amount))}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{e.reference ?? "—"}</td>
                    <td className="px-5 py-3 text-end">
                      <button
                        onClick={() => confirm("حذف هذا القيد؟") && remove.mutate(e.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AccountBadge({ code, tone }: { code: string; tone: "debit" | "credit" }) {
  const acc = ACCOUNTS.find(a => a.code === code);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 ${tone === "debit" ? "border-info/25 bg-info/10 text-info" : "border-warning/25 bg-warning/10 text-warning"}`}>
      <span className="num text-[10px] opacity-70">{code}</span>
      <span>{acc?.name ?? code}</span>
    </span>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="surface-elevated p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-2xl font-bold tracking-tight num">{value}</div>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-surface-sunken text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function NewJournalDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    description: "",
    debit_account: "",
    credit_account: "",
    amount: "",
    reference: "",
    notes: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const payload = {
        entry_date: form.entry_date,
        description: form.description.trim(),
        debit_account: form.debit_account,
        credit_account: form.credit_account,
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
      toast.success("تم تسجيل القيد بنجاح");
      setOpen(false);
      setForm({
        entry_date: new Date().toISOString().slice(0, 10),
        description: "", debit_account: "", credit_account: "", amount: "", reference: "", notes: "",
      });
    },
    onError: (e: Error) => toast.error("تعذّر تسجيل القيد", { description: e.message }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.debit_account || !form.credit_account || !form.amount) return;
    if (form.debit_account === form.credit_account) {
      toast.error("لا يمكن أن يكون الحساب المدين هو نفسه الدائن");
      return;
    }
    create.mutate();
  };

  const input = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:opacity-90">
          <Plus className="h-4 w-4" /> قيد جديد
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>إضافة قيد محاسبي يدوي</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="التاريخ *">
              <input type="date" required value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} className={input} />
            </Field>
            <Field label="المبلغ (ج.م) *">
              <input type="number" step="0.01" min="0.01" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={input} />
            </Field>
          </div>
          <Field label="البيان *">
            <input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="مثال: دفع فاتورة كهرباء المكتب" className={input} />
          </Field>
          <Field label="من ح/ (مدين) *">
            <select required value={form.debit_account} onChange={e => setForm({ ...form, debit_account: e.target.value })} className={input}>
              <option value="">اختر حساباً…</option>
              {ACCOUNTS.map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
            </select>
          </Field>
          <Field label="إلى ح/ (دائن) *">
            <select required value={form.credit_account} onChange={e => setForm({ ...form, credit_account: e.target.value })} className={input}>
              <option value="">اختر حساباً…</option>
              {ACCOUNTS.map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="رقم المرجع">
              <input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="INV-2024" className={input} />
            </Field>
            <Field label="ملاحظات">
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={input} />
            </Field>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">إلغاء</button>
            <button type="submit" disabled={create.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:opacity-90 disabled:opacity-60">
              {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              حفظ القيد
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
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
