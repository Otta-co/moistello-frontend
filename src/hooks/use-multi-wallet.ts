"use client"

import { useMultiWalletStore } from "@/stores/multi-wallet-store"

export function useMultiWallet() {
  const activeWalletId = useMultiWalletStore((s) => s.activeWalletId)
  const wallets = useMultiWalletStore((s) => s.wallets)
  const detectedWallets = useMultiWalletStore((s) => s.detectedWallets)
  const activeAdapter = useMultiWalletStore((s) => s.activeAdapter)
  const isConnected = useMultiWalletStore((s) => s.isConnected)
  const address = useMultiWalletStore((s) => s.address)
  const isConnecting = useMultiWalletStore((s) => s.isConnecting)
  const error = useMultiWalletStore((s) => s.error)
  const isSelectorOpen = useMultiWalletStore((s) => s.isSelectorOpen)

  const setSelectorOpen = useMultiWalletStore((s) => s.setSelectorOpen)
  const connect = useMultiWalletStore((s) => s.connect)
  const disconnect = useMultiWalletStore((s) => s.disconnect)
  const signMessage = useMultiWalletStore((s) => s.signMessage)
  const switchWallet = useMultiWalletStore((s) => s.switchWallet)
  const refreshBalance = useMultiWalletStore((s) => s.refreshBalance)

  const activeWallet = activeWalletId ? wallets[activeWalletId] : undefined

  return {
    activeWalletId,
    activeWallet,
    wallets,
    detectedWallets,
    adapter: activeAdapter,
    isConnected,
    address,
    isConnecting,
    error,
    isSelectorOpen,
    setSelectorOpen,
    connect,
    disconnect,
    signMessage,
    switchWallet,
    refreshBalance,
  }
}
