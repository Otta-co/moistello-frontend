"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Fingerprint,
  Wallet,
  QrCode,
  Usb,
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield,
} from "lucide-react"
import dynamic from "next/dynamic"
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

type Step = "choose" | "sign"

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function LoginPage() {
  const router = useRouter()

  const connect = useMultiWalletStore((s) => s.connect)
  const isConnecting = useMultiWalletStore((s) => s.isConnecting)
  const address = useMultiWalletStore((s) => s.address)
  const isConnected = useMultiWalletStore((s) => s.isConnected)
  const activeAdapter = useMultiWalletStore((s) => s.activeAdapter)
  const detectedWallets = useMultiWalletStore((s) => s.detectedWallets)
  const wc2PairingState = useMultiWalletStore((s) => s.wc2PairingState)
  const wc2PairingUri = useMultiWalletStore((s) => s.wc2PairingUri)
  const wc2PairingError = useMultiWalletStore((s) => s.wc2PairingError)
  const passkeyState = useMultiWalletStore((s) => s.passkeyState)
  const setPasskeyState = useMultiWalletStore((s) => s.setPasskeyState)
  const setPasskeyPublicKey = useMultiWalletStore((s) => s.setPasskeyPublicKey)
  const setWc2PairingUri = useMultiWalletStore((s) => s.setWc2PairingUri)
  const setWc2PairingState = useMultiWalletStore((s) => s.setWc2PairingState)
  const setWc2PairingError = useMultiWalletStore((s) => s.setWc2PairingError)
  const resetWc2Pairing = useMultiWalletStore((s) => s.resetWc2Pairing)
  const loginError = useMultiWalletStore((s) => s.loginError)
  const setLoginError = useMultiWalletStore((s) => s.setLoginError)
  const clearLoginError = useMultiWalletStore((s) => s.clearLoginError)

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const login = useAuthStore((s) => s.login)

  const addToast = useUIStore((s) => s.addToast)

  const [step, setStep] = useState<Step>("choose")
  const [isSigning, setIsSigning] = useState(false)
  const [signError, setSignError] = useState<string | null>(null)
  const [showLedgerPrompt, setShowLedgerPrompt] = useState(false)
  const [isWc2Active, setIsWc2Active] = useState(false)

  const signInitiated = useRef(false)

  useEffect(() => {
    useMultiWalletStore.getState().scanWallets()
    clearLoginError()
    resetWc2Pairing()
  }, [clearLoginError, resetWc2Pairing])

  useEffect(() => {
    if (isAuthenticated) {
      router.push(Routes.DASHBOARD)
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (isConnected && address && step === "choose" && !signInitiated.current) {
      signInitiated.current = true
      setStep("sign")
      performLogin(address)
    }
    // performLogin is a stable module-level function — not a hook dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, step])

  async function performLogin(walletAddress: string) {
    setIsSigning(true)
    setSignError(null)

    try {
      const nonceResponse = await apiClient.post("/auth/nonce", {
        walletAddress,
      })
      const nonceData = nonceResponse.data as { nonce: string } | undefined
      const nonce =
        nonceData?.nonce ??
        ((nonceResponse.data as unknown as string) ?? "")

      if (!nonce) {
        throw new Error("Failed to get authentication nonce")
      }

      const store = useMultiWalletStore.getState()
      const signature = await store.signMessage(nonce)
      await login(walletAddress, signature)

      addToast({
        type: "success",
        title: "Welcome back!",
        description: "You are now signed in.",
      })

      router.push(Routes.DASHBOARD)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Authentication failed"
      setSignError(message)
      addToast({
        type: "error",
        title: "Sign-In Failed",
        description: message,
      })
    } finally {
      setIsSigning(false)
    }
  }

  const handleSelectWallet = useCallback(
    async (walletId: string) => {
      if (walletId === "passkey") {
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
        setLoginError(message)
        addToast({
          type: "error",
          title: "Connection Failed",
          description: message,
        })
      }
    },
    [detectedWallets, connect, setWc2PairingUri, setWc2PairingState, setWc2PairingError, addToast, setLoginError],
  )

  const handleWc2Cancel = useCallback(() => {
    resetWc2Pairing()
    setIsWc2Active(false)
  }, [resetWc2Pairing])

  const handleWc2Retry = () => {
    handleSelectWallet("walletconnect")
  }

  const handlePasskeyConnect = useCallback(async () => {
    setSignError(null)
    setPasskeyState("registering")
    try {
      await connect("passkey")
      const mwAddress = useMultiWalletStore.getState().address
      if (!mwAddress) {
        throw new Error("Failed to get wallet address")
      }
      setPasskeyPublicKey(mwAddress)
      setPasskeyState("connected")
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Passkey login failed"
      setPasskeyState("error")
      setSignError(message)
      addToast({
        type: "error",
        title: "Passkey Login Failed",
        description: message,
      })
    }
  }, [connect, setPasskeyState, setPasskeyPublicKey, addToast])

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

  const extensionWallets = detectedWallets.filter(
    (w) => w.category === "extension",
  )
  const hasWalletConnect = detectedWallets.some((w) => w.id === "walletconnect")
  const hasLedger = detectedWallets.some((w) => w.id === "ledger")
  const hasPasskey = detectedWallets.some((w) => w.id === "passkey")

  const walletCardIcon = (id: string, name: string) => {
    switch (id) {
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="rounded-3xl p-8 md:p-10 max-w-md w-full mx-auto relative z-10 bg-card/80 backdrop-blur-xl border border-white/10 shadow-xl">
        <Link
          href={Routes.HOME}
          className="block text-center font-heading text-2xl font-bold gradient-text-extended mb-8"
        >
          Moistello
        </Link>

        {isSigning ? (
          <div className="text-center space-y-5 py-8">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-aurora-violet" />
            <div>
              <h3 className="font-heading text-lg mb-1">Signing you in...</h3>
              <p className="text-sm text-muted-foreground">
                {passkeyState === "authenticating"
                  ? "Verifying biometric..."
                  : "Waiting for wallet confirmation..."}
              </p>
            </div>
            {signError && (
              <div className="flex items-start gap-2 text-sm text-red-400 text-left">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{signError}</span>
              </div>
            )}
            {address && (
              <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {activeAdapter?.meta.name ?? "Wallet"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {shortenAddress(address)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : step === "choose" && isWc2Active ? (
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
          <div className="space-y-5">
            {/* ───── Passkey Quick Entry ───── */}
            {hasPasskey && (
              <div className="glass rounded-2xl p-5 border border-aurora-violet/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl gradient-bg-extended flex items-center justify-center text-white shrink-0">
                    <Fingerprint className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Sign in with biometrics
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Use your passkey to sign in instantly
                    </p>
                  </div>
                </div>
                <button
                  onClick={handlePasskeyConnect}
                  disabled={
                    isConnecting ||
                    passkeyState === "registering" ||
                    passkeyState === "awaiting_biometric" ||
                    passkeyState === "authenticating"
                  }
                  className="gradient-bg-extended w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-heading font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isConnecting ||
                  passkeyState === "registering" ||
                  passkeyState === "awaiting_biometric" ||
                  passkeyState === "authenticating" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {passkeyState === "registering"
                        ? "Connecting..."
                        : passkeyState === "awaiting_biometric"
                          ? "Scan biometric..."
                          : "Verifying..."}
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Sign in with Passkey
                    </>
                  )}
                </button>
                {signError && (
                  <div className="mt-3 flex items-start gap-2 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{signError}</span>
                  </div>
                )}
              </div>
            )}

            {/* ───── Divider ───── */}
            {hasPasskey && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    or connect a wallet
                  </span>
                </div>
              </div>
            )}

            {/* ───── Wallet Grid ───── */}
            {!hasPasskey && (
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl gradient-bg-extended flex items-center justify-center text-white mx-auto mb-4">
                  <Wallet className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-xl mb-1">Welcome back</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Choose how to sign in
                </p>
              </div>
            )}

            {hasPasskey && (
              <p className="text-xs text-muted-foreground text-center">
                Or use a wallet to sign in
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {extensionWallets.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => handleSelectWallet(w.id)}
                  disabled={w.status !== "detected" || isConnecting}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 glass rounded-2xl p-4 min-h-[100px] transition-all hover:bg-white/[0.06] hover:border-aurora-violet/40 border border-white/10",
                    w.status !== "detected" && "opacity-40 pointer-events-none",
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

{loginError && (
               <div className="flex items-start gap-2 text-sm text-red-400">
                 <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                 <span>{loginError}</span>
               </div>
             )}

            {extensionWallets.filter((w) => w.status === "detected")
              .length === 0 && !hasPasskey && !hasWalletConnect && !hasLedger && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No wallets available. Install a Stellar wallet like Freighter or
                use WalletConnect.
              </p>
            )}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border flex flex-col gap-2 items-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={Routes.REGISTER}
              className="font-medium text-aurora-cyan hover:underline"
            >
              Create one
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
