"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "outline"
  | "secondary";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClass: Record<BadgeVariant, string> = {
  default:
    "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
  secondary:
    "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
  success:
    "bg-emerald-500/90 text-white dark:bg-emerald-500",
  warning:
    "bg-amber-500/90 text-white dark:bg-amber-500",
  destructive:
    "bg-rose-500/90 text-white dark:bg-rose-500",
  outline:
    "border border-zinc-300 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100",
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
          variantClass[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";
