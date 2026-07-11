import { cn } from "@/lib/utils";
import type { OrderStatus, Priority } from "@/lib/mock/data";
import { statusLabels, priorityLabels } from "@/lib/mock/data";

const STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-info/10 text-info border-info/20",
  processing: "bg-warning/10 text-warning border-warning/25",
  completed: "bg-success/10 text-success border-success/25",
  pending: "bg-muted text-muted-foreground border-border",
  refunded: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export function StatusPill({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium", STATUS_STYLE[status], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {statusLabels[status]}
    </span>
  );
}

const PRIORITY_STYLE: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-secondary text-secondary-foreground",
  high: "bg-warning/15 text-warning",
  urgent: "bg-destructive/15 text-destructive",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium", PRIORITY_STYLE[priority])}>
      {priorityLabels[priority]}
    </span>
  );
}

export function Avatar({ name, color, size = 32 }: { name: string; color: string; size?: number }) {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("");
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}, #4F04AC)`, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}
