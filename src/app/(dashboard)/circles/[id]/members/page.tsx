"use client"

import React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Users, Inbox, Hash } from "lucide-react"
import { useCircleMembers } from "@/hooks/use-circles"
import { useAuth } from "@/hooks/use-auth"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CopyButton } from "@/components/shared/copy-button"
import { formatAddress } from "@/lib/formatters"
import { cn } from "@/lib/cn"
import type { MemberStatus } from "@/types"

const statusVariantMap: Record<
  MemberStatus,
  { variant: "success" | "warning" | "info" | "destructive" | "default" | "outline"; label: string }
> = {
  active: { variant: "success", label: "Active" },
  pending: { variant: "warning", label: "Pending" },
  invited: { variant: "info", label: "Invited" },
  defaulter: { variant: "destructive", label: "Defaulter" },
  left: { variant: "default", label: "Left" },
  removed: { variant: "destructive", label: "Removed" },
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const memberItem = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0 },
}

export default function CircleMembersPage() {
  const params = useParams()
  const circleId = params.id as string

  const { user } = useAuth()
  const { data: members = [], isLoading, isError } = useCircleMembers(circleId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Members"
          breadcrumbs={[
            { label: "Circles", href: "/circles" },
            { label: "Circle", href: `/circles/${circleId}` },
            { label: "Members" },
          ]}
          action={
            <Link href={`/circles/${circleId}`}>
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Back
              </Button>
            </Link>
          }
        />
        <div className="glass-premium rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="30%" />
                  <Skeleton variant="text" width="50%" />
                </div>
                <Skeleton variant="text" width={80} />
                <Skeleton variant="text" width={60} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Members" />
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="Failed to load members"
          description="Something went wrong. Please try again."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description={`${members.length} member${members.length !== 1 ? "s" : ""} in this circle`}
        breadcrumbs={[
          { label: "Circles", href: "/circles" },
          { label: "Circle", href: `/circles/${circleId}` },
          { label: "Members" },
        ]}
        action={
          <Link href={`/circles/${circleId}`}>
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to Circle
            </Button>
          </Link>
        }
      />

      {members.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No members yet"
          description="This circle has no members."
        />
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="glass-premium rounded-2xl overflow-hidden holo-border"
        >
          <div className="divide-y divide-border">
            {members.map((member) => {
              const isCurrentUser = member.userId === user?.id
              const displayName = member.userName || "Anonymous"
              const statusCfg =
                statusVariantMap[member.status] || statusVariantMap.left

              return (
                <motion.div
                  key={member.id}
                  variants={memberItem}
                  className={cn(
                    "flex items-center justify-between p-4 transition-colors hover:glass-whisper",
                    isCurrentUser && "glass-strong",
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <Avatar
                      fallback={displayName}
                      size="md"
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-heading font-semibold text-foreground dark:text-white truncate text-sm">
                          {displayName}
                        </p>
                        {isCurrentUser && (
                          <span className="text-[10px] font-medium gradient-text bg-white/5 dark:bg-white/10 rounded-full px-2 py-0.5">
                            You
                          </span>
                        )}
                      </div>
                      {member.userAddress && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-mono text-muted-foreground">
                            {formatAddress(member.userAddress)}
                          </span>
                          <CopyButton text={member.userAddress} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="inline-flex items-center gap-1 glass rounded-full px-2.5 py-1 text-xs font-heading font-medium text-foreground dark:text-white">
                      <Hash className="h-3 w-3 gradient-text" />
                      #{member.position}
                    </span>
                    <Badge variant={statusCfg.variant} size="sm">
                      {statusCfg.label}
                    </Badge>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
