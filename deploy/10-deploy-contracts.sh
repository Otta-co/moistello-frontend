#!/usr/bin/env bash
# ── 10-deploy-contracts.sh ── Build and deploy all 5 Soroban contracts
source "$(dirname "$0")/lib/common.sh"

step_header "STEP 10: Deploying contracts to Stellar"

if skip_if_done "10"; then exit 0; fi

ENV_FILE="$APP_DIR/secrets/.env"
CONTRACTS_DIR="$APP_DIR/contracts"

# ── Validate prerequisites ─────────────────────────────────────
require_command curl
require_command openssl

if [ ! -f "$ENV_FILE" ]; then
    fail "Secrets file not found at $ENV_FILE — run 08-secrets.sh first"
fi

source "$ENV_FILE"

if [ -z "${STELLAR_SECRET_KEY:-}" ] || [ "$STELLAR_SECRET_KEY" = "REPLACE_WITH_YOUR_PRIVATE_KEY" ]; then
    fail "STELLAR_SECRET_KEY is missing or still a placeholder — run 08-secrets.sh and 09-fund-check.sh first"
fi

if [ ! -d "$CONTRACTS_DIR" ]; then
    fail "Contracts directory not found at $CONTRACTS_DIR — run 01-bootstrap.sh first (repos already cloned)"
fi

# ── Ensure soroban CLI is available (C4 fix) ───────────────────
if ! command -v soroban &>/dev/null; then
    info "soroban CLI not found — installing via cargo"
    if ! command -v cargo &>/dev/null; then
        info "Installing Rust toolchain"
        run curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y 2>/dev/null
        source "$HOME/.cargo/env"
    fi
    run rustup target add wasm32-unknown-unknown 2>/dev/null || true
    run cargo install soroban-cli 2>/dev/null || fail "Failed to install soroban-cli"
    ok "soroban CLI installed"
fi

require_command soroban soroban-cli
require_command cargo

# ── Gas cost estimate ──────────────────────────────────────────
ESTIMATED_XLM=5
CONTRACT_COUNT=5
TOTAL_ESTIMATE=$((ESTIMATED_XLM * CONTRACT_COUNT))
info "════════════════════════════════════════════════════════════"
info "  Gas cost estimate: ~${ESTIMATED_XLM} XLM per contract × ${CONTRACT_COUNT} contracts"
info "  Estimated total: ~${TOTAL_ESTIMATE} XLM"
info "  Network: ${NETWORK} (${STELLAR_RPC})"
info "  Source account: ${STELLAR_PUBLIC_KEY:0:12}..."
info "════════════════════════════════════════════════════════════"
echo ""

# ── Confirmation prompt (H4 fix) ───────────────────────────────
if [ "$DRY_RUN" != "true" ]; then
    echo -n "Proceed with contract deployment on ${NETWORK}? This will spend real XLM. [y/N]: "
    read -r CONFIRM
    if [ "${CONFIRM:-}" != "y" ] && [ "${CONFIRM:-}" != "Y" ]; then
        warn "Deployment cancelled by user"
        exit 0
    fi
else
    info "[DRY-RUN] Skipping confirmation prompt"
fi

echo ""

# ── Configure soroban identity ─────────────────────────────────
info "Configuring soroban identity: moistello-deploy"
run soroban config identity generate moistello-deploy \
    --rpc-url "$STELLAR_RPC" \
    --network-passphrase "$STELLAR_PASSPHRASE" \
    --secret-key "$STELLAR_SECRET_KEY" 2>/dev/null || true
ok "Soroban identity configured"

# ── Build contracts ────────────────────────────────────────────
info "Building all contracts (wasm32-unknown-unknown, release mode)"
run cargo build --target wasm32-unknown-unknown --release || \
    fail "Contract build failed — check $CONTRACTS_DIR for errors"
ok "Contracts built successfully"

# ── Optimize WASM binaries ─────────────────────────────────────
WASM_DIR="$CONTRACTS_DIR/target/wasm32-unknown-unknown/release"
CONTRACTS=(circle_factory circle reputation_registry governance_token treasury)

info "Optimizing WASM binaries"
for wasm in "${CONTRACTS[@]}"; do
    WASM_PATH="${WASM_DIR}/${wasm}.wasm"
    OPT_PATH="${WASM_DIR}/${wasm}.optimized.wasm"
    if [ -f "$WASM_PATH" ]; then
        run soroban contract optimize --wasm "$WASM_PATH" 2>/dev/null || \
            run cp "$WASM_PATH" "$OPT_PATH"
        ok "Optimized: $wasm"
    else
        fail "WASM binary not found: $WASM_PATH"
    fi
done

echo ""

