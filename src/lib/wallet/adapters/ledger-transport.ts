/**
 * Ledger Transport Abstraction
 *
 * Detects available transport protocols (WebUSB, WebBLE) and creates
 * the appropriate connection for the Ledger hardware wallet.
 *
 * WebUSB: Desktop browsers (Chrome, Edge, Brave) — USB cable connection
 * WebBLE: Mobile browsers — Bluetooth connection
 */

export type TransportType = "webusb" | "webble" | "none"

export interface LedgerTransport {
  type: TransportType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(): Promise<any>
  isSupported(): boolean
}

/**
 * Detects which transport protocol is available in the current browser.
 * WebUSB for desktop (Chrome/Edge/Brave), WebBLE for mobile.
 */
export function detectAvailableTransport(): TransportType {
  if (typeof window === "undefined") return "none"
  if (typeof navigator === "undefined") return "none"

  if ("usb" in navigator) {
    try {
      return "webusb"
    } catch {
      // API exists but may be blocked
    }
  }

  if ("bluetooth" in navigator) {
    return "webble"
  }

  return "none"
}

/**
 * Creates a Ledger transport for the given type.
 * Lazy-loads the appropriate @ledgerhq library to minimize bundle impact.
 */
export async function createTransport(type: TransportType): Promise<LedgerTransport> {
  switch (type) {
    case "webusb": {
      const TransportWebUSB = (await import("@ledgerhq/hw-transport-webusb")).default
      return {
        type: "webusb",
        isSupported: () => "usb" in navigator,
        create: async () => TransportWebUSB.create(),
      }
    }
    case "webble": {
      try {
        const TransportWebBLE = (await import("@ledgerhq/hw-transport-webble")).default
        return {
          type: "webble",
          isSupported: () => "bluetooth" in navigator,
          create: async () => TransportWebBLE.create(),
        }
      } catch {
        throw new Error(
          "Web Bluetooth is not available in this browser. Try Chrome on Android or desktop.",
        )
      }
    }
    default:
      throw new Error(
        "No compatible transport available. Connect your Ledger via USB on desktop or Bluetooth on mobile.",
      )
  }
}

/**
 * Returns a human-readable instruction based on transport type.
 */
export function getTransportDescription(type: TransportType): string {
  switch (type) {
    case "webusb":
      return "Connect your Ledger to your computer via USB cable"
    case "webble":
      return "Open Bluetooth settings and connect your Ledger"
    case "none":
      return "Your browser does not support hardware wallet connections. Try Chrome on desktop."
  }
}

/**
 * Returns the icon name for the transport type.
 */
export function getTransportIcon(type: TransportType): string {
  switch (type) {
    case "webusb":
      return "USB"
    case "webble":
      return "Bluetooth"
    case "none":
      return "NotSupported"
  }
}

/**
 * Checks if ANY hardware wallet transport is available.
 */
export function isHardwareWalletSupported(): boolean {
  return detectAvailableTransport() !== "none"
}
