"use client"

import React, { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  Clock,
  Lock,
  CheckCircle,
  XCircle,
  Users,
  BarChart3,
  Zap,
  ChevronLeft,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/shared/copy-button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { cn } from "@/lib/cn"
import { formatRelativeTime, formatAddress, formatDate } from "@/lib/formatters"

/* ───────────────────────────────────────────────────────────
   Mock Data
   ─────────────────────────────────────────────────────────── */

interface Proposal {
  id: number
  title: string
  description: string
  proposer: string
  status: "active" | "passed" | "failed" | "executed" | "pending"
  votes_for: number
  votes_against: number
  votes_abstain: number
  created_at: number
  voting_ends_at: number
  timelock_ends_at: number
  total_supply: number
}

interface VoteRecord {
  voter: string
  vote: "for" | "against" | "abstain"
  power: number
  timestamp: number
}

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 1,
    title: "Reduce Circle Creation Fee",
    description:
      "This proposal aims to reduce the circle creation fee from 100 MOI to 25 MOI. The current fee structure creates an unnecessary barrier to entry for new community members, particularly those in emerging markets. Lowering the fee will increase participation, grow the ecosystem, and align with our mission of financial inclusion. The treasury has sufficient reserves to absorb the short-term reduction in fee revenue, and the projected increase in circle creation volume is expected to offset any losses within 2 quarters. We recommend a phased approach with a review period of 90 days post-implementation to assess impact on treasury health and ecosystem growth metrics.",
    proposer: "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
    status: "active",
    votes_for: 1250,
    votes_against: 340,
    votes_abstain: 120,
    created_at: Date.now() - 86400000 * 3,
    voting_ends_at: Date.now() + 86400000 * 2,
    timelock_ends_at: Date.now() + 86400000 * 4,
    total_supply: 50000,
  },
  {
    id: 2,
    title: "Increase Treasury Allocation to Community Grants",
    description:
      "This proposal allocates 15% of treasury funds to community grant programs over the next 6 months.",
    proposer: "GZYXWVUTSRQPONMLKJIHGFEDCBA0987654321",
    status: "passed",
    votes_for: 3400,
    votes_against: 800,
    votes_abstain: 200,
    created_at: Date.now() - 86400000 * 10,
    voting_ends_at: Date.now() - 86400000 * 3,
    timelock_ends_at: Date.now() - 86400000 * 1,
    total_supply: 50000,
  },
  {
    id: 3,
    title: "Modify Maximum Circle Member Limit",
    description:
      "This proposal increases the maximum member limit per circle from 12 to 20 members.",
    proposer: "GQWERTYUIOPASDFGHJKLZXCVBNM1234567890",
    status: "failed",
    votes_for: 1800,
    votes_against: 2100,
    votes_abstain: 300,
    created_at: Date.now() - 86400000 * 14,
    voting_ends_at: Date.now() - 86400000 * 7,
    timelock_ends_at: Date.now() - 86400000 * 5,
    total_supply: 50000,
  },
  {
    id: 4,
    title: "Deploy Protocol Fees to Staking Rewards",
    description:
      "This proposal redirects 30% of protocol fees to staking reward pools to incentivize long-term participation.",
    proposer: "GASDFGHJKLQWERTYUIOPZXCVBNM0987654321",
    status: "executed",
    votes_for: 4200,
    votes_against: 150,
    votes_abstain: 50,
    created_at: Date.now() - 86400000 * 21,
    voting_ends_at: Date.now() - 86400000 * 14,
    timelock_ends_at: Date.now() - 86400000 * 12,
    total_supply: 50000,
  },
]

