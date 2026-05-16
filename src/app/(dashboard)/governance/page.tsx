"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Landmark,
  Vote,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Zap,
  TrendingUp,
} from "lucide-react"
import { differenceInMilliseconds } from "date-fns"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/cn"
import { formatDuration } from "@/lib/formatters"

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

type ProposalStatus = "active" | "passed" | "failed" | "executed" | "cancelled"

interface Proposal {
  id: string
  number: number
  title: string
  description: string
  status: ProposalStatus
  proposer: string
  votesFor: number
  votesAgainst: number
  votesAbstain: number
  createdAt: string
  votingEndsAt: string
  timelockEndsAt: string
}

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

const FILTER_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
  { value: "executed", label: "Executed" },
] as const

type FilterValue = (typeof FILTER_TABS)[number]["value"]

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: "gov-1",
    number: 1,
    title: "Reduce Circle Creation Fee from 50 XLM to 20 XLM",
    description:
      "This proposal aims to lower the barrier of entry for new Circles by reducing the creation fee from 50 XLM to 20 XLM. This will encourage more community members to start Circles and expand the protocol's reach across the Stellar ecosystem. Data from the last quarter shows a 30% decline in new Circle creation, which correlates directly with the high fee structure. Reducing this fee is expected to increase new Circle creation by approximately 150% over the next quarter.",
    status: "active",
    proposer: "GBD2...7KLM",
    votesFor: 1250,
    votesAgainst: 340,
    votesAbstain: 120,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    votingEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    timelockEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "gov-2",
    number: 2,
    title: "Increase Diamond Tier Benefits and Reward Multipliers",
    description:
      "Proposal to enhance the Diamond Tier membership benefits by increasing the reward multiplier from 1.5x to 2.0x, adding priority governance voting power (2x weight), and introducing exclusive access to premium Circles before they become public. This aligns with the protocol's goal of rewarding long-term committed members and increasing MOI token staking. Current Diamond Tier members represent only 3% of users but contribute 22% of total protocol liquidity.",
    status: "active",
    proposer: "GAC7...3NQP",
    votesFor: 980,
    votesAgainst: 560,
    votesAbstain: 200,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    votingEndsAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString(),
    timelockEndsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "gov-3",
    number: 3,
    title: "Add USDC-YXLM Liquidity Pair to Protocol Treasury",
    description:
      "Proposal to diversify the protocol treasury by allocating 15% of treasury funds to a USDC-YXLM liquidity pair on the Stellar DEX. This strategic move aims to generate additional yield for the protocol through trading fees while maintaining exposure to both stable and appreciating assets. The estimated APR from this pair is 12-18%, which would significantly boost the treasury growth rate and provide additional funding for community initiatives and protocol development.",
    status: "passed",
    proposer: "GBF1...9RST",
    votesFor: 2100,
    votesAgainst: 180,
    votesAbstain: 45,
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    votingEndsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    timelockEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "gov-4",
    number: 4,
    title: "Lower Quorum Threshold from 20% to 15%",
    description:
      "This proposal seeks to reduce the governance quorum threshold from the current 20% to 15% of total voting power. Over the past three months, several proposals have failed to meet quorum despite having majority support, primarily due to lower voter turnout during market downturns. Lowering the threshold to 15% would maintain sufficient democratic legitimacy while ensuring the protocol can make timely decisions. Comparative analysis with other major DAOs shows 15% is above the DeFi median of 12%.",
    status: "failed",
    proposer: "GDE4...6UVW",
    votesFor: 890,
    votesAgainst: 1600,
    votesAbstain: 310,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    votingEndsAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    timelockEndsAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "gov-5",
    number: 5,
    title: "Enable Cross-Circle Contributions and Fund Sharing",
    description:
      "Landmark proposal to enable cross-Circle contribution functionality, allowing members of one Circle to contribute to rounds in other Circles. This feature would increase capital efficiency across the protocol, enable larger Circles to support smaller ones, and create a more interconnected ecosystem. The technical implementation involves upgrading the Circle smart contract to support multi-signature contribution routing and implementing a cross-Circle fee sharing mechanism where contributing Circles earn 0.5% of the round's yield.",
    status: "executed",
    proposer: "GCH9...2XYZ",
    votesFor: 3200,
    votesAgainst: 45,
    votesAbstain: 80,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    votingEndsAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
    timelockEndsAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

/* ═══════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════ */

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const fadeSlideUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

function getStatusVariant(
  status: ProposalStatus,
): "success" | "info" | "destructive" | "premium" | "warning" {
  switch (status) {
    case "active":
      return "success"
    case "passed":
      return "info"
    case "failed":
      return "destructive"
    case "executed":
      return "premium"
    case "cancelled":
      return "warning"
  }
}

function getTimeRemaining(endDate: string): string | null {
  const now = new Date()
  const end = new Date(endDate)
  const msDiff = differenceInMilliseconds(end, now)
  if (msDiff <= 0) return null
  const totalMinutes = Math.floor(msDiff / 60_000)
  return `${formatDuration(totalMinutes)} remaining`
}

function getStatusIcon(status: ProposalStatus) {
  switch (status) {
    case "active":
      return <Clock className="h-3.5 w-3.5" />
    case "passed":
      return <CheckCircle className="h-3.5 w-3.5" />
    case "failed":
      return <XCircle className="h-3.5 w-3.5" />
    case "executed":
      return <Zap className="h-3.5 w-3.5" />
    case "cancelled":
      return <AlertCircle className="h-3.5 w-3.5" />
  }
}

