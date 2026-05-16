"use client"

import React from "react"
import { motion } from "framer-motion"
import {
  Award,
  Flame,
  CheckCircle,
  TrendingUp,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowUp,
  Shield,
  Zap,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { get } from "@/lib/api-client"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TierCard } from "@/components/reputation/tier-card"
import { formatCurrency, formatDate } from "@/lib/formatters"
import { MOI_SCORE_MAX } from "@/lib/constants"
import { cn } from "@/lib/cn"
import type { ApiResponse, MoiScore } from "@/types"

function getScoreLevel(score: number): {
  level: string
  variant: "default" | "warning" | "info" | "success" | "premium"
  glow: string
} {
  if (score <= 300) return { level: "Bronze", variant: "default", glow: "shadow-amber-500/20" }
  if (score <= 600) return { level: "Silver", variant: "info", glow: "shadow-slate-400/20" }
  if (score <= 850) return { level: "Gold", variant: "warning", glow: "shadow-yellow-500/20" }
  if (score <= 950) return { level: "Platinum", variant: "success", glow: "shadow-aurora-cyan/20" }
  return { level: "Diamond", variant: "premium", glow: "shadow-aurora-violet/20" }
}

function ScoreGauge({ score }: { score: number }) {
  const levelInfo = getScoreLevel(score)
  const percentage = Math.min(100, (score / MOI_SCORE_MAX) * 100)
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-flex items-center justify-center">
        <svg width="240" height="240" className="transform -rotate-90 drop-shadow-xl">
          <defs>
            <linearGradient id="moiScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="rgb(var(--aurora-amber))" />
              <stop offset="55%" stopColor="rgb(var(--success))" />
              <stop offset="85%" stopColor="rgb(var(--aurora-cyan))" />
              <stop offset="100%" stopColor="rgb(var(--aurora-violet))" />
            </linearGradient>
            <filter id="gaugeGlow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="rgb(255 255 255 / 0.06)"
            strokeWidth="12"
          />
          <motion.circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="url(#moiScoreGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            filter="url(#gaugeGlow)"
          />
          <circle cx="120" cy="120" r="4" fill="url(#moiScoreGradient)" className="animate-pulse-glow" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="font-heading text-6xl font-bold gradient-text-extended bg-clip-text text-transparent"
          >
            {score}
          </motion.span>
          <span className="text-xs text-muted-foreground mt-1">
            / {MOI_SCORE_MAX}
          </span>
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 400, damping: 20 }}
          >
            <Badge variant={levelInfo.variant} size="md" className={cn("mt-3", levelInfo.glow)}>
              {levelInfo.level}
            </Badge>
          </motion.span>
        </div>
      </div>
    </div>
  )
}

