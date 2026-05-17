#!/usr/bin/env bash
# ── 01-bootstrap.sh ── Preflight checks + clone repositories
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"

STEP="01"
skip_if_done "$STEP" && exit 0

step_header "Bootstrap — preflight checks + repository clone"

# ── Preflight checks ────────────────────────────────────────────
require_root
require_ubuntu

IP=$(public_ip)
if [ "$IP" = "unknown" ]; then
    warn "Could not determine public IP — continuing anyway"
else
    ok "Public IP: $IP"
fi

# ── Install minimum prerequisites ───────────────────────────────
info "Installing minimum prerequisites (curl, git, ca-certificates)"
export DEBIAN_FRONTEND=noninteractive
run apt-get update -qq
run apt-get install -y -qq curl git ca-certificates
require_command "curl"
require_command "git"

# ── DNS check using getent (no dnsutils needed) ─────────────────
info "Checking DNS resolution for $DOMAIN"
if ! getent hosts "$DOMAIN" &>/dev/null; then
    warn "DNS not yet resolving for $DOMAIN — SSL/domain steps will need this later"
else
    ok "DNS resolves for $DOMAIN"
fi

# ── Create app directory structure ──────────────────────────────
info "Creating directory structure under $APP_DIR"
run mkdir -p "$APP_DIR"

# ── Clone repositories (idempotent) ─────────────────────────────
# ONLY 01-bootstrap.sh clones. No other script clones repos.

declare -A REPOS
REPOS=(
    ["backend"]="https://github.com/Otta-co/moistello-backend.git"
    ["frontend"]="https://github.com/Otta-co/moistello-frontend.git"
    ["contracts"]="https://github.com/Otta-co/moistello-contracts.git"
)

for name in "${!REPOS[@]}"; do
    target="$APP_DIR/$name"
    repo_url="${REPOS[$name]}"

    if [ -d "$target/.git" ]; then
        ok "Repository already exists: $target"
    else
        info "Cloning $repo_url → $target"
        run mkdir -p "$target"
        run git clone --depth 1 "$repo_url" "$target"
        ok "Cloned $name"
    fi
done

# ── Verify expected files exist ─────────────────────────────────
info "Verifying repository contents"

EXPECTED_FILES=(
    "$APP_DIR/backend/go.mod"
    "$APP_DIR/frontend/package.json"
    "$APP_DIR/contracts/Cargo.toml"
)

for f in "${EXPECTED_FILES[@]}"; do
    if [ -f "$f" ]; then
        ok "Found expected file: $f"
    else
        fail "Missing expected file: $f — check repository clone"
    fi
done

# ── Mark step complete ──────────────────────────────────────────
mark_done "$STEP"
step_end
