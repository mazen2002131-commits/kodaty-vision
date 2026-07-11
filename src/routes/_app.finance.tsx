import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/placeholder";

export const Route = createFileRoute("/_app/finance")({
  component: () => <Placeholder title="المالية" description="الإيرادات والمصروفات والتدفق النقدي والفواتير والتقارير المالية." />,
  head: () => ({ meta: [{ title: "المالية — Kodaty" }] }),
});
