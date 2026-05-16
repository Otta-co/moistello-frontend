"use client"

import React, { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  DollarSign,
  Clock,
  Users,
  RotateCw,
  Hash,
  ChevronRight,
  Shield,
  Inbox,
  CheckCircle,
  UserPlus,
  Settings,
  Wallet,
} from "lucide-react"
import { useCircle, useCircleMembers, useContribute } from "@/hooks/use-circles"
import { useAuth } from "@/hooks/use-auth"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/cn"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const cardItem = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1 },
}

function GlassStatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <motion.div
      variants={cardItem}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="glass rounded-2xl p-5 tilt-hover depth-2"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aurora-violet/20 to-aurora-indigo/20">
          <span className="gradient-text">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-2xs tracking-wider uppercase text-muted-foreground font-body">
            {label}
          </p>
          <p className="font-heading text-xl font-bold text-foreground dark:text-white truncate">
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default function CircleDetailPage() {
  const params = useParams()
  const circleId = params.id as string

  const { user } = useAuth()
  const { data: circle, isLoading, isError } = useCircle(circleId)
  const { data: members = [] } = useCircleMembers(circleId)
  const contribute = useContribute(circleId)

  const [showContributeModal, setShowContributeModal] = useState(false)

  const isOrganizer = user?.id === circle?.organizerId
  const isMember = members.some((m) => m.userId === user?.id)
  const canJoin =
    circle && !isMember && (circle.status === "pending" || circle.status === "active")
  const canContribute = isMember && circle?.status === "active"

  const freqLabel = circle
    ? circle.frequency.charAt(0).toUpperCase() + circle.frequency.slice(1)
    : ""

  const overviewCards = useMemo(() => {
    if (!circle) return []
    return [
      {
        label: "Contribution",
        value: formatCurrency(circle.contributionAmount, circle.currency),
        icon: <DollarSign className="h-4 w-4" />,
      },
      {
        label: "Frequency",
        value: freqLabel,
        icon: <Clock className="h-4 w-4" />,
      },
      {
        label: "Payout Type",
        value: circle.payoutType.charAt(0).toUpperCase() + circle.payoutType.slice(1),
        icon: <Shield className="h-4 w-4" />,
      },
      {
        label: "Members",
        value: `${circle.memberCount ?? members.length}/${circle.maxMembers}`,
        icon: <Users className="h-4 w-4" />,
      },
      {
        label: "Current Round",
        value: `Round ${circle.currentRound}/${circle.maxMembers}`,
        icon: <RotateCw className="h-4 w-4" />,
      },
      {
        label: "Your Position",
        value: isMember
          ? `#${members.find((m) => m.userId === user?.id)?.position ?? "—"}`
          : "Not a member",
        icon: <Hash className="h-4 w-4" />,
      },
    ]
  }, [circle, freqLabel, members, isMember, user])

  const handleContribute = () => {
    if (!circle) return
    contribute.mutate(
      { amount: circle.contributionAmount },
      { onSuccess: () => setShowContributeModal(false) },
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title=""
          breadcrumbs={[{ label: "Circles", href: "/circles" }, { label: "..." }]}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton variant="card" className="h-32 rounded-2xl" />
        <Skeleton variant="card" className="h-48 rounded-2xl" />
      </div>
    )
  }

  if (isError || !circle) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Circle Not Found"
          breadcrumbs={[{ label: "Circles", href: "/circles" }, { label: "Not Found" }]}
        />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-flagship rounded-2xl flex flex-col items-center justify-center py-20 holo-border"
        >
          <Inbox className="mb-4 h-14 w-14 text-muted-foreground" />
          <p className="font-heading text-xl font-semibold text-foreground dark:text-white">
            Circle not found
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            The circle you are looking for does not exist or has been removed.
          </p>
          <Link href="/circles" className="mt-6">
            <Button variant="primary">Back to Circles</Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={circle.name}
        description={circle.description ?? undefined}
        breadcrumbs={[
          { label: "Circles", href: "/circles" },
          { label: circle.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Badge
              variant={circle.status === "active" ? "success" : circle.status === "pending" ? "warning" : "default"}
            >
              {circle.status}
            </Badge>
            {isOrganizer && (
              <Link href={`/circles/${circleId}/settings`}>
                <Button variant="outline" size="sm" leftIcon={<Settings className="h-4 w-4" />}>
                  Manage
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        {overviewCards.map((card) => (
          <GlassStatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
          />
        ))}
      </motion.div>

      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground dark:text-white mb-4">
          Round Timeline
        </h3>
        <div className="glass rounded-2xl overflow-x-auto p-6">
          <div className="flex items-center gap-0 min-w-max">
            {Array.from({ length: circle.maxMembers }).map((_, i) => {
              const roundNum = i + 1
              const isCurrent = roundNum === circle.currentRound
              const isCompleted = roundNum < circle.currentRound
              const isUpcoming = roundNum > circle.currentRound

              return (
                <div key={roundNum} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <motion.div
                      whileHover={{ scale: 1.15 }}
                      className={cn(
                        "relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-heading font-semibold transition-all",
                        isCompleted && "gradient-bg-extended text-white shadow-lg",
                        isCurrent && "gradient-bg text-white animate-pulse-glow shadow-xl ring-4 ring-aurora-violet/30",
                        isUpcoming && "glass text-muted-foreground",
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        roundNum
                      )}
                    </motion.div>
                    <span className="mt-1.5 text-xs text-muted-foreground font-body">
                      {isCurrent ? "Current" : `R${roundNum}`}
                    </span>
                  </div>
                  {roundNum < circle.maxMembers && (
                    <div
                      className={cn(
                        "h-[2px] w-10 sm:w-16",
                        isCompleted
                          ? "bg-gradient-to-r from-emerald-500 to-aurora-cyan"
                          : isCurrent
                            ? "bg-gradient-to-r from-aurora-violet to-white/10"
                            : "bg-white/5 dark:bg-white/[0.06]",
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {canContribute && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Wallet className="h-5 w-5" />}
              onClick={() => setShowContributeModal(true)}
              className="h-14 w-full md:w-auto holo-glow"
            >
              Contribute {formatCurrency(circle.contributionAmount, circle.currency)}
            </Button>
          </motion.div>
        )}
        {canJoin && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<UserPlus className="h-5 w-5" />}
            >
              Join Circle
            </Button>
          </motion.div>
        )}
        {isOrganizer && (
          <Button
            variant="outline"
            size="lg"
            leftIcon={<UserPlus className="h-5 w-5" />}
          >
            Invite Members
          </Button>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-semibold text-foreground dark:text-white">
            Members
          </h3>
          <Link
            href={`/circles/${circleId}/members`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 font-body"
          >
            View All ({members.length}) <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="glass rounded-2xl p-5">
          {members.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              {members.slice(0, 10).map((member) => (
                <motion.div
                  key={member.id}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-aurora-violet/30 to-aurora-indigo/30 text-xs font-heading font-semibold text-foreground dark:text-white cursor-default"
                  title={member.userName ?? member.userId}
                >
                  {(member.userName ?? member.userId).slice(0, 2).toUpperCase()}
                </motion.div>
              ))}
              {members.length > 10 && (
                <span className="text-sm text-muted-foreground">
                  +{members.length - 10} more
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-semibold text-foreground dark:text-white">
            Recent Payouts
          </h3>
          <Link
            href={`/circles/${circleId}/rounds`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 font-body"
          >
            View Rounds <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="glass rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {Array.from({
              length: Math.min(Math.max(circle.currentRound - 1, 0), 5),
            }).map((_, i) => {
              const r = circle.currentRound - 1 - i
              return (
                <motion.div
                  key={r}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between px-5 py-4 hover:glass-whisper transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground dark:text-white font-heading">
                        Round {r} Payout
                      </p>
                      <p className="text-2xs text-muted-foreground">Completed</p>
                    </div>
                  </div>
                  <span className="gradient-text text-sm font-bold font-heading">
                    {formatCurrency(circle.contributionAmount * circle.maxMembers, circle.currency)}
                  </span>
                </motion.div>
              )
            })}
            {circle.currentRound <= 1 && (
              <div className="flex items-center justify-center px-5 py-10">
                <p className="text-sm text-muted-foreground">
                  No payouts yet. The first round is still active.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showContributeModal}
        onClose={() => setShowContributeModal(false)}
        title="Confirm Contribution"
        description={`Contribute to ${circle.name}`}
        size="sm"
        footer={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowContributeModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleContribute}
              isLoading={contribute.isPending}
            >
              Confirm &amp; Sign
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="glass-whisper rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-body">Amount</span>
            <span className="text-sm font-heading font-semibold text-foreground dark:text-white">
              {formatCurrency(circle.contributionAmount, circle.currency)}
            </span>
          </div>
          <div className="glass-whisper rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-body">Circle</span>
            <span className="text-sm font-heading font-semibold text-foreground dark:text-white">
              {circle.name}
            </span>
          </div>
          <div className="glass-whisper rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-body">Round</span>
            <span className="text-sm font-heading font-semibold text-foreground dark:text-white">
              {circle.currentRound}
            </span>
          </div>
          <p className="text-2xs text-muted-foreground">
            This will open your connected wallet for transaction signing.
          </p>
        </div>
      </Modal>
    </div>
  )
}
