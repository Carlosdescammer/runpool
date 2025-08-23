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
  default: "bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:ring-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-600",
  primary: "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-400",
  secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus-visible:ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
  destructive: "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-400",
  ghost: "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800",
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
