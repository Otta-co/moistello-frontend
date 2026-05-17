#!/usr/bin/env bash
# ── 09-fund-check.sh ── Verify Stellar account is funded
set -euo pipefail
echo "=== STEP 09: Verify Stellar account is funded ==="
source /opt/moistello/secrets/.env

if [ -z "${STELLAR_PUBLIC_KEY:-}" ]; then
    echo "ERROR: No Stellar public key found. Run 08-secrets.sh first."
    exit 1
fi

# Check balance on mainnet
BALANCE=$(curl -sf "https://horizon.stellar.org/accounts/${STELLAR_PUBLIC_KEY}" \
    | python3 -c "
import json,sys
try:
    data=json.load(sys.stdin)
    for b in data['balances']:
        if b['asset_type']=='native': print(b['balance']); break
except: print('0')
" 2>/dev/null || echo "0")

if [ "$BALANCE" = "0" ] || [ -z "$BALANCE" ]; then
    echo "Account not found on mainnet or zero balance."
    echo ""
    echo "FUND THIS ACCOUNT before proceeding:"
    echo "  1. Buy XLM on Kraken/Coinbase"
    echo "  2. Withdraw to: ${STELLAR_PUBLIC_KEY}"
    echo "  3. Minimum: 200 XLM"
    echo ""
    echo "Re-run this script after funding."
    exit 1
fi

echo "Balance: $BALANCE XLM ✓"
echo "PASSED"
