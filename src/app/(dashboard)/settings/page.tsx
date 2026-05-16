"use client"

import React, { useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  User,
  Shield,
  Bell,
  Wallet,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useMultiWallet } from "@/hooks/use-multi-wallet"
import { PageHeader } from "@/components/shared/page-header"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { CopyButton } from "@/components/shared/copy-button"
import { formatAddress } from "@/lib/formatters"
import { cn } from "@/lib/cn"
import type { KYCStatus } from "@/types"

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "BR", label: "Brazil" },
  { value: "IN", label: "India" },
  { value: "NG", label: "Nigeria" },
  { value: "KE", label: "Kenya" },
  { value: "ZA", label: "South Africa" },
  { value: "MX", label: "Mexico" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "SG", label: "Singapore" },
]

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Espa\u00f1ol" },
  { value: "fr", label: "Fran\u00e7ais" },
  { value: "pt", label: "Portugu\u00eas" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "sw", label: "Kiswahili" },
]

const kycConfig: Record<
  KYCStatus,
  { variant: "default" | "warning" | "success" | "destructive"; label: string }
> = {
  unverified: { variant: "default", label: "Unverified" },
  pending: { variant: "warning", label: "Pending" },
  verified: { variant: "success", label: "Verified" },
  rejected: { variant: "destructive", label: "Rejected" },
}

function GlassToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-all duration-300",
        checked
          ? "border-aurora-violet bg-aurora-violet/20 shadow-[0_0_12px_rgb(var(--aurora-violet)/0.3)]"
          : "border-white/10 bg-white/5",
      )}
    >
      <motion.span
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-foreground dark:bg-white shadow-lg"
      />
    </motion.button>
  )
}

const sectionV = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { isConnected, address, disconnect: disconnectWallet, activeWalletId, adapter, setSelectorOpen } = useMultiWallet()

  const [displayName, setDisplayName] = useState(user?.displayName ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [country, setCountry] = useState(user?.countryCode ?? "")
  const [language, setLanguage] = useState(user?.preferredLanguage ?? "en")

  const [kycStatus, setKycStatus] = useState<KYCStatus>(
    user?.kycStatus ?? "unverified",
  )
  const [kycLoading, setKycLoading] = useState(false)

  const [emailAlerts, setEmailAlerts] = useState(true)
  const [pushAlerts, setPushAlerts] = useState(true)
  const [inAppAlerts, setInAppAlerts] = useState(true)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }, [])

  const handleKYC = useCallback(async () => {
    setKycLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setKycStatus("pending")
    } finally {
      setKycLoading(false)
    }
  }, [])

  const handleRetryKYC = useCallback(async () => {
    setKycLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setKycStatus("pending")
    } finally {
      setKycLoading(false)
    }
  }, [])

  const handleDeleteAccount = useCallback(async () => {
    setDeleteLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setDeleteDialogOpen(false)
      window.location.href = "/login"
    } finally {
      setDeleteLoading(false)
    }
  }, [])

  const kyc = kycConfig[kycStatus] || kycConfig.unverified

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account, preferences, and connected wallets."
      />

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="space-y-6"
      >
        <motion.div variants={sectionV} className="glass-premium rounded-2xl p-6 space-y-4 holo-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-aurora-violet/20 to-aurora-indigo/20">
              <User className="h-4 w-4 gradient-text" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground dark:text-white">
              Profile
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Country"
              options={COUNTRIES}
              value={country}
              onChange={setCountry}
              placeholder="Select country"
            />
            <Select
              label="Language"
              options={LANGUAGES}
              value={language}
              onChange={setLanguage}
              placeholder="Select language"
            />
          </div>
        </motion.div>

        <motion.div variants={sectionV} className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-aurora-amber/20">
              <Shield className="h-4 w-4 text-amber-400" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground dark:text-white">
              KYC Verification
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge variant={kyc.variant} size="md">
                {kyc.label}
              </Badge>
              {kycStatus === "pending" && (
                <span className="inline-flex items-center gap-1.5 text-sm text-amber-400 font-body">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Verification in progress
                </span>
              )}
              {kycStatus === "verified" && (
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400 font-body">
                  <Check className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
              {kycStatus === "rejected" && (
                <span className="text-sm text-red-400 font-body">
                  Rejected — please try again
                </span>
              )}
            </div>
            <div>
              {kycStatus === "unverified" && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleKYC}
                  isLoading={kycLoading}
                >
                  Verify Identity
                </Button>
              )}
              {kycStatus === "pending" && (
                <Button variant="outline" size="md" disabled>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Processing
                </Button>
              )}
              {kycStatus === "rejected" && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleRetryKYC}
                  isLoading={kycLoading}
                >
                  Retry Verification
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={sectionV} className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/20 to-aurora-violet/20">
              <Bell className="h-4 w-4 gradient-text" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground dark:text-white">
              Notification Preferences
            </h3>
          </div>
          {[
            {
              label: "Email Notifications",
              hint: "Receive alerts via email",
              value: emailAlerts,
              setter: setEmailAlerts,
            },
            {
              label: "Push Notifications",
              hint: "Receive push on your device",
              value: pushAlerts,
              setter: setPushAlerts,
            },
            {
              label: "In-App Notifications",
              hint: "Show within the platform",
              value: inAppAlerts,
              setter: setInAppAlerts,
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-foreground dark:text-white font-body">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              </div>
              <GlassToggle checked={item.value} onChange={item.setter} />
            </div>
          ))}
        </motion.div>

        <motion.div variants={sectionV} className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-500/20 to-slate-700/20">
              <Wallet className="h-4 w-4 text-slate-400" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground dark:text-white">
              Connected Wallet
            </h3>
          </div>
          {isConnected && address ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-sm font-medium text-foreground dark:text-white font-heading">
                    {adapter?.meta.name ?? "Wallet"}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <p className="text-xs font-mono text-muted-foreground">
                    {formatAddress(address, 8, 6)}
                  </p>
                  <CopyButton text={address} />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => activeWalletId && disconnectWallet(activeWalletId)}
                className="glass-whisper"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-body">No wallet connected.</p>
              <Button variant="primary" size="sm" onClick={() => setSelectorOpen(true)}>
                Connect Wallet
              </Button>
            </div>
          )}
        </motion.div>

        <motion.div
          variants={sectionV}
          className="glass rounded-2xl p-6 space-y-4"
          style={{ borderColor: "rgb(239 68 68 / 0.2)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-red-400">
              Danger Zone
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-red-400 font-heading">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-400 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40"
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Delete Account
            </Button>
          </div>
        </motion.div>
      </motion.div>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-1 text-sm text-emerald-400 font-body"
          >
            <Check className="h-4 w-4" />
            Settings saved
          </motion.span>
        )}
        <Button
          variant="primary"
          size="lg"
          onClick={handleSave}
          isLoading={saving}
        >
          Save Changes
        </Button>
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action is permanent and cannot be undone."
        confirmLabel="Delete My Account"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  )
}
