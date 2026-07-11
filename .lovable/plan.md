though the request is comprehensive, delivering all 16 modules with real depth in one pass would produce shallow screens. I'll build in phases, starting with a strong foundation and the highest-value modules, then iterate.

## Vision

Kodaty — a luxury, RTL-first internal SaaS for managing digital license sales (Windows, Office, Adobe, Autodesk, subscriptions, activation keys). Aesthetic reference: Linear's precision + Stripe's clarity + Raycast's speed + a deep-purple luxury identity built around #4F04AC.

Core principles:
- Dense but calm. Generous whitespace at the shell level, high-signal data inside.
- Keyboard-first. Command palette (⌘K) is the primary navigator.
- RTL native (Arabic UI), with a proper Arabic + Latin type pair.
- Zero "admin panel" feel: no boxy cards, no default shadcn look. Custom variants everywhere.

## Design System (foundation — built first, used everywhere)

Tokens in `src/styles.css` (@theme inline + :root):
- Brand: `--brand: #4F04AC` + a full 50→950 purple ramp in oklch.
- Surfaces: layered neutrals (bg, surface, surface-raised, surface-sunken) — not flat white.
- Semantic: success/warning/danger/info tuned to sit next to purple without clashing.
- Gradients: `--gradient-brand`, `--gradient-brand-soft`, `--gradient-mesh` (subtle hero mesh).
- Shadows: `--shadow-sm/md/lg/glow` (glow uses brand at low alpha for luxury depth).
- Radius scale, spacing rhythm, motion tokens (durations + easings).

Typography: IBM Plex Sans Arabic (UI) + Inter (Latin/numerics) + JetBrains Mono (keys/IDs), loaded via `<link>` in `__root.tsx`.

Direction: `<html dir="rtl" lang="ar">`. Tailwind logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) throughout.

## App Shell

- Left sidebar (RTL: visually right): collapsible icon rail + expanded mode, grouped nav, active-route highlight, subtle brand accent bar.
- Top bar: breadcrumb, global search trigger (⌘K), notifications bell with unread dot, workspace switcher, user menu.
- Command Palette (⌘K): fuzzy search across orders, customers, products, keys, invoices, subscriptions, tasks + quick actions ("New order", "Add key", "Go to…").
- Notifications drawer: live feed grouped by type.
- Skeleton loaders, empty states with illustration + primary action, toast system.

## Sidebar sections (final IA)

الرئيسية · الطلبات · الاشتراكات · العملاء · المنتجات · التراخيص والمفاتيح · المخزون · المالية · التقارير · الإحصائيات · التسويق · الدعم · المهام · الأتمتة · الإشعارات · الإعدادات

## Phase 1 (this build)

1. Design system (tokens, fonts, RTL, custom shadcn variants).
2. App shell (sidebar + topbar + command palette + notifications).
3. Dashboard: today/month sales, net profit, projected profit, order counters, active/expiring subs, top products, top customers, sales chart, profit chart, recent activity, KPIs, quick actions.
4. Orders list + order detail (timeline, attachments, tags, priority, bulk actions, advanced filters).
5. Customers list + customer profile (full timeline, LTV, AOV, purchases, subscriptions, invoices, notes, tags).
6. Subscriptions list with expiry urgency, renewal timeline.
7. License Vault (keys inventory: available/sold/reserved, CSV import/export shell, search, filter, link to order/customer).

All screens use realistic mock data (no lorem ipsum) so the product feels alive.

## Phase 2 (next iteration, after you review Phase 1)

Finance, Inventory alerts, Marketing (coupons/campaigns/referrals), Support tickets, Reports, Automation center, AI assistant (Lovable AI Gateway), Tasks, Settings, live notifications backend.

## Technical notes

- Frontend-only in Phase 1 (no backend yet). Mock data in `src/lib/mock/*` typed with TS.
- TanStack Router file-based routes under `src/routes/` — one route per top-level nav item, layout route for the app shell (`_app.tsx` pattern via layout file).
- shadcn components kept but restyled through variants + tokens; no raw color classes in components.
- Motion via `tw-animate-css` + targeted framer-motion later if needed.
- AI assistant, automation execution, live notifications, and persistence land in Phase 2 with Lovable Cloud.

## Deliverable of this turn

A working Phase 1: navigable shell + Dashboard + Orders (list & detail) + Customers (list & detail) + Subscriptions + License Vault, all in Arabic RTL with the luxury purple identity. Remaining modules get polished placeholder routes so navigation feels complete.

Reply "ابدأ" (or "go") to proceed with Phase 1, or tell me which modules to prioritize differently.