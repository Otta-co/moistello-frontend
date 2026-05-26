#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"

step_header "STEP 21: Database Backup Automation"

BACKUP_SCRIPT="${APP_DIR}/scripts/backup.sh"
BACKUP_DIR="${APP_DIR}/backups"
RETENTION_DAYS=30
CRON_SCHEDULE="0 */6 * * *"

info "Creating backup script at ${BACKUP_SCRIPT}"

# Ensure cron is installed
if ! command -v crontab &>/dev/null; then
    if command -v apt-get &>/dev/null; then
        apt-get update -qq && apt-get install -y -qq cron
    elif command -v yum &>/dev/null; then
        yum install -y -q cronie
    fi
fi

mkdir -p "$(dirname "$BACKUP_SCRIPT")" "$BACKUP_DIR" "$LOG_DIR"
chown -R deploy:deploy "$LOG_DIR"
rm -f "${LOG_DIR}/backup.log"

cat > "${BACKUP_SCRIPT}" << 'BACKEOF'
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/opt/moistello/backups"
LOG_DIR="/var/log/moistello"
RETENTION_DAYS=30
MIN_FREE_PCT=10

log_msg() {
    echo "[$(date -Iseconds)] $1" | tee -a "${LOG_DIR}/backup.log"
}

fail_msg() {
    log_msg "ERROR: $1"
    exit 1
}

# ── Check disk space ────────────────────────────────────────────
free_pct=$(df "${BACKUP_DIR}" 2>/dev/null | awk 'NR==2 {gsub(/%/,""); print 100-$5}')
if [ -z "${free_pct}" ] || [ "${free_pct}" -lt "${MIN_FREE_PCT}" ]; then
    fail_msg "Insufficient disk space: ${free_pct:-unknown}% free (minimum ${MIN_FREE_PCT}%)"
fi

log_msg "Disk space OK: ${free_pct}% free"

# ── Run pg_dump with proper error handling ──────────────────────
mkdir -p "${BACKUP_DIR}"
TS=$(date +%Y%m%d-%H%M%S)
DUMP_FILE="${BACKUP_DIR}/postgres-${TS}.sql"
GZ_FILE="${DUMP_FILE}.gz"
TMP_RAW=$(mktemp)

# Capture both stdout and stderr; do NOT discard stderr
if docker exec moistello-postgres pg_dump -U moistello moistello > "${TMP_RAW}" 2>"${BACKUP_DIR}/.pg_dump_stderr.${TS}"; then
    log_msg "pg_dump completed successfully"
else
    EC=$?
    log_msg "pg_dump FAILED with exit code ${EC}:"
    cat "${BACKUP_DIR}/.pg_dump_stderr.${TS}" | tee -a "${LOG_DIR}/backup.log"
    rm -f "${TMP_RAW}"
    exit ${EC}
fi

# ── Compress with gzip ──────────────────────────────────────────
gzip -c "${TMP_RAW}" > "${GZ_FILE}"
rm -f "${TMP_RAW}"
rm -f "${BACKUP_DIR}/.pg_dump_stderr.${TS}"

# ── Verify the backup file is non-empty and starts with SQL header ──
if [ ! -s "${GZ_FILE}" ]; then
    fail_msg "Backup file ${GZ_FILE} is empty"
fi

HEADER=$(zcat "${GZ_FILE}" 2>/dev/null | head -1 || true)
if ! echo "${HEADER}" | grep -qiE '^(--|/\*|SET |CREATE |BEGIN|COMMIT)'; then
    fail_msg "Backup file ${GZ_FILE} does not appear to be a valid SQL dump (header: ${HEADER})"
fi

log_msg "Backup verified: valid SQL dump"

# ── Log backup size ─────────────────────────────────────────────
SIZE=$(du -h "${GZ_FILE}" 2>/dev/null | cut -f1)
log_msg "Backup created: postgres-${TS}.sql.gz (${SIZE})"

# ── Delete backups older than retention period ──────────────────
DELETED=$(find "${BACKUP_DIR}" -name "postgres-*.sql.gz" -mtime "+${RETENTION_DAYS}" -print -delete 2>/dev/null || true)
if [ -n "${DELETED}" ]; then
    echo "${DELETED}" | while read -r f; do
        log_msg "Rotated out old backup: $(basename "${f}")"
    done
fi
BACKEOF

chmod 755 "${BACKUP_SCRIPT}"
chown deploy:deploy "${BACKUP_SCRIPT}"
ok "Backup script created and permissions set"

# ── Install cron job ────────────────────────────────────────────
info "Installing backup cron job (every 6 hours) for user deploy"

if ! crontab -u deploy -l 2>/dev/null | grep -q 'backup.sh'; then
    (crontab -u deploy -l 2>/dev/null || true
     echo "${CRON_SCHEDULE} ${BACKUP_SCRIPT} >> ${LOG_DIR}/backup.log 2>&1"
    ) | crontab -u deploy -
    ok "Cron job installed"
else
    info "Cron job already exists — skipping"
fi

# ── Test the backup immediately ─────────────────────────────────
info "Running test backup now..."

if sudo -u deploy "${BACKUP_SCRIPT}"; then
    ok "Test backup completed successfully"
else
    EC=${PIPESTATUS[0]}
    fail "Test backup FAILED with exit code ${EC}. Check pg_dump errors above and ${LOG_DIR}/backup.log"
fi

mark_done "21"
ok "STEP 21 COMPLETE"
