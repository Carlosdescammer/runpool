"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
}

const variantClasses: Record<string, string> = {
  default: "btn",
  primary: "btn btn-primary", 
  secondary: "btn btn-secondary",
  destructive: "btn btn-destructive",
  ghost: "btn btn-ghost",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(variantClasses[variant], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
