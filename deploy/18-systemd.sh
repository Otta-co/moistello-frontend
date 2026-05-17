#!/usr/bin/env bash
# ── 18-systemd.sh ── Install and start systemd services
source "$(dirname "$0")/lib/common.sh"
set -euo pipefail

step_start "Install systemd services"
skip_if_done "18" && exit 0

require_root

info "Writing systemd unit files..."

backup_file "/etc/systemd/system/moistello-api.service"
cat > /etc/systemd/system/moistello-api.service << 'UNIT'
[Unit]
Description=Moistello API Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/moistello/backend
EnvironmentFile=/opt/moistello/backend/.env
ExecStart=/opt/moistello/bin/moistello-api
Restart=always
RestartSec=5
StandardOutput=append:/var/log/moistello/api.log
StandardError=append:/var/log/moistello/api-error.log
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
UNIT
ok "moistello-api.service written"

backup_file "/etc/systemd/system/moistello-frontend.service"
cat > /etc/systemd/system/moistello-frontend.service << 'UNIT'
[Unit]
Description=Moistello Frontend (Next.js)
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/moistello/frontend
Environment=NODE_ENV=production
Environment=PORT=1110
ExecStart=/usr/bin/node /opt/moistello/frontend/node_modules/.bin/next start
Restart=always
RestartSec=5
StandardOutput=append:/var/log/moistello/frontend.log
StandardError=append:/var/log/moistello/frontend-error.log
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
UNIT
ok "moistello-frontend.service written"

info "Validating unit files with systemd-analyze..."
if command -v systemd-analyze &>/dev/null; then
    systemd-analyze verify /etc/systemd/system/moistello-api.service 2>&1 || warn "systemd-analyze reported warnings for moistello-api (non-fatal)"
    systemd-analyze verify /etc/systemd/system/moistello-frontend.service 2>&1 || warn "systemd-analyze reported warnings for moistello-frontend (non-fatal)"
    ok "Unit files validated"
else
    warn "systemd-analyze not available; skipping validation"
fi

mkdir -p /var/log/moistello
chown deploy:deploy /var/log/moistello 2>/dev/null || true

run systemctl daemon-reload

info "Enabling services..."
run systemctl enable moistello-api moistello-frontend
ok "Services enabled"

info "Starting services (start if new, restart if already running)..."
for svc in moistello-api moistello-frontend; do
    if systemctl is-active --quiet "$svc" 2>/dev/null; then
        info "$svc is already running — restarting"
        run systemctl restart "$svc"
    else
        info "$svc is not running — starting"
        run systemctl start "$svc"
    fi
done

info "Waiting for services to become healthy (up to 60s)..."

# Check backend health endpoint
info "Checking backend: curl http://127.0.0.1:1100/health"
ATTEMPTS=0
while [ $ATTEMPTS -lt 60 ]; do
    if curl -sf http://127.0.0.1:1100/health >/dev/null 2>&1; then
        ok "Backend health endpoint responding"
        break
    fi
    ATTEMPTS=$((ATTEMPTS + 1))
    sleep 1
done
if [ $ATTEMPTS -ge 60 ]; then
    warn "Backend did not respond within 60s — checking journal:"
    systemctl status moistello-api --no-pager -l 2>&1 | tail -10 || true
fi

# Check frontend
info "Checking frontend: curl -I http://127.0.0.1:1110"
ATTEMPTS=0
while [ $ATTEMPTS -lt 60 ]; do
    if curl -sfI http://127.0.0.1:1110 >/dev/null 2>&1; then
        ok "Frontend responding"
        break
    fi
    ATTEMPTS=$((ATTEMPTS + 1))
    sleep 1
done
if [ $ATTEMPTS -ge 60 ]; then
    warn "Frontend did not respond within 60s — checking journal:"
    systemctl status moistello-frontend --no-pager -l 2>&1 | tail -10 || true
fi

mark_done "18"
step_end
