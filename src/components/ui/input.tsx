import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-input/70 bg-surface/60 px-3.5 py-2 text-sm text-foreground shadow-[0_1px_0_0_rgba(15,15,35,0.02)] backdrop-blur-sm transition-all duration-200",
          "placeholder:text-muted-foreground/70",
          "hover:border-input hover:bg-surface",
          "focus-visible:outline-none focus-visible:border-primary/60 focus-visible:bg-surface focus-visible:ring-4 focus-visible:ring-primary/10",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40",
          "aria-[invalid=true]:border-destructive/60 aria-[invalid=true]:focus-visible:ring-destructive/15",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
