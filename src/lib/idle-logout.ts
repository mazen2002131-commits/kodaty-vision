import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "kodaty:last-activity";
const IDLE_MS = 30 * 60 * 1000; // 30 minutes
const WARN_BEFORE_MS = 60 * 1000; // warn 60s before

/**
 * Signs the user out after IDLE_MS of no activity across any open tab.
 * Uses localStorage as the shared clock so multiple tabs stay in sync.
 */
export function useIdleLogout(enabled: boolean) {
  const navigate = useNavigate();
  const warnedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const now = () => Date.now();
    const readLast = () => Number(localStorage.getItem(STORAGE_KEY)) || now();

    const bump = () => {
      localStorage.setItem(STORAGE_KEY, String(now()));
      warnedRef.current = false;
    };

    // Seed initial activity time
    bump();

    const logout = async () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
        await supabase.auth.signOut();
      } finally {
        toast.error("انتهت الجلسة", { description: "تم تسجيل خروجك تلقائياً بعد 30 دقيقة من عدم النشاط." });
        navigate({ to: "/auth", replace: true });
      }
    };

    const tick = () => {
      const idle = now() - readLast();
      if (idle >= IDLE_MS) {
        logout();
        return;
      }
      if (idle >= IDLE_MS - WARN_BEFORE_MS && !warnedRef.current) {
        warnedRef.current = true;
        toast.warning("ستنتهي جلستك قريباً", {
          description: "حرّك المؤشر أو اضغط أي مفتاح للبقاء متصلاً.",
          duration: 8000,
        });
      }
    };

    // Throttle activity writes to at most 1/sec
    let lastWrite = 0;
    const onActivity = () => {
      const t = now();
      if (t - lastWrite < 1000) return;
      lastWrite = t;
      bump();
    };

    const events: (keyof WindowEventMap)[] = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", onActivity);

    timerRef.current = window.setInterval(tick, 15_000);

    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onActivity);
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [enabled, navigate]);
}
