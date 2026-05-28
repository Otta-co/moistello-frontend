import { describe, it, expect, vi, beforeEach } from "vitest"

const MOCK_PUBKEY = "GAQVF6GRTN4R2JCFGJBOCXZOVNWLPT72PNVF5UYAS6LA4BUYQHNRET46"
const VALID_SIG_HEX = "41c96a6c077bdc2b9d1825ce2ca9f0f9cd316f9154bfee157a360cac3cd766e006e7761a933ac32de98b44036bbff9a181f95583026c63a3c272280c5533d50a"
const VALID_XDR = "AAAAAgAAAAAhUvjRm3kdJEUyQuFfLqtst8/6e2pe0wCXlg4GmIHbEgAAAGQAAAAAAAAAAgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAQAAAABNHcUoim9lDPlSmBllMAePWBVx4+hw8tGm72U531b3PAAAAAAAAAAABfXhAAAAAAAAAAAA"

const { MockStellarApp } = vi.hoisted(() => {
  class M {
    getPublicKey!: ReturnType<typeof vi.fn>
    signTransaction!: ReturnType<typeof vi.fn>
    getAppConfiguration!: ReturnType<typeof vi.fn>
  }
  M.prototype.getPublicKey = vi.fn()
  M.prototype.signTransaction = vi.fn()
  M.prototype.getAppConfiguration = vi.fn()
  return { MockStellarApp: M }
})

vi.mock("@ledgerhq/hw-app-str", () => ({
  default: MockStellarApp,
}))

vi.mock("@ledgerhq/hw-transport-webusb", () => ({
  default: { create: vi.fn().mockResolvedValue({ on: vi.fn(), close: vi.fn(), sendCustom: vi.fn() }) },
}))

vi.mock("@stellar/stellar-base", () => {
  class MockTx {
    source: string
    constructor(...rest: unknown[]) {
      void rest
      this.source = MOCK_PUBKEY
    }
    addSignature() {}
    toEnvelope() {
      return { toXDR: () => "AAAAASignedXDRBase64" }
    }
  }
  return {
    Transaction: MockTx,
    TransactionBuilder: class {
      addOperation() { return this }
      build() { return { toEnvelope: () => ({ toXDR: () => "AAAAATestXDRBase64" }) } }
    },
    Keypair: { fromPublicKey: () => ({ signatureHint: () => Buffer.from([0x98, 0x81, 0xdb, 0x12]) }) },
    Networks: { TESTNET: "Test SDF Network ; September 2015" },
    Operation: { manageData: () => ({}) },
    BASE_FEE: "100",
    Memo: { none: () => null },
  }
})

function setupNavigator() {
  Object.defineProperty(window, "navigator", {
    value: {
      usb: { getDevices: vi.fn().mockResolvedValue([]), addEventListener: vi.fn(), requestDevice: vi.fn() },
      bluetooth: { requestDevice: vi.fn() },
    },
    writable: true,
    configurable: true,
  })
}

describe("Ledger Security Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    MockStellarApp.prototype.getPublicKey.mockResolvedValue({ publicKey: MOCK_PUBKEY })
    MockStellarApp.prototype.signTransaction.mockResolvedValue({ signature: VALID_SIG_HEX })
    MockStellarApp.prototype.getAppConfiguration.mockResolvedValue({ version: "2.2.0", flag: "3.3.0" })
    setupNavigator()
  })

  it("fake device rejection — adapter rejects devices that don't respond to APDU commands", async () => {
    MockStellarApp.prototype.getPublicKey.mockRejectedValue(new Error("Device not responding"))
    const { createLedgerAdapter } = await import("../adapters/ledger")
    const adapter = createLedgerAdapter()
    await expect(adapter.connect()).rejects.toMatchObject({
      adapter: "ledger",
    })
    expect(MockStellarApp.prototype.getPublicKey).toHaveBeenCalled()
    expect(await adapter.isConnected()).toBe(false)
  })

  it("unsigned transaction bypass attempt — adapter requires real device signing", async () => {
    const { createLedgerAdapter } = await import("../adapters/ledger")
    const adapter = createLedgerAdapter()
    await adapter.connect()
    MockStellarApp.prototype.signTransaction.mockRejectedValueOnce(new Error("User denied"))
    await expect(
      adapter.signTransaction(VALID_XDR),
    ).rejects.toMatchObject({
      code: "user_rejected",
    })
    expect(MockStellarApp.prototype.signTransaction).toHaveBeenCalled()
  })
})
