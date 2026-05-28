import { describe, it, expect, vi, beforeEach } from "vitest"

const MOCK_PUBKEY = "GAQVF6GRTN4R2JCFGJBOCXZOVNWLPT72PNVF5UYAS6LA4BUYQHNRET46"
const VALID_XDR = "AAAAAgAAAAAhUvjRm3kdJEUyQuFfLqtst8/6e2pe0wCXlg4GmIHbEgAAAGQAAAAAAAAAAgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAQAAAABNHcUoim9lDPlSmBllMAePWBVx4+hw8tGm72U531b3PAAAAAAAAAAABfXhAAAAAAAAAAAA"
const WRONG_XDR = "AAAAAgAAAAAzLr6NJ8tzI7OkAcHBO13WS8zA4Q7NocK10RoDd5qF5QAAAGQAAAAAAAAAAgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAQAAAABNHcUoim9lDPlSmBllMAePWBVx4+hw8tGm72U531b3PAAAAAAAAAAABfXhAAAAAAAAAAAA"
const VALID_SIG_HEX = "41c96a6c077bdc2b9d1825ce2ca9f0f9cd316f9154bfee157a360cac3cd766e006e7761a933ac32de98b44036bbff9a181f95583026c63a3c272280c5533d50a"

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
    constructor(xdr: string, ...rest: unknown[]) {
      void rest
      this.source = xdr === WRONG_XDR ? "GCY4ABNCF34LRGMQ2BCSYWOCKXBQFMAAKTSCO3RL5STOG2XBGOEOWMZ4" : MOCK_PUBKEY
    }
    hash() {
      return Buffer.from("e3eb688efeb124cfd3b1511f3dd52d5ee101908e1ded43570ec7e00413b8aa9e", "hex")
    }
    addSignature(...rest: unknown[]) {
      void rest
    }
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
    Keypair: {
      fromPublicKey: () => ({
        signatureHint: () => Buffer.from([0x98, 0x81, 0xdb, 0x12]),
      }),
    },
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

describe("LedgerAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    MockStellarApp.prototype.getPublicKey.mockResolvedValue({ publicKey: MOCK_PUBKEY })
    MockStellarApp.prototype.signTransaction.mockResolvedValue({ signature: VALID_SIG_HEX })
    MockStellarApp.prototype.getAppConfiguration.mockResolvedValue({ version: "2.2.0", flag: "3.3.0" })
    setupNavigator()
  })

  it("ledger.connect() returns public key after device confirmation", async () => {
    const { createLedgerAdapter } = await import("../adapters/ledger")
    const adapter = createLedgerAdapter()
    const result = await adapter.connect()
    expect(result.publicKey).toBe(MOCK_PUBKEY)
  })

  it("ledger.connect() with device not found", async () => {
    MockStellarApp.prototype.getPublicKey.mockRejectedValue(new Error("No device found"))
    const { createLedgerAdapter } = await import("../adapters/ledger")
    const adapter = createLedgerAdapter()
    await expect(adapter.connect()).rejects.toMatchObject({
      adapter: "ledger",
      code: "ledger_sign_failed",
    })
  })

  it("ledger.connect() with Stellar app not open", async () => {
    MockStellarApp.prototype.getPublicKey.mockRejectedValue(new Error("Stellar app not running"))
    const { createLedgerAdapter } = await import("../adapters/ledger")
    const adapter = createLedgerAdapter()
    await expect(adapter.connect()).rejects.toMatchObject({
      adapter: "ledger",
      code: "ledger_stellar_app_not_open",
    })
  })

  it("ledger.connect() with user rejection on device", async () => {
    MockStellarApp.prototype.getPublicKey.mockRejectedValue(new Error("User denied"))
    const { createLedgerAdapter } = await import("../adapters/ledger")
    const adapter = createLedgerAdapter()
    await expect(adapter.connect()).rejects.toMatchObject({
      adapter: "ledger",
      code: "user_rejected",
    })
  })

  it("ledger.signTransaction() returns signed XDR", async () => {
    const { createLedgerAdapter } = await import("../adapters/ledger")
    const adapter = createLedgerAdapter()
    await adapter.connect()
    const result = await adapter.signTransaction(VALID_XDR)
    expect(result.signedXdr).toBeTruthy()
  })

  it("ledger.signTransaction() with wrong source account", async () => {
    const { createLedgerAdapter } = await import("../adapters/ledger")
    const adapter = createLedgerAdapter()
    await adapter.connect()
    await expect(
      adapter.signTransaction(WRONG_XDR),
    ).rejects.toMatchObject({
      adapter: "ledger",
      code: "ledger_wrong_account",
    })
  })

  it("ledger.signTransaction() with device disconnect mid-sign", async () => {
    MockStellarApp.prototype.signTransaction.mockRejectedValue(new Error("Device disconnected"))
    const { createLedgerAdapter } = await import("../adapters/ledger")
    const adapter = createLedgerAdapter()
    await adapter.connect()
    await expect(
      adapter.signTransaction(VALID_XDR),
    ).rejects.toMatchObject({
      adapter: "ledger",
      code: "ledger_sign_failed",
    })
  })

  it("ledger.disconnect() clears all state", async () => {
    const { createLedgerAdapter } = await import("../adapters/ledger")
    const adapter = createLedgerAdapter()
    await adapter.connect()
    expect(await adapter.isConnected()).toBe(true)
    await adapter.disconnect()
    expect(await adapter.isConnected()).toBe(false)
  })
})
