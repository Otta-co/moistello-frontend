---
title: Getting Started
order: 2
---

# Getting Started

Learn how to get started with Moistello in minutes.

## Prerequisites

Before you begin, you'll need:

- **Freighter Wallet** — A Stellar browser extension wallet. [Install Freighter](https://freighter.app)
- **XLM** — A small amount of XLM (Stellar Lumens) for transaction fees (typically less than $0.001 per transaction)
- **USDC** — Optional but recommended. USDC is a stablecoin pegged to USD and is the primary currency for savings circles

## Step 1: Install Freighter

1. Go to [freighter.app](https://freighter.app) and install the browser extension
2. Create a new wallet or import an existing one
3. **Save your secret recovery phrase** in a safe place — you cannot recover it if lost
4. Switch to the **Stellar Testnet** network for testing

## Step 2: Connect to Moistello

1. Visit [app.moistello.io](https://app.moistello.io) (or your local instance)
2. Click **Login** and follow the prompts to connect your Freighter wallet
3. Sign the verification message — this proves you own the wallet without revealing your private key

## Step 3: Create Your First Circle

1. Navigate to **Circles → Create Circle**
2. Fill in the circle details:
   - **Name** — A recognizable name for your circle
   - **Description** — Optional description
   - **Circle Type** — Public, Private, Community, or Premium
   - **Max Members** — How many people can join (2-100)
3. Set financial parameters:
   - **Contribution Amount** — How much each member contributes per cycle
   - **Currency** — USDC or XLM
   - **Frequency** — Daily, Weekly, Biweekly, or Monthly
   - **Late Fee** — Penalty percentage for late payments (default 5%)
   - **Grace Period** — Hours before a payment is considered late
   - **Max Strikes** — Number of late payments before removal
4. Choose a payout type:
   - **Random** — VRF selects payout order
   - **Fixed Order** — Predefined order
   - **Auction** — Members bid for early payout
   - **Vote** — Members vote each round
5. Review and create

## Step 4: Invite Members

1. Open your circle
2. Click **Invite Members**
3. Share the invite link or code with your group
4. Members join by clicking the link and connecting their wallet

## Step 5: Start Contributing

Once all members have joined, the circle begins. Each cycle:
- All members contribute the agreed amount
- One member receives the full pool
- Your MoiScore increases with each on-time contribution

## Testnet vs Mainnet

When testing, use the **Stellar Testnet**. Testnet XLM is free from the [Stellar Friendbot](https://laboratory.stellar.org/#account-creator?network=test). When ready for real funds, switch to Stellar Mainnet.
