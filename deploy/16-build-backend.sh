#!/usr/bin/env bash
# ── 16-build-backend.sh ── Compile Go backend binary
set -euo pipefail
echo "=== STEP 16: Building backend binary ==="
cd /opt/moistello/backend

export PATH=$PATH:/usr/local/go/bin
CGO_ENABLED=0 go build -ldflags="-s -w" -o /opt/moistello/bin/moistello-api ./cmd/api-server

chown deploy:deploy /opt/moistello/bin/moistello-api
chmod 755 /opt/moistello/bin/moistello-api

echo "Binary: /opt/moistello/bin/moistello-api ($(du -h /opt/moistello/bin/moistello-api | cut -f1))"
echo "PASSED"
