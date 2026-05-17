#!/usr/bin/env bash
# ── 09-fund-check.sh ── Verify Stellar account is funded
source "$(dirname "$0")/lib/common.sh"

step_header "STEP 09: Verifying Stellar account funding"

if skip_if_done "09"; then exit 0; fi

require_command curl

ENV_FILE="$APP_DIR/secrets/.env"
if [ ! -f "$ENV_FILE" ]; then
    fail "Secrets file not found at $ENV_FILE — run 08-secrets.sh first"
fi

source "$ENV_FILE"

# ── Check for placeholder keys ─────────────────────────────────
if [ "${STELLAR_SECRET_KEY:-}" = "REPLACE_WITH_YOUR_PRIVATE_KEY" ] || \
   [ "${STELLAR_PUBLIC_KEY:-}" = "REPLACE_WITH_YOUR_PUBLIC_KEY" ]; then
    warn "Placeholder Stellar keys detected"
    echo ""
    info "Edit the secrets file with your real keys:"
    info "  vi $ENV_FILE"
    echo ""
    info "Replace these lines:"
    info "  STELLAR_SECRET_KEY=REPLACE_WITH_YOUR_PRIVATE_KEY"
    info "  STELLAR_PUBLIC_KEY=REPLACE_WITH_YOUR_PUBLIC_KEY"
    echo ""
    info "With your actual keys (generate at https://lab.stellar.org):"
    info "  STELLAR_SECRET_KEY=S..."
    info "  STELLAR_PUBLIC_KEY=G..."
    echo ""
    info "Fund the account with at least 10 XLM on $NETWORK."
    info "Then re-run this script."
    echo ""
    fail "Cannot proceed with placeholder keys"
fi

if [ -z "${STELLAR_PUBLIC_KEY:-}" ]; then
    fail "STELLAR_PUBLIC_KEY is empty or not set in $ENV_FILE"
fi

# ── Query Horizon for account balance ──────────────────────────
info "Querying $STELLAR_HORIZON for account: ${STELLAR_PUBLIC_KEY:0:12}..."

ACCOUNT_JSON=$(run curl -sf "${STELLAR_HORIZON}/accounts/${STELLAR_PUBLIC_KEY}" 2>&1) || true

if [ -z "$ACCOUNT_JSON" ]; then
    warn "Account not found on $NETWORK (${STELLAR_HORIZON})"
    echo ""
    info "Fund this account before proceeding:"
    info "  1. Buy XLM on an exchange (Kraken, Coinbase, etc.)"
    info "  2. Withdraw to: ${STELLAR_PUBLIC_KEY}"
    info "  3. Minimum: 10 XLM (recommended: 200 XLM)"
    echo ""
    info "Re-run this script after funding."
    echo ""
    fail "Account ${STELLAR_PUBLIC_KEY} not found on $NETWORK"
fi

BALANCE=$(echo "$ACCOUNT_JSON" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    for b in data.get('balances', []):
        if b.get('asset_type') == 'native':
            print(b.get('balance', '0'))
            break
    else:
        print('0')
except Exception:
    print('0')
" 2>/dev/null || echo "0")

info "Account found — native balance: $BALANCE XLM"

# ── Numeric comparison: require >= 10 XLM ──────────────────────
MIN_BALANCE=10
INSUFFICIENT=$(python3 -c "
b = float('${BALANCE:-0}')
print('1' if b < ${MIN_BALANCE} else '0')
" 2>/dev/null || echo "1")

if [ "$INSUFFICIENT" = "1" ]; then
    warn "Account balance ($BALANCE XLM) is below minimum ($MIN_BALANCE XLM)"
    echo ""
    info "Add more XLM to this account:"
    info "  Address: ${STELLAR_PUBLIC_KEY}"
    info "  Current balance: $BALANCE XLM"
    info "  Required minimum: $MIN_BALANCE XLM"
    info "  Recommended: 200 XLM (for ~5 contract deployments)"
    echo ""
    info "Re-run this script after funding."
    echo ""
    fail "Insufficient balance on $NETWORK"
fi

ok "Account balance ($BALANCE XLM) meets minimum requirement ($MIN_BALANCE XLM)"

mark_done "09"
ok "Funding check complete"
