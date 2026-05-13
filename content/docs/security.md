---
title: Security
order: 5
---

# Security

How Moistello keeps your funds and data secure.

## Smart Contract Security

All circle funds are managed by Soroban smart contracts on the Stellar blockchain:

- **Open source** — Contract code is publicly auditable on GitHub
- **Immutable rules** — Once deployed, contract rules cannot be changed
- **No custodial risk** — Moistello never holds your funds
- **Reentrancy protection** — Contracts include guards against common attack vectors
- **Access control** — Only the contract owner (your wallet) can trigger authorized actions

## Wallet Security

Your wallet is your identity. Keep it secure:

- **Never share your secret recovery phrase** with anyone
- **Use a hardware wallet** (Ledger) for large amounts
- **Enable all available security features** in Freighter
- **Verify transaction details** before signing anything
- **Use a dedicated wallet** for savings circles rather than your main wallet

## Platform Security

| Measure | Implementation |
|---|---|
| Transport encryption | TLS 1.3, HSTS |
| Authentication | Wallet signature verification (no passwords) |
| API security | Rate limiting, CSRF protection, input validation |
| Data storage | Profile data encrypted at rest |
| DDoS protection | Cloudflare WAF + CDN |

## Best Practices for Members

1. **Start small** — Test with small amounts before committing more
2. **Verify the circle** — Check member identities and organizer reputation
3. **Understand the rules** — Read the circle's settings before joining
4. **Set reminders** — Don't miss contribution deadlines
5. **Report issues** — If you see suspicious activity, report it immediately

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do not** disclose it publicly
2. **Open a private issue** on our GitHub repository
3. Or contact us directly through the Drips Discord

We take security seriously and will respond promptly.

## Audit Status

Smart contracts are pending external audit. This documentation will be updated with audit results once available.
