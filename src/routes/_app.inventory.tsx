import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/placeholder";

export const Route = createFileRoute("/_app/inventory")({
  component: () => <Placeholder title="المخزون" description="تتبّع المخزون وتنبيهات النفاد لكل منتج." />,
  head: () => ({ meta: [{ title: "المخزون — Kodaty" }] }),
});
