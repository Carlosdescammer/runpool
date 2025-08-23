import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white/80 shadow-md backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";
