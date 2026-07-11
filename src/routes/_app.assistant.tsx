import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User, TrendingUp, Users, KeyRound, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

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

const canned: Record<string, string> = {
  "افتراضي":
    "بناءً على بيانات مساحتك، إليك ملخصاً سريعاً:\n\n• **الإيرادات هذا الشهر**: 486,320 ر.س (+9.2% مقارنة بالشهر السابق)\n• **أفضل منتج**: Canva Pro Annual بـ 302 عملية بيع\n• **تنبيه**: 3 اشتراكات تنتهي خلال 7 أيام تحتاج متابعة\n\nهل تريد أن أرسل تذكيرات التجديد تلقائياً؟",
};

function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "مرحباً منال 👋\nأنا Kodaty AI، مساعدك الذكي. اسألني عن أرباحك، عملائك، مخزونك، أو دعني أنفّذ إجراءات نيابةً عنك." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = (text: string) => {
    if (!text.trim() || loading) return;
    setMessages(m => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setMessages(m => [...m, { role: "assistant", content: canned["افتراضي"] }]);
      setLoading(false);
    }, 900);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="surface-elevated flex flex-col overflow-hidden" style={{ height: "calc(100dvh - 140px)" }}>
        {/* Header */}
        <div className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0 mesh-bg opacity-70" />
          <div className="relative flex items-center gap-3 p-5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--gradient-brand)] shadow-brand">
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
                  ? "bg-[var(--gradient-brand)] text-white shadow-brand"
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
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--gradient-brand)] text-white shadow-brand">
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