/* ═══════════════════════════════════════════════════════════
   MINI STAT CARD
   ═══════════════════════════════════════════════════════════ */

function MiniStatCard({
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
      variants={fadeSlideUp}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="glass-whisper rounded-2xl p-3.5 flex items-center gap-3 tilt-hover"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aurora-indigo/20 to-aurora-violet/20">
        <span className="text-aurora-violet">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-2xs tracking-wider uppercase text-muted-foreground font-body">
          {label}
        </p>
        <p className="font-heading text-lg font-bold text-foreground dark:text-white leading-tight">
          {value}
        </p>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   PROPOSAL CARD
   ═══════════════════════════════════════════════════════════ */

function ProposalCard({
  proposal,
  onNavigate,
}: {
  proposal: Proposal
  onNavigate: (id: string) => void
}) {
  const totalVotes =
    proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain
  const forPct = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0
  const againstPct =
    totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0
  const abstainPct =
    totalVotes > 0 ? (proposal.votesAbstain / totalVotes) * 100 : 0

  const timeRemaining =
    proposal.status === "active" ? getTimeRemaining(proposal.votingEndsAt) : null
  const statusVariant = getStatusVariant(proposal.status)
  const statusIcon = getStatusIcon(proposal.status)

  return (
    <motion.div
      variants={fadeSlideUp}
      whileHover={{ y: -2, transition: { duration: 0.25 } }}
      className="group"
    >
      <Card
        interactive
        premium
        className="glass-premium rounded-2xl p-0 holo-border cursor-pointer overflow-hidden"
        onClick={() => onNavigate(proposal.id)}
      >
        <div className="p-5 space-y-3">
          {/* Header: Proposal ID + Status */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground tracking-wider">
              #{proposal.number}
            </span>
            <Badge
              variant={statusVariant}
              size="sm"
              className="shrink-0"
            >
              {statusIcon}
              <span className="ml-1">{proposal.status}</span>
            </Badge>
          </div>

          {/* Title */}
          <h3 className="font-heading text-base md:text-lg font-semibold text-foreground dark:text-white truncate">
            {proposal.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {proposal.description}
          </p>

          {/* Segmented vote progress bar */}
          {totalVotes > 0 && (
            <div className="space-y-1.5">
              <div className="flex h-2 rounded-full overflow-hidden bg-muted/50">
                {forPct > 0 && (
                  <div
                    className="h-full bg-success transition-all duration-500"
                    style={{ width: `${forPct}%` }}
                  />
                )}
                {againstPct > 0 && (
                  <div
                    className="h-full bg-destructive transition-all duration-500"
                    style={{ width: `${againstPct}%` }}
                  />
                )}
                {abstainPct > 0 && (
                  <div
                    className="h-full bg-muted-foreground/30 transition-all duration-500"
                    style={{ width: `${abstainPct}%` }}
                  />
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-2xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  For {Math.round(forPct)}%
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  Against {Math.round(againstPct)}%
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  Abstain {Math.round(abstainPct)}%
                </span>
              </div>
            </div>
          )}

          {/* Footer: time remaining + vote counts */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-1 border-t border-border">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {timeRemaining ?? (
                <span className="capitalize">{proposal.status}</span>
              )}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              For: {proposal.votesFor.toLocaleString("en-US")} | Against:{" "}
              {proposal.votesAgainst.toLocaleString("en-US")} | Abstain:{" "}
              {proposal.votesAbstain.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   GOVERNANCE PAGE
   ═══════════════════════════════════════════════════════════ */

export default function GovernancePage() {
  const router = useRouter()
  const [proposals] = useState(MOCK_PROPOSALS)
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all")

  const filteredProposals = useMemo(() => {
    if (activeFilter === "all") return proposals
    return proposals.filter((p) => p.status === activeFilter)
  }, [proposals, activeFilter])

  const stats = useMemo(() => {
    const total = proposals.length
    const active = proposals.filter((p) => p.status === "active").length
    return { total, active }
  }, [proposals])

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Governance"
        description="Propose and vote on changes to the Moistello protocol."
      />

      {/* Stats Bar */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
      >
        <MiniStatCard
          label="Total Proposals"
          value={String(stats.total)}
          icon={<Landmark className="h-4 w-4" />}
        />
        <MiniStatCard
          label="Active"
          value={String(stats.active)}
          icon={<Vote className="h-4 w-4" />}
        />
        <MiniStatCard
          label="Quorum"
          value="20%"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <MiniStatCard
          label="Your Voting Power"
          value="1,250 MOI"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.value
          const isActiveTab = tab.value === "active"
          const activeCount = stats.active

          return (
            <motion.button
              key={tab.value}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveFilter(tab.value)}
              className={cn(
                "relative inline-flex items-center rounded-full px-4 py-1.5 text-xs font-body font-medium transition-all duration-300",
                isActive
                  ? "gradient-bg-extended text-white shadow-lg holo-glow"
                  : "glass-whisper text-muted-foreground hover:text-foreground dark:hover:text-white",
              )}
            >
              {tab.label}
              {isActiveTab && activeCount > 0 && (
                <span
                  className={cn(
                    "ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold leading-none",
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-aurora-violet/20 text-aurora-violet",
                  )}
                >
                  {activeCount}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Proposal List or Empty State */}
      {filteredProposals.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="No proposals found"
          description="Try a different filter."
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onNavigate={(id) => router.push(`/governance/${id}`)}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}
