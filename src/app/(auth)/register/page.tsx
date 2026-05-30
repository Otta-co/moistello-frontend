"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Fingerprint,
  Wallet,
  QrCode,
  Usb,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Shield,
} from "lucide-react"
import dynamic from "next/dynamic"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useMultiWalletStore } from "@/stores/multi-wallet-store"
import { useAuthStore } from "@/stores/auth-store"
import { useUIStore } from "@/stores/ui-store"
import apiClient from "@/lib/api-client"
import { Routes } from "@/lib/constants"
import { cn } from "@/lib/cn"

const LedgerPrompt = dynamic(
  () => import("@/components/wallet/ledger-prompt").then((m) => m.LedgerPrompt),
  { ssr: false },
)

const WalletConnectQR = dynamic(
  () =>
    import("@/components/wallet/walletconnect-qr").then((m) => m.WalletConnectQR),
  { ssr: false },
)

const WalletConnectDeepLink = dynamic(
  () =>
    import("@/components/wallet/walletconnect-deeplink").then(
      (m) => m.WalletConnectDeepLink,
    ),
  { ssr: false },
)

type Step = "choose" | "passkey-email" | "profile" | "sign"

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

  const connect = useMultiWalletStore((s) => s.connect)
  const isConnecting = useMultiWalletStore((s) => s.isConnecting)
  const address = useMultiWalletStore((s) => s.address)
  const activeAdapter = useMultiWalletStore((s) => s.activeAdapter)
  const detectedWallets = useMultiWalletStore((s) => s.detectedWallets)
  const wc2PairingState = useMultiWalletStore((s) => s.wc2PairingState)
  const wc2PairingUri = useMultiWalletStore((s) => s.wc2PairingUri)
  const wc2PairingError = useMultiWalletStore((s) => s.wc2PairingError)
  const passkeyState = useMultiWalletStore((s) => s.passkeyState)
  const setPasskeyEmail = useMultiWalletStore((s) => s.setPasskeyEmail)
  const setPasskeyState = useMultiWalletStore((s) => s.setPasskeyState)
  const setPasskeyPublicKey = useMultiWalletStore((s) => s.setPasskeyPublicKey)
  const setWc2PairingUri = useMultiWalletStore((s) => s.setWc2PairingUri)
  const setWc2PairingState = useMultiWalletStore((s) => s.setWc2PairingState)
  const setWc2PairingError = useMultiWalletStore((s) => s.setWc2PairingError)
  const resetWc2Pairing = useMultiWalletStore((s) => s.resetWc2Pairing)
  const registerError = useMultiWalletStore((s) => s.registerError)
  const setRegisterError = useMultiWalletStore((s) => s.setRegisterError)
  const clearRegisterError = useMultiWalletStore((s) => s.clearRegisterError)

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)

  const addToast = useUIStore((s) => s.addToast)

  const [step, setStep] = useState<Step>("choose")
  const [passkeyEmail, setLocalPasskeyEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [profileEmail, setProfileEmail] = useState("")
  const [country, setCountry] = useState("")
  const [language, setLanguage] = useState("en")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showLedgerPrompt, setShowLedgerPrompt] = useState(false)
  const [isWc2Active, setIsWc2Active] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [nonce, setNonce] = useState<string | null>(null)

  useEffect(() => {
    useMultiWalletStore.getState().scanWallets()
    clearRegisterError()
    resetWc2Pairing()
  }, [clearRegisterError, resetWc2Pairing])

  useEffect(() => {
    if (isAuthenticated) {
      router.push(Routes.DASHBOARD)
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (step === "choose" && address && !isConnecting) {
      setStep("profile")
    }
  }, [address, isConnecting, step])

  const handleSelectWallet = useCallback(
    async (walletId: string) => {
      if (walletId === "passkey") {
        setStep("passkey-email")
        return
      }

      const wallet = detectedWallets.find((w) => w.id === walletId)
      if (wallet?.category === "hardware") {
        setShowLedgerPrompt(true)
        return
      }

      if (walletId === "walletconnect") {
        setIsWc2Active(true)
        try {
          const { setOnPairingUri } = await import(
            "@/lib/wallet/adapters/walletconnect"
          )
          setOnPairingUri((uri: string) => {
            setWc2PairingUri(uri)
            setWc2PairingState("awaiting_approval")
          })
          await connect("walletconnect")
          setWc2PairingState("approved")
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Connection failed"
          setWc2PairingError(message)
          addToast({
            type: "error",
            title: "WalletConnect Failed",
            description: message,
          })
          return
        } finally {
          const { setOnPairingUri } = await import(
            "@/lib/wallet/adapters/walletconnect"
          )
          setOnPairingUri(null)
        }
        setIsWc2Active(false)
        return
      }

      try {
        await connect(walletId)
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Connection failed"
        setRegisterError(message)
        addToast({
          type: "error",
          title: "Connection Failed",
          description: message,
        })
      }
    },
    [detectedWallets, connect, setWc2PairingUri, setWc2PairingState, setWc2PairingError, addToast, setRegisterError],
  )

  const handleWc2Cancel = useCallback(() => {
    resetWc2Pairing()
    setIsWc2Active(false)
  }, [resetWc2Pairing])

  const handleWc2Retry = () => {
    handleSelectWallet("walletconnect")
  }

  const handlePasskeyCreate = useCallback(async () => {
    if (
      !passkeyEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passkeyEmail)
    ) {
      setFieldErrors({ passkeyEmail: "Please enter a valid email address" })
      return
    }
    setFieldErrors({})
    setPasskeyEmail(passkeyEmail)
    setPasskeyState("registering")

    try {
      await connect("passkey")
      const mwAddress = useMultiWalletStore.getState().address
      if (!mwAddress) {
        throw new Error("Failed to get wallet address")
      }
      setPasskeyPublicKey(mwAddress)
      setPasskeyState("connected")
      setStep("profile")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Passkey setup failed"
      setPasskeyState("error")
      addToast({
        type: "error",
        title: "Passkey Setup Failed",
        description: message,
      })
    }
  }, [passkeyEmail, connect, setPasskeyEmail, setPasskeyState, setPasskeyPublicKey, addToast])

  const validateProfile = useCallback((): boolean => {
    const errors: Record<string, string> = {}
    if (!displayName.trim()) {
      errors.displayName = "Display name is required"
    } else if (displayName.trim().length < 2) {
      errors.displayName = "Display name must be at least 2 characters"
    } else if (displayName.trim().length > 64) {
      errors.displayName = "Display name must be under 64 characters"
    }
    if (
      profileEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail)
    ) {
      errors.profileEmail = "Please enter a valid email address"
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }, [displayName, profileEmail])

  const handleProfileNext = useCallback(() => {
    if (validateProfile()) {
      setStep("sign")
    }
  }, [validateProfile])

  const handleSignAndRegister = useCallback(async () => {
    const currentAddress = useMultiWalletStore.getState().address
    if (!currentAddress) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const nonceResponse = await apiClient.post("/auth/nonce", {
        walletAddress: currentAddress,
      })
      const nonceData = nonceResponse.data as { nonce: string } | undefined
      const fetchedNonce =
        nonceData?.nonce ??
        ((nonceResponse.data as unknown as string) ?? "")
      if (!fetchedNonce) {
        throw new Error("Failed to get authentication nonce")
      }
      setNonce(fetchedNonce)

      const multiStore = useMultiWalletStore.getState()
      const sig = await multiStore.signMessage(fetchedNonce)
      setSignature(sig)

      const registerResponse = await apiClient.post("/auth/register", {
        walletAddress: currentAddress,
        signature: sig,
        displayName: displayName.trim(),
        email: profileEmail.trim() || undefined,
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
            "Registration failed",
        )
      }

      useAuthStore.getState().setTokens(regData.token, regData.refreshToken)
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
    } catch (err: unknown) {
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
  }, [displayName, profileEmail, country, language, addToast, router])

  // Step indicator steps
  const stepMeta = [
    { num: 1, label: "Choose", key: "choose" },
    { num: 2, label: "Profile", key: "profile" },
    { num: 3, label: "Verify", key: "sign" },
  ]

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-aurora-violet" />
          <p className="text-muted-foreground text-sm">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    )
  }

  const walletCardIcon = (id: string, name: string) => {
    switch (id) {
      case "passkey":
        return <Fingerprint className="h-7 w-7" />
      case "walletconnect":
        return <QrCode className="h-7 w-7" />
      case "ledger":
        return <Usb className="h-7 w-7" />
      default:
        return (
          <span className="text-lg font-bold">
            {name.charAt(0).toUpperCase()}
          </span>
        )
    }
  }

  const stepIndex = stepMeta.findIndex((s) => s.key === step)
  const isStepPast = (key: string) => {
    const idx = stepMeta.findIndex((s) => s.key === key)
    return idx < stepIndex
  }

  const extensionWallets = detectedWallets.filter(
    (w) => w.category === "extension",
  )
  const hasWalletConnect = detectedWallets.some(
    (w) => w.id === "walletconnect",
  )
  const hasLedger = detectedWallets.some((w) => w.id === "ledger")
  const hasPasskey = detectedWallets.some((w) => w.id === "passkey")

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="rounded-3xl p-8 md:p-10 max-w-md w-full mx-auto relative z-10 bg-card/80 backdrop-blur-xl border border-white/10 shadow-xl">
        <Link
          href={Routes.HOME}
          className="block text-center font-heading text-2xl font-bold gradient-text-extended mb-8"
        >
          Moistello
        </Link>

        <div className="flex items-center justify-center gap-0 mb-8">
          {stepMeta.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                    isStepPast(s.key)
                      ? "bg-emerald-500 text-white"
                      : s.key === step
                        ? "gradient-bg text-white shadow-[0_0_16px_rgb(var(--aurora-violet)/0.4)]"
                        : "bg-white/10 text-muted-foreground",
                  )}
                >
                  {isStepPast(s.key) ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    s.num
                  )}
                </span>
                <span className="text-2xs text-muted-foreground font-heading">
                  {s.label}
                </span>
              </div>
              {i < stepMeta.length - 1 && (
                <div className="w-8 h-px bg-gradient-to-r from-aurora-violet/50 to-aurora-cyan/30 mx-1" />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {/* ───── Step: Choose Wallet ───── */}
          {step === "choose" && (
            <>
              {isWc2Active ? (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl gradient-bg-extended flex items-center justify-center text-white mx-auto mb-4">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-xl mb-1">
                    Connect with WalletConnect
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    {/Android|iPhone|iPad|iPod/i.test(
                      typeof navigator !== "undefined" ? navigator.userAgent : "",
                    )
                      ? "Open your wallet app to connect"
                      : "Scan the QR code with your mobile wallet"}
                  </p>

                  {/Android|iPhone|iPad|iPod/i.test(
                    typeof navigator !== "undefined" ? navigator.userAgent : "",
                  ) ? (
                    <WalletConnectDeepLink
                      uri={wc2PairingUri}
                      pairingState={wc2PairingState}
                      error={wc2PairingError}
                      onRetry={handleWc2Retry}
                    />
                  ) : (
                    <WalletConnectQR
                      uri={wc2PairingUri}
                      pairingState={wc2PairingState}
                      error={wc2PairingError}
                      onRetry={handleWc2Retry}
                      onCancel={handleWc2Cancel}
                    />
                  )}

                  <button
                    type="button"
                    onClick={handleWc2Cancel}
                    className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl gradient-bg-extended flex items-center justify-center text-white mx-auto mb-4">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading text-xl mb-1">
                      Create your account
                    </h3>
                    <p className="text-sm text-muted-foreground mb-5">
                      Pick how you want to connect
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {hasPasskey && (
                      <button
                        type="button"
                        onClick={() => handleSelectWallet("passkey")}
                        disabled={isConnecting}
                        className="relative flex flex-col items-center justify-center gap-2 glass rounded-2xl p-4 min-h-[100px] transition-all hover:bg-white/[0.06] hover:border-aurora-violet/40 border-2 border-aurora-violet/20 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-aurora-violet/20 text-aurora-violet">
                          <Fingerprint className="h-5 w-5" />
                        </span>
                        <span className="text-xs font-heading font-medium text-center leading-tight">
                          Passkey
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Email + Biometric
                        </span>
                        <span className="absolute -top-2 -right-2 text-2xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                          Recommended
                        </span>
                      </button>
                    )}

                    {extensionWallets.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => handleSelectWallet(w.id)}
                        disabled={w.status !== "detected" || isConnecting}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 glass rounded-2xl p-4 min-h-[100px] transition-all hover:bg-white/[0.06] hover:border-aurora-violet/40 border border-white/10",
                          w.status !== "detected" &&
                            "opacity-40 pointer-events-none",
                        )}
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-aurora-cyan">
                          {walletCardIcon(w.id, w.name)}
                        </span>
                        <span className="text-xs font-heading font-medium text-center leading-tight">
                          {w.name}
                        </span>
                        {w.status !== "detected" && (
                          <span className="text-[10px] text-muted-foreground">
                            Not installed
                          </span>
                        )}
                      </button>
                    ))}

                    {hasWalletConnect && (
                      <button
                        type="button"
                        onClick={() => handleSelectWallet("walletconnect")}
                        disabled={isConnecting}
                        className="flex flex-col items-center justify-center gap-2 glass rounded-2xl p-4 min-h-[100px] transition-all hover:bg-white/[0.06] disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-aurora-violet/20 text-aurora-violet">
                          <QrCode className="h-5 w-5" />
                        </span>
                        <span className="text-xs font-heading font-medium text-center leading-tight">
                          WalletConnect
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Mobile wallets
                        </span>
                      </button>
                    )}

                    {hasLedger && (
                      <button
                        type="button"
                        onClick={() => handleSelectWallet("ledger")}
                        disabled={isConnecting}
                        className="flex flex-col items-center justify-center gap-2 glass rounded-2xl p-4 min-h-[100px] transition-all hover:bg-white/[0.06] hover:border-premium-gold/40 border border-white/10 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-premium-gold/20 text-premium-gold">
                          <Usb className="h-5 w-5" />
                        </span>
                        <span className="text-xs font-heading font-medium text-center leading-tight">
                          Ledger
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Hardware wallet
                        </span>
                      </button>
                    )}
                  </div>

{registerError && (
                     <div className="flex items-start gap-2 text-sm text-red-400">
                       <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                       <span>{registerError}</span>
                     </div>
                   )}

                  {extensionWallets.filter((w) => w.status === "detected")
                    .length === 0 && !hasPasskey && !hasWalletConnect && !hasLedger && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No wallets available. Install a Stellar wallet like
                      Freighter or use WalletConnect.
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Your keys, your coins. We never have access to your funds.
                  </p>
                </>
              )}
            </>
          )}

          {/* ───── Step: Passkey Email ───── */}
          {step === "passkey-email" && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => {
                  setStep("choose")
                  setFieldErrors({})
                }}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to wallet options
              </button>

              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl gradient-bg-extended flex items-center justify-center text-white">
                  <Fingerprint className="h-8 w-8" />
                </div>
              </div>

              <div className="text-center">
                <h3 className="font-heading text-xl mb-1">
                  Create Your Wallet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Enter your email to create a passkey wallet.
                  <br />
                  No crypto knowledge needed.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="passkey-register-email"
                  className="text-sm font-medium text-foreground"
                >
                  Email address
                </label>
                <input
                  id="passkey-register-email"
                  type="email"
                  value={passkeyEmail}
                  onChange={(e) => {
                    setLocalPasskeyEmail(e.target.value)
                    if (fieldErrors.passkeyEmail) {
                      setFieldErrors({})
                    }
                  }}
                  placeholder="you@example.com"
                  className="w-full h-12 glass rounded-xl px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-aurora-violet/50"
                  disabled={
                    passkeyState === "registering" ||
                    passkeyState === "awaiting_biometric" ||
                    passkeyState === "authenticating" ||
                    passkeyState === "deriving"
                  }
                  autoComplete="email"
                />
                {fieldErrors.passkeyEmail && (
                  <p className="text-xs text-red-400">
                    {fieldErrors.passkeyEmail}
                  </p>
                )}
              </div>

