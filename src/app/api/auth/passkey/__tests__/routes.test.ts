import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock @simplewebauthn/server before any imports
vi.mock("@simplewebauthn/server", () => ({
  generateRegistrationOptions: vi.fn().mockResolvedValue({
    challenge: "reg-challenge-abc",
    rp: { name: "Moistello", id: "localhost" },
    user: { id: "dXNlckB0ZXN0LmNvbQ", name: "user@test.com", displayName: "user@test.com" },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
    authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "required" },
    timeout: 120000,
    attestation: "none",
  }),
  generateAuthenticationOptions: vi.fn().mockResolvedValue({
    challenge: "auth-challenge-xyz",
    rpId: "localhost",
    allowCredentials: [{ id: "cred-id-123", transports: ["internal"] }],
    userVerification: "required",
    timeout: 60000,
  }),
  verifyRegistrationResponse: vi.fn().mockResolvedValue({
    verified: true,
    registrationInfo: {
      credential: {
        id: "new-cred-id",
        publicKey: new Uint8Array(32).fill(42),
        counter: 0,
        transports: ["internal"],
      },
    },
  }),
  verifyAuthenticationResponse: vi.fn().mockResolvedValue({
    verified: true,
    authenticationInfo: {
      newCounter: 1,
      credentialId: "cred-id-123",
    },
  }),
}))

