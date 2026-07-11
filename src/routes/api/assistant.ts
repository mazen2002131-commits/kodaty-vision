import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/assistant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response("LOVABLE_API_KEY missing", { status: 500 });
        }

        const body = (await request.json()) as {
          messages: { role: "user" | "assistant" | "system"; content: string }[];
          context?: string;
        };

        const systemPrompt = `أنت "Kodaty AI"، مساعد ذكي داخلي لنظام Kodaty لإدارة مبيعات التراخيص الرقمية.
- أجب دائماً بالعربية الفصحى الحديثة، بأسلوب موجز واحترافي.
- استخدم الجنيه المصري (ج.م) للعملة.
- عند تقديم أرقام أو مؤشرات استخدم قوائم نقطية قصيرة.
- إذا كان السؤال يحتاج بيانات غير موجودة اعتذر واقترح الإجراء المناسب.
${body.context ? `\nسياق حي عن الحساب:\n${body.context}` : ""}`;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            stream: true,
            messages: [
              { role: "system", content: systemPrompt },
              ...body.messages,
            ],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          return new Response(text || "AI gateway error", { status: upstream.status || 500 });
        }

        // Transform SSE → plain text token stream
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const stream = new ReadableStream({
          async start(controller) {
            const reader = upstream.body!.getReader();
            let buf = "";
            try {
              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split("\n");
                buf = lines.pop() ?? "";
                for (const line of lines) {
                  const l = line.trim();
                  if (!l.startsWith("data:")) continue;
                  const data = l.slice(5).trim();
                  if (data === "[DONE]") { controller.close(); return; }
                  try {
                    const json = JSON.parse(data);
                    const delta = json?.choices?.[0]?.delta?.content;
                    if (delta) controller.enqueue(encoder.encode(delta));
                  } catch {}
                }
              }
              controller.close();
            } catch (e) {
              controller.error(e);
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
          },
        });
      },
    },
  },
});
