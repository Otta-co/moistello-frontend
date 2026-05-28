import { describe, it, expect } from "vitest"
import {
  deriveStellarKeypair,
  publicKeyToStellarAddress,
  hexEncode,
  normalizeEmail,
  secureZeroMemory,
} from "@/lib/crypto/key-derivation"

describe("Key Derivation — PBKDF2 → Ed25519", () => {
  it("produces deterministic output for same inputs", async () => {
    const email = "test@moistello.io"
    const credentialId = "abc123def456ghi789"
    const pepper = "deadbeefdeadbeefdeadbeefdeadbeef"

    const r1 = await deriveStellarKeypair(credentialId, email, pepper)
    const r2 = await deriveStellarKeypair(credentialId, email, pepper)
    const r3 = await deriveStellarKeypair(credentialId, email, pepper)

    expect(hexEncode(r1.publicKey)).toBe(hexEncode(r2.publicKey))
    expect(hexEncode(r2.publicKey)).toBe(hexEncode(r3.publicKey))
    expect(hexEncode(r1.secretKey)).toBe(hexEncode(r2.secretKey))
    expect(hexEncode(r2.secretKey)).toBe(hexEncode(r3.secretKey))
  })

  it("produces different keypair for different email", async () => {
    const credentialId = "abc123def456ghi789"
    const pepper = "deadbeefdeadbeefdeadbeefdeadbeef"

    const r1 = await deriveStellarKeypair(credentialId, "alice@test.com", pepper)
    const r2 = await deriveStellarKeypair(credentialId, "bob@test.com", pepper)

    expect(hexEncode(r1.publicKey)).not.toBe(hexEncode(r2.publicKey))
    expect(hexEncode(r1.secretKey)).not.toBe(hexEncode(r2.secretKey))
  })

  it("produces different keypair for different pepper", async () => {
    const credentialId = "abc123def456ghi789"
    const email = "test@moistello.io"

    const r1 = await deriveStellarKeypair(credentialId, email, "pepper1")
    const r2 = await deriveStellarKeypair(credentialId, email, "pepper2")

    expect(hexEncode(r1.publicKey)).not.toBe(hexEncode(r2.publicKey))
  })

  it("derives valid Ed25519 keypair and encodes to Stellar G address", async () => {
    const email = "test@moistello.io"
    const credentialId = "abc123def456ghi789"
    const pepper = "deadbeefdeadbeefdeadbeefdeadbeef"

    const keypair = await deriveStellarKeypair(credentialId, email, pepper)
    const address = publicKeyToStellarAddress(keypair.publicKey)

    expect(address).toMatch(/^G[A-Z0-9]{55}$/)
    expect(address.length).toBe(56)
  })
})

describe("Public Key → Stellar Address", () => {
  it("encodes a known public key to G address", async () => {
    const ed = await import("@noble/ed25519") as unknown as { etc: { sha512Sync?: (...msgs: Uint8Array[]) => Uint8Array; concatBytes: (...arrs: Uint8Array[]) => Uint8Array }; getPublicKey: (seed: Uint8Array) => Uint8Array }
    if (!ed.etc.sha512Sync) {
      const { sha512: sha512Hash } = await import("@noble/hashes/sha2.js") as unknown as { sha512: (...msgs: Uint8Array[]) => Uint8Array }
      ed.etc.sha512Sync = (...msgs: Uint8Array[]) => sha512Hash(ed.etc.concatBytes(...msgs))
    }
    const seed = new Uint8Array(32).fill(42)
    const pubKey = ed.getPublicKey(seed)
    const address = publicKeyToStellarAddress(pubKey)
    expect(address).toMatch(/^G[A-Z0-9]{55}$/)
    expect(address.length).toBe(56)
  })

  it("is deterministic for same public key", () => {
    const pubKey = new Uint8Array(32).fill(42)
    const a1 = publicKeyToStellarAddress(pubKey)
    const a2 = publicKeyToStellarAddress(pubKey)
    expect(a1).toBe(a2)
  })
})

describe("normalizeEmail", () => {
  it("lowercases email", () => {
    expect(normalizeEmail("Alice@Example.COM")).toBe("alice@example.com")
  })

  it("trims whitespace", () => {
    expect(normalizeEmail("  user@test.com  ")).toBe("user@test.com")
  })
})

describe("secureZeroMemory", () => {
  it("fills buffer with zeros", () => {
    const buf = new Uint8Array([1, 2, 3, 4, 5])
    secureZeroMemory(buf)
    for (const byte of buf) {
      expect(byte).toBe(0)
    }
  })
})
