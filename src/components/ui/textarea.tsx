import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[104px] w-full rounded-2xl border border-border/70 bg-white px-4 py-3 text-[14px] font-medium text-foreground resize-y",
          "shadow-[0_1px_2px_rgba(15,15,35,0.04),inset_0_1px_0_rgba(255,255,255,0.6)]",
          "transition-[border-color,box-shadow,background-color] duration-200",
          "placeholder:text-muted-foreground/60 placeholder:font-normal",
          "hover:border-foreground/25",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-[color-mix(in_oklch,var(--primary)_18%,transparent)]",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted/50",
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/20",
          "dark:bg-surface-raised/60 dark:backdrop-blur-sm",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
