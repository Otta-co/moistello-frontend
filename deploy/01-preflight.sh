#!/usr/bin/env bash
# ── 01-preflight.sh ── System checks
set -euo pipefail
echo "=== STEP 01: Pre-flight checks ==="
[[ $EUID -eq 0 ]] || { echo "Must run as root"; exit 1; }
grep -q '^ID=ubuntu' /etc/os-release || { echo "Ubuntu required"; exit 1; }
IP=$(curl -4sf https://ifconfig.me || echo "unknown")
echo "Public IP: $IP"
echo "PASSED"
