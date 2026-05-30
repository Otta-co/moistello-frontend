import type { WalletAdapter, WalletMeta, NetworkType, SignOptions } from "../types"
import { getRelayMonitor } from "../wc2-relay"
import { getWC2SessionStore } from "../wc2-session-store"

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""
const RELAY_URL = "wss://relay.walletconnect.com"
const METADATA = {
  name: "Moistello",
  description: "Decentralized savings circles on Stellar",
  url: "https://moistello.com",
  icons: ["https://moistello.com/logo.jpg"],
}

const SIGN_TIMEOUT = 60_000
const CONNECT_TIMEOUT = 120_000

let _onPairingUri: ((uri: string) => void) | null = null

export function setOnPairingUri(handler: ((uri: string) => void) | null): void {
  _onPairingUri = handler
}

export function getOnPairingUri(): ((uri: string) => void) | null {
  return _onPairingUri
}

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function isValidStellarPublicKey(key: string): boolean {
  return /^G[A-Z0-9]{55}$/.test(key)
}

function isXDRValid(xdr: string): boolean {
  return typeof xdr === "string" && xdr.length > 20 && /^[A-Za-z0-9+/=]+$/.test(xdr)
}

function createTimeoutError(adapter: string, ms: number) {
  return {
    adapter,
    code: "timeout" as const,
    message: `Request timed out after ${ms / 1000}s. Check your wallet and try again.`,
  }
}

function createNotConnectedError(adapter: string) {
  return {
    adapter,
    code: "not_installed" as const,
    message: "WalletConnect is not connected. Please connect your wallet first.",
  }
}

function createRelayDownError(adapter: string) {
  return {
    adapter,
    code: "internal" as const,
    message: "WalletConnect relay is unreachable. Try again later or use an extension wallet.",
    cause: "Relay status: down",
  }
}

function createRejectedError(adapter: string) {
  return {
    adapter,
    code: "user_rejected" as const,
    message: "Connection rejected. Please approve the connection request in your wallet.",
  }
}

function createNetworkMismatchError(adapter: string, chain: string, network: string) {
  return {
    adapter,
    code: "network_mismatch" as const,
    message: `Wallet is on ${chain} but expected ${network}`,
    expected: network,
    actual: chain,
  }
}

function createInternalError(adapter: string, message: string, cause?: string) {
  return {
    adapter,
    code: "internal" as const,
    message,
    ...(cause ? { cause } : {}),
  }
}

function chainIdForNetwork(network: NetworkType): string {
  return network === "mainnet" ? "stellar:pubnet" : "stellar:testnet"
}

function networkFromChainId(chainId: string): NetworkType {
  return chainId === "stellar:pubnet" ? "mainnet" : "testnet"
}

let connectedPublicKey: string | null = null
let connectedNetwork: NetworkType = "testnet"
let sessionTopic: string | null = null
let wcSignClient: unknown = null

