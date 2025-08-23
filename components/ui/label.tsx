"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-[12px] font-semibold text-zinc-700 dark:text-zinc-300",
        className
      )}
      {...props}
    />
  )
);
Label.displayName = "Label";
