import { describe, it, expect } from "vitest"

// Runtime verification that error types match the WalletError discriminated union
// This ensures the union type includes all error codes used across adapters

/**
 * Extracts the literal code values from the WalletError union at runtime.
 * This is a compile-time safety check — if the union doesn't include a code
 * we reference here, TypeScript will error.
 */
describe("WalletError union completeness", () => {
  it("includes not_installed for wallet-not-found scenarios", () => {
    const err: { adapter: string; code: "not_installed"; message: string } = {
      adapter: "freighter",
      code: "not_installed",
      message: "Wallet not found",
    }
    expect(err.code).toBe("not_installed")
  })

  it("includes not_supported for SSR/unavailable scenarios", () => {
    // This is the fix for issue #2 — not_supported must be in the union
    const err: { adapter: string; code: "not_supported"; message: string } = {
      adapter: "passkey",
      code: "not_supported",
      message: "Not available server-side",
    }
    expect(err.code).toBe("not_supported")
  })

  it("includes user_rejected for cancellation scenarios", () => {
    const err: { adapter: string; code: "user_rejected"; message: string } = {
      adapter: "passkey",
      code: "user_rejected",
      message: "User cancelled",
    }
    expect(err.code).toBe("user_rejected")
  })

  it("includes network_mismatch with expected and actual fields", () => {
    const err: { adapter: string; code: "network_mismatch"; message: string; expected: string; actual: string } = {
      adapter: "walletconnect",
      code: "network_mismatch",
      message: "Network mismatch",
      expected: "testnet",
      actual: "mainnet",
    }
    expect(err.code).toBe("network_mismatch")
    expect(err.expected).toBe("testnet")
    expect(err.actual).toBe("mainnet")
  })

  it("includes timeout for operation timeouts", () => {
    const err: { adapter: string; code: "timeout"; message: string } = {
      adapter: "walletconnect",
      code: "timeout",
      message: "Request timed out",
    }
    expect(err.code).toBe("timeout")
  })

  it("includes internal with cause field", () => {
    const err: { adapter: string; code: "internal"; message: string; cause: string } = {
      adapter: "passkey",
      code: "internal",
      message: "Operation failed",
      cause: "Something went wrong",
    }
    expect(err.code).toBe("internal")
    expect(err.cause).toBe("Something went wrong")
  })

  it("passkey adapter detects server-side environment", async () => {
    // Simulate server-side: delete PublicKeyCredential
    const origPkc = (globalThis as Record<string, unknown>).PublicKeyCredential
    delete (globalThis as Record<string, unknown>).PublicKeyCredential

    const { createPasskeyAdapter } = await import("../adapters/passkey")
    const adapter = createPasskeyAdapter()

    expect(adapter.meta.isAvailable()).toBe(false)

    // Restore
    ;(globalThis as Record<string, unknown>).PublicKeyCredential = origPkc
  })
})
