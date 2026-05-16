"use client"

import { useState } from "react"
import { Wallet, X, Loader2, AlertCircle, QrCode, Shield, Usb } from "lucide-react"
import { cn } from "@/lib/cn"
import { useMultiWalletStore } from "@/stores/multi-wallet-store"
import dynamic from "next/dynamic"
import type { WalletId } from "@/lib/wallet/types"

const LedgerPrompt = dynamic(() => import("@/components/wallet/ledger-prompt").then((m) => m.LedgerPrompt), { ssr: false })

const walletIcons: Record<string, string> = {
  walletconnect: "WC",
  freighter: "F",
  xbull: "X",
  rabet: "R",
  albedo: "A",
}

interface HardwareWalletItemProps {
  name: string
  status: "detected" | "not_detected"
  isWebUSBAvailable: boolean
  onOpenLedgerPrompt: () => void
}

function HardwareWalletItem({ name, status, isWebUSBAvailable, onOpenLedgerPrompt }: HardwareWalletItemProps) {
  const isDetected = isWebUSBAvailable && status === "detected"

  return (
    <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 hover:border-aurora-violet/40 hover:bg-white/[0.06] transition-all">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-premium-gold/20 text-premium-gold">
        <Usb className="h-5 w-5" />
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{name}</p>
          <span className="text-2xs px-1.5 py-0.5 rounded-full bg-premium-gold/20 text-premium-gold font-medium">
            Hardware Wallet
          </span>
          {isDetected && (
            <span className="text-2xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
              Detected ✓
            </span>
          )}
        </div>
        <p className="text-2xs text-muted-foreground mt-0.5">
          {isWebUSBAvailable
            ? "Maximum security — requires physical confirmation"
            : "Not supported in this browser"}
        </p>
      </div>

      {isWebUSBAvailable ? (
        <button
          type="button"
          onClick={onOpenLedgerPrompt}
          className="text-xs text-aurora-violet font-medium shrink-0 hover:text-premium-gold transition-colors"
        >
          Connect
        </button>
      ) : (
        <span className="text-xs text-muted-foreground/50 shrink-0">
          Not supported
        </span>
      )}
    </div>
  )
}

interface WalletItemProps {
  id: WalletId
  name: string
  status: "detected" | "not_detected"
  isConnecting: boolean
  activeId: WalletId | null
  onSelect: (id: WalletId) => void
  description?: string
}

function WalletItem({ id, name, status, isConnecting, activeId, onSelect, description }: WalletItemProps) {
  const isWC = id === "walletconnect"
  const isPasskey = id === "passkey"
  const available = isWC || isPasskey || status === "detected"
  const isBusy = isConnecting && activeId === id

  return (
    <button
      type="button"
      disabled={!available || isConnecting}
      onClick={() => onSelect(id)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
        isWC
          ? "holo-border"
          : "border border-white/10 hover:border-aurora-violet/40",
        "hover:bg-white/[0.06] disabled:opacity-40 disabled:pointer-events-none",
        !isWC && isBusy && "border-aurora-violet/60"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          isWC
            ? "bg-aurora-violet/20 text-aurora-violet"
            : isPasskey
              ? "bg-aurora-violet/20 text-aurora-violet"
              : "bg-white/10 text-aurora-cyan"
        )}
      >
        {isWC ? (
          <QrCode className="h-5 w-5" />
        ) : isPasskey ? (
          <Shield className="h-5 w-5" />
        ) : (
          walletIcons[id] ?? id.charAt(0).toUpperCase()
        )}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{name}</p>
          {isWC && (
            <span className="text-2xs px-1.5 py-0.5 rounded-full bg-aurora-violet/20 text-aurora-violet font-medium">
              Recommended
            </span>
          )}
          {isPasskey && (
            <span className="text-2xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
              Detected
            </span>
          )}
        </div>
        {isWC && (
          <p className="text-2xs text-muted-foreground mt-0.5">
            Lobstr, Coinbase, Trust Wallet, MetaMask &amp; 200+
          </p>
        )}
        {isPasskey && description && (
          <p className="text-2xs text-muted-foreground mt-0.5">{description}</p>
        )}
        {!available && !isWC && !isPasskey && (
          <p className="text-2xs text-muted-foreground">Not installed</p>
        )}
      </div>

      {isBusy && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-aurora-violet shrink-0" />
          {isWC && (
            <span className="text-xs text-muted-foreground shrink-0">
              Opening WalletConnect...
            </span>
          )}
          {isPasskey && (
            <span className="text-xs text-muted-foreground shrink-0">
              Setting up biometric authentication...
            </span>
          )}
        </>
      )}

      {available && !isBusy && (
        <span className="text-xs text-aurora-violet font-medium shrink-0">Connect</span>
      )}
    </button>
  )
}

interface WalletSelectorProps {
  className?: string
  variant?: "inline" | "overlay"
}

