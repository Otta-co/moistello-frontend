"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    } catch {
      // Clipboard not available
    }
  }, [text]);

  return (
    <motion.button
      type="button"
      onClick={handleCopy}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.94 }}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3 py-1.5",
        "text-xs font-mono font-medium tracking-tight",
        "transition-all duration-300",
        copied
          ? "glass-strong bg-success/10 text-success border border-success/20 shadow-[0_0_24px_rgba(16,185,129,0.15)]"
          : "glass-whisper text-muted-foreground hover:text-foreground hover:glass-strong",
        className,
      )}
      aria-label={copied ? "Copied" : label ?? "Copy to clipboard"}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="text-success"
          >
            <Check className="h-3.5 w-3.5" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
          >
            <Copy className="h-3.5 w-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
      <span className={cn(copied && "text-success")}>
        {label ? (copied ? "Copied!" : label) : copied ? "Copied!" : text}
      </span>
    </motion.button>
  );
}