{registerError && (
                 <div className="flex items-start gap-2 text-sm text-red-400">
                   <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                   <span>{registerError}</span>
                 </div>
               )}

              <button
                onClick={handlePasskeyCreate}
                disabled={
                  !passkeyEmail ||
                  passkeyState === "registering" ||
                  passkeyState === "awaiting_biometric" ||
                  passkeyState === "authenticating" ||
                  passkeyState === "deriving"
                }
                className="gradient-bg-extended w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-heading font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_24px_rgb(var(--aurora-violet)/0.25)]"
              >
                {passkeyState === "registering" ||
                passkeyState === "awaiting_biometric" ||
                passkeyState === "authenticating" ||
                passkeyState === "deriving" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {passkeyState === "registering"
                      ? "Creating passkey..."
                      : passkeyState === "awaiting_biometric"
                        ? "Scan biometric..."
                        : passkeyState === "authenticating"
                          ? "Verifying..."
                          : "Generating wallet..."}
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Create Passkey
                  </>
                )}
              </button>

              <p className="text-xs text-muted-foreground text-center">
                Your wallet is derived from your email and device biometrics.
                <br />
                No private keys leave your device.
              </p>
            </div>
          )}

          {/* ───── Step: Profile ───── */}
          {step === "profile" && address && (
            <div className="space-y-4">
              <div className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Connected &#x2713;{" "}
                    {activeAdapter?.meta.name ?? "Wallet"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {shortenAddress(address)}
                  </p>
                </div>
              </div>

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
                  label="Email (optional)"
                  type="email"
                  placeholder="you@example.com"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  error={fieldErrors.profileEmail}
                  hint="Used for notifications and recovery."
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
            </div>
          )}

          {/* ───── Step: Sign ───── */}
          {step === "sign" && (
            <div className="space-y-5">
              <div className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {activeAdapter?.meta.name ?? "Wallet"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {address ? shortenAddress(address) : ""}
                  </p>
                </div>
              </div>

              <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Profile Complete
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {displayName}
                    {profileEmail ? ` \u00b7 ${profileEmail}` : ""}
                    {country
                      ? ` \u00b7 ${countries.find((c) => c.value === country)?.label ?? country}`
                      : ""}
                  </p>
                </div>
              </div>

              {nonce && signature && (
                <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Message Signed
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {signature.slice(0, 16)}...{signature.slice(-8)}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleSignAndRegister}
                disabled={isSubmitting || isLoading}
                className="gradient-bg-premium w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-heading font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_24px_rgb(var(--premium-gold)/0.3)]"
              >
                {isSubmitting || isLoading ? (
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
          )}
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

      <LedgerPrompt
        isOpen={showLedgerPrompt}
        onClose={() => setShowLedgerPrompt(false)}
      />
    </div>
  )
}
