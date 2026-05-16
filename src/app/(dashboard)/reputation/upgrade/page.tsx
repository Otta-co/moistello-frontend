"use client"

import React from "react"
import { motion } from "framer-motion"
import {
  Flame,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Lock,
  Crown,
  Gem,
  Star,
  Medal,
  Award,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { get } from "@/lib/api-client"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/cn"
import { TierCard } from "@/components/reputation/tier-card"
import type { ApiResponse, MoiScore } from "@/types"

type TierLevel = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond"

const TIER_ORDER: TierLevel[] = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"]

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

const TIER_THRESHOLDS: Record<TierLevel, number> = {
  Bronze: 0,
  Silver: 301,
  Gold: 601,
  Platinum: 851,
  Diamond: 951,
}

const TIER_COLORS: Record<TierLevel, { gradient: string; text: string; icon: React.ElementType; bg: string }> = {
  Bronze: {
    gradient: "from-amber-500 to-orange-600",
    text: "text-amber-400",
    icon: Medal,
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  Silver: {
    gradient: "from-slate-300 to-white",
    text: "text-slate-300",
    icon: Star,
    bg: "bg-slate-400/10 border-slate-400/20",
  },
  Gold: {
    gradient: "from-yellow-300 to-amber-400",
    text: "text-yellow-400",
    icon: Crown,
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  Platinum: {
    gradient: "from-cyan-300 to-blue-400",
    text: "text-cyan-400",
    icon: Gem,
    bg: "bg-cyan-400/10 border-cyan-400/20",
  },
  Diamond: {
    gradient: "from-violet-300 to-purple-400",
    text: "text-violet-400",
    icon: Sparkles,
    bg: "bg-violet-400/10 border-violet-400/20",
  },
}

function getTierLevel(score: number): TierLevel {
  if (score <= 300) return "Bronze"
  if (score <= 600) return "Silver"
  if (score <= 850) return "Gold"
  if (score <= 950) return "Platinum"
  return "Diamond"
}

function StatCard({
  label,
  value,
  icon,
  gradient,
  alert,
}: {
  label: string
  value: string
  icon: React.ReactNode
  gradient: string
  alert?: boolean
}) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className={cn(
        "glass rounded-2xl p-5 tilt-hover depth-3",
        alert && "border border-destructive/20",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br",
            gradient,
          )}
        >
          <span className={cn("text-white text-lg", alert && "text-destructive-foreground")}>
            {icon}
          </span>
        </div>
        <div>
          <p className="text-2xs tracking-wider uppercase text-muted-foreground font-body">
            {label}
          </p>
          <p className={cn("font-heading text-xl font-bold gradient-text mt-0.5", alert && "text-destructive")}>
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default function TierUpgradePage() {
  const { data: moiScore, isLoading, isError } = useQuery({
    queryKey: ["reputation"],
    queryFn: async () => {
      const response = await get<ApiResponse<MoiScore>>("/users/me/reputation")
      return response.data ?? null
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Tier & Benefits"
          description="Your membership tier, benefits, and upgrade path."
        />
        <Skeleton variant="card" className="h-72 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton variant="card" className="h-48 rounded-2xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tier & Benefits"
          description="Your membership tier, benefits, and upgrade path."
        />
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load data"
          description="Something went wrong. Please try again later."
        />
      </div>
    )
  }

  if (!moiScore) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tier & Benefits"
          description="Your membership tier, benefits, and upgrade path."
        />
        <EmptyState
          icon={<Award className="h-6 w-6" />}
          title="No reputation data"
          description="Start contributing to circles to build your MoiScore and unlock tiers."
          action={{
            label: "Browse Circles",
            onClick: () => (window.location.href = "/circles"),
          }}
        />
      </div>
    )
  }

  const score = moiScore.score
  const breakdown = moiScore.breakdown
  const currentTier = getTierLevel(score)
  const currentTierIndex = TIER_ORDER.indexOf(currentTier)
  const higherTiers = TIER_ORDER.slice(currentTierIndex + 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-8"
    >
      <PageHeader
        title="Tier & Benefits"
        description="Your membership tier, benefits, and upgrade path."
      />

      <TierCard
        score={score}
        streak={breakdown?.streaks ?? 0}
        completions={breakdown?.completions ?? 0}
        totalContributed={breakdown?.volume ?? 0}
        defaults={0}
      />

      {/* Circle History Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
      >
        <h2 className="font-heading text-xl font-bold gradient-text mb-5">
          Circle History
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Streak"
            value={`${breakdown?.streaks ?? 0}`}
            icon={<Flame className="h-5 w-5" />}
            gradient="from-amber-500 to-red-500"
          />
          <StatCard
            label="Completed"
            value={String(breakdown?.completions ?? 0)}
            icon={<CheckCircle className="h-5 w-5" />}
            gradient="from-emerald-500 to-green-600"
          />
          <StatCard
            label="Total Contributed"
            value={
              breakdown?.volume != null
                ? formatCurrency(breakdown.volume, "USDC")
                : "—"
            }
            icon={<TrendingUp className="h-5 w-5" />}
            gradient="from-aurora-indigo to-aurora-violet"
          />
          <StatCard
            label="Defaults"
            value="0"
            icon={<AlertTriangle className="h-5 w-5" />}
            gradient="from-red-500 to-rose-600"
            alert
          />
        </div>
      </motion.div>

      {/* Next Benefits Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="space-y-5"
      >
        <h2 className="font-heading text-xl font-bold gradient-text mb-5">
          Next Benefits
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Current Tier Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className={cn(
              "glass-premium rounded-2xl p-5 holo-border border-2",
              TIER_COLORS[currentTier].bg,
            )}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
                  TIER_COLORS[currentTier].gradient,
                )}
              >
                {React.createElement(TIER_COLORS[currentTier].icon, {
                  className: "h-6 w-6 text-white",
                })}
              </div>
              <div>
                <h3
                  className={cn(
                    "font-heading text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r",
                    TIER_COLORS[currentTier].gradient,
                  )}
                >
                  {currentTier}
                </h3>
                <Badge variant="success" size="sm">
                  Active Tier
                </Badge>
              </div>
            </div>
            <ul className="space-y-2">
              {BENEFITS[currentTier].map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-2 text-sm text-foreground/90 font-body"
                >
                  <span className="mt-0.5 shrink-0 text-emerald-400">&bull;</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Higher Tier Cards */}
          {higherTiers.map((tier, index) => {
            const tierColor = TIER_COLORS[tier]

            return (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + (index + 1) * 0.1, duration: 0.4 }}
                className="glass rounded-2xl p-5 opacity-50 hover:opacity-70 transition-opacity duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/30">
                    {React.createElement(tierColor.icon, {
                      className: "h-6 w-6 text-muted-foreground/50",
                    })}
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-muted-foreground">
                      {tier}
                    </h3>
                    <p className="text-xs text-muted-foreground/60 font-body flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Unlocks at {TIER_THRESHOLDS[tier]} points
                    </p>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {BENEFITS[tier].map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-2 text-sm text-muted-foreground/50 font-body"
                    >
                      <span className="mt-0.5 shrink-0 text-muted-foreground/40">&bull;</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
