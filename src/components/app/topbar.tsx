import { Bell, Search, Plus, LogOut, User as UserIcon, Sun, Moon, Keyboard, Shield } from "lucide-react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/roles";
import { useLicenses, useOrders, useSubscriptions, useTickets } from "@/lib/db";
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
  const { data: orders = [] } = useOrders();
  const { data: tickets = [] } = useTickets();
  const { data: subscriptions = [] } = useSubscriptions();
  const { data: licenses = [] } = useLicenses();

  const notifications = [
    ...orders.filter(o => o.status === "pending").slice(0, 3).map(o => ({
      id: `order-${o.id}`,
      title: "طلب جديد بانتظار المعالجة",
      body: `${o.code} — ${o.customers?.name || "عميل"}`,
      at: o.created_at,
    })),
    ...tickets.filter(t => t.status === "open").slice(0, 3).map(t => ({
      id: `ticket-${t.id}`,
      title: "تذكرة دعم مفتوحة",
      body: t.subject,
      at: t.created_at,
    })),
    ...subscriptions.filter(s => daysUntil(s.ends_at) <= 7 && daysUntil(s.ends_at) >= 0).slice(0, 3).map(s => ({
      id: `sub-${s.id}`,
      title: "اشتراك يقترب من الانتهاء",
      body: `${s.product_name} — ${s.customers?.name || "عميل"}`,
      at: s.ends_at,
    })),
    ...licenses.filter(l => l.status === "available").slice(0, 2).map(l => ({
      id: `license-${l.id}`,
      title: "مفتاح متاح في الخزنة",
      body: l.product_name,
      at: l.created_at,
    })),
  ];

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
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-5">
        <div className="flex items-center gap-2 text-[12.5px]">
          <span className="rounded-md bg-accent px-1.5 py-0.5 font-display text-[11px] font-semibold uppercase tracking-wider text-accent-foreground">
            Kodaty
          </span>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-medium text-foreground">{crumb}</span>
        </div>

        <div className="ms-auto flex items-center gap-1.5">
          <button
            onClick={onOpenPalette}
            className="group hidden items-center gap-2 rounded-lg border border-border bg-surface/70 px-3 py-1.5 text-[13px] text-muted-foreground transition-all hover:border-border-strong hover:bg-surface hover:shadow-sm md:flex md:w-[340px]"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-start">ابحث في كل شيء…</span>
            <span className="kbd">⌘</span>
            <span className="kbd">K</span>
          </button>

          <button
            onClick={onOpenPalette}
            className="md:hidden rounded-lg border border-border p-2 text-muted-foreground"
            aria-label="بحث"
          >
            <Search className="h-4 w-4" />
          </button>

          <button
            onClick={() => navigate({ to: "/orders", search: { new: 1 } as never })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground shadow-brand transition hover:opacity-95 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">طلب جديد</span>
          </button>

          <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

          <button
            onClick={toggle}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="تبديل الوضع الليلي"
            title="تبديل الوضع (⌘\\)"
          >
            {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            onClick={onOpenShortcuts}
            className="hidden rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground sm:inline-flex"
            aria-label="اختصارات لوحة المفاتيح"
            title="اختصارات (?)"
          >
            <Keyboard className="h-4 w-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground">
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute end-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[9px] font-bold text-primary-foreground ring-2 ring-background">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-border p-3">
                <div className="text-sm font-semibold">الإشعارات</div>
                <button className="text-xs text-primary hover:underline">تحديد الكل كمقروء</button>
              </div>
              <ul className="max-h-96 overflow-y-auto">
                {notifications.length === 0 && (
                  <li className="p-6 text-center text-sm text-muted-foreground">لا توجد إشعارات حالياً</li>
                )}
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
            <DropdownMenuTrigger className="ms-1 flex items-center gap-2 rounded-lg py-1 ps-2 pe-1 transition hover:bg-accent">
              <div className="text-end">
                <div className="text-[12px] font-medium leading-tight">{profile.name}</div>
                <div className="flex items-center justify-end gap-1 text-[10px] leading-tight text-muted-foreground">
                  {role && (
                    <span className={`inline-flex items-center gap-0.5 rounded px-1 py-px text-[9px] font-semibold ${isAdmin ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <Shield className="h-2.5 w-2.5" />
                      {isAdmin ? "مدير" : "موظف"}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-800 font-display text-[13px] font-semibold text-white shadow-brand">
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

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.max(1, Math.round(Math.abs(diff) / 60_000));
  if (minutes < 60) return diff < 0 ? `خلال ${minutes} دقيقة` : `منذ ${minutes} دقيقة`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return diff < 0 ? `خلال ${hours} ساعة` : `منذ ${hours} ساعة`;
  const days = Math.round(hours / 24);
  return diff < 0 ? `خلال ${days} يوم` : `منذ ${days} يوم`;
}