# ── Helper: set env var in .env (overwrite, no append) ─────────
set_env_var() {
    local key="$1" value="$2" file="$3"
    if grep -q "^${key}=" "$file" 2>/dev/null; then
        run sed -i "s|^${key}=.*|${key}=${value}|" "$file"
    else
        echo "${key}=${value}" >> "$file"
    fi
}

# ── Deploy contracts with error tracking ───────────────────────
SUCCESSFUL=()
FAILED=()

deploy_contract() {
    local label="$1" wasm_name="$2"
    info "Deploying ${label}: ${wasm_name}"

    local result
    result=$(run soroban contract deploy \
        --wasm "${WASM_DIR}/${wasm_name}.optimized.wasm" \
        --source moistello-deploy \
        --network "$NETWORK" 2>&1) || true

    if [ -n "$result" ] && [[ "$result" =~ ^C[A-Z0-9]{55}$ ]]; then
        echo "$result"
    else
        echo ""
    fi
}

# 1/5: Circle Factory
FACTORY_ID=$(deploy_contract "1/5" "circle_factory")
if [ -n "$FACTORY_ID" ]; then
    ok "Factory deployed: $FACTORY_ID"
    SUCCESSFUL+=("circle_factory=$FACTORY_ID")
else
    warn "Factory deployment failed"
    FAILED+=("circle_factory")
fi

# 2/5: Circle (WASM install, not deploy)
info "Deploying 2/5: Circle WASM (install)"
CIRCLE_HASH=$(run soroban contract install \
    --wasm "${WASM_DIR}/circle.optimized.wasm" \
    --source moistello-deploy \
    --network "$NETWORK" 2>&1) || CIRCLE_HASH=""

if [ -n "$CIRCLE_HASH" ] && [[ "$CIRCLE_HASH" =~ ^[a-f0-9]{64}$ ]]; then
    ok "Circle WASM hash: $CIRCLE_HASH"
    SUCCESSFUL+=("circle_hash=$CIRCLE_HASH")
else
    warn "Circle WASM install failed"
    FAILED+=("circle")
fi

# 3/5: Reputation Registry
REP_ID=$(deploy_contract "3/5" "reputation_registry")
if [ -n "$REP_ID" ]; then
    ok "Reputation registry: $REP_ID"
    SUCCESSFUL+=("reputation_registry=$REP_ID")
else
    warn "Reputation registry deployment failed"
    FAILED+=("reputation_registry")
fi

# 4/5: Governance Token
TOKEN_ID=$(deploy_contract "4/5" "governance_token")
if [ -n "$TOKEN_ID" ]; then
    ok "Governance token: $TOKEN_ID"
    SUCCESSFUL+=("governance_token=$TOKEN_ID")
else
    warn "Governance token deployment failed"
    FAILED+=("governance_token")
fi

# 5/5: Treasury
TREASURY_ID=$(deploy_contract "5/5" "treasury")
if [ -n "$TREASURY_ID" ]; then
    ok "Treasury: $TREASURY_ID"
    SUCCESSFUL+=("treasury=$TREASURY_ID")
else
    warn "Treasury deployment failed"
    FAILED+=("treasury")
fi

echo ""

# ── Report failures ────────────────────────────────────────────
if [ ${#FAILED[@]} -gt 0 ]; then
    warn "Some contracts failed to deploy:"
    for f in "${FAILED[@]}"; do
        warn "  ✗ $f"
    done
    echo ""
    info "Successfully deployed (${#SUCCESSFUL[@]}):"
    for s in "${SUCCESSFUL[@]}"; do
        info "  ✓ $s"
    done
    fail "${#FAILED[@]} contract(s) failed — check network, gas, and CLI output above"
fi

# ── Save contract IDs to .env (overwrite, no append) ───────────
info "Saving contract IDs to $ENV_FILE"
set_env_var "CONTRACT_FACTORY" "$FACTORY_ID" "$ENV_FILE"
set_env_var "CONTRACT_CIRCLE_HASH" "$CIRCLE_HASH" "$ENV_FILE"
set_env_var "CONTRACT_REP_REGISTRY" "$REP_ID" "$ENV_FILE"
set_env_var "CONTRACT_GOV_TOKEN" "$TOKEN_ID" "$ENV_FILE"
set_env_var "CONTRACT_TREASURY" "$TREASURY_ID" "$ENV_FILE"
ok "Contract IDs saved to .env"

run chmod 600 "$ENV_FILE"

# ── Summary ────────────────────────────────────────────────────
echo ""
info "═══ CONTRACTS DEPLOYED ═══"
info "Network:            $NETWORK"
info "Factory:            $FACTORY_ID"
info "Circle WASM Hash:   $CIRCLE_HASH"
info "Reputation:         $REP_ID"
info "Governance Token:   $TOKEN_ID"
info "Treasury:           $TREASURY_ID"
info "Secrets file:       $ENV_FILE"

mark_done "10"
ok "Contract deployment complete"
