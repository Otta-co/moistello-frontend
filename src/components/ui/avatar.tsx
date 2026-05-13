"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
} as const;

const dotSizes = {
  xs: "w-1.5 h-1.5 -bottom-0.5 -right-0.5",
  sm: "w-2 h-2 -bottom-0.5 -right-0.5",
  md: "w-2.5 h-2.5 -bottom-0.5 -right-0.5",
  lg: "w-3 h-3 -bottom-0.5 -right-0.5",
  xl: "w-3.5 h-3.5 -bottom-0.5 -right-0.5",
} as const;

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback: string;
  size?: keyof typeof sizeClasses;
  online?: boolean;
}

export function Avatar({
  src,
  alt = "",
  fallback,
  size = "md",
  online,
  className,
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const showFallback = !src || hasError;
  const initials = fallback
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("relative inline-flex shrink-0", className)} {...props}>
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-full ring-2 ring-border",
          showFallback
            ? "gradient-bg text-white font-mono font-medium"
            : "bg-muted",
          sizeClasses[size],
        )}
        role="img"
        aria-label={alt || fallback}
      >
        {!showFallback && (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            onError={() => setHasError(true)}
            unoptimized
          />
        )}
        {showFallback && (
          <span className="font-mono font-medium leading-none select-none">
            {initials}
          </span>
        )}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            "absolute rounded-full ring-2 ring-background",
            dotSizes[size],
            online
              ? "bg-success animate-pulse-glow"
              : "bg-muted-foreground/40",
          )}
          aria-label={online ? "online" : "offline"}
        />
      )}
    </div>
  );
}
