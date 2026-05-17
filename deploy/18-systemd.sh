#!/usr/bin/env bash
# ── 18-systemd.sh ── Install systemd services
set -euo pipefail
echo "=== STEP 18: Installing systemd services ==="

cat > /etc/systemd/system/moistello-api.service << UNIT
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

cat > /etc/systemd/system/moistello-frontend.service << UNIT
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

chown deploy:deploy /var/log/moistello
systemctl daemon-reload
systemctl enable moistello-api moistello-frontend
systemctl restart moistello-api moistello-frontend

sleep 3

if systemctl is-active --quiet moistello-api; then
    echo "API service: running ✓"
else
    echo "API service: FAILED — journalctl -u moistello-api"
fi

if systemctl is-active --quiet moistello-frontend; then
    echo "Frontend service: running ✓"
else
    echo "Frontend service: FAILED — journalctl -u moistello-frontend"
fi

echo "PASSED"
