/**
 * Ambient type declarations for optional / code-split dependencies.
 *
 * These packages are loaded via dynamic import() at runtime and may
 * not be installed in every environment. Declaring them here allows
 * TypeScript compilation to succeed while preserving the runtime
 * lazy-loading pattern.
 *
 * Packages covered:
 *   @noble/*        — ed25519 signing & HKDF key derivation (passkey adapter)
 *   @ledgerhq/*     — Ledger hardware wallet transport & Stellar app
 *   @walletconnect/*— WalletConnect v2 QR-based mobile wallet
 */

declare module "@noble/hashes/hkdf.js" {
  export function hkdf(
    hash: (data: Uint8Array) => Uint8Array,
    ikm: Uint8Array,
    salt: Uint8Array,
    info: Uint8Array,
    length: number,
  ): Uint8Array
}

declare module "@noble/hashes/sha2.js" {
  export function sha256(data: Uint8Array): Uint8Array
}

declare module "@noble/ed25519" {
  export function signAsync(
    message: Uint8Array,
    secretKey: Uint8Array,
  ): Promise<Uint8Array>

  export function getPublicKeyAsync(
    secretKey: Uint8Array,
  ): Promise<Uint8Array>
}

declare module "@ledgerhq/hw-transport-webusb" {
  export interface LedgerTransport {
    close(): Promise<void>
  }

  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class TransportWebUSB {
    static create(): Promise<LedgerTransport>
  }

  export default TransportWebUSB
}

declare module "@ledgerhq/hw-transport-webble" {
  export interface LedgerTransport {
    close(): Promise<void>
  }

  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class TransportWebBLE {
    static create(): Promise<LedgerTransport>
  }

  export default TransportWebBLE
}

declare module "@ledgerhq/hw-app-str" {
  interface LedgerTransport {
    close(): Promise<void>
  }

  class Str {
    constructor(transport: LedgerTransport)
    sign(
      derivationPath: string,
      data: Uint8Array,
    ): Promise<{ signature: Uint8Array }>
    signTransaction(
      derivationPath: string,
      xdr: string,
    ): Promise<{ signature: Uint8Array }>
  }

  export default Str
}

declare module "@walletconnect/sign-client" {
  export class SignClient {
    static init(opts: Record<string, unknown>): Promise<SignClient>
    on(event: string, handler: (...args: unknown[]) => void): void
    connect(opts: Record<string, unknown>): Promise<{
      uri?: string
      approval(): Promise<unknown>
    }>
    disconnect(opts: Record<string, unknown>): Promise<void>
    session: {
      namespaces: Record<string, { accounts: string[] }>
    }
  }
}

declare module "@walletconnect/modal" {
  export class WalletConnectModal {
    constructor(opts: { projectId: string; themeMode?: string })
    openModal(opts?: { uri: string }): Promise<void>
    closeModal(): void
    subscribeModal(callback: (state: { open: boolean }) => void): void
  }
}
