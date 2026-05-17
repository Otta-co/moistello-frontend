#!/usr/bin/env bash
# ── 08-secrets.sh ── Generate all application secrets
source "$(dirname "$0")/lib/common.sh"

step_header "STEP 08: Generating secrets"

if skip_if_done "08"; then exit 0; fi

require_command openssl

SECRETS_DIR="$APP_DIR/secrets"
ENV_FILE="$SECRETS_DIR/.env"
JWT_PRIVATE="$SECRETS_DIR/jwt-private.pem"
JWT_PUBLIC="$SECRETS_DIR/jwt-public.pem"

run mkdir -p "$SECRETS_DIR"

# ── Backup existing files if re-running ────────────────────────
backup_file "$ENV_FILE"
backup_file "$JWT_PRIVATE"
backup_file "$JWT_PUBLIC"

# ── Generate infrastructure passwords ──────────────────────────
info "Generating infrastructure passwords"
PG_PW=$(run openssl rand -base64 32 | tr -d '+/=')
RD_PW=$(run openssl rand -base64 32 | tr -d '+/=')
MQ_PW=$(run openssl rand -base64 32 | tr -d '+/=')
JWT_PASSPHRASE=$(run openssl rand -base64 32 | tr -d '+/=')
ok "Passwords generated (base64, URL-safe)"

# ── Stellar keypair ────────────────────────────────────────────
if [ -n "${STELLAR_SECRET_KEY:-}" ]; then
    STELLAR_SECRET="$STELLAR_SECRET_KEY"
    info "STELLAR_SECRET_KEY provided via environment — deriving public key"
    STELLAR_PUBLIC=""
    if command -v soroban &>/dev/null; then
        STELLAR_PUBLIC=$(run soroban keys address "$STELLAR_SECRET" 2>/dev/null || echo "")
    fi
    if [ -z "$STELLAR_PUBLIC" ] && command -v stellar &>/dev/null; then
        STELLAR_PUBLIC=$(run stellar keys address "$STELLAR_SECRET" 2>/dev/null || echo "")
    fi
    if [ -z "$STELLAR_PUBLIC" ]; then
        STELLAR_PUBLIC="COULD_NOT_DERIVE"
        warn "Could not derive public key from secret — please set STELLAR_PUBLIC_KEY manually"
    fi
    ok "Using provided Stellar keypair"
else
    warn "No STELLAR_SECRET_KEY in environment — writing placeholders"
    STELLAR_SECRET="REPLACE_WITH_YOUR_PRIVATE_KEY"
    STELLAR_PUBLIC="REPLACE_WITH_YOUR_PUBLIC_KEY"
    info "Edit $ENV_FILE with your real keys before running step 09"
fi

# ── Generate JWT RSA keys ──────────────────────────────────────
info "Generating JWT RSA-2048 keypair"
run openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 \
    -aes-256-cbc -pass "pass:$JWT_PASSPHRASE" \
    -out "$JWT_PRIVATE" 2>/dev/null
run openssl rsa -pubout -in "$JWT_PRIVATE" \
    -passin "pass:$JWT_PASSPHRASE" \
    -out "$JWT_PUBLIC" 2>/dev/null
run chmod 600 "$JWT_PRIVATE"
run chmod 644 "$JWT_PUBLIC"
ok "JWT RSA-2048 keys generated"

# ── Write .env file ────────────────────────────────────────────
info "Writing secrets to $ENV_FILE"
cat > "$ENV_FILE" << ENVEOF
# ── Infrastructure ──────────────────────────────────────────
POSTGRES_PW=${PG_PW}
REDIS_PW=${RD_PW}
RABBITMQ_PW=${MQ_PW}

# ── Stellar ─────────────────────────────────────────────────
STELLAR_PUBLIC_KEY=${STELLAR_PUBLIC}
STELLAR_SECRET_KEY=${STELLAR_SECRET}

# ── JWT ─────────────────────────────────────────────────────
JWT_PRIVATE=${JWT_PRIVATE}
JWT_PUBLIC=${JWT_PUBLIC}
JWT_PASSPHRASE=${JWT_PASSPHRASE}
ENVEOF

run chmod 600 "$ENV_FILE"
run chown deploy:deploy "$SECRETS_DIR" 2>/dev/null || true
ok ".env written and permissions set"

# ── Summary ────────────────────────────────────────────────────
echo ""
info "═══ SECRETS GENERATED ═══"
info "Stellar public:  $STELLAR_PUBLIC"
info "Secrets file:    $ENV_FILE"
info "JWT private:     $JWT_PRIVATE"
info "JWT public:      $JWT_PUBLIC"
echo ""
if [ "$STELLAR_PUBLIC" = "REPLACE_WITH_YOUR_PUBLIC_KEY" ]; then
    warn "Edit $ENV_FILE with your real Stellar keys, then run step 09"
    echo ""
    warn "Min recommended balance: 200 XLM"
    echo ""
fi

mark_done "08"
ok "Secrets generation complete"
