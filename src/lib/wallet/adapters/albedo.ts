import { WalletAdapter, WalletMeta, SignOptions, NetworkType } from "../types"

interface AlbedoAPI {
  publicKey: () => Promise<{ pubkey: string }>
  tx: (params: { xdr: string, _opts?: SignOptions; network?: string }) => Promise<{ xdr: string; signed_envelope_xdr: string }>
  sign: (params: { message: string; pubkey: string }) => Promise<{ signature: string }>
}

function getAlbedoAPI(): AlbedoAPI | null {
  if (typeof window === "undefined") return null
  return ((window as unknown) as Record<string, AlbedoAPI>).albedo ?? null
}

export function createAlbedoAdapter(): WalletAdapter {
  const meta: WalletMeta = {
    id: "albedo",
    name: "Albedo",
    category: "extension",
    icon: "albedo-icon",
    installUrl: "https://albedo.link",
    description: "Stellar browser extension wallet",
    priority: 4,
    isAvailable: () => {
      if (typeof window === "undefined") return false
      return "albedo" in window
    },
  }

  return {
    meta,
    async connect() {
      const api = getAlbedoAPI()
      if (!api) throw { adapter: "albedo" as const, code: "not_installed" as const, message: "Albedo is not installed" }
      const result = await api.publicKey()
      return { publicKey: result.pubkey }
    },
    async disconnect() {},
    async isConnected() {
      const api = getAlbedoAPI()
      if (!api) return false
      try { await api.publicKey(); return true } catch { return false }
    },
    async getPublicKey() {
      const api = getAlbedoAPI()
      if (!api) throw { adapter: "albedo" as const, code: "not_installed" as const, message: "Albedo not installed" }
      const result = await api.publicKey()
      return result.pubkey
    },
    async signMessage(message: string) {
      const api = getAlbedoAPI()
      if (!api) throw { adapter: "albedo" as const, code: "not_installed" as const, message: "Albedo not installed" }
      const pubKey = await api.publicKey()
      const result = await api.sign({ message, pubkey: pubKey.pubkey })
      return { signature: result.signature, publicKey: pubKey.pubkey }
    },
    async signTransaction(xdr: string, opts?: SignOptions) {
      const api = getAlbedoAPI()
      if (!api) throw { adapter: "albedo" as const, code: "not_installed" as const, message: "Albedo not installed" }
      const result = await api.tx({ xdr, network: opts?.network ?? "testnet" })
      return { signedXdr: result.signed_envelope_xdr }
    },
    async getNetwork(): Promise<NetworkType> {
      return "testnet"
    },
  }
}
