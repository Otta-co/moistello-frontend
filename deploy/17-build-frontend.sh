#!/usr/bin/env bash
# ── 17-build-frontend.sh ── Build Next.js frontend
set -euo pipefail
echo "=== STEP 17: Building frontend ==="
DOMAIN="${DOMAIN:-moistello.com}"

cat > /opt/moistello/frontend/.env.local << FEEOF
NEXT_PUBLIC_API_URL=https://${DOMAIN}/v1
NEXT_PUBLIC_WS_URL=wss://${DOMAIN}/ws
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_PASSKEY_RP_ID=${DOMAIN}
NEXT_PUBLIC_PASSKEY_PEPPER=moistello-passkey-pepper-v1
NEXT_PUBLIC_FEATURE_MULTI_WALLET=true
NEXT_PUBLIC_FEATURE_PASSKEY=true
NEXT_PUBLIC_FEATURE_HARDWARE_WALLET=true
NEXT_PUBLIC_FEATURE_GOVERNANCE=true
NEXT_PUBLIC_FEATURE_REPUTATION_TIERS=true
FEEOF

cd /opt/moistello/frontend
npm ci --omit=dev --silent 2>&1 | tail -3
npm run build 2>&1 | tail -5

chown -R deploy:deploy /opt/moistello/frontend/.next /opt/moistello/frontend/.env.local
echo "PASSED"