function BreakdownCard({
  label,
  value,
  icon,
  gradient,
}: {
  label: string
  value: string
  icon: React.ReactNode
  gradient: string
}) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="glass rounded-2xl p-5 tilt-hover depth-3"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br",
            gradient,
          )}
        >
          <span className="text-white text-lg">{icon}</span>
        </div>
        <div>
          <p className="text-2xs tracking-wider uppercase text-muted-foreground font-body">
            {label}
          </p>
          <p className="font-heading text-xl font-bold gradient-text mt-0.5">
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function HistoryChart({ history }: { history: { date: string; score: number }[] }) {
  const maxScore = MOI_SCORE_MAX

  return (
    <div className="glass-premium rounded-2xl p-6 holo-border">
      <h3 className="font-heading text-base font-semibold text-foreground dark:text-white mb-5">
        Score Over Time
      </h3>
      {history.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground font-body">
          No score history yet. Keep contributing to build your history!
        </p>
      ) : (
        <div className="flex items-end gap-2 h-48">
          {history.slice(-12).map((entry, index) => {
            const heightPct = Math.max(4, (entry.score / maxScore) * 100)
            const date = new Date(entry.date)
            const monthLabel = date.toLocaleDateString("en-US", { month: "short" })

            return (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                transition={{ delay: index * 0.04, duration: 0.4 }}
                className="flex flex-1 flex-col items-center gap-1.5 justify-end"
              >
                <span className="text-[10px] text-muted-foreground font-mono">
                  {Math.round(entry.score)}
                </span>
                <div className="w-full flex-1 flex items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ delay: 0.5 + index * 0.04, duration: 0.6, ease: "easeOut" }}
                    className="mx-auto w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-aurora-violet/70 to-aurora-cyan/70 hover:from-aurora-violet hover:to-aurora-cyan transition-all duration-300"
                    title={`${monthLabel}: ${entry.score}`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{monthLabel}</span>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ReputationPage() {
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
          title="MoiScore"
          description="Your on-chain reputation and contribution score."
        />
        <div className="flex justify-center">
          <Skeleton variant="circular" width={240} height={240} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton variant="card" className="h-56 rounded-2xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="MoiScore"
          description="Your on-chain reputation and contribution score."
        />
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load reputation"
          description="Something went wrong. Please try again later."
        />
      </div>
    )
  }

  if (!moiScore) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="MoiScore"
          description="Your on-chain reputation and contribution score."
        />
        <EmptyState
          icon={<Award className="h-6 w-6" />}
          title="No reputation data"
          description="Start contributing to circles to build your MoiScore."
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="MoiScore"
        description="Your on-chain reputation and contribution score. Higher scores unlock better circles."
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex justify-center"
      >
        <ScoreGauge score={score} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
      >
        <TierCard
          score={score}
          streak={breakdown?.streaks ?? 0}
          completions={breakdown?.completions ?? 0}
          totalContributed={breakdown?.volume ?? 0}
          defaults={0}
        />
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BreakdownCard
          label="Streaks"
          value={`${breakdown?.streaks ?? 0}`}
          icon={<Flame className="h-5 w-5" />}
          gradient="from-amber-500 to-red-500"
        />
        <BreakdownCard
          label="Completed"
          value={String(breakdown?.completions ?? 0)}
          icon={<CheckCircle className="h-5 w-5" />}
          gradient="from-emerald-500 to-green-600"
        />
        <BreakdownCard
          label="Volume"
          value={
            breakdown?.volume != null
              ? formatCurrency(breakdown.volume, "USDC")
              : "—"
          }
          icon={<TrendingUp className="h-5 w-5" />}
          gradient="from-aurora-indigo to-aurora-violet"
        />
        <BreakdownCard
          label="Recency"
          value={
            breakdown?.recency != null
              ? formatDate(new Date(breakdown.recency * 1000))
              : "—"
          }
          icon={<Clock className="h-5 w-5" />}
          gradient="from-aurora-cyan to-aurora-indigo"
        />
      </div>

      <HistoryChart
        history={(moiScore.history ?? []).map((entry) => ({
          date: entry.date,
          score: entry.score,
        }))}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-whisper rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 gradient-text" />
          <h3 className="font-heading text-sm font-semibold text-foreground dark:text-white">
            How to Improve Your Score
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: <Zap className="h-4 w-4" />,
              title: "Stay Consistent",
              desc: "Maintain contribution streaks. Missing deadlines hurts your score.",
            },
            {
              icon: <Shield className="h-4 w-4" />,
              title: "Complete Circles",
              desc: "Finishing circles boosts your trust rating significantly.",
            },
            {
              icon: <ArrowUp className="h-4 w-4" />,
              title: "Increase Volume",
              desc: "Higher contribution amounts signal stronger commitment.",
            },
          ].map((tip) => (
            <div key={tip.title} className="glass rounded-xl p-3">
              <span className="gradient-text">{tip.icon}</span>
              <p className="text-xs font-heading font-semibold text-foreground dark:text-white mt-1.5">
                {tip.title}
              </p>
              <p className="text-2xs text-muted-foreground mt-0.5">{tip.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
