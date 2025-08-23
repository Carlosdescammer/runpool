"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

type AvatarProps = {
  src?: string | null;
  alt?: string;
  name?: string | null;
  size?: keyof typeof sizeMap;
  className?: string;
};

export function Avatar({ src, alt, name, size = "md", className }: AvatarProps) {
  const [errored, setErrored] = React.useState(false);
  const showImg = src && !errored;

  const initials = React.useMemo(() => {
    const base = (name || alt || "").trim();
    if (!base) return "";
    const parts = base.split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return (first + last).toUpperCase();
  }, [name, alt]);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-zinc-700",
        sizeMap[size],
        className
      )}
      aria-label={alt || name}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src || undefined}
          alt={alt || name || "avatar"}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span className="font-semibold">{initials || ""}</span>
      )}
    </span>
  );
}
