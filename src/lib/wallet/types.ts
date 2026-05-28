export type WalletId = string
export type WalletCategory = "extension" | "mobile" | "hardware" | "passkey" | "import"
export type NetworkType = "testnet" | "mainnet"

export interface WalletMeta {
  id: WalletId
  name: string
  category: WalletCategory
  icon: string
  installUrl: string
  description: string
  priority: number
  isAvailable: () => boolean
}

export interface WalletAdapter {
  meta: WalletMeta

  connect(): Promise<{ publicKey: string }>
  disconnect(): Promise<void>
  isConnected(): Promise<boolean>

  signMessage(message: string): Promise<{ signature: string; publicKey: string }>
  signTransaction(xdr: string, opts?: SignOptions): Promise<{ signedXdr: string }>

  getPublicKey(): Promise<string>
  getNetwork(): Promise<NetworkType>
}

export interface SignOptions {
  network?: NetworkType
  networkPassphrase?: string
  accountToSign?: string
}

export type WalletError =
  | { adapter: WalletId; code: "not_installed"; message: string }
  | { adapter: WalletId; code: "not_supported"; message: string }
  | { adapter: WalletId; code: "user_rejected"; message: string }
  | { adapter: WalletId; code: "network_mismatch"; message: string; expected: NetworkType; actual: NetworkType }
  | { adapter: WalletId; code: "timeout"; message: string }
  | { adapter: WalletId; code: "internal"; message: string; cause: string }
  // Ledger-specific errors
  | { adapter: "ledger"; code: "ledger_unsupported_browser"; message: string; browser: string }
  | { adapter: "ledger"; code: "ledger_device_not_found"; message: string; transportType: string }
  | { adapter: "ledger"; code: "ledger_stellar_app_not_open"; message: string }
  | { adapter: "ledger"; code: "ledger_stellar_app_not_installed"; message: string }
  | { adapter: "ledger"; code: "ledger_device_locked"; message: string }
  | { adapter: "ledger"; code: "ledger_transport_disconnected"; message: string; transportType: string }
  | { adapter: "ledger"; code: "ledger_firmware_outdated"; message: string; firmware: string; stellarApp: string }
  | { adapter: "ledger"; code: "ledger_wrong_account"; message: string; expected: string; actual: string }
  | { adapter: "ledger"; code: "ledger_xdr_invalid"; message: string }
  | { adapter: "ledger"; code: "ledger_mainnet_confirm_required"; message: string }
  | { adapter: "ledger"; code: "ledger_device_in_bootloader"; message: string }
  | { adapter: "ledger"; code: "ledger_device_not_responding"; message: string }
  | { adapter: "ledger"; code: "ledger_sign_failed"; message: string; cause: string }

export interface WalletSession {
  walletId: WalletId
  publicKey: string
  lastConnected: number
  network: NetworkType
}

export interface EncryptedSessionStore {
  sessions: WalletSession[]
  hmac: string
  activeWalletId: string | null
}
