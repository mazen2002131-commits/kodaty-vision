import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/placeholder";

export const Route = createFileRoute("/_app/notifications")({
  component: () => <Placeholder title="الإشعارات" description="مركز الإشعارات وقواعد الإشعارات في الوقت الفعلي." />,
  head: () => ({ meta: [{ title: "الإشعارات — Kodaty" }] }),
});
