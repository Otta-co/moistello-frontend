"use client"

import React, { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowDownCircle,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { get } from "@/lib/api-client"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDate, formatAddress } from "@/lib/formatters"
import { cn } from "@/lib/cn"
import type { ApiResponse, Payout as PayoutType, Circle } from "@/types"

function TransactionLink({ hash }: { hash: string }) {
  return (
    <a
      href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-aurora-cyan hover:underline font-mono"
    >
      {formatAddress(hash, 6, 4)}
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
}

function SummaryCard({
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
      whileHover={{ y: -3, transition: { duration: 0.25 } }}
      className="glass rounded-2xl p-5 tilt-hover depth-2"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-2xs tracking-wider uppercase text-muted-foreground font-body">
            {label}
          </p>
          <p className="font-heading text-3xl font-bold gradient-text-extended bg-clip-text text-transparent">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br",
            gradient,
            "shadow-lg",
          )}
        >
          <span className="text-white">{icon}</span>
        </div>
      </div>
    </motion.div>
  )
}

export default function PayoutsPage() {
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading, isError } = useQuery({
    queryKey: ["payouts", page, limit],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", String(limit))
      const query = params.toString()
      const url = `/payouts?${query}`
      const response = await get<ApiResponse<PayoutType[]>>(url)
      return {
        payouts: response.data ?? [],
        meta: response.meta ?? { page, limit, total: 0, totalPages: 0 },
      }
    },
  })

  const { data: circlesData } = useQuery({
    queryKey: ["circles", "payouts-filter"],
    queryFn: async () => {
      const response = await get<ApiResponse<Circle[]>>("/circles?limit=100")
      return response.data ?? []
    },
  })

  const circles = circlesData ?? []
  const payouts = data?.payouts ?? []
  const meta = data?.meta
  const hasNext = meta ? meta.page < meta.totalPages : false
  const hasPrev = page > 1

  const totalReceived = payouts.reduce((sum, p) => sum + p.amount, 0)

  const getCircleName = (circleId: string): string =>
    circles.find((c) => c.id === circleId)?.name ?? "Unknown"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payouts Received"
        description="Track the payouts you've received from your savings circles."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard
          label="Total Received"
          value={formatCurrency(totalReceived, "USDC")}
          icon={<DollarSign className="h-6 w-6" />}
          gradient="from-emerald-500 to-aurora-cyan"
        />
        <SummaryCard
          label="Number of Payouts"
          value={String(meta?.total ?? payouts.length)}
          icon={<TrendingUp className="h-6 w-6" />}
          gradient="from-aurora-indigo to-aurora-violet"
        />
      </div>

      {isLoading ? (
        <div className="glass-premium rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton variant="text" width="25%" />
                <Skeleton variant="text" width="8%" />
                <Skeleton variant="text" width="15%" />
                <Skeleton variant="text" width="12%" />
                <Skeleton variant="text" width="15%" />
                <Skeleton variant="text" width="18%" />
              </div>
            ))}
          </div>
        </div>
      ) : isError ? (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load payouts"
          description="Something went wrong. Please try again later."
        />
      ) : payouts.length === 0 ? (
        <EmptyState
          icon={<ArrowDownCircle className="h-6 w-6" />}
          title="No payouts received yet"
          description="You'll receive payouts when it's your turn in a savings circle."
          action={{
            label: "Browse Circles",
            onClick: () => (window.location.href = "/circles"),
          }}
        />
      ) : (
        <div className="glass-premium rounded-2xl overflow-hidden holo-border">
          <div className="hidden md:flex items-center gap-4 border-b border-border glass-strong px-5 py-3">
            <div className="flex-1 text-2xs font-heading tracking-wider uppercase text-muted-foreground">
              Circle
            </div>
            <div className="w-16 text-2xs font-heading tracking-wider uppercase text-muted-foreground">
              Round
            </div>
            <div className="w-28 text-2xs font-heading tracking-wider uppercase text-muted-foreground">
              Amount
            </div>
            <div className="w-24 text-2xs font-heading tracking-wider uppercase text-muted-foreground">
              Fee
            </div>
            <div className="w-28 text-2xs font-heading tracking-wider uppercase text-muted-foreground">
              Date
            </div>
            <div className="w-36 text-2xs font-heading tracking-wider uppercase text-muted-foreground">
              Transaction
            </div>
          </div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.03 } } }}
            className="divide-y divide-border"
          >
            {payouts.map((payout) => (
              <motion.div
                key={payout.id}
                variants={rowVariants}
                className="flex flex-col gap-2 px-5 py-4 md:flex-row md:items-center md:gap-4 hover:glass-whisper transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/circles/${payout.circleId}`}
                    className="text-sm font-medium text-foreground dark:text-white hover:gradient-text transition-colors truncate block font-heading"
                  >
                    {getCircleName(payout.circleId)}
                  </Link>
                </div>
                <div className="hidden md:block w-16 text-sm text-muted-foreground font-mono">
                  #{payout.roundNumber}
                </div>
                <div className="w-28 text-sm font-bold gradient-text font-heading">
                  +{formatCurrency(payout.amount, "USDC")}
                </div>
                <div className="w-24 text-sm text-muted-foreground font-body">
                  {payout.feeAmount != null && payout.feeAmount > 0
                    ? formatCurrency(payout.feeAmount, "USDC")
                    : "—"}
                </div>
                <div className="w-28 text-sm text-muted-foreground font-body">
                  {formatDate(payout.executedAt)}
                </div>
                <div className="w-36">
                  {payout.txnHash ? (
                    <TransactionLink hash={payout.txnHash} />
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">—</span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-body">
            Page {meta.page} of {meta.totalPages} ({meta.total} payouts)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
