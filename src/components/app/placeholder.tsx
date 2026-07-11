import { Construction } from "lucide-react";

export function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="surface-elevated relative overflow-hidden p-10 text-center">
        <div className="pointer-events-none absolute inset-0 mesh-bg opacity-50" />
        <div className="relative">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl brand-gradient shadow-brand">
            <Construction className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            المرحلة القادمة من التطوير
          </div>
        </div>
      </div>
    </div>
  );
}
