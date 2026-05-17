#!/usr/bin/env bash
# ── 05-swap.sh ── Configure 2GB swap file
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"

STEP="05"
skip_if_done "$STEP" && exit 0

step_header "Configuring 2GB swap file"

require_root

SWAPFILE="/swapfile"
SWAP_SIZE_MB=2048

# ── Check if swap is already active ─────────────────────────────
if swapon --show 2>/dev/null | grep -q '^/' ; then
    ok "Swap is already active — current configuration:"
    swapon --show 2>/dev/null | while read -r line; do log "$line"; done
    mark_done "$STEP"
    step_end
    exit 0
fi

# ── Check available disk space ──────────────────────────────────
AVAIL_KB=$(df --output=avail / | tail -1)
AVAIL_MB=$((AVAIL_KB / 1024))
REQUIRED_MB=$((SWAP_SIZE_MB + 512))  # 512MB buffer

info "Available disk space: ${AVAIL_MB}MB (need ${REQUIRED_MB}MB)"

if [ "$AVAIL_MB" -lt "$REQUIRED_MB" ]; then
    fail "Insufficient disk space — need ${REQUIRED_MB}MB but only ${AVAIL_MB}MB available"
fi

# ── Remove existing swapfile if present but not active ──────────
if [ -f "$SWAPFILE" ]; then
    info "Removing stale swapfile"
    run swapoff "$SWAPFILE" 2>/dev/null || true
    run rm -f "$SWAPFILE"
fi

# ── Create swap file ────────────────────────────────────────────
# Try fallocate first; fall back to dd if it fails (e.g. on non-xfs/ext4)
info "Creating ${SWAP_SIZE_MB}MB swap file at $SWAPFILE"

if command -v fallocate &>/dev/null; then
    if run fallocate -l "${SWAP_SIZE_MB}M" "$SWAPFILE" 2>/dev/null; then
        ok "Created swapfile with fallocate"
    else
        warn "fallocate failed — falling back to dd"
        run dd if=/dev/zero of="$SWAPFILE" bs=1M count="$SWAP_SIZE_MB" status=progress
        ok "Created swapfile with dd"
    fi
else
    info "fallocate not available — using dd"
    run dd if=/dev/zero of="$SWAPFILE" bs=1M count="$SWAP_SIZE_MB" status=progress
    ok "Created swapfile with dd"
fi

# ── Secure permissions ──────────────────────────────────────────
info "Securing swapfile permissions"
run chmod 600 "$SWAPFILE"

# ── Format as swap ──────────────────────────────────────────────
info "Formatting $SWAPFILE as swap"
run mkswap "$SWAPFILE"

# ── Enable swap ─────────────────────────────────────────────────
info "Enabling swap"
run swapon "$SWAPFILE"

# ── Add to /etc/fstab (idempotent) ──────────────────────────────
if grep -q "^${SWAPFILE} " /etc/fstab 2>/dev/null; then
    ok "Swap entry already exists in /etc/fstab"
else
    info "Adding swap entry to /etc/fstab"
    run bash -c "echo '${SWAPFILE} none swap sw 0 0' >> /etc/fstab"
    ok "Added swap entry to /etc/fstab"
fi

# ── Verify swap is active ───────────────────────────────────────
info "Verifying swap"
if ! swapon --show 2>/dev/null | grep -q "$SWAPFILE"; then
    fail "Swap file $SWAPFILE is not active after configuration"
fi

ok "Swap is active:"
swapon --show 2>/dev/null | log

# ── Mark step complete ──────────────────────────────────────────
mark_done "$STEP"
step_end
