"use client";

import { useWalletStore } from "@/stores/wallet-store";

export function useWallet() {
  const address = useWalletStore((s) => s.address);
  const isConnected = useWalletStore((s) => s.isConnected);
  const balance = useWalletStore((s) => s.balance);
  const isConnecting = useWalletStore((s) => s.isConnecting);
  const error = useWalletStore((s) => s.error);
  const connect = useWalletStore((s) => s.connect);
  const disconnect = useWalletStore((s) => s.disconnect);
  const refreshBalance = useWalletStore((s) => s.refreshBalance);

  return {
    address,
    isConnected,
    balance,
    isConnecting,
    error,
    connect,
    disconnect,
    refreshBalance,
  };
}
