#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"

step_header "STEP 22: Monitoring, Auto-Updates, and Log Rotation"

HEALTH_CHECK_SCRIPT="${APP_DIR}/scripts/health-check.sh"
CRON_SCHEDULE="*/15 * * * *"

# ── 1. Create health check script with ACTUAL verification ──────
info "Creating health check script at ${HEALTH_CHECK_SCRIPT}"

mkdir -p "$(dirname "$HEALTH_CHECK_SCRIPT")" "$LOG_DIR"

# Source secrets to get REDIS_PW
SECRETS_ENV="${APP_DIR}/secrets/.env"

cat > "${HEALTH_CHECK_SCRIPT}" << HEALTH_EOF
#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="${LOG_DIR}/health.log"
SECRETS_ENV="${SECRETS_ENV}"

log_msg() {
    echo "[$(date -Iseconds)] \$1" | tee -a "\${LOG_FILE}"
}

has_errors=0

# Load secrets (for REDIS_PW)
if [ -f "\${SECRETS_ENV}" ]; then
    set -a
    # shellcheck source=/dev/null
    source "\${SECRETS_ENV}"
    set +a
fi

log_msg "=== Health Check Start ==="

# ── Backend health endpoint ─────────────────────────────────────
backend_status=\$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://127.0.0.1:1100/health 2>/dev/null || echo "000")
if [ "\${backend_status}" = "200" ]; then
    log_msg "Backend (1100/health): OK (\${backend_status})"
else
    log_msg "Backend (1100/health): FAIL — HTTP \${backend_status}"
    has_errors=1
fi

# ── Frontend health ─────────────────────────────────────────────
frontend_status=\$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -I http://127.0.0.1:1110 2>/dev/null || echo "000")
if [ "\${frontend_status}" = "200" ]; then
    log_msg "Frontend (1110): OK (\${frontend_status})"
else
    log_msg "Frontend (1110): FAIL — HTTP \${frontend_status}"
    has_errors=1
fi

# ── PostgreSQL ──────────────────────────────────────────────────
pg_status=\$(docker exec moistello-postgres pg_isready -U moistello -t 10 2>&1 || echo "failed")
if echo "\${pg_status}" | grep -q "accepting connections"; then
    log_msg "PostgreSQL: OK (accepting connections)"
else
    log_msg "PostgreSQL: FAIL — \${pg_status}"
    has_errors=1
fi

# ── Redis ───────────────────────────────────────────────────────
redis_status=\$(docker exec moistello-redis redis-cli -a "\${REDIS_PW:-}" --no-auth-warning PING 2>&1 || echo "failed")
if echo "\${redis_status}" | grep -qi "PONG"; then
    log_msg "Redis: OK (PONG)"
else
    log_msg "Redis: FAIL — \${redis_status}"
    has_errors=1
fi

# ── Disk usage ──────────────────────────────────────────────────
disk_usage=\$(df -h / | awk 'NR==2 {print \$5 " (used " \$3 " of " \$2 ")"}' 2>/dev/null || echo "unknown")
disk_pct=\$(df / | awk 'NR==2 {gsub(/%/,""); print \$5}' 2>/dev/null || echo "0")
log_msg "Disk: \${disk_usage}"

if [ "\${disk_pct}" -ge 90 ] 2>/dev/null; then
    log_msg "WARNING: Disk usage above 90%"
    has_errors=1
fi

# ── Memory usage ────────────────────────────────────────────────
mem_usage=\$(free -h | awk '/^Mem:/ {print \$3 " used of " \$2 " total (" int(\$3/\$2*100) "%)"}' 2>/dev/null || echo "unknown")
log_msg "Memory: \${mem_usage}"

# ── Summary ─────────────────────────────────────────────────────
if [ "\${has_errors}" -eq 0 ]; then
    log_msg "Health Check: ALL OK"
else
    log_msg "Health Check: ERRORS DETECTED"
fi

log_msg "=== Health Check End ==="
HEALTH_EOF

chmod 755 "${HEALTH_CHECK_SCRIPT}"
chown deploy:deploy "${HEALTH_CHECK_SCRIPT}"
ok "Health check script created"

# ── 2. Install health check cron job ────────────────────────────
info "Installing health check cron job (every 15 min) for user deploy"

if ! crontab -u deploy -l 2>/dev/null | grep -q 'health-check.sh'; then
    (crontab -u deploy -l 2>/dev/null || true
     echo "${CRON_SCHEDULE} ${HEALTH_CHECK_SCRIPT} >> ${LOG_DIR}/health.log 2>&1"
    ) | crontab -u deploy -
    ok "Health check cron job installed"
else
    info "Health check cron job already exists — skipping"
fi

# ── 3. unattended-upgrades for security patches only ────────────
info "Configuring unattended-upgrades for security patches only"

run apt-get update -qq
run apt-get install -y -qq unattended-upgrades apt-listchanges

# Auto-upgrade settings: only enable automatic updates
cat > /etc/apt/apt.conf.d/20auto-upgrades << 'AUTOEOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
AUTOEOF

# Restrict to security repos only (not all packages)
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'SECEOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

Unattended-Upgrade::DevRelease "false";
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Automatic-Reboot-Time "03:00";

Unattended-Upgrade::SyslogEnable "true";
Unattended-Upgrade::SyslogFacility "daemon";
SECEOF

ok "unattended-upgrades configured (security patches only)"

# ── 4. Log rotation for /var/log/moistello/*.log ────────────────
info "Configuring log rotation for ${LOG_DIR}/*.log"

cat > /etc/logrotate.d/moistello << 'LOGEOF'
/var/log/moistello/*.log {
    daily
    missingok
    rotate 5
    maxsize 50M
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        /bin/systemctl reload nginx >/dev/null 2>&1 || true
    endscript
}
LOGEOF

# Test logrotate config
if logrotate -d /etc/logrotate.d/moistello &>/dev/null; then
    ok "Log rotation configured (max 50MB, 5 copies)"
else
    warn "Log rotation config may be invalid — check /etc/logrotate.d/moistello"
fi

mark_done "22"
ok "STEP 22 COMPLETE"
