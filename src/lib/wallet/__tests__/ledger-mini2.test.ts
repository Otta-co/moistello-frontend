import { describe, it, expect, vi, beforeEach } from "vitest"

const mockGetPublicKey = vi.fn()
const mockGetAppConfiguration = vi.fn()
const mockSignTransaction = vi.fn()
const mockTransportCreate = vi.fn()

vi.mock("@ledgerhq/hw-app-str", () => ({
  default: class MockStellarApp2 {
    constructor() {}
    getPublicKey = mockGetPublicKey
    signTransaction = mockSignTransaction
    getAppConfiguration = mockGetAppConfiguration
  },
}))

vi.mock("@ledgerhq/hw-transport-webusb", () => ({
  default: { create: mockTransportCreate },
}))

// This is the stellar-base mock from the main test
vi.mock("@stellar/stellar-base", () => {
  class MockTransaction {
    source: string
    constructor(xdr: string) {
      this.source = typeof xdr === "string" && xdr.includes("wrong") ? "GWRONGACCOUNT" : "GCORRECTACCOUNTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    }
    addSignature() {}
    toEnvelope() { return { toXDR: () => "AAAAASignedXDRBase64" } }
  }
  return {
    Transaction: MockTransaction,
    TransactionBuilder: class {
      operations: unknown[] = []
      addOperation(op: unknown) { this.operations.push(op); return this }
      build() { return { toEnvelope: () => ({ toXDR: () => "AAAAATestXDRBase64" }) } }
    },
    Keypair: { fromPublicKey: () => ({ signatureHint: () => Buffer.from([0, 0, 0, 0]) }) },
    Networks: { TESTNET: "Test SDF Network ; September 2015" },
    Operation: { manageData: () => ({}) },
    BASE_FEE: "100",
    Memo: { none: () => null },
  }
})

function setup() {
  vi.clearAllMocks()
  mockGetPublicKey.mockResolvedValue({ publicKey: "GCORRECTACCOUNTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" })
  mockGetAppConfiguration.mockResolvedValue({ version: "2.2.0", flag: "3.3.0" })
  mockTransportCreate.mockResolvedValue({ on: vi.fn(), close: vi.fn(), sendCustom: vi.fn() })
  Object.defineProperty(window, "navigator", {
    value: {
      usb: { getDevices: vi.fn().mockResolvedValue([]), addEventListener: vi.fn(), requestDevice: vi.fn() },
      bluetooth: { requestDevice: vi.fn() },
    },
    writable: true, configurable: true,
  })
}

describe("Mini2", () => {
  beforeEach(setup)

  it("connect works", async () => {
    const { createLedgerAdapter } = await import("../adapters/ledger")
    const adapter = createLedgerAdapter()
    const r = await adapter.connect()
    expect(r.publicKey).toBeTruthy()
  })
})
