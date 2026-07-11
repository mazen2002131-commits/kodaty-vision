import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Bell, Palette, Shield, Building, KeyRound, Save, Check } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  component: Settings,
  head: () => ({ meta: [{ title: "الإعدادات — Kodaty" }] }),
});

const tabs = [
  { id: "profile", label: "الملف الشخصي", icon: User },
  { id: "workspace", label: "المساحة", icon: Building },
  { id: "notifications", label: "الإشعارات", icon: Bell },
  { id: "appearance", label: "المظهر", icon: Palette },
  { id: "security", label: "الأمان", icon: Shield },
  { id: "api", label: "مفاتيح API", icon: KeyRound },
];

function Settings() {
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState({ full_name: "", email: "" });
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState({
    email_orders: true, email_tickets: true, email_reports: false,
    push_orders: true, push_tickets: true,
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle();
      setProfile({ full_name: p?.full_name || "", email: data.user.email || "" });
    });
  }, []);

  const save = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("profiles").update({ full_name: profile.full_name }).eq("id", data.user.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">الإعدادات</h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة حسابك، الفريق، والتكاملات.</p>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-6">
        <nav className="space-y-1">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${active ? "brand-gradient-soft text-brand-600 font-medium" : "text-muted-foreground hover:bg-surface-soft"}`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="surface-elevated p-6">
          {tab === "profile" && (
            <div className="space-y-5 max-w-lg">
              <h2 className="text-lg font-semibold">الملف الشخصي</h2>
              <Field label="الاسم الكامل">
                <input value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} className="input-base" />
              </Field>
              <Field label="البريد الإلكتروني">
                <input value={profile.email} disabled className="input-base opacity-60" />
              </Field>
              <div className="flex items-center gap-3 pt-2">
                <button onClick={save} className="inline-flex items-center gap-2 rounded-xl brand-gradient text-white px-4 py-2 text-sm font-medium shadow-brand">
                  {saved ? <><Check className="h-4 w-4" /> تم الحفظ</> : <><Save className="h-4 w-4" /> حفظ التغييرات</>}
                </button>
              </div>
            </div>
          )}

          {tab === "workspace" && (
            <div className="space-y-5 max-w-lg">
              <h2 className="text-lg font-semibold">المساحة</h2>
              <Field label="اسم المساحة"><input defaultValue="Kodaty HQ" className="input-base" /></Field>
              <Field label="المنطقة الزمنية">
                <select className="input-base">
                  <option>Africa/Cairo (GMT+2)</option>
                  <option>Asia/Riyadh (GMT+3)</option>
                </select>
              </Field>
              <Field label="العملة الافتراضية">
                <select className="input-base">
                  <option>EGP - جنيه مصري</option>
                </select>
              </Field>
            </div>
          )}

          {tab === "notifications" && (
            <div className="space-y-4 max-w-lg">
              <h2 className="text-lg font-semibold">تفضيلات الإشعارات</h2>
              <div className="space-y-3">
                <Toggle label="البريد: طلبات جديدة" checked={prefs.email_orders} onChange={v => setPrefs({ ...prefs, email_orders: v })} />
                <Toggle label="البريد: تذاكر دعم" checked={prefs.email_tickets} onChange={v => setPrefs({ ...prefs, email_tickets: v })} />
                <Toggle label="البريد: تقارير أسبوعية" checked={prefs.email_reports} onChange={v => setPrefs({ ...prefs, email_reports: v })} />
                <div className="border-t border-border my-2" />
                <Toggle label="Push: طلبات جديدة" checked={prefs.push_orders} onChange={v => setPrefs({ ...prefs, push_orders: v })} />
                <Toggle label="Push: تذاكر دعم" checked={prefs.push_tickets} onChange={v => setPrefs({ ...prefs, push_tickets: v })} />
              </div>
            </div>
          )}

          {tab === "appearance" && (
            <div className="space-y-5 max-w-lg">
              <h2 className="text-lg font-semibold">المظهر</h2>
              <p className="text-sm text-muted-foreground">الوضع الليلي قادم قريباً — النظام حالياً بمظهر فاتح فاخر.</p>
              <div className="grid grid-cols-3 gap-3">
                {["فاتح", "داكن", "تلقائي"].map((m, i) => (
                  <button key={m} className={`rounded-xl border p-4 text-sm ${i === 0 ? "border-brand-500 brand-gradient-soft text-brand-600 font-medium" : "border-border text-muted-foreground"}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "security" && (
            <div className="space-y-5 max-w-lg">
              <h2 className="text-lg font-semibold">الأمان</h2>
              <div className="rounded-xl border border-border p-4">
                <div className="text-sm font-medium">كلمة المرور</div>
                <div className="text-xs text-muted-foreground mt-1">آخر تحديث منذ 3 أشهر</div>
                <button className="mt-3 text-xs text-brand-600 hover:underline">تغيير كلمة المرور</button>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="text-sm font-medium">المصادقة الثنائية</div>
                <div className="text-xs text-muted-foreground mt-1">إضافة طبقة حماية إضافية</div>
                <button className="mt-3 text-xs text-brand-600 hover:underline">تفعيل 2FA</button>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="text-sm font-medium">حماية كلمات المرور المسربة</div>
                <div className="text-xs text-success mt-1 flex items-center gap-1"><Check className="h-3 w-3" /> مفعّلة عبر HIBP</div>
              </div>
            </div>
          )}

          {tab === "api" && (
            <div className="space-y-5 max-w-lg">
              <h2 className="text-lg font-semibold">مفاتيح API</h2>
              <p className="text-sm text-muted-foreground">استخدم هذه المفاتيح لدمج Kodaty مع أدواتك الخارجية.</p>
              <div className="rounded-xl border border-border p-4">
                <div className="text-xs text-muted-foreground">Public Key</div>
                <code className="mt-1 block font-mono text-xs bg-muted rounded p-2">pk_live_kodaty_••••••••••••</code>
              </div>
              <button className="text-sm text-brand-600 hover:underline">توليد مفتاح جديد</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface-soft cursor-pointer">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition ${checked ? "brand-gradient" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "start-5" : "start-0.5"}`} />
      </button>
    </label>
  );
}
