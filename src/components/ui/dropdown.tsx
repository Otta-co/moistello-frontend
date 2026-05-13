"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
}

const DropdownContext = createContext<DropdownContextValue | undefined>(
  undefined,
);

function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown components must be used within a <Dropdown>");
  }
  return context;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}

export function Dropdown({
  trigger,
  children,
  className,
  align = "left",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleClickOutside, handleEscape]);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
      <div ref={containerRef} className={cn("relative inline-block", className)}>
        <div
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          role="button"
          tabIndex={0}
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          {trigger}
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              role="menu"
              aria-orientation="vertical"
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "absolute z-50 mt-1 min-w-[200px] overflow-hidden rounded-2xl glass-strong p-1.5",
                align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left",
              )}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DropdownContext.Provider>
  );
}

export interface DropdownItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  destructive?: boolean;
}

export function DropdownItem({
  icon,
  destructive = false,
  className,
  children,
  onClick,
  ...props
}: DropdownItemProps) {
  const { setIsOpen } = useDropdownContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    setIsOpen(false);
  };

  return (
    <button
      role="menuitem"
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors duration-150",
        "focus-visible:outline-none focus-visible:bg-white/5",
        destructive
          ? "text-destructive hover:bg-red-500/10"
          : "text-foreground/80 hover:glass-whisper hover:text-foreground",
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="shrink-0 text-muted-foreground w-4 h-4" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
