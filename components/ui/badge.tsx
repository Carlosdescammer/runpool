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
    "bg-[var(--rp-primary)] text-white",
  secondary:
    "bg-[var(--rp-accent)] text-[var(--rp-text)]",
  success:
    "bg-emerald-500/90 text-white",
  warning:
    "bg-amber-500/90 text-white",
  destructive:
    "bg-rose-500/90 text-white",
  outline:
    "border border-[var(--rp-accent)] text-[var(--rp-text)]",
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
