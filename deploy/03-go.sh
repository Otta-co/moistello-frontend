#!/usr/bin/env bash
# ── 03-go.sh ── Install Go 1.23 (latest 1.23.x)
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"

STEP="03"
skip_if_done "$STEP" && exit 0

step_header "Installing Go 1.23"

require_root

GO_VERSION="1.23.4"
GO_TARBALL="go${GO_VERSION}.linux-amd64.tar.gz"
GO_URL="https://go.dev/dl/${GO_TARBALL}"

# ── Check if Go 1.23+ is already installed ──────────────────────
# Regex matches go1.23-1.99 (includes 1.30+ via substring match)
if command -v go &>/dev/null; then
    CURRENT_GO=$(go version 2>/dev/null || echo "unknown")
    if echo "$CURRENT_GO" | grep -qE 'go1\.2[3-9]|go1\.[3-9]'; then
        ok "Go 1.23+ already installed: $CURRENT_GO"
        mark_done "$STEP"
        step_end
        exit 0
    else
        warn "Older Go version detected: $CURRENT_GO — will upgrade to $GO_VERSION"
    fi
fi

# ── Download Go tarball ─────────────────────────────────────────
info "Downloading $GO_URL"
run curl -fsSL "$GO_URL" -o "/tmp/${GO_TARBALL}"

# ── Download and verify SHA256 checksum ─────────────────────────
info "Verifying SHA256 checksum"
CHECKSUMS_URL="https://go.dev/dl/${GO_TARBALL}.sha256"
EXPECTED_SHA256=$(run curl -fsSL "$CHECKSUMS_URL" 2>/dev/null | awk '{print $1}')

if [ -n "$EXPECTED_SHA256" ]; then
    ACTUAL_SHA256=$(sha256sum "/tmp/${GO_TARBALL}" | awk '{print $1}')
    if [ "$ACTUAL_SHA256" = "$EXPECTED_SHA256" ]; then
        ok "SHA256 verified: $ACTUAL_SHA256"
    else
        fail "SHA256 mismatch — expected $EXPECTED_SHA256, got $ACTUAL_SHA256"
    fi
else
    warn "Could not fetch checksum from $CHECKSUMS_URL — skipping verification"
fi

# ── Backup existing Go installation ─────────────────────────────
if [ -d /usr/local/go ]; then
    BACKUP_DIR="/usr/local/go.bak.$(date +%s)"
    info "Backing up existing Go to $BACKUP_DIR"
    run mv /usr/local/go "$BACKUP_DIR"
    ok "Backed up previous Go installation"
fi

# ── Extract and install ─────────────────────────────────────────
info "Extracting Go $GO_VERSION to /usr/local"
run rm -rf /usr/local/go
run tar -C /usr/local -xzf "/tmp/${GO_TARBALL}"
run rm -f "/tmp/${GO_TARBALL}"

# ── Set up profile for login shells ─────────────────────────────
info "Setting up /etc/profile.d/go.sh"
cat > /etc/profile.d/go.sh <<'GOEOF'
export PATH=$PATH:/usr/local/go/bin
GOEOF
run chmod 644 /etc/profile.d/go.sh
ok "Created /etc/profile.d/go.sh"

# Make Go available in the current shell
export PATH="$PATH:/usr/local/go/bin"

# ── Verify installation ─────────────────────────────────────────
if ! command -v go &>/dev/null; then
    fail "Go binary not found after installation"
fi

INSTALLED_VERSION=$(go version)
ok "Go installed: $INSTALLED_VERSION"

if ! echo "$INSTALLED_VERSION" | grep -qE 'go1\.2[3-9]|go1\.[3-9]'; then
    fail "Installed Go version does not meet 1.23+ requirement: $INSTALLED_VERSION"
fi

# ── Mark step complete ──────────────────────────────────────────
mark_done "$STEP"
step_end
