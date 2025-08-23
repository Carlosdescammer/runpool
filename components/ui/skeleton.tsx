"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
};

export function Skeleton({ className, rounded = "lg", ...props }: SkeletonProps) {
  const r = {
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  }[rounded];

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-zinc-200 dark:bg-zinc-800",
        "animate-pulse",
        r,
        className
      )}
      aria-busy="true"
      {...props}
    />
  );
}
