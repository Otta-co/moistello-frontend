#!/usr/bin/env bash
# ── 12-backend-env.sh ── Write backend .env from secrets
set -euo pipefail
echo "=== STEP 12: Writing backend environment ==="
source /opt/moistello/secrets/.env

DOMAIN="${DOMAIN:-moistello.com}"
NETWORK="${NETWORK:-mainnet}"

if [ "$NETWORK" = "mainnet" ]; then
    HORIZON="https://horizon.stellar.org"
    RPC="https://soroban.stellar.org"
    PASSPHRASE="Public Global Stellar Network ; September 2015"
else
    HORIZON="https://horizon-testnet.stellar.org"
    RPC="https://soroban-testnet.stellar.org"
    PASSPHRASE="Test SDF Network ; September 2015"
fi

cat > /opt/moistello/backend/.env << ENVEOF
MOISTELLO_ENVIRONMENT=production
MOISTELLO_SERVER_PORT=1100
MOISTELLO_SERVER_HOST=127.0.0.1
MOISTELLO_DATABASE_URL=postgres://moistello:${POSTGRES_PW}@127.0.0.1:5432/moistello?sslmode=disable
MOISTELLO_REDIS_URL=redis://:${REDIS_PW}@127.0.0.1:6379
MOISTELLO_RABBITMQ_URL=amqp://moistello:${RABBITMQ_PW}@127.0.0.1:5672/
MOISTELLO_AUTH_JWT_PRIVATE_KEY_PATH=/opt/moistello/secrets/jwt-private.pem
MOISTELLO_AUTH_JWT_PUBLIC_KEY_PATH=/opt/moistello/secrets/jwt-public.pem
MOISTELLO_AUTH_ACCESS_TOKEN_TTL=15m
MOISTELLO_AUTH_REFRESH_TOKEN_TTL=168h
MOISTELLO_CORS_ALLOWED_ORIGINS=https://${DOMAIN}
MOISTELLO_LOGGING_LEVEL=info
MOISTELLO_LOGGING_FORMAT=json
MOISTELLO_STELLAR_NETWORK=${NETWORK}
MOISTELLO_STELLAR_HORIZON_URL=${HORIZON}
MOISTELLO_STELLAR_SOROBAN_RPC_URL=${RPC}
MOISTELLO_STELLAR_NETWORK_PASSPHRASE=${PASSPHRASE}
MOISTELLO_STELLAR_MASTER_PUBLIC_KEY=${STELLAR_PUBLIC_KEY}
MOISTELLO_STELLAR_MASTER_SECRET_KEY=${STELLAR_SECRET_KEY}
MOISTELLO_CONTRACT_FACTORY=${CONTRACT_FACTORY:-}
MOISTELLO_CONTRACT_CIRCLE_HASH=${CONTRACT_CIRCLE_HASH:-}
MOISTELLO_CONTRACT_REP_REGISTRY=${CONTRACT_REP_REGISTRY:-}
MOISTELLO_CONTRACT_GOV_TOKEN=${CONTRACT_GOV_TOKEN:-}
MOISTELLO_CONTRACT_TREASURY=${CONTRACT_TREASURY:-}
ENVEOF

chmod 600 /opt/moistello/backend/.env
chown deploy:deploy /opt/moistello/backend/.env
ln -sf /opt/moistello/secrets/jwt-private.pem /opt/moistello/backend/config/keys/jwt-private.pem 2>/dev/null || mkdir -p /opt/moistello/backend/config/keys && cp /opt/moistello/secrets/jwt-private.pem /opt/moistello/backend/config/keys/
ln -sf /opt/moistello/secrets/jwt-public.pem /opt/moistello/backend/config/keys/jwt-public.pem 2>/dev/null || cp /opt/moistello/secrets/jwt-public.pem /opt/moistello/backend/config/keys/
chmod 600 /opt/moistello/backend/config/keys/jwt-private.pem

echo "Backend .env written"
echo "PASSED"
