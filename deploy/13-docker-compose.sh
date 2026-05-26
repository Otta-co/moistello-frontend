#!/usr/bin/env bash
# ── 13-docker-compose.sh ── Write Docker Compose production override
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"

step_header "STEP 13: Docker Compose Production Override"

SECRETS_FILE="${APP_DIR}/secrets/.env"
COMPOSE_FILE="${APP_DIR}/backend/docker-compose.prod.yml"
BASE_COMPOSE="${APP_DIR}/backend/docker-compose.yml"

if [ ! -f "$SECRETS_FILE" ]; then
    fail "Secrets file not found: $SECRETS_FILE — run 08-secrets.sh first"
fi

# shellcheck source=/dev/null
source "$SECRETS_FILE"

require_command docker

# ── Write production override ───────────────────────────────────
backup_file "$COMPOSE_FILE"

cat > "$COMPOSE_FILE" << 'COMPOSEEOF'
services:
  postgres:
    environment:
      POSTGRES_DB: moistello
      POSTGRES_USER: moistello
      POSTGRES_PASSWORD: "${POSTGRES_PW}"
    ports:
      - "127.0.0.1:9811:5432"
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    command: redis-server --requirepass "${REDIS_PW}" --maxmemory 256mb --maxmemory-policy allkeys-lru
    ports:
      - "127.0.0.1:9808:6379"
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  rabbitmq:
    environment:
      RABBITMQ_DEFAULT_USER: moistello
      RABBITMQ_DEFAULT_PASS: "${RABBITMQ_PW}"
    ports:
      - "127.0.0.1:9809:5672"
      - "127.0.0.1:9810:15672"
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  postgres_data:
COMPOSEEOF

ok "Production override written to $COMPOSE_FILE"

# ── Validate YAML syntax ───────────────────────────────────────
if [ -f "$BASE_COMPOSE" ]; then
    info "Validating Compose YAML syntax..."
    if docker compose -f "$BASE_COMPOSE" -f "$COMPOSE_FILE" config --dry-run &>/dev/null; then
        ok "Compose YAML syntax valid"
    else
        warn "docker compose config validation failed — check YAML syntax"
        docker compose -f "$BASE_COMPOSE" -f "$COMPOSE_FILE" config --dry-run 2>&1 || true
    fi
else
    warn "No base docker-compose.yml found at $BASE_COMPOSE — skipping YAML validation"
fi

mark_done "13"
