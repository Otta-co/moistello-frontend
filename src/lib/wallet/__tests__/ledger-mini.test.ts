import { describe, it, expect, vi, beforeEach } from "vitest"

const mockGetPublicKey = vi.fn()
const mockGetAppConfiguration = vi.fn()
const mockSignTransaction = vi.fn()
const mockTransportCreate = vi.fn()

vi.mock("@ledgerhq/hw-app-str", () => ({
  default: class MockStellarApp {
    constructor() {}
    getPublicKey = mockGetPublicKey
    signTransaction = mockSignTransaction
    getAppConfiguration = mockGetAppConfiguration
  },
}))

vi.mock("@ledgerhq/hw-transport-webusb", () => ({
  default: { create: mockTransportCreate },
}))

function setup() {
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

describe("Mini", () => {
  beforeEach(setup)

  it("connect works", async () => {
    const { createLedgerAdapter } = await import("../adapters/ledger")
    const adapter = createLedgerAdapter()
    const r = await adapter.connect()
    expect(r.publicKey).toBeTruthy()
  })
})
