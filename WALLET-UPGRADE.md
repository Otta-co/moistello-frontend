# Moistello — Enterprise Wallet Integration Plan

## The Problem

Moistello currently supports exactly **one** wallet: Freighter (browser extension). This excludes:

| User Segment | What They Have | What Happens Today |
|---|---|---|
| Mobile users in Africa/LATAM/Asia | Lobstr, Vibrant, Beans App | Can't use Moistello at all — Freighter is desktop-only |
| Exchange-held XLM | Coinbase, Binance, Kraken, OKX | Can't sign in — no self-custody wallet |
| MetaMask users | MetaMask with Stellar Snap | Sent to "Install Freighter" — they already have a wallet |
| Cross-chain users | Trust Wallet, Ledger, SafePal | No integration path |
| Hardware wallet users | Ledger Nano via Stellar app | No connection option |
| No-wallet users (target market!) | Just an email address | Must install a browser extension first — massive drop-off |
| Institutional/DAO users | Multi-sig accounts, Safe | No multi-sig support |
| WalletConnect users | xBull, Albedo, Rabet, Lobstr mobile | These wallets all support WC2 but Moistello doesn't |

**Result:** 90%+ of your actual target users cannot log in to your app.

---

## The Enterprise Solution: Wallet Abstraction Layer

### Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                      WALLET ABSTRACTION LAYER                       │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    UNIFIED WALLET INTERFACE                    │  │
│  │                                                              │  │
│  │  connect() → Promise<PublicKey>                               │  │
│  │  disconnect()                                                 │  │
│  │  signMessage(message) → Promise<Signature>                    │  │
│  │  signTransaction(xdr, opts) → Promise<SignedXDR>             │  │
│  │  getNetwork() → Promise<Network>                              │  │
│  │  getPublicKey() → Promise<PublicKey>                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                     │
│         ┌────────────────────┼────────────────────┐                 │
│         ▼                    ▼                    ▼                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐           │
│  │ Browser       │   │ WalletConnect│   │ Passkey/     │           │
│  │ Extensions    │   │ v2 Adapter   │   │ WebAuthn     │           │
│  │              │   │              │   │              │           │
│  │ • Freighter  │   │ • Lobstr     │   │ • Email      │           │
│  │ • xBull      │   │ • xBull      │   │ • Biometric  │           │
│  │ • Rabet      │   │ • Albedo     │   │ • Phone      │           │
│  │ • Albedo     │   │ • Rabet      │   │              │           │
│  └──────┬───────┘   │ • Coinbase W │   └──────┬───────┘           │
│         │           │ • Trust W    │           │                   │
│  ┌──────▼───────┐   │ • MetaMask   │   ┌──────▼───────┐           │
│  │ MetaMask     │   │ • Ledger     │   │ Hardware     │           │
│  │ Stellar Snap │   │   (via WC2) │   │ Wallet       │           │
│  └──────────────┘   └──────┬───────┘   │              │           │
│                            │           │ • Ledger     │           │
│  ┌─────────────────────────▼───────────┴──────────────┴──┐        │
│  │              MULTI-WALLET SESSION MANAGER               │        │
│  │                                                        │        │
│  │  • Active wallet tracking                              │        │
│  │  • Auto-reconnect on page refresh                       │        │
│  │  • Multiple simultaneous wallet connections             │        │
│  │  • Network switching (testnet ↔ mainnet)               │        │
│  │  • Account switching within a wallet                   │        │
│  └────────────────────────────────────────────────────────┘        │
└────────────────────────────────────────────────────────────────────┘
```

### Every Wallet Type Covered

| Category | Wallets | Integration Method | Priority |
|---|---|---|---|
| **Browser Extensions** | Freighter, xBull, Rabet, Albedo, MetaMask (Stellar Snap) | Direct extension API | P0 |
| **WalletConnect v2** | Lobstr, xBull, Albedo, Rabet, Coinbase Wallet, Trust Wallet, Ledger Live, SafePal, MetaMask (mobile) | `@walletconnect/modal` + Stellar namespace | P0 |
| **Passkey / WebAuthn** | No wallet needed — email/biometric | `@simplewebauthn` → Stellar keypair derived from credential | P1 |
| **Hardware Wallets** | Ledger (all models), Trezor (Stellar app) | Ledger Live SDK + WalletConnect bridge | P1 |
| **Multi-Sig / Safe** | Stellar Safe, organization accounts | SEP-0030 multi-sig coordination | P2 |
| **Direct Key Import** | Secret key (S...), seed phrase | Manual entry for advanced users | P2 |
| **OAuth / Social** | Google, Apple, GitHub | WebAuthn → Stellar keypair behind the scenes | P3 |

### Implementation Details Per Adapter

#### 1. Browser Extensions Adapter

```typescript
interface ExtensionWallet {
  id: string
  name: string           // "Freighter", "xBull", "Rabet", "Albedo"
  icon: string            // SVG/PNG path
  installUrl: string      // Extension store URL
  isInstalled(): boolean
  connect(): Promise<{ publicKey: string }>
  signMessage(message: string): Promise<{ signature: string }>
  signTransaction(xdr: string, opts?: SignOptions): Promise<{ signedXdr: string }>
}

