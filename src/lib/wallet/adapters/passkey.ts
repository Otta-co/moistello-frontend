import { WalletAdapter, WalletMeta, SignOptions, NetworkType } from "../types"
import {
  deriveStellarKeypair,
  publicKeyToStellarAddress,
  secureZeroMemory,
  hexEncode,
} from "@/lib/crypto/key-derivation"

const CREDENTIAL_STORAGE_KEY = "moistello_passkey_credential"

interface StoredCredential {
  credentialId: string
  email: string
  publicKeyRaw: string
}

interface PasskeySession {
  credentialId: string
  email: string
  publicKey: Uint8Array
  secretKey: Uint8Array
  stellarAddress: string
  pepper: string
}

function resolveNetworkPassphrase(network?: NetworkType, networkPassphrase?: string): string {
  if (networkPassphrase) return networkPassphrase
  if (network === "mainnet") return "Public Global Stellar Network ; September 2015"
  return "Test SDF Network ; September 2015"
}

export function createPasskeyAdapter(): WalletAdapter {
  const meta: WalletMeta = {
    id: "passkey",
    name: "Passkey / Email",
    category: "passkey",
    icon: "passkey-icon",
    installUrl: "",
    description: "Sign in with biometrics or email. No wallet needed.",
    priority: 30,
    isAvailable: () => {
      if (typeof window === "undefined") return false
      return typeof PublicKeyCredential !== "undefined"
    },
  }

  let session: PasskeySession | null = null

  function getStoredCredential(): StoredCredential | null {
    if (typeof window === "undefined") return null
    try {
      const raw = localStorage.getItem(CREDENTIAL_STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as StoredCredential
    } catch {
      return null
    }
  }

  function storeCredential(cred: StoredCredential): void {
    if (typeof window === "undefined") return
    localStorage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify(cred))
  }

  function zeroSession(): void {
    if (session) {
      secureZeroMemory(session.secretKey)
    }
    session = null
  }

  async function apiPost<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw { adapter: "passkey" as const, code: "internal" as const, message: (data as Record<string, unknown>).error as string || "Request failed" }
    }
    return res.json()
  }

  return {
    meta,

    async connect(email?: string) {
      if (typeof window === "undefined") {
        throw { adapter: "passkey", code: "not_supported" as const, message: "Not available server-side" }
      }

      if (session) {
        return { publicKey: session.stellarAddress }
      }

      const { startRegistration, startAuthentication } = await import("@simplewebauthn/browser")
      const stored = getStoredCredential()

      if (stored && !email) {
        const { options } = await apiPost<{ options: Record<string, unknown> }>(
          "/api/auth/passkey/generate-options",
          { credentialId: stored.credentialId, mode: "authenticate" }
        )

        let assertion: unknown
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          assertion = await startAuthentication({ optionsJSON: options as any })
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "NotAllowedError") {
            throw { adapter: "passkey", code: "user_rejected" as const, message: "Authentication cancelled" }
          }
          throw { adapter: "passkey", code: "internal" as const, message: "Authentication failed", cause: String(err) }
        }

        const verifyResult = await apiPost<{ verified: boolean; email: string; pepper: string }>(
          "/api/auth/passkey/auth-verify",
          { credentialId: stored.credentialId, email: stored.email, assertion }
        )

        const keypair = await deriveStellarKeypair(
          stored.credentialId,
          stored.email,
          verifyResult.pepper
        )
        const stellarAddress = publicKeyToStellarAddress(keypair.publicKey)
        session = {
          credentialId: stored.credentialId,
          email: stored.email,
          publicKey: keypair.publicKey,
          secretKey: keypair.secretKey,
          stellarAddress,
          pepper: verifyResult.pepper,
        }
        return { publicKey: stellarAddress }
      }

      const resolvedEmail = email
      if (!resolvedEmail) {
        throw { adapter: "passkey", code: "user_rejected" as const, message: "Email is required" }
      }

      const { options } = await apiPost<{ options: Record<string, unknown> }>(
        "/api/auth/passkey/generate-options",
        { email: resolvedEmail, mode: "register" }
      )

      let attestation: unknown
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attestation = await startRegistration({ optionsJSON: options as any })
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "NotAllowedError") {
          throw { adapter: "passkey", code: "user_rejected" as const, message: "Registration cancelled" }
        }
        throw { adapter: "passkey", code: "internal" as const, message: "Passkey creation failed", cause: String(err) }
      }

      const attestationRecord = attestation as { rawId?: string; id?: string }
      const credentialId = attestationRecord.rawId || attestationRecord.id || ""

      const verifyResult = await apiPost<{ verified: boolean; email: string; credentialId: string; pepper: string }>(
        "/api/auth/passkey/register",
        { attestation, email: resolvedEmail }
      )

      const keypair = await deriveStellarKeypair(
        credentialId,
        resolvedEmail,
        verifyResult.pepper
      )
      const stellarAddress = publicKeyToStellarAddress(keypair.publicKey)

      storeCredential({
        credentialId,
        email: resolvedEmail,
        publicKeyRaw: hexEncode(keypair.publicKey),
      })

      session = {
        credentialId,
        email: resolvedEmail,
        publicKey: keypair.publicKey,
        secretKey: keypair.secretKey,
        stellarAddress,
        pepper: verifyResult.pepper,
      }

      return { publicKey: stellarAddress }
    },

    async disconnect() {
      zeroSession()
    },

    async isConnected() {
      return session !== null
    },

    async getPublicKey() {
      if (!session) {
        throw { adapter: "passkey", code: "not_installed" as const, message: "Not authenticated" }
      }
      return session.stellarAddress
    },

    async signMessage(message: string) {
      if (!session) {
        throw { adapter: "passkey", code: "not_installed" as const, message: "Not authenticated" }
      }

      try {
        const { sign } = await import("@noble/ed25519") as unknown as { sign: (m: Uint8Array, k: Uint8Array) => Uint8Array }
        const msgBytes = new TextEncoder().encode(message)
        const signature = sign(msgBytes, session.secretKey)
        return {
          signature: hexEncode(signature),
          publicKey: session.stellarAddress,
        }
      } catch (err: unknown) {
        throw {
          adapter: "passkey",
          code: "internal" as const,
          message: "Failed to sign message",
          cause: err instanceof Error ? err.message : String(err),
        }
      }
    },

    async signTransaction(xdr: string, opts?: SignOptions) {
      if (!session) {
        throw { adapter: "passkey", code: "not_installed" as const, message: "Not authenticated" }
      }

      try {
        const { Keypair, Transaction, xdr: stellarXdr } = await import("@stellar/stellar-base")
        const networkPassphrase = resolveNetworkPassphrase(opts?.network, opts?.networkPassphrase)

        let envelope
        try {
          envelope = stellarXdr.TransactionEnvelope.fromXDR(xdr, "base64")
        } catch (parseErr: unknown) {
          throw {
            adapter: "passkey",
            code: "internal" as const,
            message: "Invalid transaction XDR format",
            cause: parseErr instanceof Error ? parseErr.message : String(parseErr),
          }
        }

        let tx
        try {
          tx = new Transaction(envelope, networkPassphrase)
        } catch (txErr: unknown) {
          throw {
            adapter: "passkey",
            code: "internal" as const,
            message: "Failed to create transaction from envelope",
            cause: txErr instanceof Error ? txErr.message : String(txErr),
          }
        }

        let kp
        try {
          const secretKeyBytes = new Uint8Array(session.secretKey)
          kp = Keypair.fromRawEd25519Seed(Buffer.from(secretKeyBytes))
        } catch (kpErr: unknown) {
          throw {
            adapter: "passkey",
            code: "internal" as const,
            message: "Failed to create keypair from session key",
            cause: kpErr instanceof Error ? kpErr.message : String(kpErr),
          }
        }

        try {
          tx.sign(kp)
        } catch (signErr: unknown) {
          throw {
            adapter: "passkey",
            code: "internal" as const,
            message: "Failed to apply signature to transaction",
            cause: signErr instanceof Error ? signErr.message : String(signErr),
          }
        }

        const signedXdr = tx.toEnvelope().toXDR("base64")
        return { signedXdr }
      } catch (err: unknown) {
        // Re-throw already-formatted errors from granular try/catch blocks
        if (err && typeof err === "object" && "adapter" in err) {
          throw err
        }
        throw {
          adapter: "passkey",
          code: "internal" as const,
          message: "Failed to sign transaction",
          cause: err instanceof Error ? err.message : String(err),
        }
      }
    },

    async getNetwork() {
      return "testnet" as NetworkType
    },
  }
}
