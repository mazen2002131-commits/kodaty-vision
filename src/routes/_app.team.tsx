import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { UserPlus, Shield, User as UserIcon, Trash2, Loader2, MailCheck, MailX, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { RequireAdmin } from "@/components/app/require-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
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
  listTeam, createTeamMember, updateTeamRole, deleteTeamMember, updateTeamPermissions,
} from "@/lib/team.functions";
import {
  PERMISSION_GROUPS, ALL_PERMISSIONS, DEFAULT_STAFF_PERMISSIONS, type PermissionKey,
} from "@/lib/permissions";

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

function PermissionPicker({
  value, onChange, disabled,
}: { value: Set<string>; onChange: (v: Set<string>) => void; disabled?: boolean }) {
  const toggle = (k: string) => {
    const next = new Set(value);
    if (next.has(k)) next.delete(k); else next.add(k);
    onChange(next);
  };
  const allSelected = ALL_PERMISSIONS.every(k => value.has(k));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs">
        <span className="text-muted-foreground">
          {value.size} من {ALL_PERMISSIONS.length} صلاحية مُحددة
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="text-primary hover:underline disabled:opacity-40"
            disabled={disabled || allSelected}
            onClick={() => onChange(new Set(ALL_PERMISSIONS))}
          >
            تحديد الكل
          </button>
          <span className="text-muted-foreground/40">·</span>
          <button
            type="button"
            className="text-muted-foreground hover:underline disabled:opacity-40"
            disabled={disabled || value.size === 0}
            onClick={() => onChange(new Set())}
          >
            إلغاء الكل
          </button>
        </div>
      </div>
      <div className="max-h-[340px] space-y-4 overflow-y-auto pe-1">
        {PERMISSION_GROUPS.map(group => (
          <div key={group.section}>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.section}
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {group.items.map(item => {
                const checked = value.has(item.key);
                return (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border/60 bg-background px-3 py-2 text-sm transition hover:border-primary/40 hover:bg-primary/[.03]"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={() => toggle(item.key)}
                    />
                    <span className="flex-1">{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamInner() {
  const list = useServerFn(listTeam);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["team"], queryFn: () => list() });

  const create = useServerFn(createTeamMember);
  const updateRole = useServerFn(updateTeamRole);
  const updatePerms = useServerFn(updateTeamPermissions);
  const remove = useServerFn(deleteTeamMember);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", password: "",
    role: "staff" as "admin" | "staff",
    permissions: new Set<string>(DEFAULT_STAFF_PERMISSIONS as string[]),
  });

  const [permEditing, setPermEditing] = useState<null | { user_id: string; name: string; perms: Set<string> }>(null);

  const createMut = useMutation({
    mutationFn: (v: typeof form) => create({
      data: {
        full_name: v.full_name, email: v.email, password: v.password, role: v.role,
        permissions: v.role === "admin" ? ALL_PERMISSIONS as string[] : Array.from(v.permissions),
      },
    }),
    onSuccess: () => {
      toast.success("تم إنشاء الحساب");
      setOpen(false);
      setForm({
        full_name: "", email: "", password: "", role: "staff",
        permissions: new Set(DEFAULT_STAFF_PERMISSIONS as string[]),
      });
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

  const permsMut = useMutation({
    mutationFn: (v: { user_id: string; permissions: string[] }) => updatePerms({ data: v }),
    onSuccess: () => {
      toast.success("تم تحديث الصلاحيات");
      setPermEditing(null);
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

  const isStaffForm = form.role === "staff";

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">الفريق والصلاحيات</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            أضف أعضاء وحدّد بدقة الأقسام المتاحة لكل موظف. التسجيل الذاتي مغلق.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" /> إضافة عضو
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>عضو جديد</DialogTitle>
              <DialogDescription>
                عيّن الصلاحية والأقسام التي يستطيع الوصول إليها.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
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
                  <Label>نوع الصلاحية</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">موظف — صلاحيات محددة</SelectItem>
                      <SelectItem value="admin">مدير — صلاحيات كاملة</SelectItem>
                    </SelectContent>
                  </Select>
                  {!isStaffForm && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      المدير يملك كل الصلاحيات تلقائياً.
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">الأقسام المتاحة</Label>
                <PermissionPicker
                  value={form.permissions}
                  onChange={(v) => setForm({ ...form, permissions: v })}
                  disabled={!isStaffForm}
                />
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
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-4 border-b border-border/60 bg-muted/30 px-4 py-3 text-xs font-medium text-muted-foreground">
          <div>العضو</div>
          <div>الصلاحية</div>
          <div className="hidden sm:block">الأقسام</div>
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
          data.map((u) => {
            const isAdmin = (u.role ?? "staff") === "admin";
            const permCount = isAdmin ? ALL_PERMISSIONS.length : (u.permissions?.length ?? 0);
            return (
              <div
                key={u.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-4 border-b border-border/60 px-4 py-3 text-sm last:border-b-0"
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
                  <button
                    disabled={isAdmin}
                    onClick={() => setPermEditing({
                      user_id: u.id,
                      name: u.full_name ?? u.email,
                      perms: new Set(u.permissions ?? []),
                    })}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-2.5 py-1 text-xs font-medium transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <KeyRound className="h-3 w-3" />
                    {isAdmin ? "كل الصلاحيات" : `${permCount} صلاحية`}
                  </button>
                </div>
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
            );
          })
        )}
      </div>

      {/* Per-member permissions dialog */}
      <Dialog open={!!permEditing} onOpenChange={(v) => !v && setPermEditing(null)}>
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>صلاحيات {permEditing?.name}</DialogTitle>
            <DialogDescription>
              فعّل الأقسام التي يستطيع هذا الموظف الوصول إليها.
            </DialogDescription>
          </DialogHeader>
          {permEditing && (
            <PermissionPicker
              value={permEditing.perms}
              onChange={(v) => setPermEditing({ ...permEditing, perms: v })}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermEditing(null)}>إلغاء</Button>
            <Button
              disabled={permsMut.isPending}
              onClick={() => permEditing && permsMut.mutate({
                user_id: permEditing.user_id,
                permissions: Array.from(permEditing.perms),
              })}
              className="gap-2"
            >
              {permsMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
