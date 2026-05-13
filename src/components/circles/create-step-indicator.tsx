"use client"

import React from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/cn"

interface CreateStepIndicatorProps {
  currentStep: number
  steps: string[]
}

export function CreateStepIndicator({ currentStep, steps }: CreateStepIndicatorProps) {
  return (
    <div className="mb-10 px-4">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {steps.map((label, index) => {
          const step = index + 1
          const isCompleted = step < currentStep
          const isCurrent = step === currentStep
          const isLast = index === steps.length - 1

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                  }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-heading font-semibold transition-all duration-500",
                    isCompleted && "gradient-bg-extended text-white shadow-lg",
                    isCurrent && "gradient-bg text-white animate-pulse-glow shadow-xl",
                    !isCompleted && !isCurrent && "glass text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : step}
                </motion.div>
                <span
                  className={cn(
                    "mt-2 text-xs font-body font-medium",
                    isCurrent ? "gradient-text font-semibold" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "h-[2px] flex-1 mx-3 transition-colors duration-500",
                    step < currentStep
                      ? "bg-gradient-to-r from-aurora-violet to-aurora-cyan"
                      : "bg-white/5 dark:bg-white/[0.06]",
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
