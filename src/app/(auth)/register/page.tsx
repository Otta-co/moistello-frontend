"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Wallet,
  CheckCircle,
  ExternalLink,
  User,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useWalletStore } from "@/stores/wallet-store"
import { useAuthStore } from "@/stores/auth-store"
import { useUIStore } from "@/stores/ui-store"
import { signMessage, isFreighterInstalled } from "@/lib/stellar"
import apiClient from "@/lib/api-client"
import { Routes } from "@/lib/constants"

type Step = "connect" | "profile" | "sign"

const countries: { label: string; value: string }[] = [
  { label: "Select country...", value: "" },
  { label: "Afghanistan", value: "AF" },
  { label: "Brazil", value: "BR" },
  { label: "Canada", value: "CA" },
  { label: "Democratic Republic of the Congo", value: "CD" },
  { label: "Ethiopia", value: "ET" },
  { label: "France", value: "FR" },
  { label: "Germany", value: "DE" },
  { label: "Ghana", value: "GH" },
  { label: "India", value: "IN" },
  { label: "Indonesia", value: "ID" },
  { label: "Kenya", value: "KE" },
  { label: "Mexico", value: "MX" },
  { label: "Nigeria", value: "NG" },
  { label: "Pakistan", value: "PK" },
  { label: "Philippines", value: "PH" },
  { label: "Portugal", value: "PT" },
  { label: "Rwanda", value: "RW" },
  { label: "Senegal", value: "SN" },
  { label: "South Africa", value: "ZA" },
  { label: "Spain", value: "ES" },
  { label: "Tanzania", value: "TZ" },
  { label: "Uganda", value: "UG" },
  { label: "United Kingdom", value: "GB" },
  { label: "United States", value: "US" },
  { label: "Other", value: "OTHER" },
]

