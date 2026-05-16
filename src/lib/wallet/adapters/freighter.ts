import { WalletAdapter, WalletMeta, SignOptions, NetworkType } from "../types"

interface FreighterAPI {
  isConnected: () => Promise<{ isConnected: boolean; error?: unknown }>
  getPublicKey: () => Promise<{ publicKey: string; error?: unknown }>
  signTransaction: (xdr: string, opts?: { network?: string; networkPassphrase?: string; accountToSign?: string }) => Promise<{ signedTxXdr: string; error?: unknown }>
  signAuthEntry?: (entryXdr: string, opts?: { accountToSign?: string }) => Promise<{ signedAuthEntry: string; error?: unknown }>
  getNetwork: () => Promise<{ network: string; networkPassphrase: string }>
}

function getFreighterAPI(): FreighterAPI | null {
  if (typeof window === "undefined") return null
  return (window as unknown as Record<string, FreighterAPI>).freighterApi ?? null
}

function mapNetwork(networkStr: string): NetworkType {
  if (networkStr === "PUBLIC" || networkStr === "mainnet") return "mainnet"
  return "testnet"
}

export function createFreighterAdapter(): WalletAdapter {
  const meta: WalletMeta = {
    id: "freighter",
    name: "Freighter",
    category: "extension",
    icon: "freighter-icon",
    installUrl: "https://freighter.app",
    description: "Stellar browser extension wallet",
    priority: 1,
    isAvailable: () => {
      if (typeof window === "undefined") return false
      return "freighterApi" in window
    },
  }

  return {
    meta,

    async connect() {
      const api = getFreighterAPI()
      if (!api) {
        throw { adapter: "freighter" as const, code: "not_installed" as const, message: "Freighter is not installed. Install it from https://freighter.app" }
      }

      const connected = await api.isConnected()
      if (connected.error) {
        throw { adapter: "freighter" as const, code: "internal" as const, message: "Freighter connection error", cause: String(connected.error) }
      }

      const pubKey = await api.getPublicKey()
      if (pubKey.error) {
        throw { adapter: "freighter" as const, code: "internal" as const, message: "Failed to get Freighter public key", cause: String(pubKey.error) }
      }

      return { publicKey: pubKey.publicKey }
    },

    async disconnect() {
    },

    async isConnected() {
      const api = getFreighterAPI()
      if (!api) return false
      try {
        const result = await api.isConnected()
        return result.isConnected
      } catch {
        return false
      }
    },

    async getPublicKey() {
      const api = getFreighterAPI()
      if (!api) throw { adapter: "freighter" as const, code: "not_installed" as const, message: "Freighter not installed" }
      const result = await api.getPublicKey()
      if (result.error) throw { adapter: "freighter" as const, code: "internal" as const, message: "Failed to get public key", cause: String(result.error) }
      return result.publicKey
    },

    async signMessage(message: string) {
      const api = getFreighterAPI()
      if (!api) throw { adapter: "freighter" as const, code: "not_installed" as const, message: "Freighter not installed" }

      const encoder = new TextEncoder()
      const data = encoder.encode(message)
      const encodedMessage = btoa(Array.from(data, (byte) => String.fromCharCode(byte)).join(""))
      const xdr = `AAAAAgAAAAB...${encodedMessage}`

      const network = await api.getNetwork()
      const result = await api.signTransaction(xdr, {
        network: network.network === "PUBLIC" ? "public" : "testnet",
        networkPassphrase: network.networkPassphrase,
      })

      if (result.error) {
        throw { adapter: "freighter" as const, code: "internal" as const, message: "Failed to sign message", cause: String(result.error) }
      }

      const pubKey = await api.getPublicKey()
      return { signature: result.signedTxXdr, publicKey: pubKey.publicKey }
    },

    async signTransaction(xdr: string, opts?: SignOptions) {
      const api = getFreighterAPI()
      if (!api) throw { adapter: "freighter" as const, code: "not_installed" as const, message: "Freighter not installed" }

      const result = await api.signTransaction(xdr, {
        network: opts?.network ?? "testnet",
        networkPassphrase: opts?.networkPassphrase ?? "Test SDF Network ; September 2015",
        accountToSign: opts?.accountToSign,
      })

      if (result.error) {
        throw { adapter: "freighter" as const, code: "internal" as const, message: "Failed to sign transaction", cause: String(result.error) }
      }

      return { signedXdr: result.signedTxXdr }
    },

    async getNetwork() {
      const api = getFreighterAPI()
      if (!api) return "testnet"
      try {
        const network = await api.getNetwork()
        return mapNetwork(network.network)
      } catch {
        return "testnet"
      }
    },
  }
}
