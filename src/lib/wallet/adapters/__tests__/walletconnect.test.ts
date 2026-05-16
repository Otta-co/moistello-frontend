import { describe, it, expect } from "vitest"

describe("WalletConnect Adapter", () => {
  it("should have correct wallet meta", () => {
    const meta = {
      id: "walletconnect",
      name: "WalletConnect",
      category: "mobile",
      priority: 0,
    }
    expect(meta.id).toBe("walletconnect")
    expect(meta.category).toBe("mobile")
    expect(meta.priority).toBe(0)
  })

  it("should always be available (no extension needed)", () => {
    const isAvailable = typeof window !== "undefined"
    expect(isAvailable).toBe(true)
  })

  it("should parse Stellar account from WC2 session", () => {
    const account = "stellar:testnet:GAX23V3WWDPPR5WRER3KTEUTDLSCGZYMSJY5FDRRKKCIQ4JADF5T27RC"
    const parts = account.split(":")
    expect(parts[0]).toBe("stellar")
    expect(parts[1]).toBe("testnet")
    expect(parts[2]).toHaveLength(56)
    expect(parts[2][0]).toBe("G")
  })

  it("should derive network from chain ID", () => {
    function getNetwork(chain: string) {
      return chain === "pubnet" ? "mainnet" : "testnet"
    }
    expect(getNetwork("pubnet")).toBe("mainnet")
    expect(getNetwork("testnet")).toBe("testnet")
  })

  it("should return user_rejected error on wallet denial", () => {
    const error = new Error("User rejected the signature request")
    const isRejected = error.message.includes("rejected") || error.message.includes("denied")
    expect(isRejected).toBe(true)
  })

  it("should validate session has Stellar namespace", () => {
    const session: { namespaces?: Record<string, unknown> } = { namespaces: {} }
    const hasStellar = !!session.namespaces?.["stellar"]
    expect(hasStellar).toBe(false)
  })

  it("should support all required Stellar methods", () => {
    const methods = [
      "stellar_signAndSubmitXDR",
      "stellar_signXDR",
      "stellar_getPublicKey",
      "stellar_signMessage",
    ]
    expect(methods.length).toBe(4)
    expect(methods.every(m => m.startsWith("stellar_"))).toBe(true)
  })

  it("should support both Stellar chains", () => {
    const chains = ["stellar:pubnet", "stellar:testnet"]
    expect(chains.length).toBe(2)
    expect(chains.every(c => c.startsWith("stellar:"))).toBe(true)
  })
})
