"use client";

import { create } from "zustand";
import {
  isFreighterInstalled,
  connectFreighter,
  getAccountBalance,
} from "@/lib/stellar";

interface WalletBalance {
  xlm: string;
  usdc: string;
}

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: WalletBalance | null;
  isConnecting: boolean;
  error: string | null;
}

interface WalletActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

type WalletStore = WalletState & WalletActions;

export const useWalletStore = create<WalletStore>()((set, get) => ({
  isConnected: false,
  address: null,
  balance: null,
  isConnecting: false,
  error: null,

  connect: async () => {
    set({ isConnecting: true, error: null });
    try {
      if (!isFreighterInstalled()) {
        throw new Error(
          "Freighter wallet is not installed. Please install Freighter to continue."
        );
      }

      const address = await connectFreighter();

      let balance: WalletBalance | null = null;
      try {
        balance = await getAccountBalance(address);
      } catch {
        // Balance fetch is non-critical; proceed without it
      }

      set({
        isConnected: true,
        address,
        balance,
        isConnecting: false,
        error: null,
      });
    } catch (error) {
      set({
        isConnected: false,
        address: null,
        balance: null,
        isConnecting: false,
        error:
          error instanceof Error ? error.message : "Failed to connect wallet",
      });
      throw error;
    }
  },

  disconnect: () => {
    set({
      isConnected: false,
      address: null,
      balance: null,
      isConnecting: false,
      error: null,
    });
  },

  refreshBalance: async () => {
    const { address } = get();
    if (!address) return;

    try {
      const balance = await getAccountBalance(address);
      set({ balance });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to refresh balance",
      });
    }
  },
}));
