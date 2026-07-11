import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/placeholder";

export const Route = createFileRoute("/_app/settings")({
  component: () => <Placeholder title="الإعدادات" description="إعدادات المساحة، الفريق، الصلاحيات، وتكاملات المنصة." />,
  head: () => ({ meta: [{ title: "الإعدادات — Kodaty" }] }),
});
