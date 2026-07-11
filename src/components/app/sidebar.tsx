import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ShoppingCart, RefreshCw, Users, Package, KeyRound,
  Boxes, Wallet, FileBarChart, LineChart, Megaphone, LifeBuoy,
  CheckSquare, Zap, Bell, Settings, ChevronsLeft, ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useRole } from "@/lib/roles";

type NavItem = { to: string; label: string; icon: any; badge?: number; adminOnly?: boolean };

const NAV: { section: string; items: NavItem[] }[] = [
  { section: "المساحة", items: [
    { to: "/", label: "الرئيسية", icon: LayoutDashboard },
    { to: "/orders", label: "الطلبات", icon: ShoppingCart },
    { to: "/subscriptions", label: "الاشتراكات", icon: RefreshCw },
    { to: "/customers", label: "العملاء", icon: Users },
  ]},
  { section: "الكتالوج", items: [
    { to: "/products", label: "المنتجات", icon: Package },
    { to: "/licenses", label: "التراخيص والمفاتيح", icon: KeyRound },
    { to: "/inventory", label: "المخزون", icon: Boxes },
  ]},
  { section: "الأعمال", items: [
    { to: "/finance", label: "المالية والمحاسبة", icon: Wallet, adminOnly: true },
    { to: "/reports", label: "التقارير", icon: FileBarChart, adminOnly: true },
    { to: "/analytics", label: "الإحصائيات", icon: LineChart, adminOnly: true },
    { to: "/marketing", label: "التسويق", icon: Megaphone, adminOnly: true },
  ]},
  { section: "العمليات", items: [
    { to: "/support", label: "الدعم الفني", icon: LifeBuoy },
    { to: "/tasks", label: "المهام", icon: CheckSquare },
    { to: "/automation", label: "الأتمتة", icon: Zap, adminOnly: true },
    { to: "/notifications", label: "الإشعارات", icon: Bell },
    { to: "/settings", label: "الإعدادات", icon: Settings, adminOnly: true },
  ]},
];

export function AppSidebar() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin } = useRole();
  const nav = NAV
    .map(g => ({ ...g, items: g.items.filter(i => !i.adminOnly || isAdmin) }))
    .filter(g => g.items.length > 0);

  return (
    <aside
      className={cn(
        "shrink-0 border-s border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300",
        collapsed ? "w-[72px]" : "w-[264px]",
      )}
      style={{ minHeight: "100dvh" }}
    >
      <div className="sticky top-0 flex h-full flex-col">
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl brand-gradient shadow-brand">
            <span className="font-display text-lg font-bold text-white">K</span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">Kodaty</div>
              <div className="truncate text-[11px] text-sidebar-foreground/60">مساحة العمل الرئيسية</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(v => !v)}
            className="rounded-md p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-white"
            aria-label="طي القائمة"
          >
            <ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {nav.map(group => (
            <div key={group.section} className="mb-4">
              {!collapsed && (
                <div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/40">
                  {group.section}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map(item => {
                  const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                          active
                            ? "text-white"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white",
                        )}
                      >
                        {active && (
                          <>
                            <motion.span
                              layoutId="sidebar-active-bg"
                              className="absolute inset-0 rounded-lg bg-sidebar-accent"
                              transition={{ type: "spring", stiffness: 500, damping: 40 }}
                            />
                            <motion.span
                              layoutId="sidebar-active-bar"
                              className="absolute inset-y-1 end-0 w-0.5 rounded-full bg-sidebar-primary"
                              transition={{ type: "spring", stiffness: 500, damping: 40 }}
                            />
                          </>
                        )}
                        <Icon className={cn("relative z-10 h-[18px] w-[18px] shrink-0", active ? "text-sidebar-primary" : "")} />
                        {!collapsed && <span className="relative z-10 flex-1 truncate">{item.label}</span>}
                        {!collapsed && "badge" in item && item.badge ? (
                          <span className="relative z-10 rounded-md bg-sidebar-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-sidebar-primary num">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Upgrade card */}
        {!collapsed && (
          <div className="m-3 rounded-xl border border-sidebar-border brand-gradient p-4 text-white shadow-brand">
            <div className="text-xs opacity-80">مساعد Kodaty AI</div>
            <div className="mt-1 text-sm font-semibold">اسأل عن أرباحك، عملائك، أو تجديداتك.</div>
            <Link to="/assistant" className="mt-3 block w-full rounded-lg bg-white/15 px-3 py-1.5 text-center text-xs font-medium backdrop-blur transition hover:bg-white/25">
              افتح المساعد
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
