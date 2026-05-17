#!/usr/bin/env bash
# ── 15-migrations.sh ── Apply database migrations
set -euo pipefail
echo "=== STEP 15: Running database migrations ==="
cd /opt/moistello/backend

# Install migrate tool if needed
if [ ! -f /opt/moistello/bin/migrate ]; then
    go build -o /opt/moistello/bin/migrate ./cmd/migrate
fi

/opt/moistello/bin/migrate --direction up 2>&1
echo "PASSED"
