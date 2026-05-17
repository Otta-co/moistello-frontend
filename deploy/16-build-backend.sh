#!/usr/bin/env bash
# ── 16-build-backend.sh ── Compile Go backend binary
source "$(dirname "$0")/lib/common.sh"
set -euo pipefail

step_start "Build backend binary"
skip_if_done "16" && exit 0

require_command "go"

info "Downloading Go modules..."
cd "$APP_DIR/backend"
run go mod download
ok "Go modules downloaded"

info "Building static binary (CGO_ENABLED=0, stripped)..."
mkdir -p "$APP_DIR/bin"
CGO_ENABLED=0 run go build \
    -ldflags="-s -w -extldflags '-static'" \
    -trimpath \
    -o "$APP_DIR/bin/moistello-api" \
    ./cmd/api-server

if [ ! -f "$APP_DIR/bin/moistello-api" ]; then
    fail "Binary not found at $APP_DIR/bin/moistello-api"
fi

if [ ! -x "$APP_DIR/bin/moistello-api" ]; then
    fail "Binary is not executable"
fi

if [ ! -s "$APP_DIR/bin/moistello-api" ]; then
    fail "Binary is zero-size"
fi
ok "Binary exists, executable, and non-zero ($(du -h "$APP_DIR/bin/moistello-api" | cut -f1))"

info "Smoke-testing binary..."
SMOKE=$("$APP_DIR/bin/moistello-api" --help 2>&1 | head -1 || true)
if [ -n "$SMOKE" ]; then
    ok "Smoke-test: $SMOKE"
else
    warn "Binary produced no --help output but is executable"
fi

chown deploy:deploy "$APP_DIR/bin/moistello-api" 2>/dev/null || true
chmod 755 "$APP_DIR/bin/moistello-api"

mark_done "16"
step_end
