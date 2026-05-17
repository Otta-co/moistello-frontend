#!/usr/bin/env bash
# ── 12-backend-env.sh ── Write backend .env from secrets
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"

step_header "STEP 12: Backend Environment Configuration"

SECRETS_FILE="${APP_DIR}/secrets/.env"
BACKEND_ENV="${APP_DIR}/backend/.env"
KEYS_DIR="${APP_DIR}/backend/config/keys"

# ── Validate prerequisites ─────────────────────────────────────
if [ ! -f "$SECRETS_FILE" ]; then
    fail "Secrets file not found: $SECRETS_FILE — run 08-secrets.sh first"
fi
if [ ! -d "${APP_DIR}/backend" ]; then
    fail "Backend repo not found: ${APP_DIR}/backend — run 11-clone-repos.sh first"
fi

# ── Source secrets ─────────────────────────────────────────────
# shellcheck source=/dev/null
source "$SECRETS_FILE"

# Validate critical secrets
for var in POSTGRES_PW REDIS_PW RABBITMQ_PW STELLAR_PUBLIC_KEY STELLAR_SECRET_KEY; do
    if [ -z "${!var:-}" ] || [ "${!var}" = "REPLACE_WITH_YOUR_PRIVATE_KEY" ] || [ "${!var}" = "REPLACE_WITH_YOUR_PUBLIC_KEY" ]; then
        fail "$var is not set or still contains placeholder in $SECRETS_FILE"
    fi
done

# ── Contract IDs (set by 10-deploy-contracts.sh) ───────────────
CONTRACT_FACTORY="${CONTRACT_FACTORY:-}"
CONTRACT_CIRCLE_HASH="${CONTRACT_CIRCLE_HASH:-}"
CONTRACT_REP_REGISTRY="${CONTRACT_REP_REGISTRY:-}"
CONTRACT_GOV_TOKEN="${CONTRACT_GOV_TOKEN:-}"
CONTRACT_TREASURY="${CONTRACT_TREASURY:-}"

# ── CORS origins ───────────────────────────────────────────────
CORS_ORIGINS="https://${DOMAIN},https://www.${DOMAIN}"

# ── Write backend .env ─────────────────────────────────────────
backup_file "$BACKEND_ENV"

cat > "$BACKEND_ENV" << ENVEOF
MOISTELLO_ENVIRONMENT=production
MOISTELLO_SERVER_PORT=1100
MOISTELLO_SERVER_HOST=127.0.0.1
MOISTELLO_DATABASE_URL=postgres://moistello:${POSTGRES_PW}@127.0.0.1:5432/moistello?sslmode=disable
MOISTELLO_REDIS_URL=redis://:${REDIS_PW}@127.0.0.1:6379
MOISTELLO_RABBITMQ_URL=amqp://moistello:${RABBITMQ_PW}@127.0.0.1:5672/
MOISTELLO_AUTH_JWT_PRIVATE_KEY_PATH=/opt/moistello/backend/config/keys/jwt-private.pem
MOISTELLO_AUTH_JWT_PUBLIC_KEY_PATH=/opt/moistello/backend/config/keys/jwt-public.pem
MOISTELLO_AUTH_ACCESS_TOKEN_TTL=15m
MOISTELLO_AUTH_REFRESH_TOKEN_TTL=168h
MOISTELLO_CORS_ALLOWED_ORIGINS=${CORS_ORIGINS}
MOISTELLO_LOGGING_LEVEL=info
MOISTELLO_LOGGING_FORMAT=json
MOISTELLO_STELLAR_NETWORK=${NETWORK}
MOISTELLO_STELLAR_HORIZON_URL=${STELLAR_HORIZON}
MOISTELLO_STELLAR_SOROBAN_RPC_URL=${STELLAR_RPC}
MOISTELLO_STELLAR_NETWORK_PASSPHRASE=${STELLAR_PASSPHRASE}
MOISTELLO_STELLAR_MASTER_PUBLIC_KEY=${STELLAR_PUBLIC_KEY}
MOISTELLO_STELLAR_MASTER_SECRET_KEY=${STELLAR_SECRET_KEY}
MOISTELLO_CONTRACT_FACTORY=${CONTRACT_FACTORY}
MOISTELLO_CONTRACT_CIRCLE_HASH=${CONTRACT_CIRCLE_HASH}
MOISTELLO_CONTRACT_REP_REGISTRY=${CONTRACT_REP_REGISTRY}
MOISTELLO_CONTRACT_GOV_TOKEN=${CONTRACT_GOV_TOKEN}
MOISTELLO_CONTRACT_TREASURY=${CONTRACT_TREASURY}
ENVEOF

