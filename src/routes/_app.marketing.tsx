import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/placeholder";

export const Route = createFileRoute("/_app/marketing")({
  component: () => <Placeholder title="التسويق" description="أكواد الخصم والحملات والعمولات ونظام الإحالة." />,
  head: () => ({ meta: [{ title: "التسويق — Kodaty" }] }),
});