// Freighter
const freighterAdapter: ExtensionWallet = {
  id: "freighter",
  name: "Freighter",
  isInstalled: () => typeof window !== "undefined" && "freighterApi" in window,
  connect: async () => {
    const api = (window as any).freighterApi
    const { publicKey } = await api.getPublicKey()
    return { publicKey }
  },
  signMessage: async (msg) => {
    const api = (window as any).freighterApi
    // Use SEP-0007 signing approach
    const encoder = new TextEncoder()
    const data = encoder.encode(msg)
    const xdr = buildAuthTransaction(data).toXDR()
    const { signedTxXdr } = await api.signTransaction(xdr, {
      network: STELLAR_NETWORK,
      networkPassphrase: getPassphrase(),
    })
    return { signature: signedTxXdr }
  },
  // ...
}

// xBull, Rabet, Albedo — same interface, different window objects
// window.xBullWallet, window.rabet, window.albedo
```

#### 2. WalletConnect v2 Adapter

```typescript
// This connects to 200+ wallets including:
// - Lobstr (mobile) — THE most popular Stellar wallet in target markets
// - Coinbase Wallet — users with exchange-bought XLM
// - Trust Wallet — cross-chain users
// - MetaMask (mobile) — with Stellar Snap
// - Ledger Live — hardware wallet with mobile support

import { WalletConnectModal } from "@walletconnect/modal"

const wcAdapter: WalletConnectWallet = {
  id: "walletconnect",
  name: "WalletConnect",
  icon: "walletconnect-icon",
  
  // Stellar namespace registration
  namespace: {
    stellar: {
      methods: [
        "stellar_signAndSubmitXDR",
        "stellar_signXDR",
        "stellar_getPublicKey",
        "stellar_signMessage",
      ],
      chains: ["stellar:pubnet", "stellar:testnet"],
      events: ["chainChanged", "accountsChanged"],
    },
  },
  
  connect: async () => {
    // Open WalletConnect modal → user scans QR or selects wallet
    const { uri, approval } = await wcClient.connect({
      requiredNamespaces: { stellar: { /* ... */ } },
    })
    await approval()
    // Connected session stored for auto-reconnect
  },
}
```

#### 3. Passkey / WebAuthn Adapter (Email-Based Login)

```typescript
// This is CRITICAL for user onboarding in target markets.
// User enters email → browser creates passkey → 
// passkey credential used as seed for Stellar keypair.
// Zero wallet needed. Zero crypto knowledge needed.

import { startRegistration, startAuthentication } from "@simplewebauthn/browser"

async function createStellarAccountFromPasskey(email: string) {
  // 1. Create WebAuthn credential
  const credential = await startRegistration({
    rp: { name: "Moistello", id: "moistello.io" },
    user: { id: emailToBuffer(email), name: email, displayName: email },
    // ...
  })
  
  // 2. Derive Stellar keypair from credential ID
  const seed = await sha256(credential.id)
  const keypair = Keypair.fromRawEd25519Seed(Buffer.from(seed))
  
  // 3. Fund account (friendbot on testnet, funding partner on mainnet)
  // 4. Store mapping: credentialId → stellarAddress
}
```

#### 4. Hardware Wallet Adapter

```typescript
// Ledger via Stellar app
const ledgerAdapter: HardwareWallet = {
  id: "ledger",
  name: "Ledger",
  
  connect: async () => {
    const transport = await TransportWebUSB.create()
    const stellar = new StellarApp(transport)
    const { publicKey } = await stellar.getPublicKey("44'/148'/0'")
    return { publicKey }
  },
  
  signTransaction: async (xdr) => {
    const signed = await stellar.signTransaction("44'/148'/0'", xdr)
    return { signedXdr: signed.signature }
  },
}
```

---

## The Login UI — What Users Should See

```
┌───────────────────────────────────────────────┐
│                                               │
│         Connect to Moistello                   │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │ 📱 WalletConnect                           │  │
│  │    Lobstr, xBull, Albedo, Trust, MetaMask  │  │
│  │                                [Connect →] │  │
│  ├─────────────────────────────────────────┤  │
│  │ 🦊 Freighter                              │  │
│  │    Stellar browser extension                │  │
│  │                                [Connect →] │  │
│  ├─────────────────────────────────────────┤  │
│  │ 🔐 xBull                                  │  │
│  │    Stellar browser extension                │  │
│  │                                [Connect →] │  │
│  ├─────────────────────────────────────────┤  │
│  │ 🦎 Rabet                                   │  │
│  │    Stellar browser extension (mobile OK)   │  │
│  │                                [Connect →] │  │
│  ├─────────────────────────────────────────┤  │
│  │ 💻 Ledger                                  │  │
│  │    Hardware wallet                          │  │
│  │                                [Connect →] │  │
│  ├─────────────────────────────────────────┤  │
│  │ 📧 Email / Passkey                         │  │
│  │    No wallet needed — just your email       │  │
│  │                                 [Sign Up]  │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  Don't have a wallet? We'll create one for     │
│  you in seconds — no extension needed.         │
│                                               │
└───────────────────────────────────────────────┘
```

---

## Session Management — Enterprise Grade

### Auto-Reconnect

```
User closes tab → comes back → wallet reconnects automatically
  │
  ├─ Browser extension: check if still installed → reconnect
  ├─ WalletConnect: session stored in localStorage → restore session
  ├─ Passkey: auto-authenticate via biometric → derive keypair
  └─ Hardware: prompt to reconnect → restore session
