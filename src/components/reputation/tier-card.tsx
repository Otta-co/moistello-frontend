"use client"

import React from "react"
import { motion } from "framer-motion"
import {
  Award,
  Check,
  Lock,
  ChevronUp,
  Sparkles,


  Crown,
  Gem,
  Star,
  Medal,
} from "lucide-react"
import { cn } from "@/lib/cn"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

type TierLevel = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond"

interface TierVisual {
  level: TierLevel
  icon: React.ElementType
  textGradient: string
  glow: string
  bgGradient: string
  borderColor: string
  badgeVariant: "default" | "warning" | "info" | "success" | "premium"
  accentColor: string
}

const tierVisuals: Record<TierLevel, TierVisual> = {
  Bronze: {
    level: "Bronze",
    icon: Medal,
    textGradient: "from-amber-500 to-orange-600",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.3)]",
    bgGradient: "from-amber-950/40 to-orange-950/30",
    borderColor: "border-amber-500/30",
    badgeVariant: "default",
    accentColor: "bg-amber-500",
  },
  Silver: {
    level: "Silver",
    icon: Star,
    textGradient: "from-slate-300 to-white",
    glow: "shadow-[0_0_30px_rgba(203,213,225,0.3)]",
    bgGradient: "from-slate-900/40 to-slate-800/30",
    borderColor: "border-slate-400/30",
    badgeVariant: "info",
    accentColor: "bg-slate-400",
  },
  Gold: {
    level: "Gold",
    icon: Crown,
    textGradient: "from-yellow-300 to-amber-400",
    glow: "shadow-[0_0_30px_rgba(234,179,8,0.4)]",
    bgGradient: "from-yellow-950/40 to-amber-900/30",
    borderColor: "border-yellow-500/40",
    badgeVariant: "warning",
    accentColor: "bg-yellow-500",
  },
  Platinum: {
    level: "Platinum",
    icon: Gem,
    textGradient: "from-cyan-300 to-blue-400",
    glow: "shadow-[0_0_30px_rgba(6,182,212,0.3)]",
    bgGradient: "from-cyan-950/40 to-blue-950/30",
    borderColor: "border-cyan-400/30",
    badgeVariant: "success",
    accentColor: "bg-cyan-400",
  },
  Diamond: {
    level: "Diamond",
    icon: Sparkles,
    textGradient: "from-violet-300 to-purple-400",
    glow: "shadow-[0_0_30px_rgba(139,92,246,0.4)]",
    bgGradient: "from-violet-950/40 to-purple-950/30",
    borderColor: "border-violet-400/40",
    badgeVariant: "premium",
    accentColor: "bg-violet-400",
  },
}

const TIER_ORDER: TierLevel[] = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"]

const TIER_THRESHOLDS: { min: number; max: number }[] = [
  { min: 0, max: 300 },
  { min: 301, max: 600 },
  { min: 601, max: 850 },
  { min: 851, max: 950 },
  { min: 951, max: 1000 },
]

const BENEFITS: Record<TierLevel, string[]> = {
  Bronze: [
    "Create circles (up to 5 members)",
    "Contribute up to 100 USDC",
    "Basic collateral (10%)",
  ],
  Silver: [
    "Create circles (up to 10 members)",
    "Contribute up to 500 USDC",
    "Reduced collateral (5%)",
  ],
  Gold: [
    "Create circles (up to 20 members)",
    "Contribute up to 2,000 USDC",
    "Low collateral (3%)",
    "Access to auction payouts",
  ],
  Platinum: [
    "Create circles (up to 50 members)",
    "Contribute up to 10,000 USDC",
    "Minimal collateral (1%)",
    "Vote payout priority",
  ],
  Diamond: [
    "Create circles (up to 100 members)",
    "Contribute up to 50,000 USDC",
    "Zero collateral (0%)",
    "Governance proposal rights",
    "Early feature access",
  ],
}

export interface TierCardProps {
  score: number
  streak: number
  completions: number
  totalContributed: number
  defaults: number
}

function getTierIndex(score: number): number {
  if (score <= 300) return 0
  if (score <= 600) return 1
  if (score <= 850) return 2
  if (score <= 950) return 3
  return 4
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
}