chmod 600 "$BACKEND_ENV"

# ── Copy JWT keys to backend config/keys ───────────────────────
JWT_PRIVATE="${APP_DIR}/secrets/jwt-private.pem"
JWT_PUBLIC="${APP_DIR}/secrets/jwt-public.pem"

for keyfile in "$JWT_PRIVATE" "$JWT_PUBLIC"; do
    if [ ! -f "$keyfile" ]; then
        fail "JWT key not found: $keyfile"
    fi
done

mkdir -p "$KEYS_DIR"
cp "$JWT_PRIVATE" "${KEYS_DIR}/jwt-private.pem"
cp "$JWT_PUBLIC" "${KEYS_DIR}/jwt-public.pem"
chmod 600 "${KEYS_DIR}/jwt-private.pem"
chmod 644 "${KEYS_DIR}/jwt-public.pem"
ok "JWT keys copied to $KEYS_DIR"

# ── Validate the resulting .env ─────────────────────────────────
REQUIRED_VARS=(
    MOISTELLO_ENVIRONMENT
    MOISTELLO_SERVER_PORT
    MOISTELLO_SERVER_HOST
    MOISTELLO_DATABASE_URL
    MOISTELLO_REDIS_URL
    MOISTELLO_RABBITMQ_URL
    MOISTELLO_AUTH_JWT_PRIVATE_KEY_PATH
    MOISTELLO_AUTH_JWT_PUBLIC_KEY_PATH
    MOISTELLO_CORS_ALLOWED_ORIGINS
    MOISTELLO_STELLAR_NETWORK
    MOISTELLO_STELLAR_HORIZON_URL
    MOISTELLO_STELLAR_SOROBAN_RPC_URL
    MOISTELLO_STELLAR_MASTER_PUBLIC_KEY
)

info "Validating backend .env..."
MISSING_VARS=()
while IFS='=' read -r key value; do
    for req in "${REQUIRED_VARS[@]}"; do
        if [ "$key" = "$req" ] && [ -z "$value" ]; then
            MISSING_VARS+=("$key")
        fi
    done
done < <(grep -v '^#' "$BACKEND_ENV" | grep -v '^$' || true)

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    fail "Missing or empty required variables: ${MISSING_VARS[*]}"
fi

# Validate DB URL format: postgres://user:pass@host:port/dbname?options
DB_URL=$(grep '^MOISTELLO_DATABASE_URL=' "$BACKEND_ENV" | cut -d= -f2-)
if ! echo "$DB_URL" | grep -qE '^postgres://[^:]+:[^@]+@[^:]+:[0-9]+/[^?]+'; then
    fail "MOISTELLO_DATABASE_URL format is invalid: $DB_URL"
fi

# Ensure CORS includes both domain variants
if ! grep 'MOISTELLO_CORS_ALLOWED_ORIGINS' "$BACKEND_ENV" | grep -q "www.${DOMAIN}"; then
    fail "CORS origins missing www.${DOMAIN}"
fi

# Validate values are systemd-safe (no unescaped backticks or newlines)
if grep -q '[`]' "$BACKEND_ENV"; then
    fail "Backend .env contains unescaped backticks (unsafe for systemd EnvironmentFile)"
fi
if grep -Pq '[\x00-\x08\x0b\x0c\x0e-\x1f]' "$BACKEND_ENV"; then
    fail "Backend .env contains control characters (unsafe for systemd EnvironmentFile)"
fi

ok "Backend .env validated — all required variables present and well-formed"
ok "Backend .env written to $BACKEND_ENV"

mark_done "12"