export function WalletSelector({ className, variant = "inline" }: WalletSelectorProps) {
  const [showLedgerPrompt, setShowLedgerPrompt] = useState(false)
  const detectedWallets = useMultiWalletStore((s) => s.detectedWallets)
  const isConnected = useMultiWalletStore((s) => s.isConnected)
  const isConnecting = useMultiWalletStore((s) => s.isConnecting)
  const error = useMultiWalletStore((s) => s.error)
  const address = useMultiWalletStore((s) => s.address)
  const activeAdapter = useMultiWalletStore((s) => s.activeAdapter)
  const activeWalletId = useMultiWalletStore((s) => s.activeWalletId)
  const isSelectorOpen = useMultiWalletStore((s) => s.isSelectorOpen)
  const setSelectorOpen = useMultiWalletStore((s) => s.setSelectorOpen)
  const connect = useMultiWalletStore((s) => s.connect)
  const disconnect = useMultiWalletStore((s) => s.disconnect)

  const isWebUSBAvailable = typeof navigator !== "undefined" && "usb" in navigator

  const sortedWallets = [...detectedWallets].sort((a, b) => {
    if (a.id === "walletconnect") return -1
    if (b.id === "walletconnect") return 1
    return 0
  })

  const hardwareWallets = sortedWallets.filter((w) => w.category === "hardware")
  const standardWallets = sortedWallets.filter((w) => w.category !== "hardware")

  const handleSelect = async (walletId: WalletId) => {
    const wallet = detectedWallets.find((w) => w.id === walletId)
    if (wallet?.category === "hardware") {
      setShowLedgerPrompt(true)
      return
    }
    try {
      await connect(walletId)
    } catch {
      // error already stored
    }
  }

  const handleDisconnect = () => {
    if (activeWalletId) {
      disconnect(activeWalletId)
    }
  }

  if (variant === "overlay") {
    return (
      <>
      <div className={cn("space-y-4", className)}>
        {!isConnected ? (
          <>
            <div className="w-12 h-12 rounded-2xl gradient-bg-extended flex items-center justify-center text-white mx-auto mb-4">
              <Wallet className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-xl text-center mb-1">Connect Your Wallet</h3>
            <p className="text-sm text-muted-foreground text-center mb-5">
              Choose a wallet to sign in securely
            </p>

            <div className="space-y-2">
              {standardWallets.map((w) => (
                <WalletItem
                  key={w.id}
                  id={w.id}
                  name={w.name}
                  status={w.status}
                  description={w.description}
                  isConnecting={isConnecting}
                  activeId={activeWalletId}
                  onSelect={handleSelect}
                />
              ))}
              {hardwareWallets.map((w) => (
                <HardwareWalletItem
                  key={w.id}
                  name={w.name}
                  status={w.status}
                  isWebUSBAvailable={isWebUSBAvailable}
                  onOpenLedgerPrompt={() => setShowLedgerPrompt(true)}
                />
              ))}
            </div>

            {standardWallets.length === 0 && hardwareWallets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No wallets detected. Install a Stellar wallet or use WalletConnect to scan and connect.
              </p>
            )}

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </>
        ) : (
          <div className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                Connected &#x2713; {activeAdapter?.meta.name ?? "Wallet"}
              </p>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-red-400 transition-colors"
              aria-label="Disconnect wallet"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      <LedgerPrompt
        isOpen={showLedgerPrompt}
        onClose={() => setShowLedgerPrompt(false)}
      />
      </>
    )
  }

  /* inline variant */
  if (!isConnected) {
    return (
      <>
      <div className={cn("space-y-3", className)}>
        {isSelectorOpen ? (
          <div className="space-y-2">
            {standardWallets.map((w) => (
              <WalletItem
                key={w.id}
                id={w.id}
                name={w.name}
                status={w.status}
                description={w.description}
                isConnecting={isConnecting}
                activeId={activeWalletId}
                onSelect={handleSelect}
              />
              ))}
            {hardwareWallets.map((w) => (
              <HardwareWalletItem
                key={w.id}
                name={w.name}
                status={w.status}
                isWebUSBAvailable={isWebUSBAvailable}
                onOpenLedgerPrompt={() => setShowLedgerPrompt(true)}
              />
            ))}
            {standardWallets.length === 0 && hardwareWallets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No wallets detected. Install a Stellar wallet or use WalletConnect to scan and connect.
              </p>
            )}
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSelectorOpen(false)}
              className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSelectorOpen(true)}
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
                Connect Wallet
              </>
            )}
          </button>
        )}
      </div>
      <LedgerPrompt
        isOpen={showLedgerPrompt}
        onClose={() => setShowLedgerPrompt(false)}
      />
      </>
    )
  }

  return (
    <div className={cn("glass rounded-2xl px-4 py-3.5 flex items-center gap-3", className)}>
      <span className="relative flex h-3 w-3 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {activeAdapter?.meta.name ?? "Wallet"}
        </p>
        <p className="text-xs text-muted-foreground font-mono truncate">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={handleDisconnect}
        className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-red-400 transition-colors"
        aria-label="Disconnect wallet"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
