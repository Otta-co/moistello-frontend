"use client";

import React from "react";
import { cn } from "@/lib/cn";

const variantClasses = {
  text: "h-4 w-full rounded",
  heading: "h-6 w-3/4 rounded",
  circular: "rounded-full",
  card: "rounded-2xl h-48",
  rectangular: "rounded-xl",
} as const;

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variantClasses;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer bg-muted",
        variant === "circular" && "aspect-square",
        variantClasses[variant],
        className,
      )}
      style={{
        width: width ?? style?.width,
        height: variant === "circular" ? (height ?? width ?? style?.height) : (height ?? style?.height),
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}
