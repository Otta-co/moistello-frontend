"use client";

import { useEffect } from "react";
import { Coins, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useWalletStore } from "@/stores/wallet-store";

interface WalletBalanceProps {
  className?: string;
}

export function WalletBalance({ className }: WalletBalanceProps) {
  const { address, balance, isConnected, refreshBalance, isConnecting } =
    useWalletStore();

  useEffect(() => {
    if (isConnected && address && !balance && !isConnecting) {
      refreshBalance();
    }
  }, [isConnected, address, balance, isConnecting, refreshBalance]);

  if (!isConnected) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex flex-col items-center justify-center gap-3 py-6">
          <Coins className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Connect your wallet to view balances
          </p>
        </div>
      </Card>
    );
  }

  const formatBalance = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "0.0000";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  };

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
          Wallet Balance
        </h3>
        <button
          onClick={() => refreshBalance()}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Refresh balance"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center">
              <span className="text-xs font-bold text-white dark:text-gray-900">
                XLM
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Stellar Lumens
              </p>
            </div>
          </div>
          {balance ? (
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatBalance(balance.xlm)}
            </p>
          ) : (
            <Skeleton className="h-7 w-24 mt-1" variant="text" />
          )}
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">$</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                USD Coin
              </p>
            </div>
          </div>
          {balance ? (
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatBalance(balance.usdc)}
            </p>
          ) : (
            <Skeleton className="h-7 w-24 mt-1" variant="text" />
          )}
        </div>
      </div>
    </Card>
  );
}
