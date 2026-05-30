# Moistello Frontend

Modern React wallet authentication interface for decentralized savings circles on Stellar.

## Overview

Next.js 14 application providing a secure, multi-wallet authentication experience supporting hardware wallets, browser extensions, WalletConnect, and passkey authentication.

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.x |
| Styling | Tailwind CSS 3.x |
| State | Zustand 5.x |
| Animation | Framer Motion |
| Icons | Lucide React |
| Build | Turbopack (via Next.js) |

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 1.22+ or pnpm 8+

### Installation

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Development

```bash
npm run dev
```

Access the application at `http://localhost:1110`

### Build for Production

```bash
npm run build
npm run start
```

## Scripts

| Command | Description |
|---------|-------------|
| `dev` | Start development server on port 1110 |
| `build` | Create production build |
| `start` | Start production server |
| `lint` | Run ESLint checks |

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Login page
│   │   └── register/       # Registration page
│   └── api/
│       └── auth/
│           └── passkey/    # Passkey backend proxy
├── components/
│   ├── auth/               # Auth UI components
│   ├── ui/                 # Shared design system
│   └── wallet/             # Wallet connection components
├── lib/
│   ├── api-client.ts       # HTTP client with retry logic
│   ├── wallet/             # Wallet adapters
│   │   ├── adapters/       # Extension/WC2/Hardware/Passkey
│   │   ├── types.ts        # Wallet interfaces
│   │   └── registry.ts     # Adapter registration
│   └── crypto/             # Key derivation utilities
├── stores/
│   ├── multi-wallet-store.ts  # Wallet connection state
│   ├── auth-store.ts          # Session tokens
│   ├── ui-store.ts            # Theme, toasts
│   └── auth-flow-store.ts     # Auth flow orchestration
└── types/
    └── index.ts            # Shared TypeScript interfaces
```

## Authentication Features

### Supported Wallets

| Category | Wallets | Status |
|----------|---------|--------|
| Extensions | Freighter, xBull, Rabet, Albedo | Connect & sign |
| Mobile | WalletConnect v2 | QR code / deep-link |
| Hardware | Ledger (USB/BLE) | Secure confirmation |
| Passkey | Platform biometrics | Email-based derivation |

### Flow States

```
[Choose Wallet] → [Connect] → [Await Approval] → [Sign Message] → [Authenticated]
```

For registration:
```
[Choose Wallet] → [Passkey Email] → [Profile Setup] → [Sign & Register] → [Authenticated]
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API endpoint | Yes |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WC2 project identifier | Yes |
| `NEXT_PUBLIC_PASSKEY_RP_ID` | WebAuthn relying party | Recommended |
| `NEXT_PUBLIC_FEATURE_*` | Wallet feature flags | No (defaults on) |

> **Security Note**: All `NEXT_PUBLIC_*` variables are exposed to the client. Never store secrets in frontend environment variables.

## Architecture

### State Management

Single source of truth via Zustand stores:

- **Connection state**: Managed by `useMultiWalletStore`
- **Session tokens**: Managed by `useAuthStore`
- **UI state**: Managed by `useUIStore`

### Wallet Detection

Automatic detection on mount via `scanWallets()` - checks for installed extensions, WebUSB/BLE support, and mobile wallet deep-link capability.

### Error Handling

Structured adapter errors with codes:
- `not_installed` - Wallet not available
- `user_rejected` - User cancelled action
- `network_mismatch` - Wrong network selected
- `timeout` - Operation timed out
- `internal` - Unknown error

## Security Considerations

- Wallet signatures verified server-side
- No private keys stored client-side
- Session tokens use HttpOnly cookies
- Passkey secret derived per-session only
- XDR validated before signing requests

## Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test-cover
```

Test files located in:
- `src/lib/wallet/__tests__/`
- `src/lib/crypto/__tests__/`
- `src/app/api/auth/passkey/__tests__/`

## Code Style

- ESLint with Next.js config
- TypeScript strict mode enabled
- Tailwind utility classes for styling
- React Server Components where applicable

## Browser Support

| Feature | Browsers |
|---------|----------|
| WebUSB | Chrome, Edge, Brave |
| WebBLE | Chrome Android, Edge |
| Passkey | Safari 16+, Chrome 108+, Edge 108+ |
| WalletConnect | All modern browsers |

## Contributing

1. Create feature branch from `main`
2. Follow existing code conventions
3. Add tests for new functionality
4. Ensure `npm run lint` passes
5. Submit pull request with description

## Deployment

Optimized for Vercel deployment. Static assets served via edge network.

### Build Optimization

- Dynamic imports for wallet SDKs
- Tree-shaken icons
- Optimized font loading
- Image optimization via Next.js

---

*For backend API documentation, see the backend repository.*