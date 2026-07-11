// Central permission catalog for staff members.
// Admins implicitly hold every permission.

export type PermissionKey =
  | "dashboard"
  | "orders"
  | "subscriptions"
  | "customers"
  | "products"
  | "licenses"
  | "inventory"
  | "finance"
  | "reports"
  | "analytics"
  | "marketing"
  | "support"
  | "tasks"
  | "automation"
  | "notifications"
  | "assistant"
  | "team"
  | "settings";

export const PERMISSION_GROUPS: {
  section: string;
  items: { key: PermissionKey; label: string; description?: string }[];
}[] = [
  {
    section: "المساحة",
    items: [
      { key: "dashboard", label: "الرئيسية" },
      { key: "orders", label: "الطلبات" },
      { key: "subscriptions", label: "الاشتراكات" },
      { key: "customers", label: "العملاء" },
    ],
  },
  {
    section: "الكتالوج",
    items: [
      { key: "products", label: "المنتجات" },
      { key: "licenses", label: "التراخيص والمفاتيح" },
      { key: "inventory", label: "المخزون" },
    ],
  },
  {
    section: "الأعمال",
    items: [
      { key: "finance", label: "المالية والمحاسبة" },
      { key: "reports", label: "التقارير" },
      { key: "analytics", label: "الإحصائيات" },
      { key: "marketing", label: "التسويق" },
    ],
  },
  {
    section: "العمليات",
    items: [
      { key: "support", label: "الدعم الفني" },
      { key: "tasks", label: "المهام" },
      { key: "automation", label: "الأتمتة" },
      { key: "notifications", label: "الإشعارات" },
      { key: "assistant", label: "المساعد الذكي" },
      { key: "team", label: "الفريق والصلاحيات" },
      { key: "settings", label: "الإعدادات" },
    ],
  },
];

export const ALL_PERMISSIONS: PermissionKey[] = PERMISSION_GROUPS.flatMap(g =>
  g.items.map(i => i.key),
);

// Sensible defaults for a fresh staff member.
export const DEFAULT_STAFF_PERMISSIONS: PermissionKey[] = [
  "dashboard",
  "orders",
  "subscriptions",
  "customers",
  "products",
  "licenses",
  "inventory",
  "support",
  "tasks",
  "notifications",
  "assistant",
];
