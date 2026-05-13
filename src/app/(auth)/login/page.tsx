"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Wallet, CheckCircle, ExternalLink, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { useWalletStore } from "@/stores/wallet-store"
import { useAuthStore } from "@/stores/auth-store"
import { useUIStore } from "@/stores/ui-store"
import { signMessage, isFreighterInstalled } from "@/lib/stellar"
import apiClient from "@/lib/api-client"
import { Routes } from "@/lib/constants"

type Step = "connect" | "sign"

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function LoginPage() {
  const router = useRouter()

  const isConnected = useWalletStore((s) => s.isConnected)
  const address = useWalletStore((s) => s.address)
  const isConnecting = useWalletStore((s) => s.isConnecting)
  const walletError = useWalletStore((s) => s.error)
  const connect = useWalletStore((s) => s.connect)

  const isAuthLoading = useAuthStore((s) => s.isLoading)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const login = useAuthStore((s) => s.login)

  const addToast = useUIStore((s) => s.addToast)

  const [step, setStep] = useState<Step>("connect")
  const [isSigning, setIsSigning] = useState(false)
  const [signError, setSignError] = useState<string | null>(null)
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
      setStep("sign")
      setSignError(null)
    } catch (err) {
      addToast({
        type: "error",
        title: "Connection Failed",
        description:
          err instanceof Error ? err.message : "Failed to connect wallet",
      })
    }
  }

  const handleSign = async () => {
    if (!address) return

    setIsSigning(true)
    setSignError(null)

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

      await login(address, signature)

      addToast({
        type: "success",
        title: "Welcome back!",
        description: "You are now signed in.",
      })

      router.push(Routes.DASHBOARD)
    } catch (err) {
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

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          <div className="flex flex-col items-center gap-1.5">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                isConnected
                  ? "bg-emerald-500 text-white"
                  : step === "connect"
                    ? "gradient-bg text-white shadow-[0_0_16px_rgb(var(--aurora-violet)/0.4)]"
                    : "bg-white/10 text-muted-foreground"
              }`}
            >
              {isConnected ? <CheckCircle className="h-4 w-4" /> : "1"}
            </span>
            <span className="text-2xs text-muted-foreground font-heading">Connect</span>
          </div>
          <div className="w-12 h-px bg-gradient-to-r from-aurora-violet/50 to-aurora-cyan/30 mx-2" />
          <div className="flex flex-col items-center gap-1.5">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                step === "sign"
                  ? "gradient-bg text-white shadow-[0_0_16px_rgb(var(--aurora-violet)/0.4)]"
                  : "bg-white/10 text-muted-foreground"
              }`}
            >
              2
            </span>
            <span className="text-2xs text-muted-foreground font-heading">Verify</span>
          </div>
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
                Use Freighter to sign in securely
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

          {/* Step 2: Sign to Verify */}
          <div>
            <button
              onClick={handleSign}
              disabled={!isConnected || step !== "sign" || isSigning || isAuthLoading}
              className="gradient-bg-extended w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-heading font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_24px_rgb(var(--aurora-violet)/0.25)]"
            >
              {isSigning || isAuthLoading ? (
                <>
                  <span className="absolute inset-0 animate-shimmer rounded-xl" />
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  Sign to Verify
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              This proves you own this wallet without revealing your private key.
            </p>

            {signError && (
              <div className="mt-3 flex items-start gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{signError}</span>
              </div>
            )}
          </div>
        </div>

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
    </div>
  )
}
