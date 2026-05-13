"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastVariant = "default" | "success" | "error" | "warning";

interface ToastOptions {
  variant?: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return context;
}

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  default: <Info className="h-5 w-5" />,
  success: <CheckCircle className="h-5 w-5" />,
  error: <AlertCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
};

const variantIconColors: Record<ToastVariant, string> = {
  default: "text-muted-foreground",
  success: "text-success",
  error: "text-destructive",
  warning: "text-warning",
};

const variantGlow: Record<ToastVariant, string> = {
  default: "",
  success: "shadow-[0_0_20px_rgb(var(--success)/0.1)] border-success/20",
  error: "shadow-[0_0_20px_rgb(var(--destructive)/0.1)] border-destructive/20",
  warning: "shadow-[0_0_20px_rgb(var(--warning)/0.1)] border-warning/20",
};

export interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const duration = options.duration ?? 5000;

      setToasts((prev) => [...prev, { ...options, id }]);

      const timer = setTimeout(() => removeToast(id), duration);
      timersRef.current.set(id, timer);
    },
    [removeToast],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col gap-3"
          aria-live="polite"
          aria-relevant="additions removals"
        >
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                role="alert"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "glass-strong rounded-2xl flex w-80 items-start gap-3 p-4",
                  variantGlow[t.variant ?? "default"],
                )}
              >
                <span
                  className={cn(
                    "shrink-0 mt-0.5",
                    variantIconColors[t.variant ?? "default"],
                  )}
                  aria-hidden="true"
                >
                  {variantIcons[t.variant ?? "default"]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-sm font-medium text-foreground">
                    {t.title}
                  </p>
                  {t.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {t.description}
                    </p>
                  )}
                </div>
                <motion.button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className="shrink-0 rounded-full w-6 h-6 flex items-center justify-center glass-whisper text-muted-foreground hover:text-red-500 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
