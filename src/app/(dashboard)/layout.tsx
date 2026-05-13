"use client"

import { AnimatePresence, motion } from "framer-motion"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { useRequireAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/cn"

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useRequireAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-void dark:bg-[#0a0a0f]">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="glass-flagship rounded-3xl p-10 md:p-14 flex flex-col items-center gap-6 holo-border"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-aurora-violet via-aurora-cyan to-aurora-indigo p-[2px]"
          >
            <div className="w-full h-full rounded-full bg-void dark:bg-[#0a0a0f] flex items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
          </motion.div>
          <div className="text-center">
            <p className="font-heading text-xl font-bold gradient-text-extended bg-clip-text text-transparent">
              Loading Moistello
            </p>
            <p className="mt-2 text-sm text-muted-foreground font-body tracking-wide animate-shimmer">
              Preparing your dashboard...
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <DashboardLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key="page-content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  )
}
