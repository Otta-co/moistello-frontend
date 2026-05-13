"use client"

import React, { useCallback } from "react"
import { motion } from "framer-motion"
import {
  Wallet,
  RefreshCw,
  ExternalLink,
  ArrowUpCircle,
  ArrowDownCircle,
  Coins,
  DollarSign,
  PlugZap,
} from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { PageHeader } from "@/components/shared/page-header"
import { CopyButton } from "@/components/shared/copy-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatAddress } from "@/lib/formatters"
import { cn } from "@/lib/cn"

interface SimulatedTransaction {
  type: "sent" | "received"
  amount: number
  currency: string
  date: string
  hash: string
  description: string
}

const SIMULATED_TRANSACTIONS: SimulatedTransaction[] = [
  {
    type: "sent",
    amount: 100,
    currency: "USDC",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    hash: "c9a3b8d7e6f5a4c3b2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0",
    description: "Contribution to Alpha Circle",
  },
  {
    type: "received",
    amount: 500,
    currency: "USDC",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    hash: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
    description: "Payout from Beta Circle",
  },
  {
    type: "sent",
    amount: 50,
    currency: "XLM",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    hash: "e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
    description: "XLM contribution to Gamma Circle",
  },
  {
    type: "received",
    amount: 200,
    currency: "USDC",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    hash: "f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9",
    description: "Payout from Delta Circle",
  },
  {
    type: "sent",
    amount: 25,
    currency: "XLM",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    hash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0",
    description: "Fee payment",
  },
]

function WalletConnectCard() {
  const {
    isConnected,
    isConnecting,
    address,
    error,
    connect,
    disconnect,
  } = useWallet()

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-premium rounded-2xl flex flex-col items-center py-16 text-center px-6 holo-border"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 18 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-aurora-violet/20 to-aurora-indigo/20"
        >
          <PlugZap className="h-10 w-10 text-aurora-violet" />
        </motion.div>
        <h3 className="font-heading text-xl font-semibold text-foreground dark:text-white mb-2">
          Connect Your Wallet
        </h3>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground font-body">
          Connect your Freighter wallet to manage balances and make contributions on Stellar.
        </p>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2.5 border border-red-500/20"
          >
            {error}
          </motion.p>
        )}
        <Button
          variant="primary"
          size="lg"
          onClick={connect}
          isLoading={isConnecting}
          className="holo-glow"
        >
          Connect Freighter
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-premium rounded-2xl p-6 holo-border"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-heading font-medium text-foreground dark:text-white">
              Connected Wallet
            </h3>
            <Badge variant="info" size="sm">Stellar Testnet</Badge>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <p className="font-mono text-sm text-muted-foreground">
              {formatAddress(address ?? "", 8, 6)}
            </p>
            <CopyButton text={address ?? ""} label="Copy address" />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={disconnect} className="glass-whisper">
          Disconnect
        </Button>
      </div>
    </motion.div>
  )
}

function BalanceCards() {
  const { balance, refreshBalance } = useWallet()
  const [refreshing, setRefreshing] = React.useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshBalance()
    } finally {
      setRefreshing(false)
    }
  }, [refreshBalance])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <motion.div
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className="glass rounded-2xl p-6 tilt-hover depth-3"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg">
              <Coins className="h-6 w-6 text-slate-200" />
            </div>
            <div>
              <p className="text-2xs tracking-wider uppercase text-muted-foreground font-body">
                XLM Balance
              </p>
              <p className="font-heading text-3xl font-bold gradient-text mt-0.5">
                {balance?.xlm ?? "0.00"} <span className="text-base text-muted-foreground">XLM</span>
              </p>
            </div>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            className="flex h-9 w-9 items-center justify-center rounded-lg glass hover:glass-strong transition-colors"
            title="Refresh balance"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 text-muted-foreground",
                refreshing && "animate-spin gradient-text",
              )}
            />
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className="glass rounded-2xl p-6 tilt-hover depth-3"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/40 to-aurora-cyan/40 shadow-lg shadow-emerald-500/10">
              <DollarSign className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <p className="text-2xs tracking-wider uppercase text-muted-foreground font-body">
                USDC Balance
              </p>
              <p className="font-heading text-3xl font-bold gradient-text mt-0.5">
                {balance?.usdc ?? "0.00"} <span className="text-base text-muted-foreground">USDC</span>
              </p>
            </div>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            className="flex h-9 w-9 items-center justify-center rounded-lg glass hover:glass-strong transition-colors"
            title="Refresh balance"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 text-muted-foreground",
                refreshing && "animate-spin gradient-text",
              )}
            />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

function RecentTransactions() {
  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-semibold text-foreground dark:text-white">
        Recent Transactions
      </h3>
      <div className="glass-premium rounded-2xl overflow-hidden holo-border">
        <div className="divide-y divide-border">
          {SIMULATED_TRANSACTIONS.map((tx, i) => (
            <motion.div
              key={tx.hash}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between hover:glass-whisper transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    tx.type === "received"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400",
                  )}
                >
                  {tx.type === "received" ? (
                    <ArrowDownCircle className="h-4 w-4" />
                  ) : (
                    <ArrowUpCircle className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground dark:text-white truncate font-body">
                    {tx.description}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    {new Date(tx.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <span
                  className={cn(
                    "text-sm font-bold font-heading whitespace-nowrap",
                    tx.type === "received" ? "gradient-text" : "text-muted-foreground",
                  )}
                >
                  {tx.type === "received" ? "+" : "−"}
                  {tx.amount} {tx.currency}
                </span>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono text-aurora-cyan hover:underline"
                >
                  {formatAddress(tx.hash, 6, 4)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function WalletPage() {
  const { isConnected } = useWallet()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet"
        description="Manage your Stellar wallet, view balances, and track transactions."
      />

      <WalletConnectCard />

      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-6"
        >
          <BalanceCards />
          <RecentTransactions />
        </motion.div>
      )}
    </div>
  )
}
