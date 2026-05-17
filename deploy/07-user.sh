#!/usr/bin/env bash
# ── 07-user.sh ── Deploy user + directories
set -euo pipefail
echo "=== STEP 07: Creating deploy user and directories ==="
if ! id -u deploy &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG docker deploy
    echo "deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl, /usr/bin/journalctl, /usr/sbin/nginx" > /etc/sudoers.d/deploy
    chmod 440 /etc/sudoers.d/deploy
fi
mkdir -p /opt/moistello/{bin,scripts,secrets,backups}
mkdir -p /var/log/moistello
chown -R deploy:deploy /opt/moistello /var/log/moistello
echo "User deploy ready. Dirs created."
echo "PASSED"
