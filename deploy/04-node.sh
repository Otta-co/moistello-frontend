#!/usr/bin/env bash
# ── 04-node.sh ── Install Node.js 20 LTS via nodesource
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"

STEP="04"
skip_if_done "$STEP" && exit 0

step_header "Installing Node.js 20 LTS"

require_root

# ── Check if Node.js 20+ is already installed ──────────────────
# Regex matches v20-99 via substring match (v2[0-9] covers v20-v29)
if command -v node &>/dev/null; then
    CURRENT_NODE=$(node --version 2>/dev/null || echo "unknown")
    if echo "$CURRENT_NODE" | grep -qE '^v2[0-9]'; then
        ok "Node.js 20+ already installed: $CURRENT_NODE"
        if command -v npm &>/dev/null; then
            ok "npm $(npm --version) available"
        fi
        mark_done "$STEP"
        step_end
        exit 0
    else
        warn "Older Node.js detected: $CURRENT_NODE — will upgrade to 20 LTS"
    fi
fi

# ── Validate prerequisites ──────────────────────────────────────
require_command "curl"

# ── Add nodesource repository ───────────────────────────────────
info "Adding NodeSource repository for Node.js 20.x"
run curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# ── Update apt after adding new repo ────────────────────────────
info "Updating package index after adding NodeSource repo"
export DEBIAN_FRONTEND=noninteractive
run apt-get update -qq

# ── Install Node.js ─────────────────────────────────────────────
info "Installing nodejs"
run apt-get install -y -qq nodejs

# ── Verify Node.js ──────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    fail "node binary not found after installation"
fi

NODE_VERSION=$(node --version)
ok "Node.js: $NODE_VERSION"

if ! echo "$NODE_VERSION" | grep -qE '^v2[0-9]'; then
    fail "Installed Node.js version does not meet 20+ requirement: $NODE_VERSION"
fi

# ── Verify npm ──────────────────────────────────────────────────
if ! command -v npm &>/dev/null; then
    fail "npm not found after Node.js installation"
fi

NPM_VERSION=$(npm --version)
ok "npm: $NPM_VERSION"

# ── Mark step complete ──────────────────────────────────────────
mark_done "$STEP"
step_end
