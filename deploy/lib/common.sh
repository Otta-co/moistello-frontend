#!/usr/bin/env bash
# ── common.sh ── Shared utilities for all deploy scripts
# Source this at the top of every script: source "$(dirname "$0")/lib/common.sh"
set -euo pipefail

# ── Configuration ──────────────────────────────────────────────
# All scripts read these from environment or use defaults
export DOMAIN="${DOMAIN:-moistello.com}"
export NETWORK="${NETWORK:-mainnet}"
export APP_DIR="${APP_DIR:-/opt/moistello}"
export LOG_DIR="${LOG_DIR:-/var/log/moistello}"
export DRY_RUN="${DRY_RUN:-false}"

# Derive Stellar URLs from network
if [ "$NETWORK" = "mainnet" ]; then
    export STELLAR_HORIZON="https://horizon.stellar.org"
    export STELLAR_RPC="https://soroban.stellar.org"
    export STELLAR_PASSPHRASE="Public Global Stellar Network ; September 2015"
else
    export STELLAR_HORIZON="https://horizon-testnet.stellar.org"
    export STELLAR_RPC="https://soroban-testnet.stellar.org"
    export STELLAR_PASSPHRASE="Test SDF Network ; September 2015"
fi

# ── Colors ─────────────────────────────────────────────────────
R='\033[0;31m' G='\033[0;32m' Y='\033[1;33m' B='\033[1;34m' W='\033[1;37m' N='\033[0m'

# ── Logging ────────────────────────────────────────────────────
_LOGFILE=""
_init_log() {
    _LOGFILE="${LOG_DIR}/deploy-$(date +%Y%m%d).log"
    mkdir -p "$LOG_DIR"
}

log()   { _init_log; echo -e "[$(date -Iseconds)] $1" | tee -a "$_LOGFILE"; }
ok()    { log "  ${G}✓${N} $1"; }
warn()  { log "  ${Y}⚠${N}  $1"; }
fail()  { log "  ${R}✗${N} $1"; exit 1; }
info()  { log "  ${B}→${N} $1"; }
step_header() { echo ""; log "${W}═══ $1 ═══${N}"; }

# ── Dry-Run ────────────────────────────────────────────────────
# Prefix any command with 'run' for dry-run support
# Usage: run apt install -y curl
run() {
    if [ "$DRY_RUN" = "true" ]; then
        log "  ${Y}[DRY]${N} $*"
    else
        "$@"
    fi
}

# ── Validation ─────────────────────────────────────────────────
require_root() {
    if [ "$EUID" -ne 0 ]; then fail "Must run as root (current: $(whoami))"; fi
}

require_ubuntu() {
    if ! grep -q '^ID=ubuntu' /etc/os-release 2>/dev/null; then
        fail "Ubuntu required (detected: $(grep '^ID=' /etc/os-release 2>/dev/null || echo unknown))"
    fi
}

require_command() {
    local cmd="$1"
    local pkg="${2:-$cmd}"
    if ! command -v "$cmd" &>/dev/null; then
        fail "$cmd not found. Install: apt install -y $pkg"
    fi
}

require_env() {
    local var="$1"
    if [ -z "${!var:-}" ]; then
        fail "Environment variable $var is required but not set"
    fi
}

# ── Idempotency ────────────────────────────────────────────────
_IDS_DIR="${APP_DIR}/.deploy-state"
_init_state_dir() { mkdir -p "$_IDS_DIR"; }

mark_done() {
    _init_state_dir
    local step="$1"
    touch "$_IDS_DIR/${step}.done"
    echo "$(date -Iseconds)" > "$_IDS_DIR/${step}.done"
    ok "Marked $step as done"
}

is_done() {
    _init_state_dir
    local step="$1"
    [ -f "$_IDS_DIR/${step}.done" ]
}

skip_if_done() {
    local step="$1"
    if is_done "$step"; then
        local when
        when=$(cat "$_IDS_DIR/${step}.done")
        info "$step already completed at $when — skipping"
        return 0
    fi
    return 1
}

# ── File Safety ────────────────────────────────────────────────
# Backup a file before modifying it
backup_file() {
    local file="$1"
    if [ -f "$file" ]; then
        local bk="${file}.bak.$(date +%s)"
        cp "$file" "$bk"
        info "Backed up $file → $bk"
    fi
}

# ── Network ────────────────────────────────────────────────────
public_ip() {
    curl -4sf https://ifconfig.me 2>/dev/null || \
    curl -4sf https://api.ipify.org 2>/dev/null || \
    echo "unknown"
}

dns_resolves() {
    local domain="$1"
    # Use dig or getent instead of 'host' (which requires dnsutils)
    getent hosts "$domain" &>/dev/null || dig +short "$domain" &>/dev/null || return 1
}

# ── Service Health ─────────────────────────────────────────────
wait_for_http() {
    local url="$1" timeout="${2:-30}"
    local elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if curl -sf "$url" >/dev/null 2>&1; then
            ok "Service at $url is healthy"
            return 0
        fi
        sleep 1
        elapsed=$((elapsed + 1))
    done
    warn "Service at $url did not respond within ${timeout}s"
    return 1
}

wait_for_port() {
    local host="$1" port="$2" timeout="${3:-30}"
    local elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null; then
            ok "Port $host:$port is open"
            return 0
        fi
        sleep 1
        elapsed=$((elapsed + 1))
    done
    warn "Port $host:$port did not open within ${timeout}s"
    return 1
}

# ── Checksum ───────────────────────────────────────────────────
verify_sha256() {
    local file="$1" expected="$2"
    local actual
    actual=$(sha256sum "$file" 2>/dev/null | awk '{print $1}')
    if [ "$actual" != "$expected" ]; then
        fail "Checksum mismatch for $file: expected $expected, got $actual"
    fi
    ok "Checksum verified: $file"
}

# ── Progress ───────────────────────────────────────────────────
_step_num=0
_total_steps=22
step_start() {
    _step_num=$((_step_num + 1))
    echo -e "\n${W}── [$_step_num/$_total_steps] $1 ──${N}"
}

step_end() {
    ok "Step $_step_num complete"
}