import { POST as generateOptions } from "../generate-options/route"
import { POST as register } from "../register/route"
import { POST as authVerify } from "../auth-verify/route"
import { NextRequest } from "next/server"

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:1110/api/auth/passkey/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("generate-options API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear the challenge store between tests
    // Since setChallenge is in module scope, we import it to reset
  })

  it("returns registration options for valid email", async () => {
    const res = await generateOptions(makeRequest({ email: "user@test.com", mode: "register" }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.options).toBeDefined()
    expect(data.options.challenge).toBe("reg-challenge-abc")
    expect(data.challenge).toBe("reg-challenge-abc")
  })

  it("returns 400 for invalid email in register mode", async () => {
    const res = await generateOptions(makeRequest({ email: "not-an-email", mode: "register" }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("invalid_email")
  })

  it("returns authentication options for valid credentialId", async () => {
    const res = await generateOptions(makeRequest({ credentialId: "cred-id-123", mode: "authenticate" }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.options).toBeDefined()
    expect(data.options.challenge).toBe("auth-challenge-xyz")
  })

  it("returns 400 for missing credentialId in authenticate mode", async () => {
    const res = await generateOptions(makeRequest({ mode: "authenticate" }))
    expect(res.status).toBe(400)
  })

  it("returns 400 for invalid mode", async () => {
    const res = await generateOptions(makeRequest({ mode: "unknown" }))
    expect(res.status).toBe(400)
  })

  it("stores challenge for registration", async () => {
    // First generate options — this stores the challenge
    await generateOptions(makeRequest({ email: "user@test.com", mode: "register" }))
    // Now verify that the stored challenge works with verify
    const { getAndVerifyChallenge } = await import("@/lib/passkey/store")
    expect(getAndVerifyChallenge("user@test.com", "reg-challenge-abc", "user@test.com")).toBe(true)
  })

  it("stores challenge for authentication", async () => {
    await generateOptions(makeRequest({ credentialId: "cred-id-123", mode: "authenticate" }))
    const { getAndVerifyChallenge } = await import("@/lib/passkey/store")
    expect(getAndVerifyChallenge("cred-id-123", "auth-challenge-xyz", "")).toBe(true)
  })
})

describe("register API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 for missing email", async () => {
    const res = await register(makeRequest({ attestation: { id: "test", response: { clientDataJSON: btoa(JSON.stringify({ challenge: "x" })) } } }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("invalid_email")
  })

  it("returns 400 for invalid email format", async () => {
    const res = await register(makeRequest({ email: "bad", attestation: { id: "test" } }))
    expect(res.status).toBe(400)
  })

  it("returns 400 for missing attestation", async () => {
    const res = await register(makeRequest({ email: "user@test.com" }))
    expect(res.status).toBe(400)
  })

  it("returns 400 for missing clientDataJSON", async () => {
    const res = await register(makeRequest({ email: "user@test.com", attestation: { id: "test" } }))
    expect(res.status).toBe(400)
  })

  it("returns 400 when challenge not stored (replay attack)", async () => {
    const res = await register(makeRequest({
      email: "user@test.com",
      attestation: { id: "test", rawId: "test", response: { clientDataJSON: btoa(JSON.stringify({ challenge: "never-stored" })) } },
    }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("challenge_mismatch")
  })

  it("returns verified response with pepper on success", async () => {
    // First generate options to store the challenge
    await generateOptions(makeRequest({ email: "user@test.com", mode: "register" }))

    const res = await register(makeRequest({
      email: "user@test.com",
      attestation: { id: "some-id", rawId: "some-id", response: { clientDataJSON: btoa(JSON.stringify({ challenge: "reg-challenge-abc" })) } },
    }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.verified).toBe(true)
    expect(data.email).toBe("user@test.com")
    expect(data.credentialId).toBe("new-cred-id")
    expect(data.pepper).toBeDefined()
    expect(typeof data.pepper).toBe("string")
  })

  it("stores credential after successful registration", async () => {
    await generateOptions(makeRequest({ email: "store-cred@test.com", mode: "register" }))
    await register(makeRequest({
      email: "store-cred@test.com",
      attestation: { id: "some-id", rawId: "some-id", response: { clientDataJSON: btoa(JSON.stringify({ challenge: "reg-challenge-abc" })) } },
    }))

    const { getCredential } = await import("@/lib/passkey/store")
    const cred = getCredential("new-cred-id")
    expect(cred).toBeDefined()
    expect(cred!.credentialId).toBe("new-cred-id")
    expect(cred!.counter).toBe(0)
  })
})

describe("auth-verify API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 for missing credentialId", async () => {
    const res = await authVerify(makeRequest({ email: "user@test.com", assertion: {} }))
    expect(res.status).toBe(400)
  })

  it("returns 400 for missing email", async () => {
    const res = await authVerify(makeRequest({ credentialId: "cred-id", assertion: {} }))
    expect(res.status).toBe(400)
  })

  it("returns 400 for missing assertion", async () => {
    const res = await authVerify(makeRequest({ credentialId: "cred-id", email: "user@test.com" }))
    expect(res.status).toBe(400)
  })

  it("returns 400 for unknown credential", async () => {
    const res = await authVerify(makeRequest({
      credentialId: "unknown-cred",
      email: "user@test.com",
      assertion: { response: { clientDataJSON: btoa(JSON.stringify({ challenge: "x" })) } },
    }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("credential_not_found")
  })

  it("returns 400 when challenge not stored (replay)", async () => {
    // Store credential first
    const { storeCredential } = await import("@/lib/passkey/store")
    storeCredential("cred-id-123", {
      credentialId: "cred-id-123",
      publicKey: new Uint8Array(32).fill(1),
      counter: 0,
    })

    const res = await authVerify(makeRequest({
      credentialId: "cred-id-123",
      email: "user@test.com",
      assertion: { response: { clientDataJSON: btoa(JSON.stringify({ challenge: "never-stored" })) } },
    }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("challenge_mismatch")
  })

  it("returns verified response with pepper on success", async () => {
    const { storeCredential } = await import("@/lib/passkey/store")
    storeCredential("cred-id-123", {
      credentialId: "cred-id-123",
      publicKey: new Uint8Array(32).fill(1),
      counter: 0,
    })

    // Generate auth options to store challenge
    await generateOptions(makeRequest({ credentialId: "cred-id-123", mode: "authenticate" }))

    const res = await authVerify(makeRequest({
      credentialId: "cred-id-123",
      email: "user@test.com",
      assertion: { response: { clientDataJSON: btoa(JSON.stringify({ challenge: "auth-challenge-xyz" })) } },
    }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.verified).toBe(true)
    expect(data.email).toBe("user@test.com")
    expect(data.pepper).toBeDefined()
  })

  it("updates counter after successful verification", async () => {
    const { storeCredential, getCredential } = await import("@/lib/passkey/store")
    storeCredential("cred-counter-test", {
      credentialId: "cred-counter-test",
      publicKey: new Uint8Array(32).fill(1),
      counter: 0,
    })

    await generateOptions(makeRequest({ credentialId: "cred-counter-test", mode: "authenticate" }))
    await authVerify(makeRequest({
      credentialId: "cred-counter-test",
      email: "user@test.com",
      assertion: { response: { clientDataJSON: btoa(JSON.stringify({ challenge: "auth-challenge-xyz" })) } },
    }))

    const cred = getCredential("cred-counter-test")
    expect(cred).toBeDefined()
    expect(cred!.counter).toBe(1)
  })
})
