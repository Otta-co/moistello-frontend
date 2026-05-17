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
# Docker: detect if already installed (docker-ce OR docker.io) to avoid conflicts
PACKAGES=(
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

# Only add docker.io if Docker is NOT already present
if command -v docker &>/dev/null; then
    info "Docker already installed ($(docker --version 2>/dev/null | head -1)), skipping docker.io package"
else
    # Remove conflicting containerd if present, then install from Docker official repo
    if dpkg -l containerd 2>/dev/null | grep -q '^ii'; then
        info "Removing conflicting containerd package"
        run apt-get remove -y -qq containerd
    fi
    info "Installing Docker from official repo"
    run curl -fsSL https://get.docker.com | bash
fi

# Only add docker-compose-v2 if docker compose plugin is NOT already present
if docker compose version &>/dev/null 2>&1; then
    info "Docker Compose already installed (plugin), skipping docker-compose-v2 package"
else
    PACKAGES+=(docker-compose-v2)
fi

info "Installing packages: ${PACKAGES[*]}"
run apt-get install -y -qq "${PACKAGES[@]}"

# ── Verify each critical package was installed ──────────────────
info "Verifying package installation"

CRITICAL_BINARIES=(
    "docker:dockerd"
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

# Docker Compose: check for plugin (docker compose) or standalone (docker-compose)
if docker compose version &>/dev/null 2>&1; then
    ok "Docker Compose: plugin available (docker compose)"
elif command -v docker-compose &>/dev/null; then
    ok "Docker Compose: standalone binary ($(command -v docker-compose))"
else
    fail "Docker Compose not available — install docker-compose-v2 or docker compose plugin"
fi

# ── Mark step complete ──────────────────────────────────────────
mark_done "$STEP"
step_end
