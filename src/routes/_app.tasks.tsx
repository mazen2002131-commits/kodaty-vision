import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/placeholder";

export const Route = createFileRoute("/_app/tasks")({
  component: () => <Placeholder title="المهام" description="لوحة مهام لفريق العمل مع التعيين والمتابعة." />,
  head: () => ({ meta: [{ title: "المهام — Kodaty" }] }),
});
