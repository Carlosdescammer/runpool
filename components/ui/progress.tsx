"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ProgressProps = {
  value?: number; // 0-100
  className?: string;
  label?: string;
};

export function Progress({ value = 0, className, label }: ProgressProps) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800",
        className
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      aria-label={label}
    >
      <div
        className={cn(
          "h-full w-0 rounded-full bg-indigo-500 transition-all duration-500 ease-out",
          "dark:bg-indigo-400"
        )}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
