"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
} as const;

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof sizeClasses;
  text?: string;
}

export function LoadingSpinner({
  size = "md",
  text,
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "inline-flex flex-col items-center justify-center gap-3",
        className,
      )}
      role="status"
      aria-label={text || "Loading"}
      {...props}
    >
      <Loader2
        className={cn(
          "animate-spin gradient-text-extended",
          sizeClasses[size],
        )}
      />
      {text && (
        <span className="font-body text-sm text-muted-foreground animate-shimmer bg-clip-text">
          {text}
        </span>
      )}
    </div>
  );
}
