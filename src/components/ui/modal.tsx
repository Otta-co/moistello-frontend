"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useId,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw]",
} as const;

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: keyof typeof sizeClasses;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
  className,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const uniqueId = useId();
  const titleId = uniqueId;
  const descriptionId = description ? `${uniqueId}-desc` : undefined;

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      setMounted(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      const timer = setTimeout(() => {
        setMounted(false);
        if (previousActiveElement.current && typeof previousActiveElement.current.focus === "function") {
          previousActiveElement.current.focus();
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === "function") {
        previousActiveElement.current.focus();
      }
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !modalRef.current) return;

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            className={cn(
              "glass-flagship backdrop-blur-3xl rounded-2xl w-full mx-2 md:mx-0 overflow-hidden",
              "shadow-[0_4px_8px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.08),0_24px_64px_rgba(0,0,0,0.12)]",
              sizeClasses[size],
              className,
            )}
          >
            <div className="relative pb-3 mb-4 border-b border-border px-5 md:px-6 pt-5 md:pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2
                    id={titleId}
                    className="font-heading text-lg text-foreground"
                  >
                    {title}
                  </h2>
                  {description && (
                    <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
                      {description}
                    </p>
                  )}
                </div>
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="ml-4 shrink-0 rounded-full w-8 h-8 flex items-center justify-center glass-whisper text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors duration-200"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
            <div className="px-5 md:px-6 py-4 max-h-[70vh] overflow-y-auto">
              {children}
            </div>
            {footer && (
              <div className="flex items-center justify-end gap-3 pt-3 mt-4 border-t border-border px-5 md:px-6 pb-5 md:pb-6">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
