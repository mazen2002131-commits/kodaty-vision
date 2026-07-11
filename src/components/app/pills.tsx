import { cn } from "@/lib/utils";

export type AnyOrderStatus =
  | "pending" | "processing" | "delivered" | "cancelled" | "refunded"
  | "new" | "completed";
export type AnyPriority = "low" | "normal" | "high" | "urgent";

const STATUS_STYLE: Record<AnyOrderStatus, string> = {
  new: "bg-info/10 text-info border-info/20",
  pending: "bg-muted text-muted-foreground border-border",
  processing: "bg-warning/10 text-warning border-warning/25",
  delivered: "bg-success/10 text-success border-success/25",
  completed: "bg-success/10 text-success border-success/25",
  cancelled: "bg-muted text-muted-foreground border-border",
  refunded: "bg-destructive/10 text-destructive border-destructive/20",
};

const STATUS_LABEL: Record<AnyOrderStatus, string> = {
  new: "جديد",
  pending: "معلّق",
  processing: "قيد التنفيذ",
  delivered: "مُسلَّم",
  completed: "مكتمل",
  cancelled: "ملغى",
  refunded: "مسترد",
};

export function StatusPill({ status, className }: { status: AnyOrderStatus | string; className?: string }) {
  const s = (status in STATUS_STYLE ? status : "pending") as AnyOrderStatus;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium", STATUS_STYLE[s], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABEL[s]}
    </span>
  );
}

const PRIORITY_STYLE: Record<AnyPriority, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-secondary text-secondary-foreground",
  high: "bg-warning/15 text-warning",
  urgent: "bg-destructive/15 text-destructive",
};

const PRIORITY_LABEL: Record<AnyPriority, string> = {
  low: "منخفضة",
  normal: "عادية",
  high: "مرتفعة",
  urgent: "عاجلة",
};

export function PriorityBadge({ priority }: { priority: AnyPriority | string }) {
  const p = (priority in PRIORITY_STYLE ? priority : "normal") as AnyPriority;
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium", PRIORITY_STYLE[p])}>
      {PRIORITY_LABEL[p]}
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
