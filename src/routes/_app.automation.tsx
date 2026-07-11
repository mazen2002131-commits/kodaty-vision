import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/placeholder";

export const Route = createFileRoute("/_app/automation")({
  component: () => <Placeholder title="الأتمتة" description="مركز الأتمتة: تذكيرات التجديد، إرسال المفاتيح، تنبيهات المخزون." />,
  head: () => ({ meta: [{ title: "الأتمتة — Kodaty" }] }),
});
