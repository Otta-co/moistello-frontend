#!/usr/bin/env bash
# ── 07-user.sh ── Deploy user, directories, and sudoers
source "$(dirname "$0")/lib/common.sh"

step_header "STEP 07: Creating deploy user and directories"

if skip_if_done "07"; then exit 0; fi

require_root

# ── Create docker group ────────────────────────────────────────
if ! getent group docker &>/dev/null; then
    info "Creating docker group"
    run groupadd docker
    ok "Docker group created"
else
    ok "Docker group already exists"
fi

# ── Create deploy user ─────────────────────────────────────────
if ! id -u deploy &>/dev/null; then
    info "Creating deploy user"
    run useradd -m -s /bin/bash deploy
    ok "Deploy user created"
else
    ok "Deploy user already exists"
fi

# ── Add deploy to docker group ─────────────────────────────────
if ! id -nG deploy 2>/dev/null | grep -qw docker; then
    info "Adding deploy user to docker group"
    run usermod -aG docker deploy
    ok "Added deploy to docker group"
else
    ok "Deploy user already in docker group"
fi

# ── Write and validate sudoers file ────────────────────────────
SUDOERS_FILE="/etc/sudoers.d/deploy"
info "Writing sudoers file: $SUDOERS_FILE"
cat > /tmp/deploy-sudoers << 'SUDOEOF'
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl, /usr/bin/journalctl, /usr/sbin/nginx, /usr/bin/docker, /usr/bin/docker-compose, /usr/sbin/ufw
SUDOEOF
run cp /tmp/deploy-sudoers "$SUDOERS_FILE"
run chmod 440 "$SUDOERS_FILE"

info "Validating sudoers syntax with visudo"
if run visudo -c -f "$SUDOERS_FILE"; then
    ok "Sudoers file validated successfully"
else
    run rm -f "$SUDOERS_FILE"
    fail "Sudoers validation failed — file removed for safety"
fi
run rm -f /tmp/deploy-sudoers

# ── Create application directories ─────────────────────────────
info "Creating application directories"
run mkdir -p /opt/moistello/{bin,scripts,secrets,backups}
run mkdir -p /var/log/moistello
ok "Directories created"

# ── Set ownership (excluding .git directories) ─────────────────
info "Setting ownership to deploy:deploy"
run find /opt/moistello /var/log/moistello \
    \( -name .git -type d -prune \) \
    -o -exec chown deploy:deploy {} \+ 2>/dev/null || true
ok "Ownership set (excluding .git directories)"

mark_done "07"
ok "User and directories step complete"
