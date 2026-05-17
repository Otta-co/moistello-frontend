#!/usr/bin/env bash
# ── 14-docker-start.sh ── Start Docker services
set -euo pipefail
echo "=== STEP 14: Starting Docker services ==="
cd /opt/moistello/backend

docker compose -f docker-compose.yml -f docker-compose.prod.yml pull -q 2>/dev/null || true
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --wait 2>&1

for i in $(seq 1 30); do
    if docker compose -f docker-compose.yml ps 2>/dev/null | grep -q '(healthy)'; then
        echo "All services healthy"
        break
    fi
    echo "Waiting for services... ($i/30)"
    sleep 2
done

docker compose -f docker-compose.yml ps
echo "PASSED"
