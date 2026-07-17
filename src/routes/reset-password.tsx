import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import kodatyLogo from "@/assets/kodaty-logo.png.asset.json";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "إعادة تعيين كلمة المرور — Kodaty" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase handles the recovery token in the URL hash automatically
    // and fires a PASSWORD_RECOVERY event. We just wait for a session.
    const sub = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        setReady(true);
      }
    });

    // Fallback: check existing session (covers refresh after link opened)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else {
        // Give the auth listener a moment to catch the recovery token
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: d2 }) => {
            if (!d2.session) setInvalidLink(true);
          });
        }, 1200);
      }
    });

    return () => { sub.data.subscription.unsubscribe(); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("كلمة المرور يجب ألا تقل عن 8 أحرف."); return; }
    if (password !== confirm) { setError("كلمتا المرور غير متطابقتين."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      // Sign out so user re-enters with the new password
      await supabase.auth.signOut();
      setTimeout(() => navigate({ to: "/auth" }), 1800);
    } catch (err: any) {
      setError(err?.message ?? "تعذّر تحديث كلمة المرور");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" className="grid min-h-dvh place-items-center bg-surface-sunken p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 shadow-brand">
        <div className="mb-6 flex items-center gap-2 text-lg font-semibold">
          <span className="grid size-9 place-items-center rounded-lg bg-white p-1 ring-1 ring-border">
            <img src={kodatyLogo.url} alt="Kodaty" className="h-full w-full object-contain" />
          </span>
          Kodaty
        </div>

        <div className="mb-5 flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 size-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">تعيين كلمة مرور جديدة</h1>
            <p className="mt-1 text-xs text-muted-foreground">اختر كلمة مرور قوية لا تقل عن 8 أحرف.</p>
          </div>
        </div>

        {invalidLink && !ready && (
          <div className="rounded-md bg-red-50 px-3 py-3 text-xs text-red-700">
            الرابط غير صالح أو انتهت صلاحيته. اطلب رابطاً جديداً من صفحة تسجيل الدخول.
            <button
              type="button"
              onClick={() => navigate({ to: "/auth" })}
              className="mt-2 block font-medium underline"
            >
              العودة لتسجيل الدخول
            </button>
          </div>
        )}

        {!ready && !invalidLink && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> جاري التحقّق من الرابط…
          </div>
        )}

        {ready && !done && (
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium">كلمة المرور الجديدة</span>
              <input
                type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                className="input" placeholder="••••••••" dir="ltr" autoFocus
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium">تأكيد كلمة المرور</span>
              <input
                type="password" required minLength={8} value={confirm} onChange={e => setConfirm(e.target.value)}
                className="input" placeholder="••••••••" dir="ltr"
              />
            </label>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

            <button
              type="submit" disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:opacity-95 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              حفظ كلمة المرور الجديدة
            </button>
          </form>
        )}

        {done && (
          <div className="flex items-start gap-2 rounded-md bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 size-4" />
            <div>
              تم تحديث كلمة المرور بنجاح. سيتم تحويلك لتسجيل الدخول…
            </div>
          </div>
        )}
      </div>

      <style>{`.input{width:100%;border-radius:.5rem;border:1px solid hsl(var(--border));background:white;padding:.55rem .75rem;font-size:.875rem;outline:none;transition:box-shadow .15s,border-color .15s}.input:focus{border-color:hsl(var(--primary));box-shadow:0 0 0 3px color-mix(in oklab, hsl(var(--primary)) 20%, transparent)}`}</style>
    </div>
  );
}
