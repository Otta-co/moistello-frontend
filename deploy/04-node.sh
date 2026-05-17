#!/usr/bin/env bash
# ── 04-node.sh ── Install Node.js 20 LTS
set -euo pipefail
echo "=== STEP 04: Installing Node.js 20 LTS ==="
if command -v node &>/dev/null && node --version | grep -q 'v2[0-9]'; then
    echo "Node already installed: $(node --version)"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y -qq nodejs
fi
echo "Node: $(node --version) / npm: $(npm --version)"
echo "PASSED"
