import { WalletAdapter, WalletMeta, SignOptions, NetworkType } from "../types"
import {
  deriveStellarKeypair,
  publicKeyToStellarAddress,
  secureZeroMemory,
} from "@/lib/crypto/key-derivation"

const RP_NAME = "Moistello"
const RP_ID = process.env.NEXT_PUBLIC_PASSKEY_RP_ID || "localhost"
const CREDENTIAL_STORAGE_KEY = "moistello_passkey_credential"

interface StoredCredential {
  credentialId: string
  email: string
  publicKeyRaw: string
}

export function createPasskeyAdapter(): WalletAdapter {
  const meta: WalletMeta = {
    id: "passkey",
    name: "Passkey",
    category: "passkey",
    icon: "passkey-icon",
    installUrl: "",
    description: "Sign in with biometrics. No wallet needed.",
    priority: 1,
    isAvailable: () => {
      return (
        typeof window !== "undefined" &&
        typeof PublicKeyCredential !== "undefined"
      )
    },
  }

  let currentKeypair: {
    publicKey: Uint8Array
    secretKey: Uint8Array
  } | null = null

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

  function zeroKeypair(): void {
    if (currentKeypair) {
      secureZeroMemory(currentKeypair.secretKey)
    }
    currentKeypair = null
  }

  function base64URLToBuffer(base64url: string): ArrayBuffer {
    const binary = atob(base64url.replace(/-/g, "+").replace(/_/g, "/"))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  function toHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  }

  return {
    meta,

    async connect() {
      const stored = getStoredCredential()
      if (stored) {
        return authenticateWithStoredCredential(stored)
      }
      return registerNewCredential()
    },

    async disconnect() {
      zeroKeypair()
    },

    async isConnected() {
      if (currentKeypair !== null) return true
      return getStoredCredential() !== null
    },

    async getPublicKey() {
      if (!currentKeypair) {
        throw {
          adapter: "passkey" as const,
          code: "not_installed" as const,
          message: "Not authenticated",
        }
      }
      return publicKeyToStellarAddress(currentKeypair.publicKey)
    },

    async signMessage(message: string) {
      if (!currentKeypair) {
        throw {
          adapter: "passkey" as const,
          code: "not_installed" as const,
          message: "Not authenticated",
        }
      }

      try {
        const { signAsync } = await import("@noble/ed25519")
        const encoder = new TextEncoder()
        const msgBytes = encoder.encode(message)
        const signature = await signAsync(
          msgBytes,
          currentKeypair.secretKey
        )

        return {
          signature: toHex(signature),
          publicKey: publicKeyToStellarAddress(currentKeypair.publicKey),
        }
      } catch (err: unknown) {
        throw {
          adapter: "passkey" as const,
          code: "internal" as const,
          message: "Failed to sign message",
          cause: err instanceof Error ? err.message : String(err),
        }
      } finally {
        zeroKeypair()
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async signTransaction(xdr: string, opts?: SignOptions) {
      if (!currentKeypair) {
        throw {
          adapter: "passkey" as const,
          code: "not_installed" as const,
          message: "Not authenticated",
        }
      }

      try {
        const { signAsync } = await import("@noble/ed25519")
        const encoder = new TextEncoder()
        const xdrBytes = encoder.encode(xdr)
        await signAsync(xdrBytes, currentKeypair.secretKey)

        return { signedXdr: xdr }
      } catch (err: unknown) {
        throw {
          adapter: "passkey" as const,
          code: "internal" as const,
          message: "Failed to sign transaction",
          cause: err instanceof Error ? err.message : String(err),
        }
      } finally {
        zeroKeypair()
      }
    },

    async getNetwork() {
      return "testnet" as NetworkType
    },
  }

  async function authenticateWithStoredCredential(
    stored: StoredCredential
  ): Promise<{ publicKey: string }> {
    const credentialIdBuffer = base64URLToBuffer(stored.credentialId)

    const publicKeyCredential = (await navigator.credentials.get({
      publicKey: {
        rpId: RP_ID,
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [
          {
            id: credentialIdBuffer,
            type: "public-key",
            transports: ["internal", "hybrid"],
          },
        ],
        userVerification: "required",
      },
      mediation: "optional",
    })) as PublicKeyCredential | null

    if (!publicKeyCredential) {
      throw {
        adapter: "passkey" as const,
        code: "internal" as const,
        message: "Authentication failed",
      }
    }

    const keypair = await deriveStellarKeypair(
      stored.credentialId,
      stored.email
    )
    currentKeypair = keypair

    const stellarAddress = publicKeyToStellarAddress(keypair.publicKey)
    return { publicKey: stellarAddress }
  }

  async function registerNewCredential(): Promise<{ publicKey: string }> {
    const email =
      prompt("Enter your email to create a passkey:") ||
      `user-${Date.now()}@moistello.io`

    const publicKeyCredential = (await navigator.credentials.create({
      publicKey: {
        rp: { name: RP_NAME, id: RP_ID },
        user: {
          id: new TextEncoder().encode(email),
          name: email,
          displayName: email,
        },
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { alg: -257, type: "public-key" },
          { alg: -8, type: "public-key" },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "required",
        },
        timeout: 120000,
      },
    })) as PublicKeyCredential | null

    if (!publicKeyCredential) {
      throw {
        adapter: "passkey" as const,
        code: "internal" as const,
        message: "Registration failed — no credential returned",
      }
    }

    const credentialId = publicKeyCredential.id

    const keypair = await deriveStellarKeypair(credentialId, email)
    currentKeypair = keypair

    storeCredential({
      credentialId,
      email,
      publicKeyRaw: toHex(keypair.publicKey),
    })

    const stellarAddress = publicKeyToStellarAddress(keypair.publicKey)
    return { publicKey: stellarAddress }
  }
}
