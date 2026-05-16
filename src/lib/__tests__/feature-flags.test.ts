import { describe, it, expect, afterEach } from "vitest"

const ENV_FLAGS = [
  "NEXT_PUBLIC_FEATURE_GOVERNANCE",
  "NEXT_PUBLIC_FEATURE_REPUTATION_TIERS",
  "NEXT_PUBLIC_FEATURE_PASSKEY",
  "NEXT_PUBLIC_FEATURE_HARDWARE_WALLET",
] as const

function clearTestEnv() {
  for (const f of ENV_FLAGS) {
    delete (process.env as Record<string, string | undefined>)[f]
  }
}

// Re-import after env mutations so in-module checks read current process.env values.
// vitest hoists imports, but process.env reads happen at call time so direct setting works.

import {
  isGovernanceEnabled,
  isReputationTiersEnabled,
  isPasskeyEnabled,
  isHardwareWalletEnabled,
} from "@/lib/features"

afterEach(() => {
  clearTestEnv()
})

describe("Feature Flags", () => {
  describe("Governance", () => {
    it("TestGovernance_FlagEnabled: returns true when NEXT_PUBLIC_FEATURE_GOVERNANCE=true", () => {
      process.env.NEXT_PUBLIC_FEATURE_GOVERNANCE = "true"
      expect(isGovernanceEnabled()).toBe(true)
    })

    it("TestGovernance_FlagDisabled: returns false when flag is 'false'", () => {
      process.env.NEXT_PUBLIC_FEATURE_GOVERNANCE = "false"
      expect(isGovernanceEnabled()).toBe(false)
    })

    it("TestGovernance_FlagMissing: defaults to true when flag is not set", () => {
      delete (process.env as Record<string, string | undefined>).NEXT_PUBLIC_FEATURE_GOVERNANCE
      expect(isGovernanceEnabled()).toBe(true)
    })

    it("TestGovernance_FlagZero: returns false when flag is '0'", () => {
      process.env.NEXT_PUBLIC_FEATURE_GOVERNANCE = "0"
      expect(isGovernanceEnabled()).toBe(false)
    })
  })

  describe("Reputation Tiers", () => {
    it("TestReputationTiers_FlagEnabled: returns true when NEXT_PUBLIC_FEATURE_REPUTATION_TIERS=true", () => {
      process.env.NEXT_PUBLIC_FEATURE_REPUTATION_TIERS = "true"
      expect(isReputationTiersEnabled()).toBe(true)
    })

    it("TestReputationTiers_FlagDisabled: returns false when flag is 'false'", () => {
      process.env.NEXT_PUBLIC_FEATURE_REPUTATION_TIERS = "false"
      expect(isReputationTiersEnabled()).toBe(false)
    })
  })

  describe("Passkey", () => {
    it("TestPasskey_FlagEnabled: returns true when NEXT_PUBLIC_FEATURE_PASSKEY=true", () => {
      process.env.NEXT_PUBLIC_FEATURE_PASSKEY = "true"
      expect(isPasskeyEnabled()).toBe(true)
    })

    it("TestPasskey_FlagDisabled: returns false when NEXT_PUBLIC_FEATURE_PASSKEY=false", () => {
      process.env.NEXT_PUBLIC_FEATURE_PASSKEY = "false"
      expect(isPasskeyEnabled()).toBe(false)
    })
  })

  describe("Hardware Wallet", () => {
    it("TestHardwareWallet_FlagEnabled: returns true when NEXT_PUBLIC_FEATURE_HARDWARE_WALLET=true", () => {
      process.env.NEXT_PUBLIC_FEATURE_HARDWARE_WALLET = "true"
      expect(isHardwareWalletEnabled()).toBe(true)
    })

    it("TestHardwareWallet_FlagDisabled: returns false when NEXT_PUBLIC_FEATURE_HARDWARE_WALLET=false", () => {
      process.env.NEXT_PUBLIC_FEATURE_HARDWARE_WALLET = "false"
      expect(isHardwareWalletEnabled()).toBe(false)
    })
  })

  describe("SSR Safety", () => {
    it("TestFeatureFlag_SSRSafety: returns false when window is undefined", () => {
      // Simulate SSR by making typeof window === "undefined"
      const originalWindow = globalThis.window
      // @ts-expect-error — deliberately removing window for SSR simulation
      delete globalThis.window

      try {
        // isGovernanceEnabled -> isFeatureEnabled -> first check: typeof window === "undefined" -> return false
        expect(isGovernanceEnabled()).toBe(false)
        expect(isReputationTiersEnabled()).toBe(false)
        expect(isPasskeyEnabled()).toBe(false)
        expect(isHardwareWalletEnabled()).toBe(false)
      } finally {
        globalThis.window = originalWindow
      }
    })
  })

  describe("Rollback", () => {
    it("TestFeatureFlag_Rollback: flipping flag from true to false removes feature access", () => {
      process.env.NEXT_PUBLIC_FEATURE_GOVERNANCE = "true"
      expect(isGovernanceEnabled()).toBe(true)

      process.env.NEXT_PUBLIC_FEATURE_GOVERNANCE = "false"
      expect(isGovernanceEnabled()).toBe(false)
    })
  })
})