const MOCK_VOTES: VoteRecord[] = [
  { voter: "GALICE1234567890ABCDEFGHIJKLMNOPQRST", vote: "for", power: 350, timestamp: Date.now() - 3600000 * 5 },
  { voter: "GBOB0987654321ZYXWVUTSRQPONMLKJIHGFE", vote: "for", power: 220, timestamp: Date.now() - 3600000 * 8 },
  { voter: "GCHARLIEABCDEF1234567890GHIJKLMNOPQR", vote: "against", power: 180, timestamp: Date.now() - 3600000 * 12 },
  { voter: "GDAISY9876543210ZYXWVUTSRQPONMLKJIHG", vote: "for", power: 310, timestamp: Date.now() - 3600000 * 16 },
  { voter: "GEVE0987654321ABCDEFGHIJKLMNOPQRSTUV", vote: "abstain", power: 90, timestamp: Date.now() - 3600000 * 20 },
  { voter: "GFRANK1234567890ZYXWVUTSRQPONMLKJIHG", vote: "for", power: 150, timestamp: Date.now() - 3600000 * 24 },
  { voter: "GGRACEABCDEF0987654321HIJKLMNOPQRSTUV", vote: "against", power: 160, timestamp: Date.now() - 3600000 * 30 },
  { voter: "GHANK9876543210ZYXWVUTSRQPONMLKJIHGFE", vote: "for", power: 220, timestamp: Date.now() - 3600000 * 36 },
]

const QUORUM_PERCENT = 0.1
const THRESHOLD_PERCENT = 0.6

