import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppSidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { CommandPalette } from "@/components/app/command-palette";
import { ShortcutsDialog } from "@/components/app/shortcuts-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

type SessionState = "loading" | "authed" | "guest";

const NAV_KEYS: Record<string, string> = {
  d: "/", o: "/orders", c: "/customers", s: "/subscriptions",
  l: "/licenses", f: "/finance", r: "/reports", t: "/support",
  p: "/products", a: "/analytics", m: "/marketing", i: "/inventory",
};

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function AppLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [state, setState] = useState<SessionState>("loading");
  const { toggle: toggleTheme } = useTheme();
  const gPressedAt = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setState(session ? "authed" : "guest");
      if (!session) navigate({ to: "/auth" });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setState(data.session ? "authed" : "guest");
      if (!data.session) navigate({ to: "/auth" });
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // ⌘K — palette
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(v => !v);
        return;
      }
      // ⌘\ — toggle theme
      if (mod && e.key === "\\") {
        e.preventDefault();
        toggleTheme();
        return;
      }

      if (isTypingTarget(e.target)) return;

      // ? — shortcuts
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      // / — focus search (open palette)
      if (e.key === "/") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      // n — new order
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        navigate({ to: "/orders" });
        return;
      }
      // g then <letter>
      const now = Date.now();
      if (e.key.toLowerCase() === "g") {
        gPressedAt.current = now;
        return;
      }
      if (now - gPressedAt.current < 800) {
        const target = NAV_KEYS[e.key.toLowerCase()];
        if (target) {
          e.preventDefault();
          gPressedAt.current = 0;
          navigate({ to: target });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, toggleTheme]);

  if (state !== "authed") {
    return (
      <div className="grid min-h-dvh place-items-center bg-surface-sunken">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full bg-surface-sunken">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onOpenPalette={() => setPaletteOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
        />
        <main className="flex-1 px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
