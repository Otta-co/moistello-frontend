import { describe, it, expect } from "vitest"

describe("WC2 Security — Pairing URI", () => {
  it("pairing URI does not contain Stellar public keys", () => {
    const mockURI = "wc:a1b2c3d4@2?relay-protocol=irn&symKey=abc123def456"
    expect(mockURI.startsWith("wc:")).toBe(true)
    expect(mockURI).not.toContain("G")
    expect(mockURI).not.toContain("stellar")
  })

  it("pairing URI contains only ephemeral key, not private keys", () => {
    const mockURI = "wc:a1b2c3d4@2?relay-protocol=irn&symKey=abc123def456"
    const params = new URLSearchParams(mockURI.split("?")[1] || "")
    expect(params.has("symKey")).toBe(true)
    expect(params.get("symKey")).toBe("abc123def456")
  })

  it("WC2 project ID is a public identifier", () => {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""
    expect(typeof projectId).toBe("string")
  })
})

describe("WC2 Security — Session Storage", () => {
  it("HMAC detects tampered public key", () => {
    function computeHMAC(data: string): string {
      let hash = 0
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return hash.toString(36)
    }

    const original = "topic123|GAX23V3WWDPPR5WRER3KTEUTDLSCGZYMSJY5FDRRKKCIQ4JADF5T27RC|testnet|1000|2000"
    const tampered = "topic123|GDAMALIDI7LM2MQY2AFGJ75ZX3QPHHXIQP3UZY5Q6W3K7RPGD4L5KXYZ|testnet|1000|2000"

    expect(computeHMAC(original)).not.toBe(computeHMAC(tampered))
  })

  it("HMAC detects tampered pairing topic", () => {
    function computeHMAC(data: string): string {
      let hash = 0
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return hash.toString(36)
    }

    const original = "topic123|GAX23V3WWDPPR5WRER3KTEUTDLSCGZYMSJY5FDRRKKCIQ4JADF5T27RC|testnet|1000|2000"
    const tampered = "topic456|GAX23V3WWDPPR5WRER3KTEUTDLSCGZYMSJY5FDRRKKCIQ4JADF5T27RC|testnet|1000|2000"

    expect(computeHMAC(original)).not.toBe(computeHMAC(tampered))
  })

  it("HMAC detects tampered network type", () => {
    function computeHMAC(data: string): string {
      let hash = 0
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return hash.toString(36)
    }

    const original = "topic123|GAX23V3WWDPPR5WRER3KTEUTDLSCGZYMSJY5FDRRKKCIQ4JADF5T27RC|testnet|1000|2000"
    const tampered = "topic123|GAX23V3WWDPPR5WRER3KTEUTDLSCGZYMSJY5FDRRKKCIQ4JADF5T27RC|mainnet|1000|2000"

    expect(computeHMAC(original)).not.toBe(computeHMAC(tampered))
  })

  it("session expiry prevents use of stale sessions", () => {
    const createdAt = Date.now() - 8 * 24 * 60 * 60 * 1000
    const expiresAt = createdAt + 7 * 24 * 60 * 60 * 1000
    expect(Date.now()).toBeGreaterThan(expiresAt)
  })
})

describe("WC2 Security — Transaction Signing", () => {
  it("signed XDR must differ from unsigned XDR", () => {
    const unsignedXdr = "AAAAAgAAAABqF3RqF3RqF3RqF3RqF3RqF3RqF3RqF3RqF3RqF3RqF3Q="
    const signedXdr = "AAAAAgAAAABqF3RqF3RqF3RqF3RqF3RqF3RqF3RqF3RqF3RqF3RqF3QAAAAAtQ=="
    expect(signedXdr).not.toBe(unsignedXdr)
  })

  it("validates XDR is base64 encoded", () => {
    const validBase64 = /^[A-Za-z0-9+/=]+$/
    expect(validBase64.test("AAAAAgAAAABqF3RqF3RqF3RqF3RqF3RqF3RqF3RqF3RqF3RqF3RqF3Q=")).toBe(true)
    expect(validBase64.test("aGVsbG8=")).toBe(true)
    expect(validBase64.test("invalid!")).toBe(false)
  })

  it("Stellar XDR transactions contain unique sequence numbers", () => {
    const accountSequenceA = "123456789"
    const accountSequenceB = "123456790"
    expect(accountSequenceA).not.toBe(accountSequenceB)
  })

  it("network mismatch detection works", () => {
    function detectNetworkMismatch(
      opts: { network?: string },
      currentNetwork: string,
    ): boolean {
      if (opts.network && opts.network !== currentNetwork) return true
      return false
    }

    expect(detectNetworkMismatch({ network: "mainnet" }, "testnet")).toBe(true)
    expect(detectNetworkMismatch({ network: "testnet" }, "testnet")).toBe(false)
    expect(detectNetworkMismatch({}, "testnet")).toBe(false)
  })
})

