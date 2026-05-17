#!/usr/bin/env bash
# ── 06-firewall.sh ── UFW firewall configuration
source "$(dirname "$0")/lib/common.sh"

step_header "STEP 06: Configuring firewall"

if skip_if_done "06"; then exit 0; fi

require_command ufw
require_root

# ── Backup existing UFW rules ──────────────────────────────────
info "Backing up current UFW rules to /root/ufw-backup.txt"
run ufw status numbered > /root/ufw-backup.txt 2>&1 || true
ok "UFW rules backed up"

# ── Reset and configure ────────────────────────────────────────
info "Resetting UFW to defaults"
run ufw --force reset

info "Setting default policies (deny incoming, allow outgoing)"
run ufw default deny incoming
run ufw default allow outgoing

info "Allowing SSH (22/tcp)"
run ufw allow 22/tcp

info "Allowing HTTP (80/tcp)"
run ufw allow 80/tcp

info "Allowing HTTPS (443/tcp)"
run ufw allow 443/tcp

info "Enabling UFW"
run ufw --force enable

# ── Verify SSH connectivity ────────────────────────────────────
info "Verifying port 22 is still listening"
if ss -tlnp | grep -q ':22 '; then
    ok "SSH port 22 is listening — firewall configured safely"
else
    fail "Port 22 is NOT listening after firewall changes — check connectivity immediately"
fi

run ufw status verbose

mark_done "06"
ok "Firewall step complete"
