"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  CircleDot,
  ArrowUpCircle,
  ArrowDownCircle,
  Award,
  Users,
  Plus,
  Clock,
  Shield,
  Inbox,
} from "lucide-react"
import { useCircles } from "@/hooks/use-circles"
import { useAuth } from "@/hooks/use-auth"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/cn"
import type { Circle } from "@/types"

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const fadeInItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
}

function StatCard({
  label,
  value,
  icon,
  gradient,
  pulseGlow,
}: {
  label: string
  value: string
  icon: React.ReactNode
  gradient: string
  pulseGlow?: boolean
}) {
  return (
    <motion.div
      variants={fadeInItem}
      whileHover={{ y: -3, transition: { duration: 0.25 } }}
      className="glass rounded-2xl p-5 tilt-hover depth-2"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-2xs tracking-wider uppercase text-muted-foreground font-body dark:text-muted-foreground/80">
            {label}
          </p>
          <p className="font-heading text-2xl font-bold gradient-text">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br",
            gradient,
            pulseGlow && "animate-pulse-glow",
          )}
        >
          <span className="text-white">{icon}</span>
        </div>
      </div>
    </motion.div>
  )
}

function CircleCard({ circle }: { circle: Circle }) {
  const freqLabel =
    circle.frequency.charAt(0).toUpperCase() + circle.frequency.slice(1)
  const memberCount = circle.memberCount ?? 0
  const progressPct = Math.min(
    100,
    Math.round((circle.currentRound / (circle.maxMembers || 1)) * 100),
  )

  return (
    <Link href={`/circles/${circle.id}`}>
      <motion.div
        variants={fadeInItem}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="glass rounded-2xl p-5 tilt-hover cursor-pointer holo-border"
      >
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-heading text-lg font-semibold text-foreground dark:text-white truncate">
            {circle.name}
          </h4>
          <Badge
            variant={circle.status === "active" ? "success" : circle.status === "pending" ? "warning" : "default"}
            size="sm"
          >
            {circle.status}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-sm text-muted-foreground">
          <span className="gradient-text font-bold font-heading">
            {formatCurrency(circle.contributionAmount, circle.currency)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {memberCount}/{circle.maxMembers}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {freqLabel}
          </span>
          {circle.minMoiScore != null && circle.minMoiScore > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-400 text-xs">
              <Shield className="h-3 w-3" />
              {circle.minMoiScore}+
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-2xs text-muted-foreground">
            <span>Round Progress</span>
            <span>
              {circle.currentRound}/{circle.maxMembers}
            </span>
          </div>
          <Progress value={progressPct} size="sm" variant={progressPct >= 80 ? "success" : "primary"} />
        </div>
      </motion.div>
    </Link>
  )
}

function CreateCircleCard() {
  return (
    <Link href="/circles/create">
      <motion.div
        variants={fadeInItem}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="glass-whisper rounded-2xl p-5 flex flex-col items-center justify-center text-center min-h-[160px] cursor-pointer holo-border border-dashed"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-aurora-violet/20 to-aurora-cyan/20 text-aurora-violet mb-3 animate-pulse-glow">
          <Plus className="h-6 w-6" />
        </div>
        <p className="font-heading text-sm font-semibold text-foreground dark:text-white">
          Start a Circle
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Create a new savings circle
        </p>
      </motion.div>
    </Link>
  )
}

function ActivityTimelineItem({
  description,
  amount,
  date,
}: {
  description: string
  amount: string
  date: string
}) {
  return (
    <motion.div
      variants={fadeInItem}
      className="glass-whisper rounded-xl p-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aurora-indigo/20 to-aurora-violet/20">
          <ArrowUpCircle className="h-4 w-4 text-aurora-violet" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-foreground dark:text-white truncate font-body">
            {description}
          </p>
          <p className="text-2xs text-muted-foreground">
            {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
      </div>
      <span className="gradient-text text-sm font-bold font-heading shrink-0 ml-3">
        {amount}
      </span>
    </motion.div>
  )
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { data, isLoading: circlesLoading } = useCircles()

  const circles = useMemo(() => data?.circles ?? [], [data])
  const isLoading = authLoading || circlesLoading

  const stats = useMemo(() => {
    const activeCircles = circles.filter((c) => c.status === "active").length
    const totalContributed = circles.reduce(
      (sum, c) => sum + (c.totalContributions ?? 0),
      0,
    )
    return {
      activeCircles,
      totalContributed: formatCurrency(totalContributed, "USDC"),
      totalReceived: formatCurrency(activeCircles * 250, "USDC"),
      moiScore: String(user?.moiScore ?? 0),
    }
  }, [circles, user])

  const moiHighScore = (user?.moiScore ?? 0) >= 600

  const recentActivity = useMemo(() => {
    return circles
      .filter((c) => c.status === "active")
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        description: `Contribution in ${c.name}`,
        amount: formatCurrency(c.contributionAmount, c.currency),
        date: c.createdAt,
      }))
  }, [circles])

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Dashboard" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton variant="heading" className="rounded-xl h-6 w-36" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="card" className="h-40 rounded-2xl" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton variant="heading" className="rounded-xl h-6 w-40" />
            <Skeleton variant="card" className="h-72 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's a summary of your savings circles."
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard
          label="Active Circles"
          value={String(stats.activeCircles)}
          icon={<CircleDot className="h-5 w-5" />}
          gradient="from-aurora-indigo to-aurora-violet"
        />
        <StatCard
          label="Total Contributed"
          value={stats.totalContributed}
          icon={<ArrowUpCircle className="h-5 w-5" />}
          gradient="from-aurora-cyan to-aurora-indigo"
        />
        <StatCard
          label="Total Received"
          value={stats.totalReceived}
          icon={<ArrowDownCircle className="h-5 w-5" />}
          gradient="from-emerald-500 to-aurora-cyan"
        />
        <StatCard
          label="MoiScore"
          value={stats.moiScore}
          icon={<Award className="h-5 w-5" />}
          gradient="from-aurora-amber to-aurora-violet"
          pulseGlow={moiHighScore}
        />
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold text-foreground dark:text-white">
              Your Circles
            </h3>
            <Link
              href="/circles"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
            >
              Browse all &rarr;
            </Link>
          </div>

          {circles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {circles.slice(0, 4).map((circle) => (
                <CircleCard key={circle.id} circle={circle} />
              ))}
              <CreateCircleCard />
            </div>
          ) : (
            <motion.div variants={fadeInItem}>
              <EmptyState
                icon={<Users className="h-6 w-6" />}
                title="No circles yet"
                description="You haven't joined any circles. Browse available circles or create your own."
                action={{
                  label: "Create Circle",
                  onClick: () => {
                    window.location.href = "/circles/create"
                  },
                }}
              />
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-foreground dark:text-white">
            Recent Activity
          </h3>

          {recentActivity.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="glass rounded-2xl p-5 holo-border"
            >
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <ActivityTimelineItem
                    key={item.id}
                    description={item.description}
                    amount={item.amount}
                    date={item.date}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="No activity yet"
              description="Your circle activity will appear here."
            />
          )}
        </div>
      </motion.div>
    </div>
  )
}