/* ───────────────────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────────────────── */

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Ended"
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ${hours % 24}h remaining`
  if (hours > 0) return `${hours}h ${minutes % 60}m remaining`
  return `${minutes}m ${seconds % 60}s remaining`
}

function getStatusVariant(status: Proposal["status"]): "success" | "warning" | "destructive" | "info" | "premium" | "default" {
  switch (status) {
    case "active":
      return "warning"
    case "passed":
      return "success"
    case "failed":
      return "destructive"
    case "executed":
      return "premium"
    case "pending":
      return "info"
    default:
      return "default"
  }
}

function getStatusLabel(status: Proposal["status"]): string {
  switch (status) {
    case "active":
      return "Voting Active"
    case "passed":
      return "Passed"
    case "failed":
      return "Failed"
    case "executed":
      return "Executed"
    case "pending":
      return "Pending"
    default:
      return status
  }
}

/* ───────────────────────────────────────────────────────────
   Sub-components
   ─────────────────────────────────────────────────────────── */

const voteDotColors: Record<string, string> = {
  for: "bg-success",
  against: "bg-destructive",
  abstain: "bg-muted-foreground/60",
}

const voteTextColors: Record<string, string> = {
  for: "text-success",
  against: "text-destructive",
  abstain: "text-muted-foreground",
}

const voteLabels: Record<string, string> = {
  for: "For",
  against: "Against",
  abstain: "Abstain",
}

function VoteRow({ vote, index }: { vote: VoteRecord; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={cn(
        "flex items-center justify-between px-4 py-3",
        index % 2 === 0 ? "glass-whisper" : "bg-transparent",
        "rounded-xl transition-colors",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", voteDotColors[vote.vote])} />
        <div className="min-w-0">
          <p className="text-sm font-mono text-foreground truncate">
            {formatAddress(vote.voter, 6, 4)}
          </p>
          <p className="text-2xs text-muted-foreground">
            {formatRelativeTime(new Date(vote.timestamp))}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <span className="text-sm font-heading font-semibold gradient-text">
          {vote.power.toLocaleString()} MOI
        </span>
        <span className={cn("text-xs font-medium font-body uppercase tracking-wider", voteTextColors[vote.vote])}>
          {voteLabels[vote.vote]}
        </span>
      </div>
    </motion.div>
  )
}

/* ───────────────────────────────────────────────────────────
   Page
   ─────────────────────────────────────────────────────────── */

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const fadeItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export default function GovernanceProposalDetailPage() {
  const params = useParams()
  const proposalId = Number(params.id)

  const [voted, setVoted] = useState<"for" | "against" | "abstain" | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [execConfirmOpen, setExecConfirmOpen] = useState(false)
  const [pendingVoteType, setPendingVoteType] = useState<"for" | "against" | "abstain" | null>(null)

  const proposal = useMemo(
    () => MOCK_PROPOSALS.find((p) => p.id === proposalId) ?? null,
    [proposalId],
  )

  const totalVotes = proposal
    ? proposal.votes_for + proposal.votes_against + proposal.votes_abstain
    : 0

  const forPct = totalVotes > 0 ? (proposal!.votes_for / totalVotes) * 100 : 0
  const againstPct = totalVotes > 0 ? (proposal!.votes_against / totalVotes) * 100 : 0
  const abstainPct = totalVotes > 0 ? (proposal!.votes_abstain / totalVotes) * 100 : 0

  const quorumMet = proposal
    ? totalVotes / proposal.total_supply >= QUORUM_PERCENT
    : false
  const quorumPct = proposal ? (totalVotes / proposal.total_supply) * 100 : 0

  const thresholdMet = proposal
    ? totalVotes > 0 && proposal.votes_for / totalVotes >= THRESHOLD_PERCENT
    : false

  const handleVoteConfirm = () => {
    if (pendingVoteType) {
      setVoted(pendingVoteType)
      setPendingVoteType(null)
    }
  }

  const openVoteDialog = (type: "for" | "against" | "abstain") => {
    setPendingVoteType(type)
    setConfirmOpen(true)
  }

  const handleExecute = () => {
    alert("Proposal executed successfully (mock)")
    setExecConfirmOpen(false)
  }

  /* ── Timeline computation ── */
  const now = Date.now()
  const timelockRemaining = proposal ? proposal.timelock_ends_at - now : 0
  const timelockExpired = timelockRemaining <= 0

  interface TimelineStep {
    label: string
    date: Date
    completed: boolean
    active: boolean
    future: boolean
    countdown?: string
  }

  const timelineSteps = useMemo((): TimelineStep[] => {
    if (!proposal) return []
    const steps: TimelineStep[] = [
      {
        label: "Created",
        date: new Date(proposal.created_at),
        completed: true,
        active: false,
        future: false,
      },
    ]

    const votingEnded = now > proposal.voting_ends_at
    const executed = proposal.status === "executed"

    steps.push({
      label: "Voting Ends",
      date: new Date(proposal.voting_ends_at),
      completed: votingEnded,
      active: proposal.status === "active" && !votingEnded,
      future: false,
      countdown: proposal.status === "active" && !votingEnded
        ? formatCountdown(proposal.voting_ends_at - now)
        : undefined,
    })

    steps.push({
      label: "Timelock Ends",
      date: new Date(proposal.timelock_ends_at),
      completed: timelockExpired && votingEnded,
      active: votingEnded && !timelockExpired && (proposal.status === "passed" || proposal.status === "active"),
      future: proposal.status === "active" && !votingEnded,
      countdown: votingEnded && !timelockExpired
        ? formatCountdown(timelockRemaining)
        : undefined,
    })

    steps.push({
      label: "Executed",
      date: new Date(proposal.timelock_ends_at),
      completed: executed,
      active: false,
      future: !executed,
    })

    return steps
  }, [proposal, now, timelockExpired, timelockRemaining])

  /* ── Not found state ── */
  if (!proposal) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Proposal Not Found"
          breadcrumbs={[
            { label: "Governance", href: "/governance" },
            { label: "Not Found" },
          ]}
        />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-flagship rounded-2xl flex flex-col items-center justify-center py-20 holo-border"
        >
          <XCircle className="mb-4 h-14 w-14 text-muted-foreground" />
          <p className="font-heading text-xl font-semibold text-foreground dark:text-white">
            Proposal not found
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            The proposal you are looking for does not exist.
          </p>
          <Link href="/governance" className="mt-6">
            <Button variant="primary">Back to Governance</Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Proposal Details"
        breadcrumbs={[
          { label: "Governance", href: "/governance" },
          { label: `Proposal #${proposal.id}` },
        ]}
        action={
          <Link href="/governance">
            <Button variant="outline" size="sm" leftIcon={<ChevronLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
        }
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* ─── LEFT COLUMN (2/3) ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Proposal Header */}
          <motion.div variants={fadeItem}>
            <div className="glass-premium rounded-2xl p-6 md:p-8 holo-border">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <h1 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold gradient-text-extended tracking-tight">
                  {proposal.title}
                </h1>
                <Badge variant={getStatusVariant(proposal.status)} size="md">
                  {getStatusLabel(proposal.status)}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-body">ID:</span>
                  <span className="text-sm font-mono font-medium text-foreground">
                    #{proposal.id}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-body">Proposer:</span>
                  <CopyButton
                    text={proposal.proposer}
                    label={formatAddress(proposal.proposer, 6, 4)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-body">
                    {formatRelativeTime(new Date(proposal.created_at))}
                  </span>
                </div>
              </div>

              <div className="prose-custom">
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed whitespace-pre-line font-body">
                  {proposal.description}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Section 2: Vote Distribution */}
          <motion.div variants={fadeItem}>
            <div className="glass-strong rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Vote Distribution
                </h2>
              </div>

              {/* Vote count cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="glass-whisper rounded-xl p-4 text-center">
                  <p className="text-2xl md:text-3xl font-heading font-bold text-success">
                    {proposal.votes_for.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mt-1">
                    For
                  </p>
                </div>
                <div className="glass-whisper rounded-xl p-4 text-center">
                  <p className="text-2xl md:text-3xl font-heading font-bold text-destructive">
                    {proposal.votes_against.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mt-1">
                    Against
                  </p>
                </div>
                <div className="glass-whisper rounded-xl p-4 text-center">
                  <p className="text-2xl md:text-3xl font-heading font-bold text-muted-foreground">
                    {proposal.votes_abstain.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mt-1">
                    Abstain
                  </p>
                </div>
              </div>

              {/* Triple segment bar */}
              <div className="w-full h-5 rounded-full overflow-hidden flex bg-muted mb-3">
                {forPct > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${forPct}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full bg-success"
                    style={{ flexShrink: 0 }}
                  />
                )}
                {againstPct > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${againstPct}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                    className="h-full bg-destructive"
                    style={{ flexShrink: 0 }}
                  />
                )}
                {abstainPct > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${abstainPct}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    className="h-full bg-muted-foreground/40"
                    style={{ flexShrink: 0 }}
                  />
                )}
              </div>

              {/* Labels below bar */}
              <div className="flex items-center justify-between text-2xs font-body text-muted-foreground mb-6">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success inline-block" />
                  For {forPct.toFixed(1)}%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-destructive inline-block" />
                  Against {againstPct.toFixed(1)}%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />
                  Abstain {abstainPct.toFixed(1)}%
                </span>
              </div>

              {/* Quorum & Threshold */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={cn(
                  "glass-whisper rounded-xl p-4 border",
                  quorumMet ? "border-success/20" : "border-destructive/20",
                )}>
                  <div className="flex items-center gap-2">
                    {quorumMet ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm font-heading font-semibold text-foreground">
                      Quorum: {quorumMet ? "Met" : "Not Met"}
                    </span>
                    {quorumMet ? (
                      <span className="text-xs text-success font-heading">&#x2713;</span>
                    ) : (
                      <span className="text-xs text-destructive font-heading">&#x2717;</span>
                    )}
                  </div>
                  <p className="text-2xs text-muted-foreground mt-1.5">
                    {quorumPct.toFixed(1)}% of supply voted ({totalVotes.toLocaleString()} / {proposal.total_supply.toLocaleString()})
                  </p>
                </div>

                <div className={cn(
                  "glass-whisper rounded-xl p-4 border",
                  thresholdMet ? "border-success/20" : "border-destructive/20",
                )}>
                  <div className="flex items-center gap-2">
                    {thresholdMet ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm font-heading font-semibold text-foreground">
                      Threshold: {THRESHOLD_PERCENT * 100}% For required
                    </span>
                    {thresholdMet ? (
                      <span className="text-xs text-success font-heading">&#x2713;</span>
                    ) : (
                      <span className="text-xs text-destructive font-heading">&#x2717;</span>
                    )}
                  </div>
                  <p className="text-2xs text-muted-foreground mt-1.5">
                    {totalVotes > 0
                      ? `${((proposal.votes_for / totalVotes) * 100).toFixed(1)}% For vote (${THRESHOLD_PERCENT * 100}% needed)`
                      : "No votes yet"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 3: Timeline */}
          <motion.div variants={fadeItem}>
            <div className="glass rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Timeline
                </h2>
              </div>

              <div className="relative">
                {timelineSteps.map((step, i) => (
                  <div key={step.label} className="flex gap-4">
                    {/* Dot + line column */}
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.15, type: "spring", stiffness: 300, damping: 18 }}
                        className={cn(
                          "relative flex h-9 w-9 items-center justify-center rounded-full shrink-0 z-10",
                          step.completed && "bg-success text-white",
                          step.active && "bg-aurora-violet text-white animate-pulse-glow",
                          step.future && !step.completed && "glass-whisper text-muted-foreground",
                        )}
                      >
                        {step.completed ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </motion.div>
                      {i < timelineSteps.length - 1 && (
                        <div
                          className={cn(
                            "w-[2px] flex-1 min-h-[32px]",
                            step.completed
                              ? "bg-success/40"
                              : step.active
                                ? "bg-gradient-to-b from-aurora-violet to-muted"
                                : "bg-muted",
                          )}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className={cn("pb-7", i === timelineSteps.length - 1 && "pb-0")}>
                      <p
                        className={cn(
                          "font-heading text-sm font-semibold",
                          step.completed && "text-success",
                          step.active && "gradient-text",
                          step.future && !step.completed && "text-muted-foreground",
                        )}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(step.date, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {step.countdown && (
                        <p className="text-xs text-aurora-cyan font-mono mt-1 animate-pulse">
                          {step.countdown}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Section 4: Votes List */}
          <motion.div variants={fadeItem}>
            <div className="glass rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-2 mb-5">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Recent Votes
                </h2>
                <span className="text-sm text-muted-foreground ml-auto font-mono">
                  {MOCK_VOTES.length} votes
                </span>
              </div>

              {MOCK_VOTES.length > 0 ? (
                <div className="space-y-1">
                  {MOCK_VOTES.map((v, i) => (
                    <VoteRow key={v.voter} vote={v} index={i} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <Users className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No votes cast yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ─── RIGHT COLUMN (1/3) ─── */}
        <div className="space-y-6">
          {/* Voting Panel — only if active */}
          {proposal.status === "active" && (
            <motion.div variants={fadeItem}>
              <div className="glass-premium rounded-2xl p-6 holo-border">
                <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
                  Cast Your Vote
                </h2>

                <div className="flex items-center gap-2 mb-5 mt-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-aurora-violet/20 to-aurora-cyan/20">
                    <Zap className="h-4 w-4 text-aurora-violet" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-body">Your Voting Power</p>
                    <p className="text-sm font-heading font-bold gradient-text">1,250 MOI</p>
                  </div>
                </div>

                {voted ? (
                  <div className="space-y-3">
                    <div className={cn(
                      "rounded-xl p-4 border text-center",
                      voted === "for" && "bg-success/10 border-success/20",
                      voted === "against" && "bg-destructive/10 border-destructive/20",
                      voted === "abstain" && "bg-muted-foreground/10 border-muted-foreground/20",
                    )}>
                      <p className="text-sm text-muted-foreground font-body">You voted:</p>
                      <p className={cn(
                        "text-lg font-heading font-bold mt-0.5",
                        voteTextColors[voted],
                      )}>
                        {voteLabels[voted]}
                      </p>
                    </div>
                    <p className="text-2xs text-muted-foreground text-center">
                      Your vote has been recorded. Voting power: 1,250 MOI
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      variant="primary"
                      size="lg"
                      leftIcon={<ThumbsUp className="h-5 w-5" />}
                      onClick={() => openVoteDialog("for")}
                      className="w-full bg-success hover:brightness-110"
                    >
                      Vote FOR
                    </Button>

                    <Button
                      variant="destructive"
                      size="lg"
                      leftIcon={<ThumbsDown className="h-5 w-5" />}
                      onClick={() => openVoteDialog("against")}
                      className="w-full"
                    >
                      Vote AGAINST
                    </Button>

                    <Button
                      variant="secondary"
                      size="lg"
                      leftIcon={<Minus className="h-5 w-5" />}
                      onClick={() => openVoteDialog("abstain")}
                      className="w-full"
                    >
                      Abstain
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Execute Panel — only if passed */}
          {proposal.status === "passed" && (
            <motion.div variants={fadeItem}>
              <div className="glass-premium rounded-2xl p-6 holo-border">
                <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
                  Execute Proposal
                </h2>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  This proposal has passed. {!timelockExpired
                    ? "The timelock must expire before execution."
                    : "The timelock has expired. Execute the on-chain action."}
                </p>

                {!timelockExpired ? (
                  <div className="glass-whisper rounded-xl p-4 flex items-center gap-3 border border-warning/20">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400/20">
                      <Lock className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-heading font-semibold text-amber-400">
                        Timelock Active
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {formatCountdown(timelockRemaining)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="premium"
                    size="lg"
                    leftIcon={<Zap className="h-5 w-5" />}
                    onClick={() => setExecConfirmOpen(true)}
                    className="w-full"
                  >
                    Execute
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* Results Panel — if failed or executed */}
          {(proposal.status === "failed" || proposal.status === "executed") && (
            <motion.div variants={fadeItem}>
              <div className={cn(
                "glass rounded-2xl p-6",
                proposal.status === "executed" && "border border-success/20 shadow-[0_0_24px_rgba(16,185,129,0.10)]",
                proposal.status === "failed" && "border border-destructive/20",
              )}>
                <div className="flex flex-col items-center text-center">
                  {proposal.status === "failed" ? (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mb-4">
                        <XCircle className="h-8 w-8 text-destructive" />
                      </div>
                      <p className="font-heading text-lg font-semibold text-foreground">
                        This proposal did not pass.
                      </p>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        The required threshold of {THRESHOLD_PERCENT * 100}% For votes was not met. Only{" "}
                        {totalVotes > 0
                          ? `${((proposal.votes_for / totalVotes) * 100).toFixed(1)}%`
                          : "0%"}{" "}
                        voted in favor.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 mb-4 shadow-[0_0_24px_rgba(16,185,129,0.15)]">
                        <CheckCircle className="h-8 w-8 text-success" />
                      </div>
                      <p className="font-heading text-lg font-semibold text-success">
                        Proposal executed successfully.
                      </p>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        All on-chain actions have been completed. The proposal garnered{" "}
                        {forPct.toFixed(1)}% support with {proposal.votes_for.toLocaleString()} votes in favor.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {proposal.status === "pending" && (
            <motion.div variants={fadeItem}>
              <div className="glass rounded-2xl p-6 border border-border">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-heading text-lg font-semibold text-foreground">
                    Voting not yet started
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    This proposal is pending and voting has not yet begun.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Vote Confirm Dialog ── */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false)
          setPendingVoteType(null)
        }}
        onConfirm={handleVoteConfirm}
        title="Confirm Your Vote"
        message={
          pendingVoteType
            ? `You are about to vote ${voteLabels[pendingVoteType].toUpperCase()} on Proposal #${proposal.id} with 1,250 voting power. This action cannot be undone.`
            : ""
        }
        confirmLabel={`Vote ${pendingVoteType ? voteLabels[pendingVoteType].toUpperCase() : ""}`}
        variant="danger"
      />

      {/* ── Execute Confirm Dialog ── */}
      <ConfirmDialog
        isOpen={execConfirmOpen}
        onClose={() => setExecConfirmOpen(false)}
        onConfirm={handleExecute}
        title="Execute Proposal"
        message={`You are about to execute Proposal #${proposal.id} on-chain. This will trigger the approved state changes. Ensure you have reviewed the proposal details before proceeding.`}
        confirmLabel="Execute"
        variant="danger"
      />
    </div>
  )
}
