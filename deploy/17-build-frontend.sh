#!/usr/bin/env bash
# ── 17-build-frontend.sh ── Build Next.js frontend
source "$(dirname "$0")/lib/common.sh"
set -euo pipefail

step_start "Build frontend"
skip_if_done "17" && exit 0

require_command "node"
require_command "npm"

info "Writing .env.local..."
cat > "$APP_DIR/frontend/.env.local" << ENVEOF
NEXT_PUBLIC_API_URL=https://${DOMAIN}/v1
NEXT_PUBLIC_WS_URL=wss://${DOMAIN}/ws
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${WALLETCONNECT_PROJECT_ID:-}
NEXT_PUBLIC_PASSKEY_RP_ID=${DOMAIN}
NEXT_PUBLIC_PASSKEY_PEPPER=${PASSKEY_PEPPER:-moistello-passkey-pepper-v1}
NEXT_PUBLIC_FEATURE_MULTI_WALLET=true
NEXT_PUBLIC_FEATURE_PASSKEY=true
NEXT_PUBLIC_FEATURE_HARDWARE_WALLET=true
NEXT_PUBLIC_FEATURE_GOVERNANCE=true
NEXT_PUBLIC_FEATURE_REPUTATION_TIERS=true
ENVEOF
ok ".env.local written"

info "Installing dependencies (npm ci — all dependencies, including dev)..."
cd "$APP_DIR/frontend"
BUILD_LOG=$(mktemp)
if ! npm ci 2>&1 | tee "$BUILD_LOG"; then
    fail "npm ci failed — last 50 lines:"
    tail -50 "$BUILD_LOG"
    exit 1
fi
ok "npm ci complete"

info "Building (npm run build)..."
> "$BUILD_LOG"
if ! npm run build 2>&1 | tee "$BUILD_LOG"; then
    fail "npm run build failed — last 50 lines:"
    tail -50 "$BUILD_LOG"
    exit 1
fi
rm -f "$BUILD_LOG"

if [ ! -d "$APP_DIR/frontend/.next" ]; then
    fail ".next directory not found after build"
fi
ok ".next directory verified"

chown -R deploy:deploy "$APP_DIR/frontend/.next" "$APP_DIR/frontend/.env.local" 2>/dev/null || true
mark_done "17"
step_end
