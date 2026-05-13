"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Bell,
  BellOff,
  ArrowUp,
  ArrowDown,
  CircleDot,
  AlertTriangle,
  CheckCheck,
  UserPlus,
  DollarSign,
  Shield,
  Info,
} from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatRelativeTime } from "@/lib/formatters"
import { cn } from "@/lib/cn"
import type { Notification } from "@/types"

const iconMap: Record<string, React.ReactNode> = {
  contribution: <ArrowUp className="h-4 w-4" />,
  contribution_received: <ArrowDown className="h-4 w-4" />,
  payout: <ArrowDown className="h-4 w-4" />,
  payout_received: <DollarSign className="h-4 w-4" />,
  circle: <CircleDot className="h-4 w-4" />,
  circle_joined: <UserPlus className="h-4 w-4" />,
  circle_completed: <CheckCheck className="h-4 w-4" />,
  system: <Info className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  penalty: <Shield className="h-4 w-4" />,
}

const gradientMap: Record<string, string> = {
  contribution: "from-emerald-500/30 to-green-600/30",
  contribution_received: "from-emerald-500/30 to-green-600/30",
  payout: "from-aurora-indigo/30 to-aurora-violet/30",
  payout_received: "from-aurora-indigo/30 to-aurora-violet/30",
  circle: "from-aurora-violet/30 to-fuchsia-500/30",
  circle_joined: "from-aurora-violet/30 to-fuchsia-500/30",
  circle_completed: "from-aurora-violet/30 to-fuchsia-500/30",
  system: "from-white/5 to-white/10",
  warning: "from-red-500/30 to-amber-500/30",
  penalty: "from-red-500/30 to-amber-500/30",
}

const iconColorMap: Record<string, string> = {
  contribution: "text-emerald-400",
  contribution_received: "text-emerald-400",
  payout: "text-aurora-violet",
  payout_received: "text-aurora-violet",
  circle: "text-fuchsia-400",
  circle_joined: "text-fuchsia-400",
  circle_completed: "text-fuchsia-400",
  system: "text-muted-foreground",
  warning: "text-red-400",
  penalty: "text-red-400",
}

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0 },
}

function NotificationItem({
  notification,
  onMarkRead,
  onClick,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onClick: (n: Notification) => void
}) {
  const handleClick = () => {
    if (!notification.isRead) onMarkRead(notification.id)
    onClick(notification)
  }

  const link =
    notification.data &&
    typeof notification.data === "object" &&
    "link" in notification.data
      ? String(notification.data.link)
      : null

  const icon = iconMap[notification.type] ?? <Bell className="h-4 w-4" />
  const grad = gradientMap[notification.type] ?? gradientMap.system
  const icol = iconColorMap[notification.type] ?? iconColorMap.system
  const isUnread = !notification.isRead

  return (
    <motion.button
      variants={itemVariants}
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:glass-whisper",
        isUnread && "glass-strong",
      )}
    >
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
        {isUnread && (
          <motion.span
            layoutId="unread-dot"
            className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-aurora-cyan animate-pulse"
          />
        )}
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br",
            grad,
          )}
        >
          <span className={icol}>{icon}</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "text-sm truncate font-body",
              isUnread
                ? "font-semibold text-foreground dark:text-white"
                : "font-medium text-muted-foreground",
            )}
          >
            {notification.title}
          </p>
          <span className="shrink-0 text-[11px] text-muted-foreground font-body">
            {notification.sentAt
              ? formatRelativeTime(notification.sentAt)
              : formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        {notification.body && (
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2 font-body">
            {notification.body}
          </p>
        )}
        {link && (
          <span className="mt-1 inline-block text-xs gradient-text font-body">
            View details &rarr;
          </span>
        )}
      </div>
    </motion.button>
  )
}

export default function NotificationsPage() {
  const router = useRouter()
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useNotifications()
  const [filter, setFilter] = useState("all")
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      const link =
        notification.data &&
        typeof notification.data === "object" &&
        "link" in notification.data
          ? String(notification.data.link)
          : null
      if (link) router.push(link)
    },
    [router],
  )

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await markAllAsRead()
    } finally {
      setMarkingAll(false)
    }
  }

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay updated with your circle activity, payouts, and system alerts."
        action={
          unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              isLoading={markingAll}
              leftIcon={<CheckCheck className="h-4 w-4" />}
              className="glass-whisper"
            >
              Mark All Read
            </Button>
          )
        }
      />

      <Tabs defaultValue="all" onValueChange={setFilter}>
        <TabsList className="inline-flex gap-1 glass rounded-xl p-1">
          <TabsTrigger value="all" className="rounded-lg text-sm font-body">
            All
            {notifications.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/10 px-1.5 text-xs text-muted-foreground">
                {notifications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="rounded-lg text-sm font-body">
            Unread
            {unreadCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-aurora-cyan/20 px-1.5 text-xs text-aurora-cyan animate-pulse-glow">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="glass-premium rounded-2xl overflow-hidden holo-border">
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="55%" />
                  <Skeleton variant="text" width="85%" />
                </div>
                <Skeleton variant="text" width="12%" />
              </div>
            ))}
          </div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<BellOff className="h-6 w-6" />}
          title="No notifications"
          description={
            filter === "unread"
              ? "You're all caught up! No unread notifications."
              : "You don't have any notifications yet."
          }
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.03 } } }}
          className="glass-premium rounded-2xl overflow-hidden holo-border"
        >
          <div className="divide-y divide-border">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={markAsRead}
                onClick={handleNotificationClick}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
