import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leadingIcon, trailingIcon, wrapperClassName, ...props }, ref) => {
    const base = (
      <input
        type={type}
        ref={ref}
        className={cn(
          "peer flex h-12 w-full rounded-2xl border border-border/70 bg-white px-4 text-[14px] font-medium text-foreground",
          "shadow-[0_1px_2px_rgba(15,15,35,0.04),inset_0_1px_0_rgba(255,255,255,0.6)]",
          "transition-[border-color,box-shadow,background-color] duration-200",
          "placeholder:text-muted-foreground/60 placeholder:font-normal",
          "hover:border-foreground/25",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-[color-mix(in_oklch,var(--primary)_18%,transparent)]",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted/50",
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/20",
          "dark:bg-surface-raised/60 dark:backdrop-blur-sm",
          leadingIcon && "ps-11",
          trailingIcon && "pe-11",
          className,
        )}
        {...props}
      />
    );

    if (!leadingIcon && !trailingIcon) return base;

    return (
      <div className={cn("relative w-full", wrapperClassName)}>
        {leadingIcon && (
          <span className="pointer-events-none absolute inset-y-0 start-0 flex w-11 items-center justify-center text-muted-foreground/70 peer-focus-visible:text-primary transition-colors">
            {leadingIcon}
          </span>
        )}
        {base}
        {trailingIcon && (
          <span className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-muted-foreground/70">
            {trailingIcon}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