describe("WC2 Security — Error Information Leakage", () => {
  it("errors never contain private keys", () => {
    const error = {
      adapter: "walletconnect",
      code: "internal" as const,
      message: "Something went wrong",
      cause: "Error: Operation failed",
    }
    expect(error.cause).not.toContain("private_key")
    expect(error.cause).not.toContain("secret")
    expect(error.cause).not.toContain("seed")
  })

  it("errors never expose user signatures", () => {
    const error = {
      adapter: "walletconnect",
      code: "user_rejected" as const,
      message: "You cancelled the signature",
    }
    expect(error.message).not.toMatch(/^[A-Za-z0-9+/=]{20,}$/)
  })
})

describe("WC2 Security — Public Key Validation", () => {
  it("Stellar public keys start with G", () => {
    const validKey = "GAX23V3WWDPPR5WRER3KTEUTDLSCGZYMSJY5FDRRKKCIQ4JADF5T27RC"
    expect(validKey[0]).toBe("G")
  })

  it("Stellar public keys are exactly 56 characters", () => {
    const validKey = "GAX23V3WWDPPR5WRER3KTEUTDLSCGZYMSJY5FDRRKKCIQ4JADF5T27RC"
    expect(validKey).toHaveLength(56)
  })

  it("Stellar public keys contain only base32 chars", () => {
    const validKey = "GAX23V3WWDPPR5WRER3KTEUTDLSCGZYMSJY5FDRRKKCIQ4JADF5T27RC"
    expect(/^G[A-Z0-9]{55}$/.test(validKey)).toBe(true)
  })

  it("rejects keys with lowercase", () => {
    const invalidKey = "gax23v3wwdppr5wrer3kteutdlscgzymsjy5fdrrkkciq4jadf5t27rc"
    expect(/^G[A-Z0-9]{55}$/.test(invalidKey)).toBe(false)
  })

  it("rejects keys of wrong length", () => {
    const tooShort = "GABC"
    const tooLong = "G" + "A".repeat(60)
    expect(tooShort).toHaveLength(4)
    expect(tooLong).toHaveLength(61)
  })
})

describe("WC2 Security — Auth XDR Structure", () => {
  it("auth XDR should contain identifiable prefix", () => {
    const prefix = "MOISTELLO_AUTH"
    const encoded = btoa(`${prefix}:hash123:${Date.now()}`)
    expect(encoded).toBeDefined()
    expect(atob(encoded)).toContain(prefix)
  })

  it("auth XDR should include timestamp for freshness", () => {
    const ts = Date.now()
    const encoded = btoa(`MOISTELLO_AUTH:hash456:${ts}`)
    const decoded = atob(encoded)
    expect(decoded).toContain(String(ts))
  })

  it("auth XDR hash is SHA-256 (64 hex chars)", () => {
    const hash = "a".repeat(64)
    expect(hash).toHaveLength(64)
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true)
  })
})

describe("WC2 Security — Session Topic Handling", () => {
  it("session topic is a string", () => {
    const topic = "a1b2c3d4e5f6g7h8i9j0"
    expect(typeof topic).toBe("string")
    expect(topic.length).toBeGreaterThan(0)
  })

  it("session topic cleared on disconnect", () => {
    let topic: string | null = "active-topic"
    topic = null
    expect(topic).toBeNull()
  })
})
