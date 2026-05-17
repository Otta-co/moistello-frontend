#!/usr/bin/env bash
# ── 13-docker-compose.sh ── Write Docker Compose production override
set -euo pipefail
echo "=== STEP 13: Writing Docker Compose production override ==="
source /opt/moistello/secrets/.env

cat > /opt/moistello/backend/docker-compose.prod.yml << COMPOSEEOF
version: '3.8'
services:
  postgres:
    environment:
      POSTGRES_DB: moistello
      POSTGRES_USER: moistello
      POSTGRES_PASSWORD: "${POSTGRES_PW}"
    ports:
      - "127.0.0.1:5432:5432"
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    command: redis-server --requirepass "${REDIS_PW}" --maxmemory 256mb --maxmemory-policy allkeys-lru
    ports:
      - "127.0.0.1:6379:6379"
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  rabbitmq:
    environment:
      RABBITMQ_DEFAULT_USER: moistello
      RABBITMQ_DEFAULT_PASS: "${RABBITMQ_PW}"
    ports:
      - "127.0.0.1:5672:5672"
      - "127.0.0.1:15672:15672"
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  postgres_data:
COMPOSEEOF

chown deploy:deploy /opt/moistello/backend/docker-compose.prod.yml
echo "PASSED"
