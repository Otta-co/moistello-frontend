"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Shield, CheckCircle, Copy, ExternalLink } from "lucide-react"
import { useMultiWallet } from "@/hooks/use-multi-wallet"

export default function PasskeySetupPage() {
  const router = useRouter()
  const { address, isConnected } = useMultiWallet()
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isConnected) {
      router.push("/login")
    }
  }, [mounted, isConnected, router])

  if (!mounted || !address) {
    return (
      <div className="min-h-screen bg-void auroral-mesh flex items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-aurora-violet border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void auroral-mesh flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-premium rounded-3xl p-8 max-w-md w-full holo-border text-center"
      >
        <div className="w-16 h-16 rounded-2xl gradient-bg-extended flex items-center justify-center mx-auto mb-6">
          <Shield className="h-8 w-8 text-white" />
        </div>

        <h1 className="font-heading text-2xl gradient-text mb-2">
          Passkey Created!
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Your Stellar account has been created. Fund it to start using
          Moistello.
        </p>

        <div className="glass rounded-xl p-4 mb-6">
          <p className="text-xs text-muted-foreground mb-2 font-heading uppercase tracking-wider">
            Your Stellar Address
          </p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-foreground flex-1 break-all">
              {address}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(address)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="glass-whisper rounded-lg p-2 hover:text-foreground transition-colors"
              aria-label="Copy address"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <a
          href={`https://laboratory.stellar.org/#account-creator?network=test&destination=${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="gradient-bg-extended text-white px-6 py-3 rounded-xl font-heading text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity mb-4"
        >
          Fund with Friendbot
          <ExternalLink className="h-4 w-4" />
        </a>

        <p className="text-xs text-muted-foreground mt-2">
          Friendbot gives you 10,000 test XLM for free on testnet.
        </p>

        <button
          onClick={() => router.push("/dashboard")}
          className="w-full mt-6 glass rounded-xl py-3 text-sm font-heading hover:glass-strong transition-all"
        >
          Continue to Dashboard
        </button>
      </motion.div>
    </div>
  )
}
