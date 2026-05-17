#!/usr/bin/env bash
# ── 22-monitoring.sh ── Health monitor + auto-updates
set -euo pipefail
echo "=== STEP 22: Configuring monitoring ==="

cat > /opt/moistello/scripts/health-check.sh << 'EOF'
#!/bin/bash
echo "=== $(date -Iseconds) ==="
echo "DISK:  $(df -h / | tail -1 | awk '{print $5 " (" $3 "/" $2 ")"}')"
echo "MEM:   $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "LOAD:  $(uptime | awk -F'load average:' '{print $2}')"
echo "API:   $(systemctl is-active moistello-api 2>/dev/null || echo dead)"
echo "FRONT: $(systemctl is-active moistello-frontend 2>/dev/null || echo dead)"
echo "PG:    $(docker inspect -f '{{.State.Status}}' moistello-postgres 2>/dev/null || echo down)"
echo "REDIS: $(docker inspect -f '{{.State.Status}}' moistello-redis 2>/dev/null || echo down)"
echo "RMQ:   $(docker inspect -f '{{.State.Status}}' moistello-rabbitmq 2>/dev/null || echo down)"
EOF

chmod +x /opt/moistello/scripts/health-check.sh
chown deploy:deploy /opt/moistello/scripts/health-check.sh

if ! crontab -u deploy -l 2>/dev/null | grep -q 'health-check.sh'; then
    (crontab -u deploy -l 2>/dev/null; echo "*/15 * * * * /opt/moistello/scripts/health-check.sh >> /var/log/moistello/health.log 2>&1") | crontab -u deploy -
fi

# Auto security updates
apt install -y -qq unattended-upgrades >/dev/null 2>&1 || true
cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

echo "Health monitor: every 15 min ✓"
echo "Auto security updates: enabled ✓"
echo "PASSED"
