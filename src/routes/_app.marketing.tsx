import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Megaphone, Tag, Users2, TrendingUp, Copy, Check, Plus } from "lucide-react";
import { formatEGP } from "@/lib/db";

export const Route = createFileRoute("/_app/marketing")({
  component: Marketing,
  head: () => ({ meta: [{ title: "التسويق — Kodaty" }] }),
});

const campaigns = [
  { name: "عرض نهاية العام", channel: "واتساب", reach: 1240, orders: 87, revenue: 42350, status: "نشطة" },
  { name: "خصم Adobe للطلاب", channel: "فيسبوك", reach: 3420, orders: 156, revenue: 62800, status: "نشطة" },
  { name: "حزمة أوفيس Family", channel: "إنستقرام", reach: 890, orders: 41, revenue: 18700, status: "منتهية" },
  { name: "تخفيضات Streaming", channel: "تيك توك", reach: 2100, orders: 98, revenue: 24600, status: "نشطة" },
];

const coupons = [
  { code: "WELCOME10", discount: "10%", uses: 234, cap: 500, expires: "2026-12-31" },
  { code: "STUDENT25", discount: "25%", uses: 89, cap: 200, expires: "2026-08-15" },
  { code: "VIP50", discount: "50 ج.م", uses: 42, cap: 100, expires: "2026-07-30" },
  { code: "SUMMER15", discount: "15%", uses: 178, cap: 300, expires: "2026-09-01" },
];

const referrals = [
  { name: "أحمد المصري", refs: 12, earned: 1200, tier: "ذهبي" },
  { name: "سارة عبدالله", refs: 8, earned: 800, tier: "فضي" },
  { name: "محمد فؤاد", refs: 5, earned: 500, tier: "فضي" },
];

function Marketing() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const totalReach = campaigns.reduce((s, c) => s + c.reach, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const activeCampaigns = campaigns.filter(c => c.status === "نشطة").length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">التسويق</h1>
          <p className="text-sm text-muted-foreground mt-1">الحملات، أكواد الخصم، ونظام الإحالة.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl brand-gradient text-white px-4 py-2 text-sm font-medium shadow-brand">
          <Plus className="h-4 w-4" /> حملة جديدة
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="حملات نشطة" value={String(activeCampaigns)} icon={Megaphone} tone="text-brand-600" />
        <Kpi label="إجمالي الوصول" value={totalReach.toLocaleString("ar-EG")} icon={Users2} tone="text-info" />
        <Kpi label="إيراد الحملات" value={formatEGP(totalRevenue)} icon={TrendingUp} tone="text-success" />
        <Kpi label="أكواد نشطة" value={String(coupons.length)} icon={Tag} tone="text-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-elevated lg:col-span-2 overflow-hidden">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-sm font-medium">الحملات</h3>
          </div>
          <div className="grid grid-cols-[1fr_90px_80px_90px_120px_80px] gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-muted-foreground">
            <div>الاسم</div>
            <div>القناة</div>
            <div className="text-center">وصول</div>
            <div className="text-center">طلبات</div>
            <div className="text-center">إيراد</div>
            <div>الحالة</div>
          </div>
          {campaigns.map(c => (
            <div key={c.name} className="grid grid-cols-[1fr_90px_80px_90px_120px_80px] gap-4 border-b border-border/60 px-5 py-3.5 items-center text-sm hover:bg-surface-soft transition">
              <div className="font-medium">{c.name}</div>
              <div className="text-muted-foreground text-xs">{c.channel}</div>
              <div className="text-center font-mono text-xs">{c.reach.toLocaleString("ar-EG")}</div>
              <div className="text-center font-mono text-xs">{c.orders}</div>
              <div className="text-center font-mono text-xs">{formatEGP(c.revenue)}</div>
              <div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "نشطة" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="surface-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">أكواد الخصم</h3>
            <button className="text-xs text-brand-600 hover:underline">إضافة</button>
          </div>
          <div className="space-y-2">
            {coupons.map(c => (
              <div key={c.code} className="rounded-xl border border-border p-3 hover:border-brand-500/40 transition">
                <div className="flex items-center justify-between">
                  <code className="font-mono text-sm font-semibold text-brand-600">{c.code}</code>
                  <button onClick={() => copy(c.code)} className="text-muted-foreground hover:text-brand-600">
                    {copied === c.code ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.discount} خصم</span>
                  <span>{c.uses}/{c.cap}</span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full brand-gradient" style={{ width: `${(c.uses / c.cap) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="surface-elevated p-5">
        <h3 className="text-sm font-medium mb-4">نظام الإحالة — أفضل السفراء</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {referrals.map((r, i) => (
            <div key={r.name} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-2xl">{["🥇", "🥈", "🥉"][i]}</div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600">{r.tier}</span>
              </div>
              <div className="font-medium">{r.name}</div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{r.refs} إحالة</span>
                <span className="font-semibold text-success">{formatEGP(r.earned)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
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
