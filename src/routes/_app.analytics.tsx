import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/placeholder";

export const Route = createFileRoute("/_app/analytics")({
  component: () => <Placeholder title="الإحصائيات" description="تحليلات متقدمة وسلوك المستخدمين وتحويلات الحملات." />,
  head: () => ({ meta: [{ title: "الإحصائيات — Kodaty" }] }),
});
