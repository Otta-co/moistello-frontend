#!/usr/bin/env bash
# ── 03-go.sh ── Install Go 1.23
set -euo pipefail
echo "=== STEP 03: Installing Go 1.23 ==="
if command -v go &>/dev/null && go version | grep -q 'go1\.2[3-9]'; then
    echo "Go already installed: $(go version)"
else
    curl -fsSL "https://go.dev/dl/go1.23.4.linux-amd64.tar.gz" -o /tmp/go.tar.gz
    rm -rf /usr/local/go
    tar -C /usr/local -xzf /tmp/go.tar.gz
    rm /tmp/go.tar.gz
    echo 'export PATH=$PATH:/usr/local/go/bin' > /etc/profile.d/go.sh
    export PATH=$PATH:/usr/local/go/bin
fi
echo "Go: $(go version | awk '{print $3}')"
echo "PASSED"
