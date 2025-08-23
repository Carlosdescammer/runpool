"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
}

const base =
  "inline-flex items-center justify-center rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none active:scale-[0.98] select-none";

const variants: Record<string, string> = {
  /* Default now mirrors primary to avoid black buttons in light-only theme */
  default: "bg-[var(--rp-primary)] text-white hover:brightness-110 focus-visible:ring-[var(--rp-accent)]",
  /* Use theme primary color for actions; focus ring uses accent */
  primary: "bg-[var(--rp-primary)] text-white hover:brightness-110 focus-visible:ring-[var(--rp-accent)]",
  /* Soft secondary surface using very light bg with navy text and blue-gray border */
  secondary: "bg-[var(--rp-bg)] text-[var(--rp-text)] border border-[var(--rp-accent)] hover:bg-white focus-visible:ring-[var(--rp-accent)]",
  destructive: "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-400",
  ghost: "bg-transparent hover:bg-zinc-100",
};

const sizes: Record<string, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-[15px]",
  lg: "h-12 px-5 text-base",
  icon: "h-10 w-10",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
