import type { WalletAdapter, WalletMeta, NetworkType } from "../types"
import { getRelayMonitor } from "../wc2-relay"
import { getWC2SessionStore } from "../wc2-session-store"

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""
const RELAY_URL = "wss://relay.walletconnect.com"
const METADATA = {
  name: "Moistello",
  description: "Decentralized savings circles on Stellar",
  url: "https://moistello.io",
  icons: ["https://moistello.io/icon.png"],
}

let _onPairingUri: ((uri: string) => void) | null = null

export function setOnPairingUri(handler: ((uri: string) => void) | null): void {
  _onPairingUri = handler
}

export function getOnPairingUri(): ((uri: string) => void) | null {
  return _onPairingUri
}

export function createWalletConnectAdapter(): WalletAdapter {
  const meta: WalletMeta = {
    id: "walletconnect",
    name: "WalletConnect",
    category: "mobile",
    icon: "walletconnect-icon",
    installUrl: "",
    description: "Lobstr, Coinbase Wallet, Trust Wallet, MetaMask & 200+ more",
    priority: 0,
    isAvailable: () => true,
  }

  let connectedPublicKey: string | null = null
  let connectedNetwork: NetworkType = "testnet"

  function createSessionHandler(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signClient: any,
    resolve: (value: { publicKey: string }) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject: (reason: any) => void,
    getSettled: () => boolean,
    setSettled: () => void,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signClient.on("session_proposal", async (proposal: any) => {
      if (getSettled()) return

      try {
        const { id, params } = proposal
        const { requiredNamespaces, relays } = params

        const namespaces: Record<string, Record<string, unknown>> = {}
        for (const [key, ns] of Object.entries(requiredNamespaces || {})) {
          const nsObj = ns as Record<string, unknown>
          const chains = (nsObj.chains as string[]) || []
          namespaces[key] = {
            ...nsObj,
            accounts: chains.map((chain: string) => `${chain}:${connectedPublicKey ?? ""}`),
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (signClient as any).approve({
          id,
          relayProtocol: relays?.[0]?.protocol ?? "irn",
          namespaces,
        })

        const sessions = signClient.session.getAll()
        const session = sessions.length > 0 ? sessions[sessions.length - 1] : null
        if (!session) {
          setSettled()
          reject({
            adapter: "walletconnect" as const,
            code: "internal" as const,
            message: "Session not found after approval",
            cause: "No active session",
          })
          return
        }

        const ns = session.namespaces?.stellar
        if (ns?.accounts?.length > 0) {
          const account = ns.accounts[0]
          const pubKey = account.split(":")[2]
          if (pubKey) {
            connectedPublicKey = pubKey
            connectedNetwork = account.includes("pubnet") ? "mainnet" : "testnet"
            setSettled()
            resolve({ publicKey: pubKey })
            return
          }
        }

        setSettled()
        reject({
          adapter: "walletconnect" as const,
          code: "internal" as const,
          message: "Could not extract public key from session",
          cause: "No stellar account in namespace",
        })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (!getSettled()) {
          setSettled()
          reject({
            adapter: "walletconnect" as const,
            code: "internal" as const,
            message: err?.message ?? "Session proposal handling failed",
            cause: String(err),
          })
        }
      }
    })

    signClient.on("session_delete", () => {
      connectedPublicKey = null
    })
  }

  return {
    meta,

    async connect(): Promise<{ publicKey: string }> {
      const relay = getRelayMonitor()
      if (relay.status === "down") {
        throw {
          adapter: "walletconnect" as const,
          code: "internal" as const,
          message: "WalletConnect relay is unreachable. Try again later or use an extension wallet.",
          cause: "Relay status: down",
        }
      }

      const startTime = performance.now()
      const { SignClient } = await import("@walletconnect/sign-client")

      let signClient: Awaited<ReturnType<typeof SignClient.init>>
      try {
        signClient = await SignClient.init({
          projectId: PROJECT_ID || undefined,
          relayUrl: RELAY_URL,
          metadata: METADATA,
        })
        relay.recordOutcome(true, performance.now() - startTime)
      } catch (err) {
        relay.recordOutcome(false, performance.now() - startTime)
        throw {
          adapter: "walletconnect" as const,
          code: "internal" as const,
          message: "Failed to initialize WalletConnect. Check your connection.",
          cause: String(err),
        }
      }

      return new Promise<{ publicKey: string }>((resolve, reject) => {
        let settled = false
        const getSettled = () => settled
        const setSettled = () => { settled = true }

        createSessionHandler(signClient, resolve, reject, getSettled, setSettled)

        signClient
          .connect({
            requiredNamespaces: {
              stellar: {
                methods: ["stellar_signAndSubmitXDR", "stellar_signXDR"],
                chains: ["stellar:testnet", "stellar:pubnet"],
                events: [],
              },
            },
          })
          .then(async ({ uri, approval }: { uri?: string; approval?: () => Promise<unknown> }) => {
            if (!uri) return

            if (_onPairingUri) {
              _onPairingUri(uri)
              if (approval) {
                try {
                  const session = await approval()
                  const ns = (session as Record<string, unknown>)?.namespaces as Record<string, unknown> | undefined
                  const stellar = ns?.stellar as Record<string, unknown> | undefined
                  const accounts = stellar?.accounts as string[] | undefined
                  if (accounts && accounts.length > 0) {
                    const account = accounts[0]
                    const pubKey = account.split(":")[2]
                    if (pubKey) {
                      connectedPublicKey = pubKey
                      connectedNetwork = account.includes("pubnet") ? "mainnet" : "testnet"
                      setSettled()
                      getWC2SessionStore().saveSession({
                        pairingTopic: "",
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
                  reject({
                    adapter: "walletconnect" as const,
                    code: "internal" as const,
                    message: "Could not extract public key from session",
                    cause: "No stellar account in namespace",
                  })
                } catch {
                  if (!getSettled()) {
                    setSettled()
                    reject({
                      adapter: "walletconnect" as const,
                      code: "user_rejected" as const,
                      message: "You cancelled the connection in your wallet.",
                    })
                  }
                }
              }
              return
            }

            if (PROJECT_ID) {
              try {
                const { WalletConnectModal } = await import("@walletconnect/modal")
                const wcModal = new WalletConnectModal({
                  projectId: PROJECT_ID,
                  themeMode: "dark",
                })
                wcModal.subscribeModal((state: { open: boolean }) => {
                  if (!state.open && !getSettled()) {
                    setSettled()
                    reject({
                      adapter: "walletconnect" as const,
                      code: "user_rejected" as const,
                      message: "WalletConnect connection was cancelled",
                    })
                  }
                })
                wcModal.openModal({ uri })
              } catch {
                window.open(`https://walletconnect.com/wc?uri=${encodeURIComponent(uri)}`, "_blank")
              }
            } else {
              if (typeof window !== "undefined") {
                console.info(
                  "[WalletConnect] No project ID set. Using deep link. Get a project ID at https://cloud.walletconnect.com for QR modal support.",
                )
                window.open(`https://walletconnect.com/wc?uri=${encodeURIComponent(uri)}`, "_blank")
              }
            }
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .catch((err: any) => {
            relay.recordOutcome(false, performance.now() - startTime)
            if (!getSettled()) {
              setSettled()
              reject({
                adapter: "walletconnect" as const,
                code: "internal" as const,
                message: err?.message ?? "Failed to initiate WalletConnect connection",
                cause: String(err),
              })
            }
          })
      })
    },

    async disconnect(): Promise<void> {
      connectedPublicKey = null
      getWC2SessionStore().clear()
    },

    async isConnected(): Promise<boolean> {
      return connectedPublicKey !== null
    },

    async getPublicKey(): Promise<string> {
      if (!connectedPublicKey) {
        throw {
          adapter: "walletconnect" as const,
          code: "not_installed" as const,
          message: "WalletConnect is not connected",
        }
      }
      return connectedPublicKey
    },

    async signMessage(message: string): Promise<{ signature: string; publicKey: string }> {
      const relay = getRelayMonitor()
      if (!connectedPublicKey) {
        throw {
          adapter: "walletconnect" as const,
          code: "not_installed" as const,
          message: "WalletConnect is not connected",
        }
      }
      if (relay.status === "down") {
        throw {
          adapter: "walletconnect" as const,
          code: "internal" as const,
          message: "WalletConnect relay is unreachable. Try again later.",
          cause: "Relay status: down",
        }
      }
      const start = performance.now()
      const encoded = btoa(message)
      const xdr = `AAAAAgAAAAB...${encoded}`
      try {
        const result = await this.signTransaction(xdr)
        relay.recordOutcome(true, performance.now() - start)
        return { signature: result.signedXdr, publicKey: connectedPublicKey }
      } catch (err) {
        relay.recordOutcome(false, performance.now() - start)
        throw err
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async signTransaction(_xdr: string): Promise<{ signedXdr: string }> {
      throw {
        adapter: "walletconnect" as const,
        code: "internal" as const,
        message: "Transaction signing via WalletConnect is not yet implemented",
        cause: "Not implemented",
      }
    },

    async getNetwork(): Promise<NetworkType> {
      return connectedNetwork
    },
  }
}
