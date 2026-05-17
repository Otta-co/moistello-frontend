#!/usr/bin/env bash
# ── 08-secrets.sh ── Generate all secrets
# Requires: STELLAR_SECRET_KEY env var (optional - generates keypair if not set)
set -euo pipefail
echo "=== STEP 08: Generating secrets ==="
DIR=/opt/moistello/secrets
mkdir -p "$DIR"

# Infrastructure passwords
PG_PW=$(openssl rand -base64 32)
RD_PW=$(openssl rand -base64 32)
MQ_PW=$(openssl rand -base64 32)
echo "Infrastructure passwords generated"

# Stellar keypair
if [ -n "${STELLAR_SECRET_KEY:-}" ]; then
    STELLAR_SECRET="$STELLAR_SECRET_KEY"
    STELLAR_PUBLIC=$(stellar keys address "$STELLAR_SECRET" 2>/dev/null || echo "INVALID_KEY")
    echo "Using provided Stellar keypair"
else
    OUT=$(stellar keys generate --no-fund 2>&1 || true)
    STELLAR_PUBLIC=$(echo "$OUT" | grep -oP 'G[A-Z2-7]{55}' | head -1)
    STELLAR_SECRET=$(echo "$OUT" | grep -oP 'S[A-Z2-7]{55}' | head -1)
    echo "New Stellar keypair generated"
fi

# JWT keys
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$DIR/jwt-private.pem" 2>/dev/null
openssl rsa -pubout -in "$DIR/jwt-private.pem" -out "$DIR/jwt-public.pem" 2>/dev/null
chmod 600 "$DIR/jwt-private.pem"
echo "JWT keys generated"

# Write .env
cat > "$DIR/.env" << ENVEOF
POSTGRES_PW=${PG_PW}
REDIS_PW=${RD_PW}
RABBITMQ_PW=${MQ_PW}
STELLAR_PUBLIC_KEY=${STELLAR_PUBLIC}
STELLAR_SECRET_KEY=${STELLAR_SECRET}
JWT_PRIVATE=${DIR}/jwt-private.pem
JWT_PUBLIC=${DIR}/jwt-public.pem
ENVEOF
chmod 600 "$DIR/.env"
chown -R deploy:deploy "$DIR"

echo ""
echo "=== SECRETS GENERATED ==="
echo "Stellar public:  $STELLAR_PUBLIC"
echo "Secrets file:    $DIR/.env"
echo ""
echo "⚠  FUND THIS ACCOUNT before proceeding to contract deployment:"
echo "   Buy XLM on Kraken/Coinbase → withdraw to: $STELLAR_PUBLIC"
echo "   Minimum: 200 XLM (~\$30)"
echo "PASSED"
