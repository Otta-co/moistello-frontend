"use client"

import { useEffect, useRef } from "react"

export type DeviceScreenState =
  | "dashboard"
  | "stellar_logo"
  | "waiting_commands"
  | "display_address"
  | "confirm_address"
  | "review_transaction"
  | "transaction_details"
  | "signing"
  | "approved"
  | "rejected"
  | "bootloader"
  | "locked"
  | "pairing"

interface LedgerDeviceSimProps {
  screen: DeviceScreenState
  address?: string
  amount?: string
  asset?: string
  destination?: string
  operationType?: string
  className?: string
}

function SimulatorFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto w-[180px] h-[100px] rounded-[12px] border-2 border-gray-700 bg-black overflow-hidden shadow-lg"
      style={{ fontFamily: "'Courier New', monospace" }}
      aria-hidden="true"
    >
      <div className="absolute top-0 left-0 right-0 h-[14px] bg-gray-800 flex items-center justify-center">
        <div className="w-[6px] h-[6px] rounded-full bg-gray-600" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[14px] bg-gray-800 flex items-center justify-center gap-1">
        <div className="w-[4px] h-[4px] rounded-full bg-gray-600" />
        <div className="w-[4px] h-[4px] rounded-full bg-gray-600" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-3 pt-[18px] pb-[18px]">
        {children}
      </div>
    </div>
  )
}

function AnimatedDots() {
  return (
    <span className="inline-flex">
      <span className="animate-pulse">.</span>
      <span className="animate-pulse" style={{ animationDelay: "0.3s" }}>.</span>
      <span className="animate-pulse" style={{ animationDelay: "0.6s" }}>.</span>
    </span>
  )
}

function ScreenContent({ screen, address, amount, asset, destination, operationType }: LedgerDeviceSimProps) {
  switch (screen) {
    case "dashboard":
      return (
        <div className="text-center">
          <div className="text-[8px] text-gray-400">Dashboard</div>
          <div className="text-[6px] text-gray-500 mt-1">
            Stellar
            <br />
            Bitcoin
            <br />
            Ethereum
          </div>
        </div>
      )

    case "stellar_logo":
      return (
        <div className="text-center">
          <div className="text-[10px] text-white font-bold">Stellar</div>
          <div className="text-[6px] text-gray-400 mt-1">Opening<AnimatedDots /></div>
        </div>
      )

    case "waiting_commands":
      return (
        <div className="text-center">
          <div className="text-[8px] text-green-400">Stellar</div>
          <div className="text-[5px] text-gray-400 mt-1">Waiting for<br />commands...</div>
        </div>
      )

    case "display_address":
      return (
        <div className="text-center w-full">
          <div className="text-[6px] text-gray-400 mb-1">Address</div>
          <div className="text-[5px] text-white break-all font-mono leading-tight">
            {address
              ? `${address.slice(0, 14)}...${address.slice(-6)}`
              : "GABC...XYZ"}
          </div>
        </div>
      )

    case "confirm_address":
      return (
        <div className="text-center w-full">
          <div className="text-[6px] text-gray-400 mb-1">Address</div>
          <div className="text-[5px] text-white break-all font-mono leading-tight">
            {address
              ? `${address.slice(0, 14)}...${address.slice(-6)}`
              : "GABC...XYZ"}
          </div>
          <div className="flex justify-center gap-2 mt-1">
            <span className="text-[5px] text-green-400">✓ Approve</span>
            <span className="text-[5px] text-red-400">✗ Reject</span>
          </div>
        </div>
      )

    case "review_transaction":
      return (
        <div className="text-center w-full">
          <div className="text-[6px] text-yellow-400 mb-1">Review Tx</div>
          <div className="text-[5px] text-white text-left leading-tight">
            {operationType ? `${operationType}` : "Payment"}
            <br />
            <span className="text-gray-400">
              {amount || "100"} {asset || "XLM"}
            </span>
          </div>
        </div>
      )

    case "transaction_details":
      return (
        <div className="text-center w-full">
          <div className="text-[6px] text-yellow-400 mb-1">Details</div>
          <div className="text-[4px] text-gray-300 text-left leading-tight">
            Dest: {destination ? `${destination.slice(0, 8)}...` : "GABC..."}
            <br />
            Amt: {amount || "100"} {asset || "XLM"}
            <br />
            Fee: 0.00001 XLM
          </div>
          <div className="flex justify-center gap-2 mt-1">
            <span className="text-[5px] text-green-400">✓ Sign</span>
            <span className="text-[5px] text-red-400">✗ Reject</span>
          </div>
        </div>
      )

    case "signing":
      return (
        <div className="text-center">
          <div className="text-[6px] text-yellow-400">Signing<AnimatedDots /></div>
        </div>
      )

    case "approved":
      return (
        <div className="text-center">
          <div className="text-[10px] text-green-400">✓</div>
          <div className="text-[6px] text-green-400">Signed</div>
        </div>
      )

    case "rejected":
      return (
        <div className="text-center">
          <div className="text-[10px] text-red-400">✗</div>
          <div className="text-[6px] text-red-400">Rejected</div>
        </div>
      )

    case "bootloader":
      return (
        <div className="text-center">
          <div className="text-[6px] text-yellow-400">Bootloader</div>
          <div className="text-[5px] text-gray-500 mt-1">Update mode</div>
        </div>
      )

    case "locked":
      return (
        <div className="text-center">
          <div className="text-[6px] text-gray-400">🔒 Locked</div>
          <div className="text-[5px] text-gray-500 mt-1">Enter PIN</div>
        </div>
      )

    case "pairing":
      return (
        <div className="text-center">
          <div className="text-[6px] text-blue-400">Pair with</div>
          <div className="text-[5px] text-white">Moistello?</div>
          <div className="flex justify-center gap-2 mt-1">
            <span className="text-[5px] text-green-400">✓</span>
            <span className="text-[5px] text-red-400">✗</span>
          </div>
        </div>
      )

    default:
      return (
        <div className="text-[6px] text-gray-500">Ready</div>
      )
  }
}

export function LedgerDeviceSim(props: LedgerDeviceSimProps) {
  const { screen, className = "" } = props
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced && containerRef.current) {
      const animated = containerRef.current.querySelectorAll(".animate-pulse")
      animated.forEach((el) => {
        (el as HTMLElement).style.animation = "none"
      })
    }
  }, [screen])

  return (
    <div ref={containerRef} className={`flex flex-col items-center gap-1 ${className}`}>
      <SimulatorFrame>
        <ScreenContent {...props} />
      </SimulatorFrame>
      <p className="text-[8px] text-muted-foreground/50">
        {getScreenLabel(screen)}
      </p>
    </div>
  )
}

function getScreenLabel(screen: DeviceScreenState): string {
  switch (screen) {
    case "dashboard": return "Your Ledger is on the Dashboard"
    case "stellar_logo": return "Opening Stellar app..."
    case "waiting_commands": return "Stellar app is ready"
    case "display_address": return "Check address on your Ledger"
    case "confirm_address": return "Press both buttons to confirm"
    case "review_transaction": return "Review on your Ledger"
    case "transaction_details": return "Verify details, then sign"
    case "signing": return "Signing on Ledger..."
    case "approved": return "Transaction signed ✓"
    case "rejected": return "Transaction rejected"
    case "bootloader": return "Device in bootloader mode"
    case "locked": return "Device is locked"
    case "pairing": return "Bluetooth pairing request"
    default: return ""
  }
}
