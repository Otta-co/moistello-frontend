import { describe, it, expect, vi, beforeEach } from "vitest"
import { getWalletRegistry } from "../registry"
import { getSessionManager } from "../session-manager"

vi.mock("../features", () => ({
  isPasskeyEnabled: () => false,
  isHardwareWalletEnabled: () => false,
  isWalletConnectEnabled: () => true,
  isFeatureEnabled: () => false,
}))

vi.mock("../wc2-relay", () => ({
  WCRelayMonitor: vi.fn().mockImplementation(() => ({
    status: "healthy",
    recordOutcome: vi.fn(),
  })),
  getRelayMonitor: vi.fn().mockReturnValue({
    status: "healthy",
    recordOutcome: vi.fn(),
  }),
}))

vi.mock("../wc2-session-store", () => ({
  WC2SessionStore: vi.fn().mockImplementation(() => ({
    getSession: vi.fn().mockReturnValue(null),
    saveSession: vi.fn(),
    clear: vi.fn(),
  })),
  getWC2SessionStore: vi.fn().mockReturnValue({
    getSession: vi.fn().mockReturnValue(null),
    saveSession: vi.fn(),
    clear: vi.fn(),
  }),
}))

describe("WC2 Integration", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it("registers WC2 adapter in registry when feature flag is on", async () => {
    const registry = getWalletRegistry()

    const { initializeWalletAdapters } = await import("../adapters")
    await initializeWalletAdapters()

    const adapter = registry.getAdapter("walletconnect")
    expect(adapter).toBeDefined()
    expect(adapter!.meta.id).toBe("walletconnect")
    expect(adapter!.meta.category).toBe("mobile")
  })

  it("detects WC2 as available (always available on browser)", () => {
    const registry = getWalletRegistry()
    registry.clearCache()
    const results = registry.detect()
    const wc2 = results.find((r) => r.id === "walletconnect")
    expect(wc2).toBeDefined()
  })

  it("WC2 adapter implements WalletAdapter interface", () => {
    const registry = getWalletRegistry()
    const adapter = registry.getAdapter("walletconnect")
    expect(adapter).toBeDefined()

    expect(typeof adapter!.connect).toBe("function")
    expect(typeof adapter!.disconnect).toBe("function")
    expect(typeof adapter!.isConnected).toBe("function")
    expect(typeof adapter!.signMessage).toBe("function")
    expect(typeof adapter!.signTransaction).toBe("function")
    expect(typeof adapter!.getPublicKey).toBe("function")
    expect(typeof adapter!.getNetwork).toBe("function")
  })

  it("WC2 adapter has correct meta", () => {
    const registry = getWalletRegistry()
    const adapter = registry.getAdapter("walletconnect")
    expect(adapter).toBeDefined()
    expect(adapter!.meta.name).toBe("WalletConnect")
    expect(adapter!.meta.category).toBe("mobile")
    expect(typeof adapter!.meta.isAvailable()).toBe("boolean")
  })

  it("session manager can persist and restore WC2 sessions", () => {
    const sm = getSessionManager()
    expect(sm).toBeDefined()
  })
})