const languages: { label: string; value: string }[] = [
  { label: "English", value: "en" },
  { label: "Fran\u00e7ais", value: "fr" },
  { label: "Kiswahili", value: "sw" },
  { label: "Espa\u00f1ol", value: "es" },
  { label: "Portugu\u00eas", value: "pt" },
  { label: "\u0939\u093f\u0928\u094d\u0926\u0940", value: "hi" },
]

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function RegisterPage() {
  const router = useRouter()

  const isConnected = useWalletStore((s) => s.isConnected)
  const address = useWalletStore((s) => s.address)
  const isConnecting = useWalletStore((s) => s.isConnecting)
  const walletError = useWalletStore((s) => s.error)
  const connect = useWalletStore((s) => s.connect)

  const isAuthLoading = useAuthStore((s) => s.isLoading)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setTokens = useAuthStore((s) => s.setTokens)

  const addToast = useUIStore((s) => s.addToast)

  const [step, setStep] = useState<Step>("connect")
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [country, setCountry] = useState("")
  const [language, setLanguage] = useState("en")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      router.push(Routes.DASHBOARD)
    }
  }, [isAuthenticated, router])

  const handleConnect = async () => {
    try {
      await connect()
      setStep("profile")
      setSubmitError(null)
    } catch (err) {
      addToast({
        type: "error",
        title: "Connection Failed",
        description:
          err instanceof Error ? err.message : "Failed to connect wallet",
      })
    }
  }

  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {}

    if (!displayName.trim()) {
      errors.displayName = "Display name is required"
    } else if (displayName.trim().length < 2) {
      errors.displayName = "Display name must be at least 2 characters"
    } else if (displayName.trim().length > 64) {
      errors.displayName = "Display name must be under 64 characters"
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleProfileNext = () => {
    if (validateProfile()) {
      setStep("sign")
    }
  }

  const handleSignAndRegister = async () => {
    if (!address) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const nonceResponse = await apiClient.post("/auth/nonce", {
        walletAddress: address,
      })
      const nonceData = nonceResponse.data as { nonce: string } | undefined
      const nonce =
        nonceData?.nonce ??
        ((nonceResponse.data as unknown as string) ?? "")

      if (!nonce) {
        throw new Error("Failed to get authentication nonce")
      }

      const signature = await signMessage(nonce)

      const registerResponse = await apiClient.post("/auth/register", {
        walletAddress: address,
        signature,
        displayName: displayName.trim(),
        email: email.trim() || undefined,
        countryCode: country || undefined,
        preferredLanguage: language,
      })

      const regData = registerResponse.data as {
        token: string
        refreshToken: string
        user: unknown
      }

      if (!regData?.token || !regData?.user) {
        throw new Error(
          (registerResponse.data as { error?: string })?.error ??
            "Registration failed"
        )
      }

      setTokens(regData.token, regData.refreshToken)
      useAuthStore.setState({
        isAuthenticated: true,
        user: regData.user as NonNullable<
          ReturnType<typeof useAuthStore.getState>["user"]
        >,
        isLoading: false,
      })

      addToast({
        type: "success",
        title: "Welcome to Moistello!",
        description: "Your account has been created.",
      })

      router.push(Routes.DASHBOARD)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed"
      setSubmitError(message)
      addToast({
        type: "error",
        title: "Registration Failed",
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen auroral-mesh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-aurora-violet" />
          <p className="text-muted-foreground text-sm">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen auroral-mesh flex flex-col items-center justify-center px-4 py-12">
      {/* Card */}
      <div className="glass-flagship rounded-3xl p-8 md:p-10 max-w-md w-full mx-auto holo-border relative z-10">
        <Link
          href={Routes.HOME}
          className="block text-center font-heading text-2xl font-bold gradient-text-extended mb-8"
        >
          Moistello
        </Link>

        {/* 3-step indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {[
            { num: 1, label: "Connect", key: "connect" },
            { num: 2, label: "Profile", key: "profile" },
            { num: 3, label: "Verify", key: "sign" },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    (s.key === "connect" && isConnected) ||
                    (s.key === "profile" && step === "sign") ||
                    (s.key === "sign" && step === "sign")
                      ? "bg-emerald-500 text-white"
                      : step === s.key
                        ? "gradient-bg text-white shadow-[0_0_16px_rgb(var(--aurora-violet)/0.4)]"
                        : "bg-white/10 text-muted-foreground"
                  }`}
                >
                  {(s.key === "connect" && isConnected) ||
                  (s.key === "profile" && step === "sign") ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    s.num
                  )}
                </span>
                <span className="text-2xs text-muted-foreground font-heading">{s.label}</span>
              </div>
              {i < 2 && (
                <div className="w-8 h-px bg-gradient-to-r from-aurora-violet/50 to-aurora-cyan/30 mx-1" />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {/* Step 1: Connect Wallet */}
          {!isConnected ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl gradient-bg-extended flex items-center justify-center text-white mx-auto mb-4">
                <Wallet className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-xl mb-1">Connect Your Wallet</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Use Freighter to get started
              </p>

              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="glass-strong w-full h-12 rounded-xl flex items-center justify-center gap-3 text-sm font-heading font-medium text-foreground hover:bg-white/[0.06] transition-all disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden"
              >
                {isConnecting ? (
                  <>
                    <span className="absolute inset-0 animate-shimmer" />
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-5 w-5 text-aurora-violet" />
                    Connect Freighter
                  </>
                )}
              </button>

              {walletError && (
                <div className="mt-4 flex items-start gap-2 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{walletError}</span>
                </div>
              )}

              {mounted && !isFreighterInstalled() && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Freighter not detected.{" "}
                  <a
                    href="https://freighter.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-aurora-cyan hover:underline"
                  >
                    Install Freighter
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              )}
            </div>
          ) : (
            <div className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  Connected &#x2713;
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {address ? shortenAddress(address) : ""}
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Profile */}
          {step === "profile" && (
            <div className="glass rounded-2xl p-5 space-y-4">
              <Input
                label="Display Name"
                placeholder="Your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                error={fieldErrors.displayName}
                required
                leftIcon={<User className="h-4 w-4" />}
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldErrors.email}
                hint="Optional. Used for notifications and recovery."
                leftIcon={<Mail className="h-4 w-4" />}
              />
              <Select
                label="Country"
                options={countries}
                value={country}
                onChange={setCountry}
                placeholder="Select country..."
              />
              <Select
                label="Preferred Language"
                options={languages}
                value={language}
                onChange={setLanguage}
              />
              <button
                onClick={handleProfileNext}
                className="gradient-bg-extended w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-heading font-semibold text-white hover:opacity-90 transition-opacity shadow-[0_0_16px_rgb(var(--aurora-violet)/0.2)]"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === "sign" && (
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Profile Complete
                </p>
                <p className="text-xs text-muted-foreground">
                  {displayName}
                  {email ? ` \u00b7 ${email}` : ""}
                  {country ? ` \u00b7 ${country}` : ""}
                </p>
              </div>
            </div>
          )}

          {!isConnected && (
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet first to continue.
            </p>
          )}

          {/* Step 3: Create Account */}
          <div>
            <button
              onClick={handleSignAndRegister}
              disabled={step !== "sign" || isSubmitting || isAuthLoading}
              className="gradient-bg-premium w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-heading font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_24px_rgb(var(--premium-gold)/0.3)]"
            >
              {isSubmitting || isAuthLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {submitError && (
              <div className="mt-3 flex items-start gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col gap-2 items-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={Routes.LOGIN}
              className="font-medium text-aurora-cyan hover:underline"
            >
              Sign in
            </Link>
          </p>
          <Link
            href={Routes.HOME}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
