#!/usr/bin/env bash
# ── 06-firewall.sh ── UFW firewall
set -euo pipefail
echo "=== STEP 06: Configuring firewall ==="
ufw --force reset >/dev/null 2>&1
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow 22/tcp >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null 2>&1
ufw status verbose
echo "PASSED"
