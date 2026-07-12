import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Bell, Palette, Shield, Building, KeyRound, Save, Check, Camera, Loader2, Eye, EyeOff } from "lucide-react";
import { useRole } from "@/lib/roles";

export const Route = createFileRoute("/_app/settings")({
  component: Settings,
  head: () => ({ meta: [{ title: "الإعدادات — Kodaty" }] }),
});

const ALL_TABS = [
  { id: "profile", label: "الملف الشخصي", icon: User, adminOnly: false },
  { id: "security", label: "الأمان", icon: Shield, adminOnly: false },
  { id: "notifications", label: "الإشعارات", icon: Bell, adminOnly: false },
  { id: "appearance", label: "المظهر", icon: Palette, adminOnly: false },
  { id: "workspace", label: "المساحة", icon: Building, adminOnly: true },
  { id: "api", label: "مفاتيح API", icon: KeyRound, adminOnly: true },
];

function Settings() {
  const { isAdmin } = useRole();
  const tabs = useMemo(() => ALL_TABS.filter(t => isAdmin || !t.adminOnly), [isAdmin]);
  const [tab, setTab] = useState("profile");
  const [userId, setUserId] = useState<string>("");
  const [profile, setProfile] = useState({ full_name: "", email: "", avatar_url: "" as string | null });
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [prefs, setPrefs] = useState({
    email_orders: true, email_tickets: true, email_reports: false,
    push_orders: true, push_tickets: true,
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      const { data: p } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", data.user.id).maybeSingle();
      setProfile({ full_name: p?.full_name || "", email: data.user.email || "", avatar_url: p?.avatar_url ?? null });
    });
  }, []);

  const save = async () => {
    if (!userId) return;
    await supabase.from("profiles").update({ full_name: profile.full_name }).eq("id", userId);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;
    setAvatarError("");
    if (!file.type.startsWith("image/")) { setAvatarError("الملف يجب أن يكون صورة"); return; }
    if (file.size > 3 * 1024 * 1024) { setAvatarError("حجم الصورة يجب ألا يتجاوز 3MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
      if (sErr) throw sErr;
      const url = signed.signedUrl;
      const { error: pErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
      if (pErr) throw pErr;
      setProfile(p => ({ ...p, avatar_url: url }));
    } catch (err: any) {
      setAvatarError(err.message || "فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!userId) return;
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
    setProfile(p => ({ ...p, avatar_url: null }));
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
            <div className="space-y-6 max-w-lg">
              <h2 className="text-lg font-semibold">الملف الشخصي</h2>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden brand-gradient grid place-items-center text-white text-2xl font-semibold shadow-brand">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      (profile.full_name || profile.email || "?").slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onPickFile}
                    disabled={uploading}
                    className="absolute -bottom-1 -end-1 h-7 w-7 rounded-full bg-background border border-border grid place-items-center shadow hover:bg-accent transition"
                    aria-label="تغيير الصورة"
                  >
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={onPickFile} disabled={uploading} className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent">
                      {uploading ? "جارِ الرفع…" : "رفع صورة"}
                    </button>
                    {profile.avatar_url && (
                      <button type="button" onClick={removeAvatar} className="text-xs px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                        إزالة
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">PNG أو JPG، حتى 3MB.</div>
                  {avatarError && <div className="text-[11px] text-red-600">{avatarError}</div>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileChange} />
              </div>

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
              <p className="text-sm text-muted-foreground">استخدم زر القمر/الشمس في الأعلى لتبديل الوضع.</p>
            </div>
          )}

          {tab === "security" && <SecurityTab />}

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

function SecurityTab() {
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const submit = async () => {
    setMsg(null);
    if (pw.length < 8) { setMsg({ type: "err", text: "كلمة المرور يجب ألا تقل عن 8 أحرف" }); return; }
    if (pw !== pw2) { setMsg({ type: "err", text: "كلمتا المرور غير متطابقتين" }); return; }
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const email = u.user?.email;
      if (!email) throw new Error("لا يوجد مستخدم");
      // Re-verify current password
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password: cur });
      if (signErr) throw new Error("كلمة المرور الحالية غير صحيحة");
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setMsg({ type: "ok", text: "تم تحديث كلمة المرور بنجاح" });
      setCur(""); setPw(""); setPw2("");
    } catch (e: any) {
      setMsg({ type: "err", text: e.message || "فشل تحديث كلمة المرور" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 max-w-lg">
      <h2 className="text-lg font-semibold">الأمان</h2>
      <div className="rounded-xl border border-border p-4 space-y-4">
        <div>
          <div className="text-sm font-medium">تغيير كلمة المرور</div>
          <div className="text-xs text-muted-foreground mt-1">أدخل كلمة المرور الحالية ثم كلمة المرور الجديدة.</div>
        </div>
        <Field label="كلمة المرور الحالية">
          <div className="relative">
            <input type={show ? "text" : "password"} value={cur} onChange={e => setCur(e.target.value)} className="input-base pe-10" autoComplete="current-password" />
            <button type="button" onClick={() => setShow(s => !s)} className="absolute inset-y-0 end-2 grid place-items-center text-muted-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="كلمة المرور الجديدة">
          <input type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} className="input-base" autoComplete="new-password" />
        </Field>
        <Field label="تأكيد كلمة المرور الجديدة">
          <input type={show ? "text" : "password"} value={pw2} onChange={e => setPw2(e.target.value)} className="input-base" autoComplete="new-password" />
        </Field>
        {msg && (
          <div className={`text-xs rounded-lg px-3 py-2 ${msg.type === "ok" ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"}`}>
            {msg.text}
          </div>
        )}
        <button onClick={submit} disabled={busy} className="inline-flex items-center gap-2 rounded-xl brand-gradient text-white px-4 py-2 text-sm font-medium shadow-brand disabled:opacity-60">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحديث…</> : <><Save className="h-4 w-4" /> تحديث كلمة المرور</>}
        </button>
      </div>

      <div className="rounded-xl border border-border p-4">
        <div className="text-sm font-medium">حماية كلمات المرور المسربة</div>
        <div className="text-xs text-success mt-1 flex items-center gap-1"><Check className="h-3 w-3" /> مفعّلة عبر HIBP</div>
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
