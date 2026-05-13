"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatAddress } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/stores/wallet-store";

interface WalletConnectProps {
  className?: string;
  variant?: "outline" | "primary";
  size?: "sm" | "md" | "lg";
}

export function WalletConnect({
  className,
  variant = "outline",
  size = "sm",
}: WalletConnectProps) {
  const { isConnected, address, isConnecting, error, connect } =
    useWalletStore();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLocalError(null);
    try {
      await connect();
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("not installed")) {
          setLocalError(
            "Freighter wallet is not installed. Please install the Freighter browser extension to continue.",
          );
        } else {
          setLocalError(err.message || "Failed to connect wallet.");
        }
      } else {
        setLocalError("Failed to connect wallet.");
      }
    }
  };

  const displayError = localError || error;

  if (isConnected && address) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Wallet className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
            {formatAddress(address)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button
        variant={variant}
        size={size}
        leftIcon={<Wallet className="h-4 w-4" />}
        isLoading={isConnecting}
        onClick={handleConnect}
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
      {displayError && (
        <p className="text-xs text-red-600 dark:text-red-400 max-w-[240px]">
          {displayError}
        </p>
      )}
    </div>
  );
}
