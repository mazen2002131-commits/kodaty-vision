const NOW = 1783036800000; // fixed epoch for deterministic SSR (2026-07-11)
// Mock domain data for Kodaty. Realistic Arabic + product names.

export type OrderStatus = "new" | "processing" | "completed" | "pending" | "refunded" | "cancelled";
export type Priority = "low" | "normal" | "high" | "urgent";
export type PaymentMethod = "instapay" | "vodafone_cash" | "usdt" | "bank" | "paypal" | "stripe";

export interface Product {
  id: string;
  name: string;
  category: "os" | "office" | "design" | "security" | "ai" | "streaming";
  price: number;
  cost: number;
  stock: number;
  sold: number;
  icon: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  country: string;
  joinedAt: string;
  totalSpent: number;
  ordersCount: number;
  tags: string[];
  avatarColor: string;
}

export interface Order {
  id: string;
  code: string;
  customerId: string;
  productId: string;
  qty: number;
  amount: number;
  cost: number;
  status: OrderStatus;
  priority: Priority;
  payment: PaymentMethod;
  createdAt: string;
  notes?: string;
  tags: string[];
  timeline: { at: string; by: string; text: string }[];
}

export interface Subscription {
  id: string;
  customerId: string;
  productId: string;
  email: string;
  startAt: string;
  endAt: string;
  renewPrice: number;
  autoRenew: boolean;
  status: "active" | "expiring" | "expired" | "cancelled";
}

export interface LicenseKey {
  id: string;
  productId: string;
  key: string;
  status: "available" | "sold" | "reserved";
  orderId?: string;
  customerId?: string;
  addedAt: string;
}

export const products: Product[] = [
  { id: "p1", name: "Microsoft Office 365 Family", category: "office", price: 950, cost: 480, stock: 34, sold: 128, icon: "📄" },
  { id: "p2", name: "Windows 11 Pro — Retail", category: "os", price: 1150, cost: 520, stock: 12, sold: 214, icon: "🪟" },
  { id: "p3", name: "Adobe Creative Cloud All Apps", category: "design", price: 2400, cost: 1450, stock: 6, sold: 47, icon: "🎨" },
  { id: "p4", name: "Autodesk AutoCAD 2026", category: "design", price: 3800, cost: 2200, stock: 4, sold: 19, icon: "📐" },
  { id: "p5", name: "Canva Pro — Annual", category: "design", price: 420, cost: 180, stock: 88, sold: 302, icon: "🖌️" },
  { id: "p6", name: "Figma Professional", category: "design", price: 680, cost: 340, stock: 22, sold: 76, icon: "🧩" },
  { id: "p7", name: "Kaspersky Total Security", category: "security", price: 380, cost: 160, stock: 45, sold: 91, icon: "🛡️" },
  { id: "p8", name: "ChatGPT Plus — شهر", category: "ai", price: 550, cost: 280, stock: 60, sold: 240, icon: "🤖" },
  { id: "p9", name: "Netflix Premium — سنة", category: "streaming", price: 1200, cost: 700, stock: 15, sold: 88, icon: "🎬" },
  { id: "p10", name: "Spotify Family — سنة", category: "streaming", price: 640, cost: 320, stock: 20, sold: 54, icon: "🎧" },
];

const names = [
  "أحمد العتيبي", "منى القحطاني", "خالد النعيمي", "سارة المطيري", "يوسف بن حماد",
  "ريم الشمري", "عبدالله المالكي", "نور الحربي", "فيصل الدوسري", "لمى الغامدي",
  "طارق السبيعي", "هدى الزهراني", "محمد المنصور", "دانه العجمي", "زياد الرشيدي",
];

const countries = ["🇸🇦 السعودية", "🇦🇪 الإمارات", "🇪🇬 مصر", "🇰🇼 الكويت", "🇶🇦 قطر", "🇧🇭 البحرين", "🇴🇲 عمان"];
const avatarColors = ["#7C3AED", "#4F04AC", "#9333EA", "#6D28D9", "#8B5CF6", "#A855F7"];

export const customers: Customer[] = names.map((n, i) => ({
  id: `c${i + 1}`,
  name: n,
  email: `user${i + 1}@kodaty.io`,
  whatsapp: `+9665${(10000000 + i * 1234567).toString().slice(0, 8)}`,
  country: countries[i % countries.length],
  joinedAt: new Date(NOW - (i * 7 + 3) * 86400000).toISOString(),
  totalSpent: 800 + ((i * 733) % 12000),
  ordersCount: 1 + (i % 12),
  tags: i % 3 === 0 ? ["VIP"] : i % 4 === 0 ? ["جديد"] : ["نشط"],
  avatarColor: avatarColors[i % avatarColors.length],
}));

const statuses: OrderStatus[] = ["new", "processing", "completed", "pending", "completed", "completed", "refunded"];
const priorities: Priority[] = ["normal", "high", "normal", "low", "urgent", "normal"];
const payments: PaymentMethod[] = ["instapay", "vodafone_cash", "usdt", "bank", "stripe", "paypal"];

