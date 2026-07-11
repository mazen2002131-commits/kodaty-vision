import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/placeholder";

export const Route = createFileRoute("/_app/reports")({
  component: () => <Placeholder title="التقارير" description="تقارير قابلة للتصدير عن المبيعات والأرباح والعملاء والاشتراكات." />,
  head: () => ({ meta: [{ title: "التقارير — Kodaty" }] }),
});
