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
    { to: "/team", label: "الفريق والصلاحيات", icon: ShieldCheck, adminOnly: true },
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
        collapsed ? "w-[68px]" : "w-[248px]",
      )}
      style={{ minHeight: "100dvh" }}
    >
      <div className="sticky top-0 flex h-dvh flex-col">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 pt-5 pb-5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl brand-gradient shadow-sm">
            <span className="font-display text-[15px] font-bold text-white">K</span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold text-foreground">Kodaty</div>
              <div className="truncate text-[10.5px] text-muted-foreground">مساحة العمل</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(v => !v)}
            className="rounded-md p-1 text-muted-foreground/70 hover:bg-sidebar-accent/60 hover:text-foreground"
            aria-label="طي القائمة"
          >
            <ChevronsLeft className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 pb-4">
          {nav.map(group => (
            <div key={group.section} className="mb-5">
              {!collapsed && (
                <div className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
                  {group.section}
                </div>
              )}
              <ul className="space-y-px">
                {group.items.map(item => {
                  const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors",
                          active
                            ? "text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-foreground",
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidebar-active-bg"
                            className="absolute inset-0 rounded-lg bg-sidebar-accent"
                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                          />
                        )}
                        <Icon className={cn("relative z-10 h-[16px] w-[16px] shrink-0", active && "text-sidebar-primary")} />
                        {!collapsed && <span className="relative z-10 flex-1 truncate">{item.label}</span>}
                        {!collapsed && "badge" in item && item.badge ? (
                          <span className="relative z-10 rounded-md bg-sidebar-primary/12 px-1.5 py-0.5 text-[10px] font-medium text-sidebar-primary num">
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

        {/* Assistant CTA */}
        {!collapsed && (
          <div className="m-2.5 rounded-xl border border-sidebar-border bg-surface p-3">
            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> Kodaty AI
            </div>
            <div className="mt-1 text-[12.5px] font-medium leading-snug text-foreground">
              اسأل عن أرباحك أو عملائك في ثوانٍ.
            </div>
            <Link
              to="/assistant"
              className="mt-2.5 block w-full rounded-md bg-primary px-3 py-1.5 text-center text-[11.5px] font-medium text-primary-foreground transition hover:opacity-90"
            >
              افتح المساعد
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
