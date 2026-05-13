"use client"

import React, { useState, useDeferredValue } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Search,
  Plus,
  Users,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "lucide-react"
import { useCircles } from "@/hooks/use-circles"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/cn"
import { formatCurrency } from "@/lib/formatters"
import type { Circle, CircleType, Currency } from "@/types"

const TYPE_TABS = [
  { value: "all", label: "All" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "community", label: "Community" },
  { value: "premium", label: "Premium" },
]

const CURRENCIES: Currency[] = ["USDC", "XLM"]

const typeAccentColors: Record<CircleType, string> = {
  public: "from-emerald-500 to-aurora-cyan",
  private: "from-aurora-indigo to-aurora-violet",
  org: "from-aurora-cyan to-aurora-indigo",
  community: "from-aurora-amber to-aurora-violet",
  premium: "from-aurora-violet to-fuchsia-500",
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const cardItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function CircleGridCard({ circle }: { circle: Circle }) {
  const freqLabel =
    circle.frequency.charAt(0).toUpperCase() + circle.frequency.slice(1)
  const memberCount = circle.memberCount ?? 0
  const progressPct = Math.min(
    100,
    Math.round((circle.currentRound / (circle.maxMembers || 1)) * 100),
  )
  const isPremium = circle.circleType === "premium"
  const accentGradient = typeAccentColors[circle.circleType] ?? typeAccentColors.public

  return (
    <Link href={`/circles/${circle.id}`}>
      <motion.div
        variants={cardItem}
        whileHover={{ y: -5, transition: { duration: 0.25 } }}
        className={cn(
          "glass-premium rounded-2xl overflow-hidden tilt-hover depth-3",
          isPremium && "holo-border",
        )}
      >
        <div className={cn("h-[3px] w-full bg-gradient-to-r", accentGradient)} />
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="font-heading text-lg font-semibold text-foreground dark:text-white truncate">
                {circle.name}
              </h4>
              <p className="text-2xs text-muted-foreground mt-0.5 capitalize">
                {circle.circleType}
              </p>
            </div>
            <Badge
              variant={circle.status === "active" ? "success" : circle.status === "pending" ? "warning" : "default"}
              size="sm"
              className="shrink-0 ml-2"
            >
              {circle.status}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="gradient-text font-bold font-heading">
              {formatCurrency(circle.contributionAmount, circle.currency)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {freqLabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {memberCount}/{circle.maxMembers}
            </span>
            {circle.minMoiScore != null && circle.minMoiScore > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-400 text-xs">
                <Shield className="h-3 w-3" />
                {circle.minMoiScore}+
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-2xs text-muted-foreground">
              <span>Round Progress</span>
              <span>{circle.currentRound}/{circle.maxMembers}</span>
            </div>
            <Progress value={progressPct} size="sm" variant={progressPct >= 80 ? "success" : "primary"} />
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground hover:text-foreground transition-colors font-body">
              View Details &rarr;
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default function CirclesBrowsePage() {
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [typeFilter, setTypeFilter] = useState("all")
  const [currencyFilter, setCurrencyFilter] = useState<Currency | null>(null)
  const [page, setPage] = useState(1)
  const limit = 12

  const filters = {
    search: deferredSearch || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    page,
    limit,
  }

  const { data, isLoading, isError } = useCircles(filters)
  const circles = data?.circles ?? []
  const meta = data?.meta

  const filteredCircles =
    currencyFilter != null
      ? circles.filter((c) => c.currency === currencyFilter)
      : circles

  const hasNext = meta ? meta.page < meta.totalPages : false
  const hasPrev = page > 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discover Circles"
        description="Browse and join savings circles on the Stellar network."
        action={
          <Link href="/circles/create">
            <Button variant="premium" size="md" leftIcon={<Plus className="h-4 w-4" />}>
              Create Circle
            </Button>
          </Link>
        }
      />

      <div className="relative">
        <Input
          placeholder="Search circles by name..."
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TYPE_TABS.map((f) => (
            <motion.button
              key={f.value}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setTypeFilter(f.value)
                setPage(1)
              }}
              className={cn(
                "inline-flex items-center rounded-full px-4 py-1.5 text-xs font-body font-medium transition-all duration-300",
                typeFilter === f.value
                  ? "gradient-bg-extended text-white shadow-lg holo-glow"
                  : "glass-whisper text-muted-foreground hover:text-foreground dark:hover:text-white",
              )}
            >
              {f.label}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-2xs text-muted-foreground font-body">Currency:</span>
          {CURRENCIES.map((c) => (
            <motion.button
              key={c}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCurrencyFilter((prev) => (prev === c ? null : c))}
              className={cn(
                "inline-flex items-center rounded-full px-3.5 py-1 text-xs font-body font-medium transition-all duration-300",
                currencyFilter === c
                  ? "gradient-bg-extended text-white"
                  : "glass-whisper text-muted-foreground hover:text-foreground dark:hover:text-white",
              )}
            >
              {c}
            </motion.button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="Failed to load circles"
          description="Something went wrong. Please try again later."
        />
      ) : filteredCircles.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="No circles found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredCircles.map((circle) => (
            <CircleGridCard key={circle.id} circle={circle} />
          ))}
        </motion.div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground font-body">
            Page {meta.page} of {meta.totalPages} ({meta.total} circles)
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
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(meta.totalPages, 5) }).map((_, i) => {
                const pageNum = i + 1
                return (
                  <motion.button
                    key={pageNum}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "w-8 h-8 rounded-full text-xs font-body font-medium transition-all",
                      meta.page === pageNum
                        ? "gradient-bg-extended text-white"
                        : "glass-whisper text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {pageNum}
                  </motion.button>
                )
              })}
            </div>
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
