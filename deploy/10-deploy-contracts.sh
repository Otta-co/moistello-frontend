#!/usr/bin/env bash
# ── 10-deploy-contracts.sh ── Build + deploy all 5 contracts to mainnet
# Prerequisites: 09-fund-check.sh passed (account funded)
# Requires: STELLAR_SECRET_KEY in /opt/moistello/secrets/.env
set -euo pipefail
echo "=== STEP 10: Deploying contracts to Stellar Mainnet ==="
source /opt/moistello/secrets/.env

if [ -z "${STELLAR_SECRET_KEY:-}" ]; then
    echo "ERROR: No secret key. Run 08-secrets.sh first."
    exit 1
fi

CONTRACTS_DIR=/opt/moistello/contracts
if [ ! -d "$CONTRACTS_DIR" ]; then
    git clone --depth 1 https://github.com/Otta-co/moistello-contracts.git "$CONTRACTS_DIR"
fi

# Install Rust if needed
if ! command -v cargo &>/dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# Add wasm target
rustup target add wasm32v1-none 2>/dev/null || true

# Install stellar CLI if needed
if ! command -v soroban &>/dev/null; then
    cargo install soroban-cli --version 26.0.0
fi

cd "$CONTRACTS_DIR"

echo "Building all contracts (wasm32v1-none)..."
cargo build --target wasm32v1-none --release

echo "Optimizing WASM binaries..."
for wasm in circle_factory circle reputation_registry governance_token treasury; do
    soroban contract optimize \
        --wasm "target/wasm32v1-none/release/${wasm}.wasm" 2>/dev/null || \
    cp "target/wasm32v1-none/release/${wasm}.wasm" \
       "target/wasm32v1-none/release/${wasm}.optimized.wasm"
done

# Configure identity
soroban config identity generate moistello-mainnet \
    --rpc-url https://soroban.stellar.org \
    --network-passphrase "Public Global Stellar Network ; September 2015" \
    --secret-key "$STELLAR_SECRET_KEY" 2>/dev/null || true

WASM_DIR="target/wasm32v1-none/release"
NETWORK="mainnet"
IDENTITY="moistello-mainnet"

echo ""
echo "Deploying 1/5: Circle Factory..."
FACTORY_ID=$(soroban contract deploy \
    --wasm "$WASM_DIR/circle_factory.optimized.wasm" \
    --source "$IDENTITY" \
    --network "$NETWORK")
echo "   Factory: $FACTORY_ID"

echo "Deploying 2/5: Circle (WASM install)..."
CIRCLE_HASH=$(soroban contract install \
    --wasm "$WASM_DIR/circle.optimized.wasm" \
    --source "$IDENTITY" \
    --network "$NETWORK")
echo "   Circle WASM Hash: $CIRCLE_HASH"

echo "Deploying 3/5: Reputation Registry..."
REP_ID=$(soroban contract deploy \
    --wasm "$WASM_DIR/reputation_registry.optimized.wasm" \
    --source "$IDENTITY" \
    --network "$NETWORK")
echo "   Reputation: $REP_ID"

echo "Deploying 4/5: Governance Token..."
TOKEN_ID=$(soroban contract deploy \
    --wasm "$WASM_DIR/governance_token.optimized.wasm" \
    --source "$IDENTITY" \
    --network "$NETWORK")
echo "   Token: $TOKEN_ID"

echo "Deploying 5/5: Treasury..."
TREASURY_ID=$(soroban contract deploy \
    --wasm "$WASM_DIR/treasury.optimized.wasm" \
    --source "$IDENTITY" \
    --network "$NETWORK")
echo "   Treasury: $TREASURY_ID"

# Save to secrets
cat >> /opt/moistello/secrets/.env << ENVEOF
CONTRACT_FACTORY=${FACTORY_ID}
CONTRACT_CIRCLE_HASH=${CIRCLE_HASH}
CONTRACT_REP_REGISTRY=${REP_ID}
CONTRACT_GOV_TOKEN=${TOKEN_ID}
CONTRACT_TREASURY=${TREASURY_ID}
ENVEOF

echo ""
echo "=== CONTRACTS DEPLOYED ==="
echo "Factory:            $FACTORY_ID"
echo "Circle WASM Hash:   $CIRCLE_HASH"
echo "Reputation:         $REP_ID"
echo "Governance Token:   $TOKEN_ID"
echo "Treasury:           $TREASURY_ID"
echo ""
echo "Saved to /opt/moistello/secrets/.env"
echo "PASSED"
