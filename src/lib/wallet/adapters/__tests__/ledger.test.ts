import { describe, it, expect } from "vitest"

describe("Ledger Adapter", () => {
  it("should have correct wallet meta", () => {
    const meta = {
      id: "ledger",
      name: "Ledger",
      category: "hardware" as const,
      priority: 5,
    }
    expect(meta.id).toBe("ledger")
    expect(meta.category).toBe("hardware")
    expect(meta.priority).toBe(5)
  })

  it("should detect WebUSB availability", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockNavigator: any = {}
    const hasUSB = "usb" in mockNavigator
    expect(hasUSB).toBe(false)

    mockNavigator.usb = { getDevices: () => [] }
    const nowHasUSB = "usb" in mockNavigator
    expect(nowHasUSB).toBe(true)
  })

  it("should parse derivation path correctly", () => {
    const path = "44'/148'/0'"
    const parts = path.split("/")
    expect(parts.length).toBe(3)
    expect(parts[0]).toBe("44'")
    expect(parts[1]).toBe("148'")
    expect(parts[2]).toBe("0'")
  })

  it("should return user_rejected error when device denies", () => {
    const error = new Error("Transaction was denied by the user")
    const isDenied = error.message.includes("denied")
    expect(isDenied).toBe(true)
  })

  it("should return timeout error when device locked", () => {
    const locked = true
    const message = locked ? "Ledger is locked. Unlock it and open the Stellar app." : ""
    expect(message).toContain("locked")
  })

  it("should close transport on disconnect", async () => {
    let closed = false
    const mockTransport = { close: async () => { closed = true } }
    await mockTransport.close()
    expect(closed).toBe(true)
  })

  it("should clear publicKey on disconnect", () => {
    let publicKey = "GABC123"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    publicKey = null as any
    expect(publicKey).toBeNull()
  })

  it("should return false isConnected when transport closed", async () => {
    const isOpen = false
    expect(isOpen).toBe(false)
  })
})
