"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, Fingerprint } from "lucide-react"
import { useMultiWalletStore } from "@/stores/multi-wallet-store"
import { useAuthStore } from "@/stores/auth-store"
import { useUIStore } from "@/stores/ui-store"
import apiClient from "@/lib/api-client"
import { Routes } from "@/lib/constants"

export default function PasskeySetupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [createdKey, setCreatedKey] = useState<string | null>(null)

  const connect = useMultiWalletStore((s) => s.connect)
  const signMessage = useMultiWalletStore((s) => s.signMessage)
  const passkeyState = useMultiWalletStore((s) => s.passkeyState)
  const setPasskeyState = useMultiWalletStore((s) => s.setPasskeyState)
  const setPasskeyEmail = useMultiWalletStore((s) => s.setPasskeyEmail)
  const setPasskeyPublicKey = useMultiWalletStore((s) => s.setPasskeyPublicKey)
  const login = useAuthStore((s) => s.login)
  const addToast = useUIStore((s) => s.addToast)

  const handleCreate = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      return
    }
    setError(null)
    setIsLoading(true)
    setPasskeyEmail(email)
    setPasskeyState("registering")

    try {
      await connect("passkey")
      const mwAddress = useMultiWalletStore.getState().address
      if (!mwAddress) {
        throw new Error("Failed to get wallet address")
      }

      setPasskeyPublicKey(mwAddress)
      setCreatedKey(mwAddress)
      setPasskeyState("connected")

      const nonceResponse = await apiClient.post("/auth/nonce", {
        walletAddress: mwAddress,
      })
      const nonceData = nonceResponse.data as { nonce: string } | undefined
      const nonce = nonceData?.nonce ?? ((nonceResponse.data as unknown as string) ?? "")

      if (!nonce) {
        throw new Error("Failed to get authentication nonce")
      }

      const signature = await signMessage(nonce)
      await login(mwAddress, signature)

      addToast({
        type: "success",
        title: "Wallet Created!",
        description: "Your passkey wallet is ready. Welcome to Moistello!",
      })

      router.push(Routes.DASHBOARD)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setPasskeyState("error")
      addToast({
        type: "error",
        title: "Setup Failed",
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen auroral-mesh flex flex-col items-center justify-center px-4 py-12">
      <div className="glass-flagship rounded-3xl p-8 md:p-10 max-w-md w-full mx-auto holo-border relative z-10">
        <Link
          href={Routes.HOME}
          className="block text-center font-heading text-2xl font-bold gradient-text-extended mb-8"
        >
          Moistello
        </Link>

        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl gradient-bg-extended flex items-center justify-center text-white">
            <Fingerprint className="h-8 w-8" />
          </div>
        </div>

        {createdKey ? (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-heading font-medium">Wallet Created!</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your Stellar wallet is ready:
            </p>
            <p className="font-mono text-xs bg-white/5 rounded-xl px-4 py-3 break-all">
              {createdKey}
            </p>
            <p className="text-xs text-muted-foreground">
              Signing you in...
            </p>
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-aurora-violet" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-center">
              <h3 className="font-heading text-xl mb-1">Create Your Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Enter your email to create a passkey wallet.
                <br />
                No crypto knowledge needed.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="passkey-email" className="text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="passkey-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                placeholder="you@example.com"
                className="w-full h-12 glass rounded-xl px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-aurora-violet/50"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={isLoading || !email}
              className="gradient-bg-extended w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-heading font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_24px_rgb(var(--aurora-violet)/0.25)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {passkeyState === "registering" ? "Creating passkey..." :
                   passkeyState === "awaiting_biometric" ? "Scan biometric..." :
                   passkeyState === "authenticating" ? "Verifying..." :
                   passkeyState === "deriving" ? "Generating wallet..." : "Setting up..."}
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4" />
                  Create Passkey
                </>
              )}
            </button>

            <div className="text-center">
              <Link
                href={Routes.LOGIN}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to login
              </Link>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Your wallet is created from your email and device biometrics.
              <br />
              No private keys leave your device.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
