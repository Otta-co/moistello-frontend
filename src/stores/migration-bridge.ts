const OLD_STORAGE_KEY = "moistello_wallet_address"
const NEW_STORAGE_KEY = "moistello_wallet_sessions"

export function migrateOldWalletSession(): boolean {
  if (typeof window === "undefined") return false
  try {
    const oldAddress = localStorage.getItem(OLD_STORAGE_KEY)
    if (!oldAddress) return false

    const alreadyMigrated = localStorage.getItem(NEW_STORAGE_KEY)
    if (alreadyMigrated) return false

    const session = {
      sessions: [{
        walletId: "freighter",
        publicKey: oldAddress,
        lastConnected: Date.now(),
        network: "testnet",
      }],
      hmac: "migrated",
      activeWalletId: "freighter",
    }
    localStorage.setItem(NEW_STORAGE_KEY, JSON.stringify(session))
    localStorage.removeItem(OLD_STORAGE_KEY)
    return true
  } catch { return false }
}
