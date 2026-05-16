export { walletRegistry, WalletRegistry, type DetectionResult } from "./registry"
export { sessionManager, WalletSessionManager } from "./session-manager"
export { initializeWalletAdapters } from "./adapters"
export type {
  WalletId, WalletCategory, NetworkType, WalletMeta, WalletAdapter,
  SignOptions, WalletError, WalletSession, EncryptedSessionStore,
} from "./types"
