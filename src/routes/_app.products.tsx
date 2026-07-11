import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/placeholder";

export const Route = createFileRoute("/_app/products")({
  component: () => <Placeholder title="المنتجات" description="كتالوج المنتجات والفئات والأسعار — قريباً في المرحلة التالية." />,
  head: () => ({ meta: [{ title: "المنتجات — Kodaty" }] }),
});
