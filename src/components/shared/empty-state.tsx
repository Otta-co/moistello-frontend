"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "glass-premium rounded-3xl p-8 md:p-12 max-w-md mx-auto flex flex-col items-center text-center",
        className,
      )}
    >
      <div
        className="flex h-14 w-14 items-center justify-center gradient-bg rounded-2xl p-3 text-white"
        aria-hidden="true"
      >
        <span className="w-8 h-8 [&>*]:w-full [&>*]:h-full">{icon}</span>
      </div>
      <h3 className="font-heading text-xl md:text-2xl text-foreground mt-6">
        {title}
      </h3>
      {description && (
        <p className="text-muted-foreground mt-2 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="outline"
          size="md"
          onClick={action.onClick}
          className="mt-6"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
