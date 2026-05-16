"use client"

/**
 * Feature flag utility for the Moistello frontend.
 * All flags default to "true" if not explicitly set to "false" or "0".
 */

export function isFeatureEnabled(flag: string): boolean {
  if (typeof window === "undefined") return false
  const envFlag = (process.env as Record<string, string | undefined>)[flag]
  if (envFlag === "false" || envFlag === "0") return false
  return true
}

export function isGovernanceEnabled(): boolean {
  return isFeatureEnabled("NEXT_PUBLIC_FEATURE_GOVERNANCE")
}

export function isReputationTiersEnabled(): boolean {
  return isFeatureEnabled("NEXT_PUBLIC_FEATURE_REPUTATION_TIERS")
}

export function isPasskeyEnabled(): boolean {
  return isFeatureEnabled("NEXT_PUBLIC_FEATURE_PASSKEY")
}

export function isHardwareWalletEnabled(): boolean {
  return isFeatureEnabled("NEXT_PUBLIC_FEATURE_HARDWARE_WALLET")
}
