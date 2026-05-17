#!/usr/bin/env bash
# ── 02-packages.sh ── Install production system packages
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"

STEP="02"
skip_if_done "$STEP" && exit 0

step_header "Installing production system packages"

require_root

export DEBIAN_FRONTEND=noninteractive

# ── apt update only (no upgrade) ────────────────────────────────
info "Updating package index"
run apt-get update -qq

# ── Install minimum production packages ─────────────────────────
# No build-essential — production servers should be lean.
PACKAGES=(
    docker.io
    docker-compose-v2
    nginx
    certbot
    python3-certbot-nginx
    curl
    git
    ufw
    htop
    openssl
    dnsutils
    software-properties-common
)

info "Installing packages: ${PACKAGES[*]}"
run apt-get install -y -qq "${PACKAGES[@]}"

# ── Verify each critical package was installed ──────────────────
info "Verifying package installation"

CRITICAL_BINARIES=(
    "docker:dockerd"
    "docker-compose:docker-compose-v2"
    "nginx:nginx"
    "certbot:certbot"
    "curl:curl"
    "git:git"
    "ufw:ufw"
    "htop:htop"
    "openssl:openssl"
    "dig:dnsutils"
)

for entry in "${CRITICAL_BINARIES[@]}"; do
    cmd="${entry%%:*}"
    pkg="${entry##*:}"
    if command -v "$cmd" &>/dev/null; then
        ok "Package verified: $cmd ($(command -v "$cmd"))"
    elif dpkg -l | grep -q "^ii.*$pkg" 2>/dev/null; then
        ok "Package verified (dpkg): $pkg"
    else
        fail "Package $pkg not installed — verify apt sources"
    fi
done

# ── Mark step complete ──────────────────────────────────────────
mark_done "$STEP"
step_end
