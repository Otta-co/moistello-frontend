#!/usr/bin/env bash
# ── rebuild.sh ── Pull latest code, rebuild, restart, verify health
# Usage: bash /opt/moistello/frontend/deploy/rebuild.sh
# Run from production VPS after pushing changes to GitHub.
# Handles frontend-only, backend-only, or both repos changing.
source "$(dirname "$0")/lib/common.sh"
set -euo pipefail

FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend"
BIN_DIR="$APP_DIR/bin"

step_header "Rebuild Moistello"

# ── Frontend ──
step_header "Frontend"
if [ -d "$FRONTEND_DIR" ]; then
    info "Pulling latest..."
    cd "$FRONTEND_DIR"
    run git pull origin master

    info "Installing dependencies..."
    run npm ci

    info "Building..."
    run npm run build

    ok "Frontend build complete"
else
    warn "Frontend directory not found at $FRONTEND_DIR — skipping"
fi

# ── Backend ──
step_header "Backend"
if [ -d "$BACKEND_DIR" ]; then
    info "Pulling latest..."
    cd "$BACKEND_DIR"
    run git pull origin master

    info "Downloading Go modules..."
    run go mod download

    info "Building static binary..."
    mkdir -p "$BIN_DIR"
    CGO_ENABLED=0 run go build \
        -ldflags="-s -w -extldflags '-static'" \
        -trimpath \
        -o "$BIN_DIR/moistello-api" \
        ./cmd/api-server

    if [ ! -f "$BIN_DIR/moistello-api" ]; then
        fail "Binary not found after build"
    fi
    ok "Backend build complete ($(du -h "$BIN_DIR/moistello-api" | cut -f1))"
else
    warn "Backend directory not found at $BACKEND_DIR — skipping"
fi

# ── Restart Services ──
step_header "Restarting services"
run sudo systemctl daemon-reload
run sudo systemctl restart moistello-api moistello-frontend
ok "Services restarted"

# ── Health Checks ──
step_header "Health checks"
info "Backend (port 1100)..."
wait_for_http "http://127.0.0.1:1100/health" 30
info "Frontend (port 1110)..."
wait_for_http "http://127.0.0.1:1110" 30

echo ""
ok "Rebuild complete — $DOMAIN is live"
