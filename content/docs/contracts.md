---
title: Smart Contracts
order: 2
---

# Smart Contracts

Moistello's smart contracts are built on Soroban (Stellar's smart contract platform). The system consists of three main contracts deployed on-chain.

## Contract Architecture

### Circle Contract

Each savings circle is a separate contract instance that manages:
- Member joining and contributions
- Round-based payouts with different distribution modes
- On-chain dispute resolution
- Membership status tracking

### Treasury Contract

Handles platform fee collection and administrative fund management.

### CircleFactory Contract

Deploys new circle contracts and maintains the registry of all circles on the platform.

## Integration

Contracts are deployed using the Soroban CLI. Contact support for SDK access and integration guidelines.

```bash
# Soroban CLI installation
cargo install --locked soroban-cli
```