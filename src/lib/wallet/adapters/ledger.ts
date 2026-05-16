import { WalletAdapter, WalletMeta, SignOptions, NetworkType } from "../types"
import { detectAvailableTransport, createTransport } from "./ledger-transport"

const DERIVATION_PATH = "44'/148'/0'"

function bytesToHex(bytes: Uint8Array | ArrayBuffer | ArrayLike<number>): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as ArrayLike<number>)
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("")
}

export function createLedgerAdapter(): WalletAdapter {
  const meta: WalletMeta = {
    id: "ledger",
    name: "Ledger",
    category: "hardware",
    icon: "ledger-icon",
    installUrl: "https://www.ledger.com/start/",
    description: "Hardware wallet — maximum security for large amounts",
    priority: 5,
    isAvailable: () => {
      if (typeof window === "undefined") return false
      return "usb" in navigator
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let transport: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stellarApp: any = null
  let currentPublicKey: string | null = null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function ensureConnection(): Promise<{ transport: any; stellar: any }> {
    if (transport && stellarApp) {
      return { transport, stellar: stellarApp }
    }

    const transportType = detectAvailableTransport()
    if (transportType === "none") {
      throw {
        adapter: "ledger" as const,
        code: "not_installed" as const,
        message:
          "No compatible transport available. Connect your Ledger via USB on desktop or Bluetooth on mobile.",
      }
    }

    const lt = await createTransport(transportType)
    transport = await lt.create()

    const Str = (await import("@ledgerhq/hw-app-str")).default
    stellarApp = new Str(transport)
    return { transport, stellar: stellarApp }
  }

  async function closeConnection(): Promise<void> {
    if (transport) {
      try { await transport.close() } catch {}
      transport = null
    }
    stellarApp = null
    currentPublicKey = null
  }

  return {
    meta,

    async connect() {
      try {
        const { stellar } = await ensureConnection()
        const result = await stellar.getPublicKey(DERIVATION_PATH)
        currentPublicKey = result.publicKey
        return { publicKey: result.publicKey }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        await closeConnection()
        if (err.message?.includes("denied") || err.message?.includes("cancel")) {
          throw {
            adapter: "ledger" as const,
            code: "user_rejected" as const,
            message: "Connection cancelled on Ledger device.",
          }
        }
        if (err.message?.includes("locked") || err.message?.includes("0x6511")) {
          throw {
            adapter: "ledger" as const,
            code: "timeout" as const,
            message: "Ledger is locked. Unlock it and open the Stellar app.",
          }
        }
        throw {
          adapter: "ledger" as const,
          code: "not_installed" as const,
          message: "Ledger not detected. Is it plugged in and unlocked with the Stellar app open?",
        }
      }
    },

    async disconnect() {
      await closeConnection()
    },

    async isConnected() {
      if (!transport || !stellarApp) return false
      try {
        await stellarApp.getPublicKey(DERIVATION_PATH)
        return true
      } catch {
        return false
      }
    },

    async getPublicKey() {
      if (!currentPublicKey) {
        const { stellar } = await ensureConnection()
        const result = await stellar.getPublicKey(DERIVATION_PATH)
        currentPublicKey = result.publicKey
      }
      if (!currentPublicKey) {
        throw { adapter: "ledger" as const, code: "not_installed" as const, message: "Not connected" }
      }
      return currentPublicKey
    },

    async signMessage(message: string) {
      const { stellar } = await ensureConnection()
      if (!currentPublicKey) {
        const pk = await stellar.getPublicKey(DERIVATION_PATH)
        currentPublicKey = pk.publicKey
      }
      if (!currentPublicKey) {
        throw { adapter: "ledger" as const, code: "not_installed" as const, message: "Not connected" }
      }

      try {
        const encoder = new TextEncoder()
        const data = encoder.encode(message)
        const result = await stellar.sign(DERIVATION_PATH, data)

        return {
          signature: bytesToHex(result.signature),
          publicKey: currentPublicKey,
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err.message?.includes("denied") || err.statusText?.includes("denied")) {
          throw {
            adapter: "ledger" as const,
            code: "user_rejected" as const,
            message: "Signature rejected on Ledger device.",
          }
        }
        throw {
          adapter: "ledger" as const,
          code: "internal" as const,
          message: "Failed to sign on Ledger",
          cause: err.message || String(err),
        }
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async signTransaction(xdr: string, _?: SignOptions) {
      const { stellar } = await ensureConnection()
      if (!currentPublicKey) {
        const pk = await stellar.getPublicKey(DERIVATION_PATH)
        currentPublicKey = pk.publicKey
      }

      try {
        const result = await stellar.signTransaction(DERIVATION_PATH, xdr)
        return { signedXdr: result.signature }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err.message?.includes("denied")) {
          throw {
            adapter: "ledger" as const,
            code: "user_rejected" as const,
            message: "Transaction rejected on Ledger device. Verify the details on your device screen.",
          }
        }
        throw {
          adapter: "ledger" as const,
          code: "internal" as const,
          message: "Failed to sign transaction on Ledger",
          cause: err.message || String(err),
        }
      }
    },

    async getNetwork() {
      return "testnet" as NetworkType
    },
  }
}
