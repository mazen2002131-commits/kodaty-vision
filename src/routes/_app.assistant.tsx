import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User, TrendingUp, Users, KeyRound, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/assistant")({
  component: Assistant,
  head: () => ({ meta: [{ title: "Kodaty AI — المساعد الذكي" }] }),
});

type Msg = { role: "user" | "assistant"; content: string };

const suggestions = [
  { icon: TrendingUp, text: "ما أفضل منتج مبيعاً هذا الأسبوع؟" },
  { icon: Users, text: "أعطني قائمة عملاء VIP بلا نشاط منذ شهر" },
  { icon: KeyRound, text: "كم مفتاح متاح لـ Office 365 الآن؟" },
  { icon: RefreshCw, text: "من العملاء الذين ينتهي اشتراكهم خلال 7 أيام؟" },
];

async function buildLiveContext(): Promise<string> {
  try {
    const now = Date.now();
    const since30 = new Date(now - 30 * 864e5).toISOString();
    const since7 = new Date(now - 7 * 864e5).toISOString();
    const [orders30, orders7, customersCount, licenses, subs, products, topOrders] = await Promise.all([
      supabase.from("orders").select("total,status,created_at").gte("created_at", since30),
      supabase.from("orders").select("total,status,created_at,order_items(product_name,qty,unit_price)").gte("created_at", since7),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("licenses").select("status,product_name"),
      supabase.from("subscriptions").select("status,ends_at,product_name,customers(name)"),
      supabase.from("products").select("name,price,billing_type,active"),
      supabase.from("orders").select("total,customers(name)").order("total", { ascending: false }).limit(5),
    ]);

    const paid = new Set(["delivered", "paid", "fulfilled", "processing"]);
    const sum = (rows: any[]) => rows.filter((o) => paid.has(o.status)).reduce((s, o) => s + Number(o.total ?? 0), 0);
    const rev30 = sum(orders30.data ?? []);
    const rev7 = sum(orders7.data ?? []);

    const prodTotals: Record<string, { qty: number; revenue: number }> = {};
    for (const o of orders7.data ?? []) {
      if (!paid.has((o as any).status)) continue;
      for (const it of ((o as any).order_items ?? []) as any[]) {
        const key = it.product_name || "غير محدد";
        prodTotals[key] ??= { qty: 0, revenue: 0 };
        prodTotals[key].qty += Number(it.qty ?? 0);
        prodTotals[key].revenue += Number(it.qty ?? 0) * Number(it.unit_price ?? 0);
      }
    }
    const topProducts7 = Object.entries(prodTotals).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);

    const licByProduct: Record<string, { available: number; sold: number }> = {};
    for (const l of licenses.data ?? []) {
      const key = (l as any).product_name || "غير محدد";
      licByProduct[key] ??= { available: 0, sold: 0 };
      if ((l as any).status === "available") licByProduct[key].available++;
      else if ((l as any).status === "sold") licByProduct[key].sold++;
    }
    const availTotal = Object.values(licByProduct).reduce((s, v) => s + v.available, 0);
    const soldTotal = Object.values(licByProduct).reduce((s, v) => s + v.sold, 0);

    const expiringSoon = (subs.data ?? []).filter((s: any) => {
      if (!s.ends_at) return false;
      const d = new Date(s.ends_at).getTime() - now;
      return d > 0 && d < 7 * 864e5;
    });

    const fmt = (n: number) => n.toLocaleString("ar-EG");
    const L: string[] = [];
    L.push(`## مؤشرات عامة`);
    L.push(`- إيرادات آخر 7 أيام: ${fmt(rev7)} ج.م عبر ${(orders7.data ?? []).length} طلب`);
    L.push(`- إيرادات آخر 30 يوم: ${fmt(rev30)} ج.م عبر ${(orders30.data ?? []).length} طلب`);
    L.push(`- عدد العملاء الكلي: ${customersCount.count ?? 0}`);
    L.push(`- مفاتيح تراخيص — متاحة: ${availTotal} · مباعة: ${soldTotal}`);
    L.push(`- اشتراكات تنتهي خلال 7 أيام: ${expiringSoon.length}`);

    L.push(`\n## أفضل المنتجات مبيعاً — آخر 7 أيام`);
    if (topProducts7.length) {
      topProducts7.forEach(([n, v], i) => L.push(`${i + 1}. ${n} — ${v.qty} وحدة · ${fmt(v.revenue)} ج.م`));
    } else L.push(`- لا توجد مبيعات مسجّلة خلال آخر 7 أيام.`);

    if (Object.keys(licByProduct).length) {
      L.push(`\n## مخزون التراخيص حسب المنتج`);
      for (const [n, v] of Object.entries(licByProduct)) L.push(`- ${n}: متاح ${v.available} · مباع ${v.sold}`);
    }

    if (expiringSoon.length) {
      L.push(`\n## اشتراكات على وشك الانتهاء`);
      for (const s of expiringSoon.slice(0, 10)) {
        const days = Math.ceil((new Date((s as any).ends_at).getTime() - now) / 864e5);
        L.push(`- ${(s as any).customers?.name ?? "—"} · ${(s as any).product_name} · خلال ${days} يوم`);
      }
    }

    const activeProducts = (products.data ?? []).filter((p: any) => p.active);
    if (activeProducts.length) {
      L.push(`\n## كتالوج المنتجات النشطة`);
      for (const p of activeProducts.slice(0, 20)) L.push(`- ${(p as any).name} — ${fmt(Number((p as any).price))} ج.م (${(p as any).billing_type})`);
    }

    if ((topOrders.data ?? []).length) {
      L.push(`\n## أعلى الطلبات قيمةً`);
      for (const o of topOrders.data ?? []) L.push(`- ${(o as any).customers?.name ?? "—"} — ${fmt(Number((o as any).total))} ج.م`);
    }

    return L.join("\n");
  } catch (e) {
    return `تعذّر تحميل سياق البيانات: ${(e as Error).message}`;
  }
}

