"use client";

import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/cn";

interface ToastProviderProps {
  children: ReactNode;
}

const typeIcons: Record<string, ReactNode> = {
  success: <CheckCircle className="h-5 w-5" />,
  error: <AlertCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
};

const typeStyles: Record<string, string> = {
  success: "border-green-300 bg-green-50",
  error: "border-red-300 bg-red-50",
  warning: "border-yellow-300 bg-yellow-50",
  info: "border-blue-300 bg-blue-50",
};

const typeIconColors: Record<string, string> = {
  success: "text-green-600",
  error: "text-red-600",
  warning: "text-yellow-600",
  info: "text-blue-600",
};

export function ToastProvider({ children }: ToastProviderProps) {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {children}
      {mounted &&
        createPortal(
          <div
            className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2"
            aria-live="polite"
            aria-relevant="additions removals"
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                role="alert"
                className={cn(
                  "flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300",
                  typeStyles[t.type] ?? typeStyles.info,
                  "translate-x-0 opacity-100"
                )}
              >
                <span
                  className={cn(
                    "shrink-0",
                    typeIconColors[t.type] ?? typeIconColors.info
                  )}
                  aria-hidden="true"
                >
                  {typeIcons[t.type] ?? typeIcons.info}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {t.title}
                  </p>
                  {t.description && (
                    <p className="mt-0.5 text-sm text-gray-600">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
