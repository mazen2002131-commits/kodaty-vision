import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ShoppingCart, RefreshCw, Users, Package, KeyRound,
  Boxes, Wallet, FileBarChart, LineChart, Megaphone, LifeBuoy,
  CheckSquare, Zap, Bell, Settings, ChevronsLeft, ShieldCheck, Sparkles,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useRole } from "@/lib/roles";
import type { PermissionKey } from "@/lib/permissions";
import kodatyLogo from "@/assets/kodaty-logo.png.asset.json";

type NavItem = { to: string; label: string; icon: any; badge?: number; perm: PermissionKey; adminOnly?: boolean; kbd?: string };

const NAV: { section: string; items: NavItem[] }[] = [
  { section: "المساحة", items: [
    { to: "/", label: "الرئيسية", icon: LayoutDashboard, perm: "dashboard", kbd: "D" },
    { to: "/orders", label: "الطلبات", icon: ShoppingCart, perm: "orders", kbd: "O" },
    { to: "/subscriptions", label: "الاشتراكات", icon: RefreshCw, perm: "subscriptions", kbd: "S" },
    { to: "/customers", label: "العملاء", icon: Users, perm: "customers", kbd: "C" },
  ]},
  { section: "الكتالوج", items: [
    { to: "/products", label: "المنتجات", icon: Package, perm: "products", kbd: "P" },
    { to: "/licenses", label: "التراخيص والمفاتيح", icon: KeyRound, perm: "licenses", kbd: "L" },
    { to: "/inventory", label: "المخزون", icon: Boxes, perm: "inventory", kbd: "I" },
  ]},
  { section: "الأعمال", items: [
    { to: "/finance", label: "المالية والمحاسبة", icon: Wallet, perm: "finance", kbd: "F" },
    { to: "/reports", label: "التقارير", icon: FileBarChart, perm: "reports", kbd: "R" },
    { to: "/analytics", label: "الإحصائيات", icon: LineChart, perm: "analytics", kbd: "A" },
    { to: "/marketing", label: "التسويق", icon: Megaphone, perm: "marketing", kbd: "M" },
  ]},
  { section: "العمليات", items: [
    { to: "/support", label: "الدعم الفني", icon: LifeBuoy, perm: "support", kbd: "T" },
    { to: "/tasks", label: "المهام", icon: CheckSquare, perm: "tasks" },
    { to: "/automation", label: "الأتمتة", icon: Zap, perm: "automation" },
    { to: "/notifications", label: "الإشعارات", icon: Bell, perm: "notifications" },
    { to: "/team", label: "الفريق والصلاحيات", icon: ShieldCheck, perm: "team", adminOnly: true },
    { to: "/settings", label: "الإعدادات", icon: Settings, perm: "settings", adminOnly: true },
  ]},
];

export function AppSidebar() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin, can } = useRole();
  const nav = NAV
    .map(g => ({ ...g, items: g.items.filter(i => (i.adminOnly ? isAdmin : can(i.perm))) }))
    .filter(g => g.items.length > 0);

  return (
    <aside
      className={cn(
        "relative shrink-0 border-s border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300",
        collapsed ? "w-[64px]" : "w-[248px]",
      )}
      style={{ minHeight: "100dvh" }}
    >
      {/* Ambient royal glow */}
      <div className="pointer-events-none absolute inset-0 grid-dots opacity-60" />
      <div className="pointer-events-none absolute -top-24 start-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[oklch(0.53_0.235_296/0.28)] blur-3xl" />

      <div className="sticky top-0 flex h-dvh flex-col">
        {/* Brand */}
        <div className={cn("relative flex items-center gap-2.5 px-3.5 pt-4 pb-4", collapsed && "justify-center px-2")}>
          <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white shadow-[0_0_0_1px_oklch(1_0_0/0.1),0_8px_24px_-8px_oklch(0.53_0.235_296/0.6)]">
            <img src={kodatyLogo.url} alt="Kodaty" className="h-7 w-7 object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[15px] font-semibold text-white tracking-tight">Kodaty</div>
              <div className="truncate text-[10.5px] text-sidebar-muted">مساحة العمل</div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="rounded-md p-1 text-sidebar-muted transition hover:bg-white/5 hover:text-white"
              aria-label="طي القائمة"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto mb-2 rounded-md p-1 text-sidebar-muted transition hover:bg-white/5 hover:text-white"
            aria-label="فتح القائمة"
          >
            <ChevronsLeft className="h-3.5 w-3.5 rotate-180" />
          </button>
        )}

        <nav className={cn("relative flex-1 overflow-y-auto pb-4", collapsed ? "px-2" : "px-2.5")}>
          {nav.map(group => (
            <div key={group.section} className="mb-4">
              {!collapsed && (
                <div className="mb-1 px-2.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted/80">
                  {group.section}
                </div>
              )}
              <ul className="space-y-[2px]">
                {group.items.map(item => {
                  const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-md py-[7px] text-[13px] transition-colors",
                          collapsed ? "justify-center px-2" : "px-2.5",
                          active
                            ? "text-white"
                            : "text-sidebar-foreground/75 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidebar-active-bg"
                            className="absolute inset-0 rounded-md bg-white/[0.08] shadow-[inset_0_1px_0_0_oklch(1_0_0/0.05)]"
                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                          />
                        )}
                        {active && !collapsed && (
                          <motion.span
                            layoutId="sidebar-active-rail"
                            className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-sidebar-primary shadow-[0_0_12px_oklch(0.80_0.13_296/0.7)]"
                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                          />
                        )}
                        <Icon className={cn(
                          "relative z-10 h-[16px] w-[16px] shrink-0 transition-colors",
                          active ? "text-sidebar-primary" : "text-sidebar-muted group-hover:text-white",
                        )} />
                        {!collapsed && (
                          <>
                            <span className="relative z-10 flex-1 truncate">{item.label}</span>
                            {item.kbd && (
                              <span className={cn(
                                "relative z-10 hidden rounded border px-1 font-mono text-[9.5px] transition group-hover:inline-flex",
                                active
                                  ? "border-white/15 bg-white/5 text-sidebar-foreground/80"
                                  : "border-white/10 bg-white/[0.03] text-sidebar-muted",
                              )}>
                                G {item.kbd}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Assistant CTA */}
        {!collapsed && (
          <div className="relative mx-2.5 mb-3 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-3">
            <div className="pointer-events-none absolute -top-8 -end-8 h-24 w-24 rounded-full bg-[oklch(0.80_0.13_296/0.35)] blur-2xl" />
            <div className="relative flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-primary">
              <Sparkles className="h-3 w-3" /> Kodaty AI
            </div>
            <div className="relative mt-1 text-[12.5px] font-medium leading-snug text-white">
              اسأل عن أرباحك أو عملائك في ثوانٍ.
            </div>
            <Link
              to="/assistant"
              className="relative mt-2.5 block w-full rounded-md bg-white/95 px-3 py-1.5 text-center text-[11.5px] font-semibold text-brand-800 transition hover:bg-white"
            >
              افتح المساعد
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
