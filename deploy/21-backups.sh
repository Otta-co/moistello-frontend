#!/usr/bin/env bash
# ── 21-backups.sh ── Database backup cron
set -euo pipefail
echo "=== STEP 21: Configuring backups ==="

cat > /opt/moistello/scripts/backup.sh << 'EOF'
#!/bin/bash
set -euo pipefail
D=/opt/moistello/backups
mkdir -p "$D"
TS=$(date +%Y%m%d-%H%M%S)
docker exec moistello-postgres pg_dump -U moistello moistello 2>/dev/null \
    | gzip > "$D/postgres-${TS}.sql.gz"
find "$D" -name "postgres-*.sql.gz" -mtime +30 -delete 2>/dev/null || true
echo "[$(date -Iseconds)] Backup: postgres-${TS}.sql.gz ($(du -h $D/postgres-${TS}.sql.gz 2>/dev/null | cut -f1))"
EOF

chmod +x /opt/moistello/scripts/backup.sh
chown deploy:deploy /opt/moistello/scripts/backup.sh

if ! crontab -u deploy -l 2>/dev/null | grep -q 'backup.sh'; then
    (crontab -u deploy -l 2>/dev/null; echo "0 */6 * * * /opt/moistello/scripts/backup.sh >> /var/log/moistello/backup.log 2>&1") | crontab -u deploy -
fi

echo "Backups: every 6 hours, 30-day retention ✓"
echo "PASSED"
