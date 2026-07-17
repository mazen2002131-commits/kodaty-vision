import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Loader2 } from "lucide-react";
import kodatyLogo from "@/assets/kodaty-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "دخول — Kodaty" },
      { name: "description", content: "سجّل الدخول إلى مساحة عمل Kodaty لإدارة مبيعات التراخيص الرقمية." },
      { name: "robots", content: "noindex" },
    ],
  }),
});



function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setInfo(null); setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setInfo("إذا كان البريد مسجّلاً لدينا، فسنرسل رابط إعادة تعيين آمن خلال دقائق. تحقّق من صندوق الوارد ومجلّد الرسائل غير المرغوب فيها.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err: any) {
      setError(err?.message ?? "حدث خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  };


  const google = async () => {
    setError(null); setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) throw result.error;
      if (!result.redirected) navigate({ to: "/" });
    } catch (err: any) {
      setError(err?.message ?? "تعذّر تسجيل الدخول بجوجل");
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" className="grid min-h-dvh grid-cols-1 lg:grid-cols-2 bg-surface-sunken">
      {/* Brand side */}
      <div className="relative hidden overflow-hidden brand-gradient p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <span className="grid size-10 place-items-center rounded-xl bg-white p-1.5"><img src={kodatyLogo.url} alt="Kodaty" className="h-full w-full object-contain" /></span>
            Kodaty
          </div>
          <p className="mt-16 max-w-md text-3xl font-semibold leading-snug">
            منصّة إدارة مبيعات التراخيص الرقمية والاشتراكات — بذوق فاخر.
          </p>
          <p className="mt-4 max-w-md text-sm text-white/80">
            طلبات، عملاء، خزنة مفاتيح، اشتراكات، ومساعد ذكي — كل ما تحتاجه لإدارة أعمالك من مكان واحد.
          </p>
        </div>
        <div className="text-xs text-white/60">© {new Date().getFullYear()} Kodaty</div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <span className="grid size-8 place-items-center rounded-lg bg-white p-1 ring-1 ring-border"><img src={kodatyLogo.url} alt="Kodaty" className="h-full w-full object-contain" /></span>
              Kodaty
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">أهلاً بعودتك</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            سجّل الدخول للوصول إلى مساحتك.
          </p>

          <button
            type="button"
            onClick={google}
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-muted/50 disabled:opacity-60"
          >
            <GoogleIcon />
            متابعة عبر Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> أو <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <Field label="البريد الإلكتروني">
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="you@example.com" dir="ltr"
              />
            </Field>
            <Field label="كلمة المرور">
              <input
                type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                className="input" placeholder="••••••••" dir="ltr"
              />
            </Field>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            {info && <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{info}</p>}

            <button
              type="submit" disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:opacity-95 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              تسجيل الدخول
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            التسجيل الذاتي مغلق. للحصول على حساب تواصل مع مدير المساحة.
          </p>
        </div>
      </div>

      <style>{`.input{width:100%;border-radius:.5rem;border:1px solid hsl(var(--border));background:white;padding:.55rem .75rem;font-size:.875rem;outline:none;transition:box-shadow .15s,border-color .15s}.input:focus{border-color:hsl(var(--primary));box-shadow:0 0 0 3px color-mix(in oklab, hsl(var(--primary)) 20%, transparent)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
