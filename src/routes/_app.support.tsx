import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/placeholder";

export const Route = createFileRoute("/_app/support")({
  component: () => <Placeholder title="الدعم الفني" description="نظام تذاكر احترافي بالحالة والأولوية والمحادثات الداخلية." />,
  head: () => ({ meta: [{ title: "الدعم الفني — Kodaty" }] }),
});
