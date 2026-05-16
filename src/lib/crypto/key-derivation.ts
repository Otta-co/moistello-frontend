import { hkdf } from "@noble/hashes/hkdf.js"
import { sha256 } from "@noble/hashes/sha2.js"

const PEPPER =
  process.env.NEXT_PUBLIC_PASSKEY_PEPPER || "moistello-passkey-pepper-v1"

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

function crc16xmodem(data: Uint8Array): number {
  let crc = 0
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i] << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }
      crc &= 0xffff
    }
  }
  return crc
}

function base32Encode(data: Uint8Array): string {
  const length = data.length
  let result = ""
  let buffer = 0
  let bits = 0

  for (let i = 0; i < length; i++) {
    buffer = (buffer << 8) | data[i]
    bits += 8
    while (bits >= 5) {
      bits -= 5
      const index = (buffer >>> bits) & 0x1f
      result += BASE32_ALPHABET[index]
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(buffer << (5 - bits)) & 0x1f]
  }

  return result
}

function hexEncode(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function deriveStellarKeypair(
  credentialId: string,
  email: string
): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
  const encoder = new TextEncoder()
  const ikm = encoder.encode(`${credentialId}:${email}:${PEPPER}`)
  const salt = encoder.encode("moistello-stellar-key-v1")
  const info = encoder.encode("stellar-ed25519")

  const { getPublicKeyAsync } = await import("@noble/ed25519")

  const seed = hkdf(sha256, ikm, salt, info, 32)
  const publicKey = await getPublicKeyAsync(seed)

  return { publicKey, secretKey: seed }
}

export function publicKeyToStellarAddress(publicKey: Uint8Array): string {
  const versionByte = 0x30

  const payload = new Uint8Array(1 + 32)
  payload[0] = versionByte
  payload.set(publicKey, 1)

  const crc = crc16xmodem(payload)
  const checksum = new Uint8Array([crc & 0xff, (crc >> 8) & 0xff])

  const full = new Uint8Array(35)
  full.set(payload, 0)
  full.set(checksum, 33)

  return base32Encode(full)
}

export function secureZeroMemory(buffer: Uint8Array): void {
  buffer.fill(0)
}

export { hexEncode }
