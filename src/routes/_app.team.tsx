import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { UserPlus, Shield, User as UserIcon, Trash2, Loader2, MailCheck, MailX } from "lucide-react";
import { toast } from "sonner";
import { RequireAdmin } from "@/components/app/require-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  listTeam, createTeamMember, updateTeamRole, deleteTeamMember,
} from "@/lib/team.functions";

export const Route = createFileRoute("/_app/team")({
  component: TeamPage,
  head: () => ({ meta: [{ title: "الفريق — Kodaty" }] }),
});

function TeamPage() {
  return (
    <RequireAdmin>
      <TeamInner />
    </RequireAdmin>
  );
}

function TeamInner() {
  const list = useServerFn(listTeam);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["team"], queryFn: () => list() });

  const create = useServerFn(createTeamMember);
  const updateRole = useServerFn(updateTeamRole);
  const remove = useServerFn(deleteTeamMember);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "staff" as "admin" | "staff" });

  const createMut = useMutation({
    mutationFn: (v: typeof form) => create({ data: v }),
    onSuccess: () => {
      toast.success("تم إنشاء الحساب");
      setOpen(false);
      setForm({ full_name: "", email: "", password: "", role: "staff" });
      qc.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذّر إنشاء الحساب"),
  });

  const roleMut = useMutation({
    mutationFn: (v: { user_id: string; role: "admin" | "staff" }) => updateRole({ data: v }),
    onSuccess: () => {
      toast.success("تم تحديث الصلاحية");
      qc.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "فشل التحديث"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { user_id: id } }),
    onSuccess: () => {
      toast.success("تم حذف الحساب");
      qc.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "فشل الحذف"),
  });

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">الفريق والصلاحيات</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            أضف أعضاء إلى مساحة العمل وحدّد صلاحياتهم. التسجيل الذاتي مغلق — الحسابات تُنشأ من هنا فقط.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" /> إضافة عضو
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>عضو جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>الاسم الكامل</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="مثال: أحمد محمود"
                />
              </div>
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email" dir="ltr"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label>كلمة المرور المؤقتة</Label>
                <Input
                  type="text" dir="ltr" minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="8 أحرف على الأقل"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  شاركها مع العضو ليقوم بتغييرها بعد الدخول.
                </p>
              </div>
              <div>
                <Label>الصلاحية</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as any })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">موظف — صلاحيات محدودة</SelectItem>
                    <SelectItem value="admin">مدير — صلاحيات كاملة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => createMut.mutate(form)}
                disabled={
                  createMut.isPending ||
                  !form.email || !form.full_name || form.password.length < 8
                }
                className="gap-2"
              >
                {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                إنشاء الحساب
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="surface-elevated overflow-hidden rounded-xl">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b border-border/60 bg-muted/30 px-4 py-3 text-xs font-medium text-muted-foreground">
          <div>العضو</div>
          <div>الصلاحية</div>
          <div className="hidden sm:block">الحالة</div>
          <div className="hidden sm:block">آخر دخول</div>
          <div></div>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> جاري التحميل…
          </div>
        ) : !data?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">لا يوجد أعضاء بعد.</div>
        ) : (
          data.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b border-border/60 px-4 py-3 text-sm last:border-b-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                  {(u.full_name ?? u.email)[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium">{u.full_name ?? "—"}</div>
                  <div className="truncate text-xs text-muted-foreground" dir="ltr">{u.email}</div>
                </div>
              </div>
              <Select
                value={u.role ?? "staff"}
                onValueChange={(v) => roleMut.mutate({ user_id: u.id, role: v as any })}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">
                    <span className="inline-flex items-center gap-2"><UserIcon className="h-3.5 w-3.5" /> موظف</span>
                  </SelectItem>
                  <SelectItem value="admin">
                    <span className="inline-flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> مدير</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="hidden sm:block">
                {u.confirmed ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    <MailCheck className="h-3 w-3" /> مُفعّل
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    <MailX className="h-3 w-3" /> بانتظار التفعيل
                  </span>
                )}
              </div>
              <div className="hidden text-xs text-muted-foreground sm:block">
                {u.last_sign_in_at
                  ? new Date(u.last_sign_in_at).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })
                  : "—"}
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>حذف {u.full_name ?? u.email}؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف الحساب نهائياً ولن يتمكن من الدخول مجدداً.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => deleteMut.mutate(u.id)}
                    >
                      حذف
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
