import { describe, it, expect, vi, beforeEach } from "vitest"

describe("Feature flags independence", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("isPasskeyEnabled returns false when env var is false", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PASSKEY", "false")
    vi.stubGlobal("window", {})
    const { isPasskeyEnabled } = await import("../features")
    expect(isPasskeyEnabled()).toBe(false)
    vi.unstubAllEnvs()
  })

  it("isPasskeyEnabled returns true when env var is unset", async () => {
    vi.stubGlobal("window", {})
    const { isPasskeyEnabled } = await import("../features")
    expect(isPasskeyEnabled()).toBe(true)
  })

  it("isPasskeyEnabled returns true when env var is true", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PASSKEY", "true")
    vi.stubGlobal("window", {})
    const { isPasskeyEnabled } = await import("../features")
    expect(isPasskeyEnabled()).toBe(true)
    vi.unstubAllEnvs()
  })

  it("isWalletConnectEnabled returns false when env var is false", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_WALLETCONNECT", "false")
    vi.stubGlobal("window", {})
    const { isWalletConnectEnabled } = await import("../features")
    expect(isWalletConnectEnabled()).toBe(false)
    vi.unstubAllEnvs()
  })

  it("passkey works independently of walletconnect", async () => {
    // Scenario: WC off, passkey on
    vi.stubEnv("NEXT_PUBLIC_FEATURE_WALLETCONNECT", "false")
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PASSKEY", "true")
    vi.stubGlobal("window", {})

    const { isWalletConnectEnabled, isPasskeyEnabled } = await import("../features")
    expect(isWalletConnectEnabled()).toBe(false)
    expect(isPasskeyEnabled()).toBe(true)

    vi.unstubAllEnvs()
  })

  it("both can be disabled independently", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_WALLETCONNECT", "false")
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PASSKEY", "false")
    vi.stubGlobal("window", {})

    const { isWalletConnectEnabled, isPasskeyEnabled } = await import("../features")
    expect(isWalletConnectEnabled()).toBe(false)
    expect(isPasskeyEnabled()).toBe(false)

    vi.unstubAllEnvs()
  })

  it("both can be enabled simultaneously", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_WALLETCONNECT", "true")
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PASSKEY", "true")
    vi.stubGlobal("window", {})

    const { isWalletConnectEnabled, isPasskeyEnabled } = await import("../features")
    expect(isWalletConnectEnabled()).toBe(true)
    expect(isPasskeyEnabled()).toBe(true)

    vi.unstubAllEnvs()
  })

  it("returns false on SSR even when env says true", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PASSKEY", "true")
    // The isFeatureEnabled function checks typeof window === "undefined" for SSR.
    // In jsdom, window IS defined, so we simulate SSR by making it undefined.
    const origWindow = globalThis.window
    delete (globalThis as Partial<typeof globalThis>).window
    const { isPasskeyEnabled } = await import("../features")
    expect(isPasskeyEnabled()).toBe(false)
    globalThis.window = origWindow
    vi.unstubAllEnvs()
  })
})