export const orders: Order[] = Array.from({ length: 48 }, (_, i) => {
  const product = products[i % products.length];
  const customer = customers[i % customers.length];
  const qty = 1 + (i % 3);
  return {
    id: `o${i + 1}`,
    code: `KD-${String(10248 + i)}`,
    customerId: customer.id,
    productId: product.id,
    qty,
    amount: product.price * qty,
    cost: product.cost * qty,
    status: statuses[i % statuses.length],
    priority: priorities[i % priorities.length],
    payment: payments[i % payments.length],
    createdAt: new Date(NOW - i * 3600_000 * 5).toISOString(),
    notes: i % 5 === 0 ? "تم إرسال المفتاح عبر واتساب." : undefined,
    tags: i % 4 === 0 ? ["عاجل"] : i % 3 === 0 ? ["تجديد"] : [],
    timeline: [
      { at: new Date(NOW - i * 3600_000 * 5).toISOString(), by: "النظام", text: "تم إنشاء الطلب" },
      { at: new Date(NOW - i * 3600_000 * 4).toISOString(), by: "منال · فريق المبيعات", text: "تم تأكيد الدفع" },
      { at: new Date(NOW - i * 3600_000 * 3).toISOString(), by: "الأتمتة", text: "تم إرسال المفتاح للعميل" },
    ],
  };
});

export const subscriptions: Subscription[] = customers.slice(0, 12).map((c, i) => {
  const daysLeft = [3, 12, 45, 1, 90, 7, -4, 22, 60, 30, 14, 120][i];
  const end = new Date(NOW + daysLeft * 86400_000);
  return {
    id: `s${i + 1}`,
    customerId: c.id,
    productId: products[i % products.length].id,
    email: c.email,
    startAt: new Date(end.getTime() - 365 * 86400_000).toISOString(),
    endAt: end.toISOString(),
    renewPrice: products[i % products.length].price,
    autoRenew: i % 3 !== 0,
    status: daysLeft < 0 ? "expired" : daysLeft <= 14 ? "expiring" : "active",
  };
});

export const keys: LicenseKey[] = Array.from({ length: 60 }, (_, i) => {
  const p = products[i % products.length];
  // Deterministic pseudo-random so SSR & client render the same string.
  const seg = (n: number) => {
    let s = "";
    let x = (i + 1) * 9973 + n * 31;
    for (let k = 0; k < 5; k++) {
      x = (x * 1103515245 + 12345) & 0x7fffffff;
      s += "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[x % 32];
    }
    return s;
  };
  return {
    id: `k${i + 1}`,
    productId: p.id,
    key: `${seg(1)}-${seg(2)}-${seg(3)}-${seg(4)}-${seg(5)}`,
    status: i % 5 === 0 ? "reserved" : i % 3 === 0 ? "sold" : "available",
    orderId: i % 3 === 0 ? `o${i + 1}` : undefined,
    customerId: i % 3 === 0 ? `c${(i % customers.length) + 1}` : undefined,
    addedAt: new Date(2026, 5, 1 + (i % 28)).toISOString(),
  };
});

// Chart data
export const salesSeries = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  sales: 4000 + Math.round(Math.sin(i / 3) * 1800 + Math.sin(i * 1.7) * 1100 + i * 60),
  profit: 1800 + Math.round(Math.cos(i / 4) * 900 + Math.cos(i * 1.3) * 550 + i * 30),
}));

export const categorySplit = [
  { name: "Office", value: 34 },
  { name: "OS", value: 22 },
  { name: "Design", value: 18 },
  { name: "AI", value: 14 },
  { name: "Security", value: 8 },
  { name: "Streaming", value: 4 },
];

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n);
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("ar-EG").format(n);
}

export function relativeTime(iso: string) {
  const diff = (NOW - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

export function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - NOW) / 86400_000);
}

export function customerById(id: string) { return customers.find(c => c.id === id)!; }
export function productById(id: string) { return products.find(p => p.id === id)!; }
export function orderById(id: string) { return orders.find(o => o.id === id); }

export const statusLabels: Record<OrderStatus, string> = {
  new: "جديد", processing: "قيد التنفيذ", completed: "مكتمل",
  pending: "معلّق", refunded: "مسترد", cancelled: "ملغى",
};
export const paymentLabels: Record<PaymentMethod, string> = {
  instapay: "InstaPay", vodafone_cash: "فودافون كاش", usdt: "USDT",
  bank: "تحويل بنكي", paypal: "PayPal", stripe: "Stripe",
};
export const priorityLabels: Record<Priority, string> = {
  low: "منخفضة", normal: "عادية", high: "عالية", urgent: "عاجلة",
};

export const notifications = [
  { id: "n1", type: "order", title: "طلب جديد #KD-10295", body: "أحمد العتيبي · Adobe Creative Cloud", at: new Date(NOW - 120_000).toISOString() },
  { id: "n2", type: "sub", title: "اشتراك سينتهي قريباً", body: "منى القحطاني · Microsoft 365 · بعد 3 أيام", at: new Date(NOW - 20 * 60_000).toISOString() },
  { id: "n3", type: "stock", title: "المخزون منخفض", body: "AutoCAD 2026 · تبقى 4 مفاتيح", at: new Date(NOW - 3600_000).toISOString() },
  { id: "n4", type: "payment", title: "فشل عملية دفع", body: "خالد النعيمي · فودافون كاش · 950 ر.س", at: new Date(NOW - 5 * 3600_000).toISOString() },
  { id: "n5", type: "task", title: "مهمة جديدة", body: "متابعة تجديد اشتراك سارة المطيري", at: new Date(NOW - 8 * 3600_000).toISOString() },
];
