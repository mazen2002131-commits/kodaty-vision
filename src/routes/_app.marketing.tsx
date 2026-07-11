import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Megaphone, Tag, Users2, TrendingUp, Copy, Check, Plus, Trash2 } from "lucide-react";
import {
  formatEGP,
  useCampaigns, useCreateCampaign, useDeleteCampaign,
  useCoupons, useCreateCoupon, useDeleteCoupon,
  useReferrals, useCreateReferral, useDeleteReferral,
} from "@/lib/db";
import { RequireAdmin } from "@/components/app/require-admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/marketing")({
  component: () => (<RequireAdmin><Marketing /></RequireAdmin>),
  head: () => ({ meta: [{ title: "التسويق — Kodaty" }] }),
});

function Marketing() {
  const { data: campaigns = [] } = useCampaigns();
  const { data: coupons = [] } = useCoupons();
  const { data: referrals = [] } = useReferrals();

  const [copied, setCopied] = useState<string | null>(null);
  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const totalReach = campaigns.reduce((s, c) => s + (c.reach ?? 0), 0);
  const totalRevenue = campaigns.reduce((s, c) => s + Number(c.revenue ?? 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">التسويق</h1>
          <p className="text-sm text-muted-foreground mt-1">الحملات، أكواد الخصم، ونظام الإحالة.</p>
        </div>
        <NewCampaignDialog />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="حملات نشطة" value={String(activeCampaigns)} icon={Megaphone} tone="text-brand-600" />
        <Kpi label="إجمالي الوصول" value={totalReach.toLocaleString("ar-EG")} icon={Users2} tone="text-info" />
        <Kpi label="إيراد الحملات" value={formatEGP(totalRevenue)} icon={TrendingUp} tone="text-success" />
        <Kpi label="أكواد نشطة" value={String(coupons.filter(c => c.active).length)} icon={Tag} tone="text-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CampaignsList />

        <div className="surface-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">أكواد الخصم</h3>
            <NewCouponDialog />
          </div>
          <div className="space-y-2">
            {coupons.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">لا توجد أكواد خصم</div>
            )}
            {coupons.map(c => (
              <CouponRow key={c.id} c={c} copied={copied} onCopy={copy} />
            ))}
          </div>
        </div>
      </div>

      <div className="surface-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">نظام الإحالة — أفضل السفراء</h3>
          <NewReferralDialog />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {referrals.length === 0 && (
            <div className="md:col-span-3 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">لا توجد إحالات</div>
          )}
          {referrals.map((r, i) => (
            <ReferralCard key={r.id} r={r} rank={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CampaignsList() {
  const { data: campaigns = [] } = useCampaigns();
  const del = useDeleteCampaign();
  return (
    <div className="surface-elevated lg:col-span-2 overflow-hidden">
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-medium">الحملات</h3>
      </div>
      <div className="grid grid-cols-[1fr_90px_80px_90px_120px_80px_40px] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-muted-foreground">
        <div>الاسم</div><div>القناة</div><div className="text-center">وصول</div>
        <div className="text-center">طلبات</div><div className="text-center">إيراد</div><div>الحالة</div><div></div>
      </div>
      {campaigns.length === 0 && (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">لا توجد حملات</div>
      )}
      {campaigns.map(c => (
        <div key={c.id} className="grid grid-cols-[1fr_90px_80px_90px_120px_80px_40px] gap-4 border-b border-border/60 px-5 py-3.5 items-center text-sm hover:bg-surface-soft transition group">
          <div className="font-medium truncate">{c.name}</div>
          <div className="text-muted-foreground text-xs">{c.channel}</div>
          <div className="text-center font-mono text-xs">{(c.reach ?? 0).toLocaleString("ar-EG")}</div>
          <div className="text-center font-mono text-xs">{c.orders ?? 0}</div>
          <div className="text-center font-mono text-xs">{formatEGP(Number(c.revenue ?? 0))}</div>
          <div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
              {c.status === "active" ? "نشطة" : "متوقفة"}
            </span>
          </div>
          <button
            onClick={async () => { if (confirm("حذف الحملة؟")) { await del.mutateAsync(c.id); toast.success("تم الحذف"); } }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
          ><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
    </div>
  );
}

function NewCampaignDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", channel: "email", status: "active", reach: 0, orders: 0, revenue: 0 });
  const create = useCreateCampaign();
  const submit = async () => {
    if (!form.name.trim()) return toast.error("اسم الحملة مطلوب");
    try {
      await create.mutateAsync(form);
      toast.success("تم إنشاء الحملة");
      setOpen(false);
      setForm({ name: "", channel: "email", status: "active", reach: 0, orders: 0, revenue: 0 });
    } catch (e) { toast.error((e as Error).message); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-xl brand-gradient text-white px-4 py-2 text-sm font-medium shadow-brand">
          <Plus className="h-4 w-4" /> حملة جديدة
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>حملة تسويقية جديدة</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>اسم الحملة</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>القناة</Label>
              <Select value={form.channel} onValueChange={v => setForm({ ...form, channel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">بريد إلكتروني</SelectItem>
                  <SelectItem value="whatsapp">واتساب</SelectItem>
                  <SelectItem value="facebook">فيسبوك</SelectItem>
                  <SelectItem value="instagram">إنستجرام</SelectItem>
                  <SelectItem value="google">جوجل</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشطة</SelectItem>
                  <SelectItem value="paused">متوقفة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>الوصول</Label><Input type="number" value={form.reach} onChange={e => setForm({ ...form, reach: Number(e.target.value) })} /></div>
            <div><Label>الطلبات</Label><Input type="number" value={form.orders} onChange={e => setForm({ ...form, orders: Number(e.target.value) })} /></div>
            <div><Label>الإيراد</Label><Input type="number" value={form.revenue} onChange={e => setForm({ ...form, revenue: Number(e.target.value) })} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button onClick={submit} disabled={create.isPending}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewCouponDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", discount_type: "percent" as "percent" | "fixed", discount_value: 10, cap: 100 });
  const create = useCreateCoupon();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-brand-600 hover:underline">+ إضافة</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>كود خصم جديد</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>الكود</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER25" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>نوع الخصم</Label>
              <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v as "percent" | "fixed" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">نسبة %</SelectItem>
                  <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>القيمة</Label><Input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })} /></div>
          </div>
          <div><Label>حد الاستخدام</Label><Input type="number" value={form.cap} onChange={e => setForm({ ...form, cap: Number(e.target.value) })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button onClick={async () => {
            if (!form.code.trim()) return toast.error("الكود مطلوب");
            try { await create.mutateAsync(form); toast.success("تم"); setOpen(false); setForm({ code: "", discount_type: "percent", discount_value: 10, cap: 100 }); }
            catch (e) { toast.error((e as Error).message); }
          }} disabled={create.isPending}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CouponRow({ c, copied, onCopy }: { c: import("@/lib/db").Coupon; copied: string | null; onCopy: (s: string) => void }) {
  const del = useDeleteCoupon();
  const pct = Math.min(100, c.cap > 0 ? (c.uses / c.cap) * 100 : 0);
  return (
    <div className="rounded-xl border border-border p-3 hover:border-brand-500/40 transition group">
      <div className="flex items-center justify-between">
        <code className="font-mono text-sm font-semibold text-brand-600">{c.code}</code>
        <div className="flex items-center gap-1">
          <button onClick={() => onCopy(c.code)} className="text-muted-foreground hover:text-brand-600 p-1">
            {copied === c.code ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={async () => { if (confirm("حذف الكود؟")) { await del.mutateAsync(c.id); toast.success("تم الحذف"); } }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 transition"
          ><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{c.discount_type === "percent" ? `${c.discount_value}%` : formatEGP(Number(c.discount_value))} خصم</span>
        <span>{c.uses}/{c.cap}</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full brand-gradient" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function NewReferralDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", refs_count: 0, earned: 0, tier: "bronze" });
  const create = useCreateReferral();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-brand-600 hover:underline">+ إضافة سفير</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>إضافة سفير</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>الاسم</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>عدد الإحالات</Label><Input type="number" value={form.refs_count} onChange={e => setForm({ ...form, refs_count: Number(e.target.value) })} /></div>
            <div><Label>المكافآت</Label><Input type="number" value={form.earned} onChange={e => setForm({ ...form, earned: Number(e.target.value) })} /></div>
            <div>
              <Label>المستوى</Label>
              <Select value={form.tier} onValueChange={v => setForm({ ...form, tier: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">برونزي</SelectItem>
                  <SelectItem value="silver">فضي</SelectItem>
                  <SelectItem value="gold">ذهبي</SelectItem>
                  <SelectItem value="platinum">بلاتيني</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button onClick={async () => {
            if (!form.name.trim()) return toast.error("الاسم مطلوب");
            try { await create.mutateAsync(form); toast.success("تم"); setOpen(false); setForm({ name: "", refs_count: 0, earned: 0, tier: "bronze" }); }
            catch (e) { toast.error((e as Error).message); }
          }} disabled={create.isPending}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReferralCard({ r, rank }: { r: import("@/lib/db").Referral; rank: number }) {
  const del = useDeleteReferral();
  const medal = ["🥇", "🥈", "🥉"][rank] ?? "⭐";
  const tierLabel: Record<string, string> = { bronze: "برونزي", silver: "فضي", gold: "ذهبي", platinum: "بلاتيني" };
  return (
    <div className="rounded-xl border border-border p-4 group relative">
      <div className="flex items-center justify-between mb-3">
        <div className="text-2xl">{medal}</div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600">{tierLabel[r.tier] ?? r.tier}</span>
      </div>
      <div className="font-medium">{r.name}</div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{r.refs_count} إحالة</span>
        <span className="font-semibold text-success">{formatEGP(Number(r.earned))}</span>
      </div>
      <button
        onClick={async () => { if (confirm("حذف السفير؟")) { await del.mutateAsync(r.id); toast.success("تم الحذف"); } }}
        className="opacity-0 group-hover:opacity-100 absolute top-2 left-2 text-muted-foreground hover:text-destructive transition"
      ><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ElementType; tone: string }) {
  return (
    <div className="surface-elevated p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