```

### Multi-Account Support

```
User connects Freighter → sees account A
User also connects Lobstr → sees account B
User switches between accounts in navbar dropdown
Each account has independent: circles, contributions, MoiScore
```

### Network Detection

```
Wallet reports testnet → app routes to testnet Horizon
Wallet reports mainnet → app routes to mainnet Horizon + production contracts
Network mismatch → warning banner + switch prompt
```

---

## Implementation Plan

### Phase 1 — Wallet Abstraction Core (2 days)
- Define `WalletAdapter` interface
- Implement adapter registry (dynamic wallet discovery)
- Implement session manager (reconnect, multi-account, network detection)
- Implement Freighter adapter (migrate existing code)
- Implement xBull adapter
- Implement Rabet adapter
- Implement Albedo adapter

### Phase 2 — WalletConnect v2 (2 days)
- Install `@walletconnect/modal`, `@walletconnect/core`, `@walletconnect/sign-client`
- Register Stellar namespace with SEP-0007 methods
- Build WC2 adapter implementing WalletAdapter interface
- QR code modal for mobile pairing
- Session persistence + reconnect
- Test with: Lobstr mobile, xBull mobile, Coinbase Wallet, Trust Wallet

### Phase 3 — Passkey / WebAuthn (1 day)
- Install `@simplewebauthn/browser`, `@simplewebauthn/server`
- Implement credential → Stellar keypair derivation
- Passkey adapter implementing WalletAdapter interface
- Auto-create Stellar account on first signup (friendbot testnet / funding partner mainnet)
- Biometric re-authentication on return visits

### Phase 4 — Hardware Wallet (1 day)
- Install `@ledgerhq/hw-transport-webusb`, `@ledgerhq/hw-app-str`
- Ledger adapter implementing WalletAdapter interface
- Unlock prompt → derive path → get public key
- Sign transaction → confirm on device → return signed XDR

### Phase 5 — UI + Migration (2 days)
- Multi-wallet login page (replaces current single-button)
- Wallet selector dropdown in navbar
- Account switcher component
- Wallet settings page (manage connected wallets)
- Migrate all existing pages from direct `isFreighterInstalled()` calls to `useWallet()` hook
- Update contribute flow to support any wallet's sign method
- Update auth flow to support any wallet's signMessage

### Phase 6 — Testing + Security (1 day)
- Integration tests: connect each wallet type → sign nonce → verify JWT
- Integration tests: connect → contribute → sign transaction
- Integration tests: multi-account switching
- Integration tests: network switching
- Integration tests: session persistence across page refreshes
- Security audit: passkey derivation algorithm
- Security audit: WalletConnect session storage

**Total: ~9 days enterprise implementation**

---

## Security Considerations

| Risk | Mitigation |
|---|---|
| WalletConnect session hijacking | Sessions stored encrypted. Pairing URI expires in 5 minutes. |
| Passkey derivation compromise | Credential ID → SHA-256 → Ed25519. Key never leaves device. |
| Fake wallet injection | Adapter registry validates extension signatures before trusting. |
| Phishing via wallet modals | All wallet modals open in sandboxed iframe or native app via deep link. |
| Session replay attacks | Nonce per request. JWT short-lived (15 min). Refresh token rotation. |

---

## What Gets Eliminated

| Current Anti-Pattern | Enterprise Replacement |
|---|---|
| `isFreighterInstalled()` hardcoded everywhere | `useWallet()` hook → any adapter |
| `window.freighterApi` direct access | `adapter.signMessage()` → adapter handles API |
| "Install Freighter" dead-end | Multi-wallet selector with "Use Passkey" fallback |
| Desktop-only auth | WalletConnect QR → mobile signing |
| Single wallet lock-in | Multi-adapter registry, add new wallets in 50 lines |
