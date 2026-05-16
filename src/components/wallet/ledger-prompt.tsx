"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Usb, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/cn"
import { Button } from "@/components/ui/button"
import { useMultiWallet } from "@/hooks/use-multi-wallet"
import {
  detectAvailableTransport,
  getTransportDescription,
} from "@/lib/wallet/adapters/ledger-transport"

interface LedgerPromptProps {
  isOpen: boolean
  onClose: () => void
  onConnected?: (publicKey: string) => void
}

const STEPS_BASE = [
  "Connect your Ledger",
  "Unlock your Ledger with your PIN",
  "Open the Stellar app on your Ledger",
  "Confirm the connection",
]

export function LedgerPrompt({ isOpen, onClose, onConnected }: LedgerPromptProps) {
  const { connect } = useMultiWallet()
  const [currentStep, setCurrentStep] = useState(0)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  const transportType =
    typeof window !== "undefined" ? detectAvailableTransport() : "none"
  const transportDesc = getTransportDescription(transportType)
  const STEPS = [
    transportDesc,
    ...STEPS_BASE.slice(1),
  ]

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)
    setCurrentStep(3)

    try {
      await connect("ledger")
      setConnected(true)
      setCurrentStep(4)
      setTimeout(() => {
        onConnected?.("")
        onClose()
      }, 1500)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Failed to connect to Ledger")
      setCurrentStep(0)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 24 }}
            className="glass-premium rounded-3xl p-8 max-w-lg w-full holo-border"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl gradient-bg-extended flex items-center justify-center mx-auto mb-4">
                <Usb className="h-7 w-7 text-white" />
              </div>
              <h2 className="font-heading text-2xl gradient-text mb-2">Connect Ledger</h2>
              <p className="text-sm text-muted-foreground">
                Follow the steps to connect your hardware wallet
              </p>
            </div>

            {/* Steps */}
            {!connected && (
              <div className="space-y-4 mb-6">
                {STEPS.map((step, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-all duration-300",
                      i < currentStep ? "glass text-muted-foreground" :
                      i === currentStep ? "glass-strong text-foreground" :
                      "glass opacity-40"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      i < currentStep ? "bg-emerald-400/20 text-emerald-400" :
                      i === currentStep ? "bg-aurora-violet/20 text-aurora-violet" :
                      "bg-white/5 text-muted-foreground"
                    )}>
                      {i < currentStep ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <span className="text-sm font-bold">{i + 1}</span>
                      )}
                    </div>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Connected state */}
            {connected && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-6"
              >
                <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                <p className="font-heading text-lg">Ledger Connected!</p>
                <p className="text-sm text-muted-foreground mt-1">Your hardware wallet is ready.</p>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-3 flex items-start gap-2 text-sm text-red-400 mb-4"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={onClose}
                disabled={isConnecting}
              >
                Cancel
              </Button>
              {!connected && (
                <Button
                  variant="primary"
                  className="flex-1 rounded-xl"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  isLoading={isConnecting}
                >
                  {isConnecting ? "Connecting..." : "I'm Ready — Connect"}
                </Button>
              )}
              {connected && (
                <Button
                  variant="primary"
                  className="flex-1 rounded-xl"
                  onClick={onClose}
                >
                  Continue
                </Button>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground/50 text-center mt-4">
              Your private key never leaves the Ledger device. Every transaction requires physical confirmation.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
