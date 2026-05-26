#!/usr/bin/env bash
# ── 14-docker-start.sh ── Start all Docker services
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"

step_header "STEP 14: Starting Docker Services"

COMPOSE_DIR="${APP_DIR}/backend"
BASE_COMPOSE="${COMPOSE_DIR}/docker-compose.yml"
PROD_COMPOSE="${COMPOSE_DIR}/docker-compose.prod.yml"
SECRETS_FILE="${APP_DIR}/secrets/.env"

require_command docker

# ── Verify secrets file exists ─────────────────────────────────
if [ ! -f "$SECRETS_FILE" ]; then
    fail "Secrets file not found: $SECRETS_FILE — run 08-secrets.sh first"
fi

# ── Check Docker daemon is running ─────────────────────────────
if ! docker info &>/dev/null; then
    fail "Docker daemon is not running. Start it with: systemctl start docker"
fi
ok "Docker daemon is running"

# ── Verify compose files exist ─────────────────────────────────
if [ ! -f "$BASE_COMPOSE" ]; then
    fail "Base compose file not found: $BASE_COMPOSE"
fi
if [ ! -f "$PROD_COMPOSE" ]; then
    fail "Production compose file not found: $PROD_COMPOSE — run 13-docker-compose.sh first"
fi

# ── Pull images ────────────────────────────────────────────────
info "Pulling Docker images..."
run docker compose --env-file "$SECRETS_FILE" -f "$BASE_COMPOSE" -f "$PROD_COMPOSE" pull

# ── Start services ─────────────────────────────────────────────
info "Starting services (with --wait --remove-orphans)..."
run docker compose --env-file "$SECRETS_FILE" -f "$BASE_COMPOSE" -f "$PROD_COMPOSE" up -d --wait --remove-orphans

# ── Wait for all services healthy ──────────────────────────────
MAX_ATTEMPTS=30
INTERVAL=2
info "Waiting for all services to become healthy (max ${MAX_ATTEMPTS} attempts, ${INTERVAL}s interval)..."

HEALTHY=false
for attempt in $(seq 1 $MAX_ATTEMPTS); do
     # Count unhealthy or starting services
     UNHEALTHY_COUNT=$(docker compose --env-file "$SECRETS_FILE" -f "$BASE_COMPOSE" -f "$PROD_COMPOSE" ps --format json 2>/dev/null | \
         python3 -c "import sys,json; data=[json.loads(l) for l in sys.stdin.readlines()]; print(sum(1 for d in data if d.get('Health','') not in ('healthy','')))" 2>/dev/null || echo 999)

    if [ "$UNHEALTHY_COUNT" = "0" ]; then
        HEALTHY=true
        break
    fi
    echo -n "  Attempt ${attempt}/${MAX_ATTEMPTS}: ${UNHEALTHY_COUNT} service(s) not yet healthy..."
    sleep "$INTERVAL"
    echo " retrying"
done

if [ "$HEALTHY" = false ]; then
     warn "Some services did not become healthy within timeout"
     info "Docker compose logs (last 50 lines per service):"
     run docker compose --env-file "$SECRETS_FILE" -f "$BASE_COMPOSE" -f "$PROD_COMPOSE" logs --tail 50
     fail "One or more services failed to reach healthy state — check logs above"
fi

ok "All services healthy"
ok "Docker services started successfully"

mark_done "14"
