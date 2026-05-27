import { describe, it, expect, beforeEach, vi } from "vitest"
import { WC2SessionStore } from "../wc2-session-store"

function mockLocalStorage() {
  const store: Record<string, string> = {}
  vi.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) => store[key] ?? null)
  vi.spyOn(Storage.prototype, "setItem").mockImplementation((key: string, value: string) => {
    store[key] = value
  })
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key: string) => {
    delete store[key]
  })
}

describe("WC2SessionStore", () => {
  let store: WC2SessionStore

  beforeEach(() => {
    vi.restoreAllMocks()
    mockLocalStorage()
    store = new WC2SessionStore()
  })

  it("returns null when no session stored", () => {
    expect(store.getSession()).toBeNull()
  })

  it("persists and retrieves a session", () => {
    const data = {
      pairingTopic: "topic123",
      publicKey: "GAX23V3WWDPPR5WRER3KTEUTDLSCGZYMSJY5FDRRKKCIQ4JADF5T27RC",
      network: "testnet" as const,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }
    store.saveSession(data)

    const retrieved = store.getSession()
    expect(retrieved).not.toBeNull()
    expect(retrieved!.pairingTopic).toBe("topic123")
    expect(retrieved!.publicKey).toBe(data.publicKey)
    expect(retrieved!.network).toBe("testnet")
  })

  it("handles corrupted data gracefully", () => {
    localStorage.setItem("moistello_wc2_session", "invalid-json")
    expect(store.getSession()).toBeNull()
  })

  it("detects tampered HMAC", () => {
    const data = {
      pairingTopic: "topic123",
      publicKey: "GAX23V3WWDPPR5WRER3KTEUTDLSCGZYMSJY5FDRRKKCIQ4JADF5T27RC",
      network: "testnet" as const,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }
    store.saveSession(data)

    const raw = localStorage.getItem("moistello_wc2_session")!
    const payload = JSON.parse(raw)
    payload.data.publicKey = "GDAMALIDI7LM2MQY2AFGJ75ZX3QPHHXIQP3UZY5Q6W3K7RPGD4L5KXYZ"
    localStorage.setItem("moistello_wc2_session", JSON.stringify(payload))

    expect(store.getSession()).toBeNull()
  })

  it("expires stale sessions", () => {
    const data = {
      pairingTopic: "topic123",
      publicKey: "GAX23V3WWDPPR5WRER3KTEUTDLSCGZYMSJY5FDRRKKCIQ4JADF5T27RC",
      network: "testnet" as const,
      createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() - 24 * 60 * 60 * 1000,
    }
    store.saveSession(data)

    expect(store.getSession()).toBeNull()
  })

  it("clears session data", () => {
    const data = {
      pairingTopic: "topic123",
      publicKey: "GAX23V3WWDPPR5WRER3KTEUTDLSCGZYMSJY5FDRRKKCIQ4JADF5T27RC",
      network: "testnet" as const,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }
    store.saveSession(data)
    store.clear()

    expect(store.getSession()).toBeNull()
  })
})