export function createWalletConnectAdapter(): WalletAdapter {
  const meta: WalletMeta = {
    id: "walletconnect",
    name: "WalletConnect",
    category: "mobile",
    icon: "walletconnect-icon",
    installUrl: "",
    description: "Lobstr, Coinbase Wallet, Trust Wallet, MetaMask & 200+ more",
    priority: 0,
    isAvailable: () => isBrowser(),
  }

  async function getOrInitSignClient(): Promise<unknown> {
    if (wcSignClient) return wcSignClient
    const { SignClient } = await import("@walletconnect/sign-client")
    wcSignClient = await SignClient.init({
      projectId: PROJECT_ID || undefined,
      relayUrl: RELAY_URL,
      metadata: METADATA,
    })
    return wcSignClient
  }

  async function sendSignRequest(
    method: string,
    params: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const relay = getRelayMonitor()
    const startTime = performance.now()

    if (!wcSignClient) {
      throw createNotConnectedError("walletconnect")
    }
    if (relay.status === "down") {
      throw createRelayDownError("walletconnect")
    }

    const signClient = wcSignClient as {
      request: (opts: {
        topic: string
        chainId: string
        request: { method: string; params: Record<string, unknown> }
      }) => Promise<unknown>
    }

    const requestPromise = signClient.request({
      topic: sessionTopic!,
      chainId: chainIdForNetwork(connectedNetwork),
      request: { method, params },
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        relay.recordOutcome(false, performance.now() - startTime)
        reject(createTimeoutError("walletconnect", SIGN_TIMEOUT))
      }, SIGN_TIMEOUT)
    })

    try {
      const result = (await Promise.race([requestPromise, timeoutPromise])) as Record<string, unknown>
      relay.recordOutcome(true, performance.now() - startTime)
      return result
    } catch (err: unknown) {
      relay.recordOutcome(false, performance.now() - startTime)
      const wcError = err as { code?: number; message?: string }
      if (wcError?.code === 5000 || wcError?.message?.includes("rejected")) {
        throw createRejectedError("walletconnect")
      }
      throw err
    }
  }

  function createSessionHandler(
    signClient: {
      on: (event: string, handler: (...args: unknown[]) => void) => void
      approve: (opts: Record<string, unknown>) => Promise<unknown>
      session: { getAll: () => Array<{ topic: string; namespaces: Record<string, unknown> }> }
    },
    resolve: (value: { publicKey: string }) => void,
    reject: (reason: unknown) => void,
    getSettled: () => boolean,
    setSettled: () => void,
    startTime: number,
  ) {
    signClient.on("session_proposal", async (proposal: unknown) => {
      if (getSettled()) return

      try {
        const prop = proposal as {
          id: number
          params: { requiredNamespaces: Record<string, unknown>; relays: Array<{ protocol: string }> }
        }
        const { id, params } = prop
        const { requiredNamespaces, relays } = params

        const namespaces: Record<string, Record<string, unknown>> = {}
        for (const [key, ns] of Object.entries(requiredNamespaces || {})) {
          const nsObj = ns as { chains?: string[]; methods?: string[]; events?: string[] }
          namespaces[key] = {
            ...nsObj,
          }
        }

        await signClient.approve({
          id,
          relayProtocol: relays?.[0]?.protocol ?? "irn",
          namespaces,
        })

        const sessions = signClient.session.getAll()
        const sessionsList = sessions as Array<{
          topic: string
          namespaces: Record<string, { accounts: string[] }>
        }>
        const session = sessionsList.length > 0 ? sessionsList[sessionsList.length - 1] : null

        if (!session) {
          setSettled()
          reject(createInternalError("walletconnect", "Session not found after approval", "No active session"))
          return
        }

        sessionTopic = session.topic

        const ns = session.namespaces?.stellar
        if (ns?.accounts?.length > 0) {
          const account = ns.accounts[0]
          const pubKey = account.split(":")[2]
          if (pubKey && isValidStellarPublicKey(pubKey)) {
            connectedPublicKey = pubKey
            connectedNetwork = networkFromChainId(account.split(":")[1])
            setSettled()
            const relay = getRelayMonitor()
            relay.recordOutcome(true, performance.now() - startTime)
            wcSignClient = signClient
            getWC2SessionStore().saveSession({
              pairingTopic: session.topic,
              publicKey: pubKey,
              network: connectedNetwork,
              createdAt: Date.now(),
              expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            })
            resolve({ publicKey: pubKey })
            return
          }
        }

        setSettled()
        reject(
          createInternalError("walletconnect", "Could not extract public key from session", "No stellar account in namespace"),
        )
      } catch (err: unknown) {
        if (!getSettled()) {
          setSettled()
          reject(
            createInternalError("walletconnect", "Session proposal handling failed", String(err)),
          )
        }
      }
    })

    signClient.on("session_delete", () => {
      connectedPublicKey = null
      sessionTopic = null
      wcSignClient = null
      getWC2SessionStore().clear()
    })
  }

  return {
    meta,

    async connect(): Promise<{ publicKey: string }> {
      const relay = getRelayMonitor()
      if (relay.status === "down") {
        throw createRelayDownError("walletconnect")
      }

      const startTime = performance.now()
      const signClient = await getOrInitSignClient()

      let settled = false
      const getSettled = () => settled
      const setSettled = () => {
        settled = true
      }

      const connectionPromise = new Promise<{ publicKey: string }>((resolve, reject) => {
        createSessionHandler(
          signClient as {
            on: (event: string, handler: (...args: unknown[]) => void) => void
            approve: (opts: Record<string, unknown>) => Promise<unknown>
            session: { getAll: () => Array<{ topic: string; namespaces: Record<string, unknown> }> }
          },
          resolve,
          reject,
          getSettled,
          setSettled,
          startTime,
        )
      })

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          if (!getSettled()) {
            setSettled()
            relay.recordOutcome(false, performance.now() - startTime)
            reject(createTimeoutError("walletconnect", CONNECT_TIMEOUT))
          }
        }, CONNECT_TIMEOUT)
      })

      ;(signClient as { connect: (opts: Record<string, unknown>) => Promise<{ uri?: string }> }).connect({
        requiredNamespaces: {
          stellar: {
            methods: ["stellar_signAndSubmitXDR", "stellar_signXDR"],
            chains: ["stellar:testnet", "stellar:pubnet"],
            events: [],
          },
        },
      })
        .then((result) => {
          const { uri } = result as { uri?: string }

          if (!uri) {
            if (!getSettled()) {
              setSettled()
            }
            return
          }

          if (_onPairingUri) {
            _onPairingUri(uri)
          }

          // Desktop: open modal to let user choose wallet
          // The session_proposal handler will auto-approve when wallet proposes
          if (isBrowser() && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            if (PROJECT_ID) {
              ;(async () => {
                try {
                  const { WalletConnectModal } = await import("@walletconnect/modal")
                  const wcModal = new WalletConnectModal({
                    projectId: PROJECT_ID,
                    themeMode: "dark",
                  })
                  wcModal.openModal({ uri })
                } catch {
                  window.open(`https://walletconnect.com/wc?uri=${encodeURIComponent(uri)}`, "_blank")
                }
              })()
            } else {
              window.open(`https://walletconnect.com/wc?uri=${encodeURIComponent(uri)}`, "_blank")
            }
          }
        })
        .catch(() => {
          if (!getSettled()) {
            setSettled()
          }
        })

      return Promise.race([connectionPromise, timeoutPromise])
    },

    async disconnect(): Promise<void> {
      const sc = wcSignClient as { disconnect?: (opts: { topic: string }) => Promise<void> } | null
      if (sc?.disconnect && sessionTopic) {
        try {
          await sc.disconnect({ topic: sessionTopic })
        } catch {
          // best-effort disconnect
        }
      }
      connectedPublicKey = null
      sessionTopic = null
      wcSignClient = null
      getWC2SessionStore().clear()
    },

    async isConnected(): Promise<boolean> {
      return connectedPublicKey !== null && sessionTopic !== null
    },

    async getPublicKey(): Promise<string> {
      if (!connectedPublicKey) {
        throw createNotConnectedError("walletconnect")
      }
      return connectedPublicKey
    },

    async signMessage(message: string): Promise<{ signature: string; publicKey: string }> {
      if (!connectedPublicKey) {
        throw createNotConnectedError("walletconnect")
      }
      if (!sessionTopic || !wcSignClient) {
        throw createNotConnectedError("walletconnect")
      }

      const relay = getRelayMonitor()
      if (relay.status === "down") {
        throw createRelayDownError("walletconnect")
      }

      const { xdr } = await createAuthXDR(message)
      const result = await this.signTransaction(xdr, { network: connectedNetwork })

      return { signature: result.signedXdr, publicKey: connectedPublicKey }
    },

    async signTransaction(xdr: string, opts?: SignOptions): Promise<{ signedXdr: string }> {
      if (!connectedPublicKey) {
        throw createNotConnectedError("walletconnect")
      }
      if (!sessionTopic || !wcSignClient) {
        throw createNotConnectedError("walletconnect")
      }

      if (!isXDRValid(xdr)) {
        throw createInternalError("walletconnect", "Invalid XDR format", "XDR must be a base64 string")
      }

      const relay = getRelayMonitor()
      if (relay.status === "down") {
        throw createRelayDownError("walletconnect")
      }

      if (opts?.network && opts.network !== connectedNetwork) {
        throw createNetworkMismatchError("walletconnect", opts.network, connectedNetwork)
      }

      const result = await sendSignRequest("stellar_signXDR", { xdr })

      const signedXdr = result?.signedXdr as string | undefined
      if (!signedXdr) {
        throw createInternalError("walletconnect", "Wallet returned empty response", "No signedXdr in response")
      }

      if (!isXDRValid(signedXdr)) {
        throw createInternalError("walletconnect", "Wallet returned invalid signed XDR", "signedXdr failed format validation")
      }

      if (signedXdr === xdr) {
        throw createInternalError("walletconnect", "Wallet returned unsigned XDR", "signedXdr matches original xdr")
      }

      return { signedXdr }
    },

    async getNetwork(): Promise<NetworkType> {
      return connectedNetwork
    },
  }
}

async function createAuthXDR(message: string): Promise<{ xdr: string; hash: string }> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`moistello-auth:${message}`)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  const xdr = btoa(`MOISTELLO_AUTH:${hash}:${Date.now()}`)
  return { xdr, hash }
}

export function resetWcState(): void {
  connectedPublicKey = null
  connectedNetwork = "testnet"
  sessionTopic = null
  wcSignClient = null
  getWC2SessionStore().clear()
}

export async function disconnectWc(): Promise<void> {
  const sc = wcSignClient as { disconnect?: (opts: { topic: string }) => Promise<void> } | null
  if (sc?.disconnect && sessionTopic) {
    try {
      await sc.disconnect({ topic: sessionTopic })
    } catch {
      // best-effort disconnect
    }
  }
  connectedPublicKey = null
  sessionTopic = null
  wcSignClient = null
  getWC2SessionStore().clear()
}
