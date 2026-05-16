"use client"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/cn"
import { formatAddress } from "@/lib/formatters"
import { useMultiWallet } from "@/hooks/use-multi-wallet"
import { useState } from "react"

export function AccountSwitcher() {
  const { activeWalletId, activeWallet, wallets, switchWallet, detectedWallets } = useMultiWallet()
  const [isOpen, setIsOpen] = useState(false)
  const connectedWallets = Object.entries(wallets).filter(([,w]) => w.status === "connected" || w.status === "reconnecting")
  if (connectedWallets.length === 0) return null
  const activeName = detectedWallets.find(w => w.id === activeWalletId)?.name || activeWalletId || "Wallet"

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1.5 glass-whisper rounded-full px-2.5 py-1.5 text-xs font-mono hover:glass-strong transition-all">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="max-w-[100px] truncate">{activeWallet?.publicKey ? formatAddress(activeWallet.publicKey, 4, 4) : activeName}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute right-0 top-full mt-2 w-64 glass-premium rounded-2xl p-2 border border-white/10 shadow-xl z-50">
            <p className="text-[10px] font-heading uppercase tracking-wider text-muted-foreground px-3 py-2">Connected Wallets</p>
            {connectedWallets.map(([id, w]) => (
              <button key={id} onClick={() => { switchWallet(id); setIsOpen(false) }} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all", activeWalletId === id ? "glass-strong text-foreground" : "text-muted-foreground hover:text-foreground hover:glass-whisper")}>
                <div className={cn("w-2 h-2 rounded-full", w.status === "connected" ? "bg-emerald-400" : "bg-muted-foreground")} />
                <span className="flex-1 text-left font-mono text-xs">{formatAddress(w.publicKey, 6, 4)}</span>
                {activeWalletId === id && <Check className="h-3.5 w-3.5 text-aurora-violet" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}