function TierBadgeGlow({
  level,
  size = "lg",
}: {
  level: TierLevel
  size?: "lg" | "sm"
}) {
  const visuals = tierVisuals[level]
  const Icon = visuals.icon
  const isLarge = size === "lg"

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-3xl border",
        visuals.bgGradient,
        visuals.borderColor,
        visuals.glow,
        isLarge ? "w-36 h-36 p-4" : "w-16 h-16 p-2",
      )}
    >
      {level === "Gold" && (
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
          aria-hidden="true"
        >
          <motion.div
            className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 0.8,
            }}
          />
        </motion.div>
      )}
      {level === "Platinum" && (
        <motion.div
          className="absolute inset-0 rounded-3xl"
          animate={{ boxShadow: ["0 0 20px rgba(6,182,212,0.2)", "0 0 40px rgba(6,182,212,0.5)", "0 0 20px rgba(6,182,212,0.2)"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {level === "Diamond" && (
        <motion.div
          className="absolute inset-0 rounded-3xl border-2 border-transparent"
          style={{
            background: "linear-gradient(90deg, #a78bfa, #818cf8, #22d3ee, #34d399, #a78bfa) border-box",
            WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
          animate={{ backgroundPosition: ["0% 50%", "200% 50%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      )}
      {level === "Silver" && (
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
          aria-hidden="true"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-px w-2 bg-white/40 rounded-full"
              style={{
                left: `${15 + (i * 13)}%`,
                top: `${10 + (i % 3) * 30}%`,
              }}
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      )}
      <Icon
        className={cn(
          "mb-1",
          isLarge ? "h-10 w-10" : "h-5 w-5",
          "drop-shadow-[0_0_6px_currentColor]",
        )}
        style={{
          color:
            level === "Bronze"
              ? "#f59e0b"
              : level === "Silver"
                ? "#cbd5e1"
                : level === "Gold"
                  ? "#eab308"
                  : level === "Platinum"
                    ? "#22d3ee"
                    : "#a78bfa",
        }}
      />
      <span
        className={cn(
          "font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r",
          visuals.textGradient,
          isLarge ? "text-sm" : "text-[10px]",
        )}
      >
        {level}
      </span>
    </motion.div>
  )
}

function NextTierGhost({ level }: { level: TierLevel | null }) {
  if (!level) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-4 w-4 text-aurora-violet" />
        <span className="font-heading font-semibold">Max Tier Reached</span>
      </div>
    )
  }

  const visuals = tierVisuals[level]
  const Icon = visuals.icon

  return (
    <div className="flex items-center gap-2 opacity-30">
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border w-10 h-10",
          visuals.bgGradient,
          visuals.borderColor,
        )}
      >
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <span className="text-xs font-heading font-semibold text-muted-foreground">
          {level}
        </span>
        <p className="text-2xs text-muted-foreground">Next tier</p>
      </div>
    </div>
  )
}

export function TierCard({ score }: TierCardProps) {
  const tierIndex = getTierIndex(score)
  const currentTier = TIER_ORDER[tierIndex]
  const nextTier = tierIndex < 4 ? TIER_ORDER[tierIndex + 1] : null
  const visuals = tierVisuals[currentTier]

  const threshold = TIER_THRESHOLDS[tierIndex]
  const range = threshold.max - threshold.min
  const progress = Math.max(0, Math.min(100, ((score - threshold.min) / range) * 100))
  const pointsToNext =
    nextTier !== null
      ? TIER_THRESHOLDS[tierIndex + 1].min - score
      : 0

  const currentBenefits = BENEFITS[currentTier]
  const lockedBenefits = nextTier ? BENEFITS[nextTier] : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="glass-premium rounded-2xl p-6 md:p-8 holo-border depth-4"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* LEFT COLUMN: Tier Badge + Progress */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center lg:items-start gap-5"
        >
          <div className="flex items-center gap-4">
            <TierBadgeGlow level={currentTier} size="lg" />
            <div className="hidden lg:block">
              <span className="text-5xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                {score}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5 font-body">
                Your MoiScore
              </p>
            </div>
          </div>

          <div className="lg:hidden text-center">
            <span className="text-4xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              {score}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5 font-body">
              Your MoiScore
            </p>
          </div>

          <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">
                Progress to{" "}
                <span className={cn("bg-clip-text text-transparent bg-gradient-to-r", tierVisuals[nextTier ?? currentTier].textGradient)}>
                  {nextTier ?? "Max"}
                </span>
              </span>
              <span className="text-2xs font-mono text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress
              value={progress}
              variant="premium"
              size="lg"
            />
            {pointsToNext > 0 ? (
              <p className="text-xs text-muted-foreground font-body">
                <span className="font-heading font-bold text-foreground">
                  {pointsToNext}
                </span>{" "}
                points to {nextTier}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-aurora-violet" />
                Maximum tier achieved
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1">
            <Badge variant={visuals.badgeVariant} size="md" className={visuals.glow}>
              {currentTier}
            </Badge>
            {nextTier && (
              <>
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                <NextTierGhost level={nextTier} />
              </>
            )}
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Benefits */}
        <motion.div variants={itemVariants} className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 gradient-text" />
              <h3 className="font-heading text-base font-semibold text-foreground dark:text-white">
                Your Benefits
              </h3>
            </div>
            <ul className="space-y-2.5">
              {currentBenefits.map((benefit) => (
                <motion.li
                  key={benefit}
                  variants={itemVariants}
                  className="flex items-start gap-2.5 text-sm text-foreground/90 font-body"
                >
                  <span className="mt-0.5 shrink-0 rounded-full bg-emerald-500/15 p-0.5">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </span>
                  {benefit}
                </motion.li>
              ))}
            </ul>
          </div>

          {lockedBenefits.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-heading text-sm font-semibold text-muted-foreground">
                  Locked &mdash; {nextTier} Benefits
                </h4>
              </div>
              <ul className="space-y-2">
                {lockedBenefits.map((benefit) => (
                  <motion.li
                    key={benefit}
                    variants={itemVariants}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground/60 font-body"
                  >
                    <span className="mt-0.5 shrink-0 rounded-full bg-muted/40 p-0.5">
                      <Lock className="h-3 w-3 text-muted-foreground/40" />
                    </span>
                    {benefit}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
