#!/usr/bin/env bash
# ── 05-swap.sh ── 2GB swap
set -euo pipefail
echo "=== STEP 05: Configuring swap (2GB) ==="
if swapon --show | grep -q .; then
    echo "Swap already active"
else
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
swapon --show
echo "PASSED"
