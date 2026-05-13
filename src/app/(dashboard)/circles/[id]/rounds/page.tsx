"use client"

import React, { useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, CheckCircle, Inbox, RotateCw } from "lucide-react"
import { useCircle, useCircleRounds } from "@/hooks/use-circles"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/cn"
import type { Contribution, ContributionStatus } from "@/types"

const statusStyles: Record<
  ContributionStatus,
  { variant: "success" | "warning" | "destructive" | "default" }
> = {
  completed: { variant: "success" },
  pending: { variant: "warning" },
  missed: { variant: "destructive" },
  late: { variant: "destructive" },
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const roundItem = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1 },
}

export default function CircleRoundsPage() {
  const params = useParams()
  const circleId = params.id as string

  const { data: circle } = useCircle(circleId)
  const { data: rounds = [], isLoading, isError } = useCircleRounds(circleId)

  const groupedRounds = useMemo(() => {
    const map = new Map<number, Contribution[]>()
    for (const r of rounds) {
      const existing = map.get(r.roundNumber) || []
      existing.push(r)
      map.set(r.roundNumber, existing)
    }
    const entries: [number, Contribution[]][] = []
    map.forEach((value, key) => entries.push([key, value]))
    return entries
      .sort(([a], [b]) => b - a)
      .map(([num, contributions]) => ({
        roundNumber: num,
        contributions,
        isCurrent: num === (circle?.currentRound ?? 0),
        isCompleted: num < (circle?.currentRound ?? 0),
        isUpcoming: num > (circle?.currentRound ?? 0),
      }))
  }, [rounds, circle])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Rounds"
          breadcrumbs={[
            { label: "Circles", href: "/circles" },
            { label: "Circle", href: `/circles/${circleId}` },
            { label: "Rounds" },
          ]}
          action={
            <Link href={`/circles/${circleId}`}>
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Back
              </Button>
            </Link>
          }
        />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="card" className="h-40 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Rounds"
          breadcrumbs={[
            { label: "Circles", href: "/circles" },
            { label: "Circle", href: `/circles/${circleId}` },
            { label: "Rounds" },
          ]}
          action={
            <Link href={`/circles/${circleId}`}>
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Back
              </Button>
            </Link>
          }
        />
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="Failed to load rounds"
          description="Something went wrong. Please try again."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rounds"
        description="Round history and contribution tracking"
        breadcrumbs={[
          { label: "Circles", href: "/circles" },
          { label: circle?.name ?? "Circle", href: `/circles/${circleId}` },
          { label: "Rounds" },
        ]}
        action={
          <Link href={`/circles/${circleId}`}>
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to Circle
            </Button>
          </Link>
        }
      />

      {groupedRounds.length === 0 ? (
        <EmptyState
          icon={<RotateCw className="h-6 w-6" />}
          title="No rounds yet"
          description="Round data will appear here once the circle starts."
        />
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {groupedRounds.map((round) => (
            <motion.div
              key={round.roundNumber}
              variants={roundItem}
              className={cn(
                "glass-premium rounded-2xl p-5 md:p-6",
                round.isCurrent && "holo-border",
              )}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-heading font-semibold",
                      round.isCompleted && "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
                      round.isCurrent && "gradient-bg text-white animate-pulse-glow shadow-xl",
                      round.isUpcoming && "glass text-muted-foreground",
                    )}
                  >
                    {round.isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      round.roundNumber
                    )}
                  </motion.div>
                  <div>
                    <p className="font-heading font-semibold text-foreground dark:text-white text-base">
                      Round {round.roundNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {round.isCompleted
                        ? "Completed"
                        : round.isCurrent
                          ? "In Progress"
                          : "Upcoming"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    round.isCompleted
                      ? "success"
                      : round.isCurrent
                        ? "primary"
                        : "default"
                  }
                  size="sm"
                >
                  {round.isCompleted ? "Completed" : round.isCurrent ? "Current" : "Upcoming"}
                </Badge>
              </div>

              {round.contributions.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="glass-strong">
                        <th className="px-4 py-2.5 text-left text-2xs font-heading tracking-wider uppercase text-muted-foreground">
                          Contributor
                        </th>
                        <th className="px-4 py-2.5 text-left text-2xs font-heading tracking-wider uppercase text-muted-foreground">
                          Amount
                        </th>
                        <th className="px-4 py-2.5 text-right text-2xs font-heading tracking-wider uppercase text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {round.contributions.map((c) => {
                        const st = statusStyles[c.status] || statusStyles.pending
                        const label = c.onTime ? "On Time" : c.status
                        return (
                          <tr
                            key={c.id}
                            className="hover:glass-whisper transition-colors"
                          >
                            <td className="px-4 py-2.5 font-mono text-xs text-foreground dark:text-white">
                              {c.userId.slice(0, 8)}...
                            </td>
                            <td className="px-4 py-2.5 text-sm gradient-text font-bold font-heading">
                              {formatCurrency(c.amount, circle?.currency ?? "USDC")}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <Badge
                                variant={c.onTime ? "success" : st.variant}
                                size="sm"
                              >
                                {label}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {round.contributions.length === 0 && (
                <p className="text-sm text-muted-foreground py-4">
                  No contributions recorded for this round yet.
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
