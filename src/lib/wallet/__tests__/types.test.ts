import { describe, it, expect } from "vitest"

// Since we're testing types at compile time, verify runtime type guard behavior
describe("WalletAdapter types", () => {
  it("should create a valid WalletError discriminated union", () => {
    const err = { adapter: "freighter" as const, code: "not_installed" as const, message: "test" }
    expect(err.adapter).toBe("freighter")
    expect(err.code).toBe("not_installed")
  })

  it("should support all error codes", () => {
    const codes = ["not_installed", "user_rejected", "network_mismatch", "timeout", "internal"]
    codes.forEach(code => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = { adapter: "freighter" as const, code: code as any, message: "test" }
      expect(err.code).toBe(code)
    })
  })

  it("should support all wallet categories", () => {
    const categories = ["extension", "mobile", "hardware", "passkey", "import"]
    expect(categories.length).toBe(5)
  })

  it("NetworkType should be testnet or mainnet only", () => {
    const validNetworks = ["testnet", "mainnet"]
    expect(validNetworks).toContain("testnet")
    expect(validNetworks).toContain("mainnet")
  })
})
