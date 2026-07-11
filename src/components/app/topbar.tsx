import { Bell, Search, Plus, LogOut, User as UserIcon, Sun, Moon, Keyboard, Shield } from "lucide-react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { notifications, relativeTime } from "@/lib/mock/data";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/roles";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface TopbarProps { onOpenPalette: () => void; onOpenShortcuts: () => void }

const CRUMBS: Record<string, string> = {
  "/": "الرئيسية", "/orders": "الطلبات", "/customers": "العملاء",
  "/subscriptions": "الاشتراكات", "/products": "المنتجات",
  "/licenses": "التراخيص والمفاتيح", "/inventory": "المخزون",
  "/finance": "المالية", "/reports": "التقارير", "/analytics": "الإحصائيات",
  "/marketing": "التسويق", "/support": "الدعم الفني", "/tasks": "المهام",
  "/automation": "الأتمتة", "/notifications": "الإشعارات", "/settings": "الإعدادات",
};

export function Topbar({ onOpenPalette, onOpenShortcuts }: TopbarProps) {
  const pathname = useRouterState({ select: s => s.location.pathname });
  const base = "/" + (pathname.split("/")[1] || "");
  const crumb = CRUMBS[base] || "Kodaty";
  const navigate = useNavigate();
  const { resolved, toggle } = useTheme();
  const { role, isAdmin } = useRole();
  const [profile, setProfile] = useState<{ name: string; email: string; initial: string }>({ name: "…", email: "", initial: "؟" });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      if (!u) return;
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", u.id).maybeSingle();
      const name = prof?.full_name || u.email?.split("@")[0] || "المستخدم";
      setProfile({ name, email: u.email ?? "", initial: name.slice(0, 1).toUpperCase() });
    });
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };


  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Kodaty</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-medium">{crumb}</span>
        </div>

        <div className="ms-auto flex items-center gap-2">
          <button
            onClick={onOpenPalette}
            className="group hidden items-center gap-2 rounded-lg border border-border bg-surface-sunken px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground md:flex md:w-80"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-start">ابحث في كل شيء…</span>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ⌘ K
            </kbd>
          </button>

          <button
            onClick={onOpenPalette}
            className="md:hidden rounded-lg border border-border bg-surface-sunken p-2 text-muted-foreground"
            aria-label="بحث"
          >
            <Search className="h-4 w-4" />
          </button>

          <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-brand transition hover:opacity-90">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">طلب جديد</span>
          </button>

          <button
            onClick={toggle}
            className="rounded-lg border border-border bg-surface-sunken p-2 text-muted-foreground transition hover:text-foreground"
            aria-label="تبديل الوضع الليلي"
            title="تبديل الوضع (⌘\\)"
          >
            {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            onClick={onOpenShortcuts}
            className="hidden rounded-lg border border-border bg-surface-sunken p-2 text-muted-foreground transition hover:text-foreground sm:inline-flex"
            aria-label="اختصارات لوحة المفاتيح"
            title="اختصارات (?)"
          >
            <Keyboard className="h-4 w-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="relative rounded-lg border border-border bg-surface-sunken p-2 text-muted-foreground transition hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-0">
              <div className="flex items-center justify-between border-b border-border p-3">
                <div className="text-sm font-semibold">الإشعارات</div>
                <button className="text-xs text-primary hover:underline">تحديد الكل كمقروء</button>
              </div>
              <ul className="max-h-96 overflow-y-auto">
                {notifications.map(n => (
                  <li key={n.id} className="border-b border-border/60 p-3 last:border-b-0 hover:bg-accent/40">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{n.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{n.body}</div>
                        <div className="mt-1 text-[10px] text-muted-foreground/70">{relativeTime(n.at)}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="ms-1 flex items-center gap-2 rounded-lg border border-border bg-surface-sunken py-1 ps-2 pe-1 transition hover:border-border-strong">
              <div className="text-end">
                <div className="text-xs font-medium leading-tight">{profile.name}</div>
                <div className="text-[10px] leading-tight text-muted-foreground">مساحة العمل</div>
              </div>
              <div className="grid h-7 w-7 place-items-center rounded-md brand-gradient text-xs font-semibold text-white">
                {profile.initial}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="text-sm font-medium">{profile.name}</div>
                <div className="truncate text-xs text-muted-foreground" dir="ltr">{profile.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                <UserIcon className="me-2 h-4 w-4" /> الإعدادات
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-600">
                <LogOut className="me-2 h-4 w-4" /> تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
