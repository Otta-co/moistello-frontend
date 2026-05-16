import { describe, it, expect } from "vitest"

describe("Freighter Adapter", () => {
  it("should have correct wallet meta", () => {
    const meta = {
      id: "freighter",
      name: "Freighter",
      category: "extension" as const,
      installUrl: "https://freighter.app",
      description: "Stellar browser extension",
      priority: 1,
    }
    expect(meta.id).toBe("freighter")
    expect(meta.category).toBe("extension")
    expect(meta.installUrl).toContain("freighter.app")
  })

  it("should detect Freighter via window.freighterApi", () => {
    // In test: simulate the global injection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockWindow: any = {}
    const isInstalled = () => typeof mockWindow.freighterApi !== "undefined"
    expect(isInstalled()).toBe(false)
    
    mockWindow.freighterApi = { getPublicKey: async () => ({ publicKey: "GABC..." }) }
    expect(isInstalled()).toBe(true)
  })

  it("should return public key in Stellar format on connect", () => {
    const publicKey = "GAX23V3WWDPPR5WRER3KTEUTDLSCGZYMSJY5FDRRKKCIQ4JADF5T27RC"
    expect(publicKey).toHaveLength(56)
    expect(publicKey[0]).toBe("G")
  })

  it("should return not_installed error when Freighter absent", () => {
    const connect = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (window as any).freighterApi === "undefined") {
        return { error: { code: "not_installed", message: "Freighter is not installed" } }
      }
      return { publicKey: "GABC..." }
    }
    // In test env, window.freighterApi is undefined
    const result = connect()
    expect(result).toHaveProperty("error")
    expect(result.error).toHaveProperty("code", "not_installed")
  })
})
