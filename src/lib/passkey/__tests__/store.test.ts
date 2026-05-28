import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock process.env before importing store
vi.stubEnv("PASSKEY_SERVER_PEPPER", "test-server-pepper")
vi.stubEnv("NEXT_PUBLIC_PASSKEY_RP_ID", "test-rp-id")
vi.stubEnv("PASSKEY_EXPECTED_ORIGIN", "https://test.origin")

import {
  setChallenge,
  getAndVerifyChallenge,
  storeCredential,
  getCredential,
  getPepper,
  getRpId,
  getExpectedOrigin,
} from "../store"

describe("Passkey server store", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe("challenge store", () => {
    it("stores and verifies a challenge", () => {
      setChallenge("user@test.com", "challenge-abc", "user@test.com")
      expect(getAndVerifyChallenge("user@test.com", "challenge-abc", "user@test.com")).toBe(true)
    })

    it("deletes challenge after single use (replay protection)", () => {
      setChallenge("user@test.com", "challenge-abc", "user@test.com")
      getAndVerifyChallenge("user@test.com", "challenge-abc", "user@test.com")
      expect(getAndVerifyChallenge("user@test.com", "challenge-abc", "user@test.com")).toBe(false)
    })

    it("returns false for unknown key", () => {
      expect(getAndVerifyChallenge("unknown", "challenge-abc", "a@b.com")).toBe(false)
    })

    it("returns false for wrong challenge", () => {
      setChallenge("user@test.com", "challenge-abc", "user@test.com")
      expect(getAndVerifyChallenge("user@test.com", "wrong-challenge", "user@test.com")).toBe(false)
    })

    it("returns false for wrong email", () => {
      setChallenge("user@test.com", "challenge-abc", "user@test.com")
      expect(getAndVerifyChallenge("user@test.com", "challenge-abc", "wrong@email.com")).toBe(false)
    })

    it("returns false for expired challenge", () => {
      vi.useFakeTimers()
      setChallenge("user@test.com", "challenge-abc", "user@test.com")
      vi.advanceTimersByTime(5 * 60 * 1000 + 1)
      expect(getAndVerifyChallenge("user@test.com", "challenge-abc", "user@test.com")).toBe(false)
      vi.useRealTimers()
    })

    it("stores challenges with credentialId key for auth mode", () => {
      setChallenge("cred-id-123", "challenge-auth", "")
      expect(getAndVerifyChallenge("cred-id-123", "challenge-auth", "")).toBe(true)
    })
  })

  describe("credential store", () => {
    it("stores and retrieves a credential", () => {
      const pubKey = new Uint8Array(32).fill(1)
      storeCredential("cred-1", {
        credentialId: "cred-1",
        publicKey: pubKey,
        counter: 0,
        transports: ["internal"],
      })
      const retrieved = getCredential("cred-1")
      expect(retrieved).toBeDefined()
      expect(retrieved!.credentialId).toBe("cred-1")
      expect(retrieved!.counter).toBe(0)
      expect(retrieved!.transports).toEqual(["internal"])
    })

    it("returns undefined for unknown credential", () => {
      expect(getCredential("unknown-cred")).toBeUndefined()
    })

    it("allows updating counter after authentication", () => {
      const pubKey = new Uint8Array(32).fill(2)
      storeCredential("cred-2", {
        credentialId: "cred-2",
        publicKey: pubKey,
        counter: 5,
      })
      const cred = getCredential("cred-2")!
      cred.counter = 6
      expect(getCredential("cred-2")!.counter).toBe(6)
    })
  })

  describe("configuration", () => {
    it("getPepper returns env value", () => {
      expect(getPepper()).toBe("test-server-pepper")
    })

    it("getRpId returns env value", () => {
      expect(getRpId()).toBe("test-rp-id")
    })

    it("getExpectedOrigin returns env value", () => {
      expect(getExpectedOrigin()).toBe("https://test.origin")
    })

    it("getPepper falls back to default when env not set", async () => {
      vi.stubEnv("PASSKEY_SERVER_PEPPER", "")
      const { getPepper: getPepperDefault } = await import("../store")
      expect(getPepperDefault()).toBe("moistello-passkey-pepper-v1")
    })

    it("getRpId falls back to localhost", async () => {
      vi.stubEnv("NEXT_PUBLIC_PASSKEY_RP_ID", "")
      const { getRpId: getRpIdDefault } = await import("../store")
      expect(getRpIdDefault()).toBe("localhost")
    })

    it("getExpectedOrigin falls back to localhost:1110", async () => {
      vi.stubEnv("PASSKEY_EXPECTED_ORIGIN", "")
      const { getExpectedOrigin: getOriginDefault } = await import("../store")
      expect(getOriginDefault()).toBe("http://localhost:1110")
    })
  })
})
