"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMultiWallet } from "@/hooks/use-multi-wallet"

interface SignPromptProps {
  isOpen: boolean
  onClose: () => void
  onSign: () => Promise<string>
  onSuccess?: () => void
  title?: string
  description?: string
}

export function SignPrompt({ isOpen, onClose, onSign, onSuccess, title = "Sign Transaction", description }: SignPromptProps) {
  const { activeWallet, detectedWallets } = useMultiWallet()
  const [status, setStatus] = useState<"idle" | "signing" | "success" | "error">("idle")
  const [error, setError] = useState("")
  const walletName = detectedWallets.find(w => w.id === activeWallet?.adapter?.meta?.id)?.name || "wallet"

  const handleSign = async () => {
    setStatus("signing")
    setError("")
    try {
      await onSign()
      setStatus("success")
      onSuccess?.()
      setTimeout(() => onClose(), 1000)
    } catch (err: unknown) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Signing failed")
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
          <motion.div initial={{ scale: 0.92, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 24 }} className="glass-premium rounded-3xl p-8 max-w-md w-full holo-border text-center">
            {status === "success" ? (
              <motion.div className="py-8"><CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" /><p className="font-heading text-lg">Signed Successfully</p></motion.div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl gradient-bg-extended flex items-center justify-center mx-auto mb-4"><Shield className="h-6 w-6 text-white" /></div>
                <h2 className="font-heading text-xl gradient-text mb-1">{title}</h2>
                {description && <p className="text-sm text-muted-foreground mb-1">{description}</p>}
                <p className="text-xs text-muted-foreground mb-6">Signing with: <span className="text-foreground font-medium">{walletName}</span></p>
                {error && <div className="glass rounded-xl p-3 flex items-center gap-2 text-sm text-red-400 mb-4"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose} disabled={status === "signing"}>Cancel</Button>
                  <Button variant="primary" className="flex-1 rounded-xl" onClick={handleSign} disabled={status === "signing"} isLoading={status === "signing"}>{status === "signing" ? `Waiting for ${walletName}...` : "Sign"}</Button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
