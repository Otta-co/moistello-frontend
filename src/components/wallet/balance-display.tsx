"use client"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { Wallet, RefreshCw } from "lucide-react"
import { formatAddress } from "@/lib/formatters"
import { useMultiWallet } from "@/hooks/use-multi-wallet"

export function BalanceDisplay() {
  const { wallets, refreshBalance, detectedWallets } = useMultiWallet()
  const connectedWallets = Object.entries(wallets).filter(([,w]) => w.status === "connected" || w.status === "reconnecting")

  useEffect(() => {
    const ids = Object.keys(wallets)
    ids.forEach((id) => { refreshBalance(id) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (connectedWallets.length === 0) return (
    <div className="glass rounded-2xl p-8 text-center">
      <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
      <p className="text-muted-foreground text-sm">No wallets connected</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {connectedWallets.map(([id, w]) => {
        const meta = detectedWallets.find(d => d.id === id)
        return (
          <motion.div key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-heading text-sm">{meta?.name || id}</span>
              </div>
              <button onClick={() => refreshBalance(id)} className="glass-whisper rounded-lg p-1.5 hover:text-foreground transition-colors">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-heading uppercase tracking-wider text-muted-foreground mb-1">XLM</p>
                <p className="font-heading text-xl gradient-text font-bold">{w.balance?.xlm || "0.00"}</p>
              </div>
              <div>
                <p className="text-[10px] font-heading uppercase tracking-wider text-muted-foreground mb-1">USDC</p>
                <p className="font-heading text-xl gradient-text font-bold">{w.balance?.usdc || "0.00"}</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-2">{formatAddress(w.publicKey, 8, 6)}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
