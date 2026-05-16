"use client"

import React, { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowUpCircle,
  AlertCircle,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { get } from "@/lib/api-client"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDate, formatAddress } from "@/lib/formatters"
import type {
  ApiResponse,
  Contribution as ContributionType,
  Circle,
  ContributionStatus,
} from "@/types"

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

const statusConfig: Record<ContributionStatus, { variant: "success" | "warning" | "destructive" | "default" }> = {
  completed: { variant: "success" },
  pending: { variant: "warning" },
  missed: { variant: "destructive" },
  late: { variant: "destructive" },
}

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
}

export default function ContributionsPage() {
  const [circleFilter, setCircleFilter] = useState("")
  const [page, setPage] = useState(1)
  const limit = 20

  const { data: circlesData } = useQuery({
    queryKey: ["circles", "contributions-filter"],
    queryFn: async () => {
      const response = await get<ApiResponse<Circle[]>>("/circles?limit=100")
      return response.data ?? []
    },
  })

  const circles = circlesData ?? []
  const circleOptions = [
    { label: "All Circles", value: "" },
    ...circles.map((c) => ({ label: c.name, value: c.id })),
  ]

  const { data, isLoading, isError } = useQuery({
    queryKey: ["contributions", circleFilter, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (circleFilter) params.set("circleId", circleFilter)
      params.set("page", String(page))
      params.set("limit", String(limit))
      const query = params.toString()
      const url = `/contributions?${query}`
      const response = await get<ApiResponse<ContributionType[]>>(url)
      return {
        contributions: response.data ?? [],
        meta: response.meta ?? { page, limit, total: 0, totalPages: 0 },
      }
    },
  })

  const contributions = data?.contributions ?? []
  const meta = data?.meta
  const hasNext = meta ? meta.page < meta.totalPages : false
  const hasPrev = page > 1

  const getCircleName = (circleId: string): string =>
    circles.find((c) => c.id === circleId)?.name ?? "Unknown"

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Contributions"
        description="Track all your circle contributions and their status."
      />

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="w-64">
          <Select
            options={circleOptions}
            value={circleFilter}
            onChange={(value) => {
              setCircleFilter(value)
              setPage(1)
            }}
            placeholder="Filter by circle..."
          />
        </div>
      </div>

      {isLoading ? (
        <div className="glass-premium rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton variant="text" width="25%" />
                <Skeleton variant="text" width="8%" />
                <Skeleton variant="text" width="15%" />
                <Skeleton variant="text" width="15%" />
                <Skeleton variant="text" width="12%" />
                <Skeleton variant="text" width="18%" />
              </div>
            ))}
          </div>
        </div>
      ) : isError ? (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load contributions"
          description="Something went wrong. Please try again later."
        />
      ) : contributions.length === 0 ? (
        <EmptyState
          icon={<ArrowUpCircle className="h-6 w-6" />}
          title="No contributions yet"
          description="Join a circle to get started!"
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
            <div className="w-28 text-2xs font-heading tracking-wider uppercase text-muted-foreground">
              Date
            </div>
            <div className="w-24 text-2xs font-heading tracking-wider uppercase text-muted-foreground">
              Status
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
            {contributions.map((c) => {
              const st = statusConfig[c.status] || statusConfig.pending
              const isOnTime = c.onTime
              const displayStatus = isOnTime
                ? "completed"
                : c.status

              return (
                <motion.div
                  key={c.id}
                  variants={rowVariants}
                  className="flex flex-col gap-2 px-5 py-4 md:flex-row md:items-center md:gap-4 hover:glass-whisper transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/circles/${c.circleId}`}
                      className="text-sm font-medium text-foreground dark:text-white hover:gradient-text transition-colors truncate block font-heading"
                    >
                      {getCircleName(c.circleId)}
                    </Link>
                    <span className="text-xs text-muted-foreground md:hidden">
                      Round {c.roundNumber}
                    </span>
                  </div>
                  <div className="hidden md:block w-16 text-sm text-muted-foreground font-mono">
                    #{c.roundNumber}
                  </div>
                  <div className="w-28 text-sm font-bold gradient-text font-heading">
                    {formatCurrency(c.amount, "USDC")}
                  </div>
                  <div className="w-28 text-sm text-muted-foreground font-body">
                    {formatDate(c.submittedAt)}
                  </div>
                  <div className="w-24">
                    <Badge
                      variant={isOnTime ? "success" : st.variant}
                      size="sm"
                    >
                      {isOnTime ? "On Time" : displayStatus}
                    </Badge>
                  </div>
                  <div className="w-36">
                    {c.txnHash ? (
                      <TransactionLink hash={c.txnHash} />
                    ) : (
                      <span className="text-xs text-muted-foreground font-mono">
                        Pending
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-body">
            Page {meta.page} of {meta.totalPages} ({meta.total} contributions)
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
