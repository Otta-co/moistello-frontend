#!/usr/bin/env bash
# ── 15-migrations.sh ── Run database migrations
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"

step_header "STEP 15: Database Migrations"

BACKEND_ENV="${APP_DIR}/backend/.env"
MIGRATE_BIN="${APP_DIR}/bin/migrate"
BACKEND_DIR="${APP_DIR}/backend"

if [ ! -f "$BACKEND_ENV" ]; then
    fail "Backend .env not found: $BACKEND_ENV — run 12-backend-env.sh first"
fi

# ── Export DATABASE_URL from backend .env ──────────────────────
DB_URL=$(grep '^MOISTELLO_DATABASE_URL=' "$BACKEND_ENV" | cut -d= -f2-)
if [ -z "$DB_URL" ]; then
    fail "MOISTELLO_DATABASE_URL not found in $BACKEND_ENV"
fi
export DATABASE_URL="$DB_URL"

# ── Verify PostgreSQL is accepting connections ──────────────────
# Extract connection details from the URL
DB_HOST=$(echo "$DB_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DB_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')

if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ]; then
    fail "Could not parse host/port from DATABASE_URL: $DB_URL"
fi

info "Verifying PostgreSQL connectivity at ${DB_HOST}:${DB_PORT}..."

if ! wait_for_port "$DB_HOST" "$DB_PORT" 15; then
    fail "PostgreSQL is not accepting connections at ${DB_HOST}:${DB_PORT}"
fi

# Quick connectivity check with psql if available
if command -v psql &>/dev/null; then
    if PGPASSWORD="${POSTGRES_PW:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U moistello -d moistello -c "SELECT 1;" &>/dev/null; then
        ok "PostgreSQL connection verified"
    else
        fail "PostgreSQL connection failed — check credentials and network"
    fi
else
    ok "PostgreSQL port ${DB_HOST}:${DB_PORT} is reachable (psql not available for full check)"
fi

# ── Build migrate tool if not built ────────────────────────────
if [ ! -f "$MIGRATE_BIN" ]; then
    info "Building migrate tool..."
    if [ ! -d "$BACKEND_DIR" ]; then
         fail "Backend directory not found: $BACKEND_DIR"
     fi
     (cd "$BACKEND_DIR" && run go build -o "$MIGRATE_BIN" ./cmd/migrate)
     ok "Migrate tool built: $MIGRATE_BIN"
else
    ok "Migrate tool already exists: $MIGRATE_BIN"
fi

# ── Run migrations ─────────────────────────────────────────────
info "Running migrations..."
MIGRATION_OUTPUT=""
set +e
MIGRATION_OUTPUT=$(run "$MIGRATE_BIN" --direction up 2>&1)
MIGRATION_EXIT=$?
set -e

echo "$MIGRATION_OUTPUT"

if [ $MIGRATION_EXIT -ne 0 ]; then
    warn "Migration failed with exit code $MIGRATION_EXIT"

    # Try to determine which migration file failed
    FAILED_FILE=$(echo "$MIGRATION_OUTPUT" | grep -oP '(?<=error: |ERROR: |failed: |at )\S+\.(sql|up\.sql)' | tail -1 || true)
    if [ -n "$FAILED_FILE" ]; then
        warn "Failed migration file: $FAILED_FILE"
    fi

    fail "Database migrations failed — see output above"
fi

ok "Migrations applied successfully"

mark_done "15"