function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "مرحباً 👋\nأنا Kodaty AI، مساعدك الذكي متصل ببياناتك الحية. اسألني عن أرباحك، عملائك، مخزونك، أو دعني أنفّذ إجراءات نيابةً عنك." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const context = await buildLiveContext();
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok || !res.body) {
        const err = await res.text().catch(() => "");
        setMessages(m => [...m, { role: "assistant", content: `تعذر الاتصال بالمساعد. ${err || ""}`.trim() }]);
        return;
      }
      setMessages(m => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages(m => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (e: any) {
      setMessages(m => [...m, { role: "assistant", content: `خطأ: ${e?.message ?? "غير معروف"}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="surface-elevated flex flex-col overflow-hidden" style={{ height: "calc(100dvh - 140px)" }}>
        {/* Header */}
        <div className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0 mesh-bg opacity-70" />
          <div className="relative flex items-center gap-3 p-5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl brand-gradient shadow-brand">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-lg font-bold">Kodaty AI</h1>
              <p className="text-xs text-muted-foreground">مساعد ذكي متصل ببياناتك · متاح 24/7</p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[11px] text-success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              نشط
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <div className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                m.role === "assistant"
                  ? "brand-gradient text-white shadow-brand"
                  : "bg-surface-sunken text-foreground",
              )}>
                {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                m.role === "assistant"
                  ? "bg-surface-sunken text-foreground rounded-ss-sm"
                  : "bg-primary text-primary-foreground rounded-se-sm",
              )}>
                {m.content.split("\n").map((line, k) => (
                  <div key={k} dangerouslySetInnerHTML={{
                    __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                  }} />
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg brand-gradient text-white shadow-brand">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-ss-sm bg-surface-sunken px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="border-t border-border p-4">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">اقتراحات</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {suggestions.map(s => {
                const I = s.icon;
                return (
                  <button
                    key={s.text}
                    onClick={() => send(s.text)}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-start text-sm transition-colors hover:border-brand-500/50 hover:bg-brand-50/40"
                  >
                    <I className="h-4 w-4 shrink-0 text-brand-600" />
                    <span className="truncate">{s.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-4">
          <form
            onSubmit={e => { e.preventDefault(); send(input); }}
            className="flex items-end gap-2 rounded-xl border border-border bg-surface-sunken p-2 focus-within:border-primary"
          >
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              placeholder="اكتب سؤالك…"
              className="flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-brand transition-opacity hover:bg-brand-700 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              إرسال
            </button>
          </form>
          <div className="mt-2 text-[10px] text-muted-foreground">
            Kodaty AI يعتمد على بياناتك الداخلية. النسخة التجريبية قد ترتكب أخطاءً.
          </div>
        </div>
      </div>
    </div>
  );
}
