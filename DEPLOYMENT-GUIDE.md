# Moistello — VPS Deployment Guide

## 1. Architecture Overview

```
                                     INTERNET
                                        │
                                   ┌────▼────┐
                                   │ Cloudflare│  (optional: DDoS, CDN, DNS)
                                   └────┬────┘
                                        │
                                  ┌─────▼─────┐
                                  │   Nginx    │  :80 → 301 :443
                                  │  :443 SSL  │  Let's Encrypt auto-renew
                                  └──┬─────┬───┘
                                     │     │
                            /api/*   │     │  /*
                            /v1/*    │     │
                            /ws      │     │
                                     ▼     ▼
                           ┌──────────┐  ┌──────────────┐
                           │ Backend  │  │  Frontend     │
                           │ Go :1100 │  │ Next.js :1110 │
                           │ (binary) │  │ (Node 18+)   │
                           └──┬───┬───┘  └──────────────┘
                              │   │   │
                     ┌────────┘   │   └──────────┐
                     ▼            ▼              ▼
              ┌──────────┐ ┌──────────┐ ┌────────────┐
              │PostgreSQL│ │  Redis   │ │ RabbitMQ   │
              │16-alpine │ │7-alpine  │ │3-management│
              │  :5432   │ │  :6379   │ │:5672 :15672│
              └──────────┘ └──────────┘ └────────────┘
                     │
                     ▼
              ┌──────────┐
              │  Backups │  (S3 / local volume / cron)
              │  pg_dump │
              └──────────┘

DOMAIN:  moistello.app  (example — replace with yours)
         └── moistello.app → Frontend Next.js
         └── moistello.app/v1/* → Backend Go API
         └── moistello.app/ws → WebSocket
```

## 2. VPS Sizing

| Component   | RAM   | Disk  | Notes                                   |
|-------------|-------|-------|-----------------------------------------|
| PostgreSQL | 512M  | 5G    | Grows with circles + members + history |
| Redis      | 256M  | 1G    | Session cache, rate-limit counters     |
| RabbitMQ   | 512M  | 2G    | Notification queue, webhook dispatch   |
| Go backend | 256M  | 0.5G  | Compiled binary is ~15MB               |
| Next.js    | 512M  | 0.5G  | SSR per-request memory, 171KB JS bundle|
| OS overhead| 512M  | 3G    | Systemd, Docker, Nginx, logs           |
| **Total**  |**~2.5G**|**12G**|                                        |

### Recommended Specs

| Tier    | CPU   | RAM  | Disk  | Provider      | Cost/mo | For                    |
|---------|-------|------|-------|---------------|---------|------------------------|
| Minimal | 2 vCPU| 4 GB | 20 GB | Hetzner CX22  | ~$7     | Dev/test, <50 users    |
| Standard| 4 vCPU| 8 GB | 40 GB | Hetzner CX32  | ~$15    | Production, <500 users |
| Scalable| 4 vCPU| 16 GB| 80 GB | Hetzner CX42  | ~$30    | Production, 500+ users |

### Recommended Providers

| Provider       | 4GB RAM price | Notes                                |
|----------------|--------------|--------------------------------------|
| **Hetzner**   | **~$7/mo**  | Best value. German DC. IPv4+IPv6.   |
| DigitalOcean   | ~$24/mo     | US/EU/Asia. Simple UI. Backups $1.  |
| Vultr          | ~$18/mo     | 17 DCs. Hourly billing.             |
| Linode         | ~$20/mo     | Good support.                       |
| AWS Lightsail  | ~$20/mo     | Free tier first 3 months.           |

**Pick Hetzner CX22 ($7/mo).** It handles everything this stack needs for the first 500 users.

---

## 3. Prerequisites

### On Your Local Machine
- SSH key pair: `ssh-keygen -t ed25519 -C "moistello-deploy"` if you don't have one
- Domain name pointed to the VPS IP (A record: `@` → VPS IP, `www` → VPS IP)
- Git access to the three repos

### On the VPS (Ubuntu 24.04 LTS)

```bash
# Initial setup — run as root on first SSH
apt update && apt upgrade -y
apt install -y \
  curl wget git ufw nginx certbot python3-certbot-nginx \
  docker.io docker-compose-v2 \
  htop iotop net-tools mosh

# Enable firewall
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw enable

# Add deploy user (don't deploy as root)
useradd -m -s /bin/bash deploy
usermod -aG docker deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh

# Create app directory
mkdir -p /opt/moistello
chown deploy:deploy /opt/moistello
```

---

## 4. Deployment — Step by Step

All remaining steps run as the `deploy` user: `su - deploy`

### 4.1 Clone Repositories

```bash
cd /opt/moistello

git clone git@github.com:Otta-co/moistello-backend.git backend
git clone git@github.com:Otta-co/moistello-frontend.git frontend
# Contracts are already on-chain — no need to clone for hosting
```

### 4.2 Configure Environment

```bash
# Backend — copy and edit config
cd /opt/moistello/backend
cp .env.example .env

# Edit the critical values:
vi .env
```

**Backend `.env` — values you MUST change:**
```bash
MOISTELLO_DATABASE_URL=postgres://moistello:CHANGE_THIS_PASSWORD@localhost:5432/moistello?sslmode=disable
MOISTELLO_REDIS_URL=redis://:CHANGE_THIS_PASSWORD@localhost:6379
MOISTELLO_RABBITMQ_URL=amqp://moistello:CHANGE_THIS_PASSWORD@localhost:5672/
MOISTELLO_JWT_PRIVATE_KEY_PATH=/etc/moistello/config/keys/jwt-private.pem
MOISTELLO_JWT_PUBLIC_KEY_PATH=/etc/moistello/config/keys/jwt-public.pem
MOISTELLO_SERVER_PORT=1100
MOISTELLO_LOGGING_LEVEL=info
MOISTELLO_CORS_ALLOWED_ORIGINS=https://moistello.app
MOISTELLO_STELLAR_NETWORK=testnet
MOISTELLO_STELLAR_MASTER_PUBLIC_KEY=G...YOUR_PUBLIC_KEY
MOISTELLO_STELLAR_MASTER_SECRET_KEY=S...YOUR_SECRET_KEY
```

**Frontend `.env.local` — critical values:**
```bash
cd /opt/moistello/frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://moistello.app/v1
NEXT_PUBLIC_WS_URL=wss://moistello.app/ws
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_PASSKEY_RP_ID=moistello.app
NEXT_PUBLIC_PASSKEY_PEPPER=moistello-passkey-pepper-v1
NEXT_PUBLIC_FEATURE_MULTI_WALLET=true
NEXT_PUBLIC_FEATURE_PASSKEY=true
NEXT_PUBLIC_FEATURE_HARDWARE_WALLET=true
NEXT_PUBLIC_FEATURE_GOVERNANCE=true
NEXT_PUBLIC_FEATURE_REPUTATION_TIERS=true
EOF
```

### 4.3 Generate Secure Credentials

```bash
# Generate random passwords for each service
POSTGRES_PW=$(openssl rand -base64 32)
REDIS_PW=$(openssl rand -base64 32)
RABBITMQ_PW=$(openssl rand -base64 32)

echo "Postgres: $POSTGRES_PW"
echo "Redis:    $REDIS_PW"
echo "RabbitMQ: $RABBITMQ_PW"
# Save these to a password manager — you'll need them
```

### 4.4 Update Docker Compose with Secure Credentials

Create a production override file:

```bash
cd /opt/moistello/backend
cat > docker-compose.prod.yml << 'PRODEOF'
version: '3.8'
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PW}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - /opt/moistello/backups:/backups
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    command: redis-server --requirepass ${REDIS_PW} --maxmemory 256mb --maxmemory-policy allkeys-lru
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  rabbitmq:
    environment:
      RABBITMQ_DEFAULT_USER: moistello
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PW}
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  postgres_data:
PRODEOF
```

### 4.5 Start Infrastructure

```bash
cd /opt/moistello/backend

# Export passwords so docker compose can use them
export POSTGRES_PW RABBITMQ_PW REDIS_PW

# Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for health checks
docker compose ps
# All three should show "(healthy)"

# Run database migrations
go run ./cmd/migrate --direction up
```

### 4.6 Build and Start Backend

```bash
cd /opt/moistello/backend

# Build binary
CGO_ENABLED=0 go build -ldflags="-s -w" -o /opt/moistello/bin/moistello-api ./cmd/api-server

# Create systemd service
sudo tee /etc/systemd/system/moistello-api.service << 'UNITEOF'
[Unit]
Description=Moistello API Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/moistello/backend
EnvironmentFile=/opt/moistello/backend/.env
ExecStart=/opt/moistello/bin/moistello-api
Restart=always
RestartSec=5
StandardOutput=append:/var/log/moistello/api.log
StandardError=append:/var/log/moistello/api-error.log
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
UNITEOF

sudo mkdir -p /var/log/moistello
sudo chown deploy:deploy /var/log/moistello
sudo systemctl daemon-reload
sudo systemctl enable moistello-api
sudo systemctl start moistello-api

# Verify
sudo systemctl status moistello-api
curl http://localhost:1100/health
```

### 4.7 Build and Start Frontend

```bash
cd /opt/moistello/frontend

# Install dependencies
npm ci --omit=dev

# Build
npm run build

# Create systemd service
sudo tee /etc/systemd/system/moistello-frontend.service << 'UNITEOF'
[Unit]
Description=Moistello Frontend (Next.js)
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/moistello/frontend
Environment=NODE_ENV=production
Environment=PORT=1110
ExecStart=/usr/bin/node /opt/moistello/frontend/node_modules/.bin/next start
Restart=always
RestartSec=5
StandardOutput=append:/var/log/moistello/frontend.log
StandardError=append:/var/log/moistello/frontend-error.log
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
UNITEOF

sudo systemctl daemon-reload
sudo systemctl enable moistello-frontend
sudo systemctl start moistello-frontend

# Verify
sudo systemctl status moistello-frontend
curl -I http://localhost:1110
```

### 4.8 Configure Nginx

```bash
sudo tee /etc/nginx/sites-available/moistello << 'NGINXEOF'
# Rate limiting — 100 req/s per IP
limit_req_zone $binary_remote_addr zone=moistello:10m rate=100r/s;

# Upstream definitions
upstream backend {
    server 127.0.0.1:1100;
}

upstream frontend {
    server 127.0.0.1:1110;
}

# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name moistello.app www.moistello.app;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name moistello.app www.moistello.app;

    # SSL — Certbot will populate these
    ssl_certificate     /etc/letsencrypt/live/moistello.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/moistello.app/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/moistello.app/chain.pem;

    # Modern SSL config
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;
    gzip_comp_level 6;

    # Root: Frontend
    location / {
        limit_req zone=moistello burst=50 nodelay;
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_buffering on;
        proxy_cache_bypass $http_upgrade;
    }

    # API: Backend
    location /v1/ {
        limit_req zone=moistello burst=20 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
        client_max_body_size 10m;
    }

    # Health check (no rate limit)
    location /health {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # WebSocket
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # Metrics (internal only)
    location /metrics {
        allow 127.0.0.1;
        deny all;
        proxy_pass http://backend;
    }
}
NGINXEOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/moistello /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 4.9 SSL Certificate

```bash
# Get certificate (run without SSL first — comment out ssl_* lines temporarily)
sudo nginx -t && sudo systemctl reload nginx

# Now get cert (Certbot will modify config)
sudo certbot --nginx -d moistello.app -d www.moistello.app

# Auto-renewal (Certbot adds a systemd timer automatically)
sudo certbot renew --dry-run   # Test renewal

# Verify timer
sudo systemctl status certbot.timer
```

---

## 5. Post-Deployment Verification

```bash
# Health checks
curl -s https://moistello.app/health          # → {"status":"ok"}
curl -s -I https://moistello.app              # → HTTP/2 200
curl -s https://moistello.app/v1/circles      # → [] or list

# Check services
sudo systemctl status moistello-api moistello-frontend
docker compose -f /opt/moistello/backend/docker-compose.yml ps

# Logs
sudo journalctl -u moistello-api -f           # Backend logs
sudo journalctl -u moistello-frontend -f      # Frontend logs
docker compose -f /opt/moistello/backend/docker-compose.yml logs -f postgres
```

---

## 6. Backup Strategy

```bash
# Create backup script
sudo tee /opt/moistello/scripts/backup.sh << 'BACKUPEOF'
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/moistello/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DB_PW="${POSTGRES_PW:-moistello_dev}"

mkdir -p "$BACKUP_DIR"

# PostgreSQL dump
docker exec moistello-postgres pg_dump -U moistello moistello \
  | gzip > "$BACKUP_DIR/postgres-$TIMESTAMP.sql.gz"

# Rotate old backups
find "$BACKUP_DIR" -name "postgres-*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log
echo "[$(date)] Backup complete: postgres-$TIMESTAMP.sql.gz ($(du -h $BACKUP_DIR/postgres-$TIMESTAMP.sql.gz | cut -f1))"
BACKUPEOF

chmod +x /opt/moistello/scripts/backup.sh

# Schedule: every 6 hours
sudo tee /etc/cron.d/moistello-backup << 'CRONEOF'
0 */6 * * * deploy /opt/moistello/scripts/backup.sh >> /var/log/moistello/backup.log 2>&1
CRONEOF
```

**Optional: offsite backup to S3**

```bash
# Add this to backup.sh after the dump
aws s3 cp "$BACKUP_DIR/postgres-$TIMESTAMP.sql.gz" \
  "s3://moistello-backups/daily/postgres-$TIMESTAMP.sql.gz" \
  --storage-class STANDARD_IA
```

---

## 7. Monitoring

### 7.1 Resource Monitoring (htop + systemd)

```bash
# Quick health check script
cat > /opt/moistello/scripts/health-check.sh << 'HEALTHEOF'
#!/bin/bash
echo "=== $(date) ==="
echo "--- DISK ---"
df -h / | tail -1
echo "--- MEMORY ---"
free -h | grep Mem
echo "--- SERVICES ---"
systemctl is-active moistello-api moistello-frontend
echo "--- DOCKER ---"
docker compose -f /opt/moistello/backend/docker-compose.yml ps --format "table {{.Name}}\t{{.Status}}"
echo "--- LOAD ---"
uptime
HEALTHEOF

chmod +x /opt/moistello/scripts/health-check.sh

# Run every 15 minutes, log to file
crontab -l 2>/dev/null; echo "*/15 * * * * /opt/moistello/scripts/health-check.sh >> /var/log/moistello/health.log 2>&1" | crontab -
```

### 7.2 Prometheus + Grafana (optional, for serious monitoring)

```bash
# Add to docker-compose.prod.yml:
  prometheus:
    image: prom/prometheus:latest
    ports: ["9090:9090"]
    volumes: [./prometheus.yml:/etc/prometheus/prometheus.yml]
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports: ["3000:3000"]
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PW}
    restart: unless-stopped
```

---

## 8. CI/CD via GitHub Actions (Optional)

```yaml
# .github/workflows/deploy.yml — in moistello-backend repo
name: Deploy to VPS
on:
  push:
    branches: [master]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: "1.23" }

      - name: Test
        run: go test ./... -count=1

      - name: Build
        run: CGO_ENABLED=0 go build -ldflags="-s -w" -o moistello-api ./cmd/api-server

      - name: Deploy
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          source: moistello-api
          target: /opt/moistello/bin/

      - name: Restart
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            sudo systemctl restart moistello-api
            sudo systemctl status moistello-api --no-pager
```

---

## 9. Rollback Plan

```bash
# If deployment breaks — rollback backend
sudo systemctl stop moistello-api
cp /opt/moistello/bin/moistello-api /opt/moistello/bin/moistello-api.broken
cp /opt/moistello/bin/moistello-api.previous /opt/moistello/bin/moistello-api
sudo systemctl start moistello-api

# Rollback frontend
cd /opt/moistello/frontend
git checkout HEAD~1
npm ci --omit=dev && npm run build
sudo systemctl restart moistello-frontend

# Rollback feature flags (no restart needed — next build picks them up)
# Edit .env.local, set flag to "false", rebuild frontend
NEXT_PUBLIC_FEATURE_GOVERNANCE=false
npm run build && sudo systemctl restart moistello-frontend

# Rollback database (worst case)
docker exec -i moistello-postgres psql -U moistello moistello < /opt/moistello/backups/postgres-LATEST.sql
```

---

## 10. Cost Breakdown

| Item                | Monthly Cost |
|---------------------|-------------|
| VPS (Hetzner CX22)  | ~$7         |
| Domain (Namecheap)  | ~$1         |
| SSL (Let's Encrypt) | Free        |
| Email (optional)    | $0–5        |
| **Total**           | **~$8–13/mo** |

---

## 11. Security Checklist

- [ ] SSH: key-only auth, no password login (`PasswordAuthentication no` in `/etc/ssh/sshd_config`)
- [ ] SSH: non-standard port (optional, reduces noise)
- [ ] Firewall: only 22, 80, 443 open (`ufw status`)
- [ ] Database: NOT exposed to public internet (binds 127.0.0.1 only)
- [ ] Database: strong random password (not `moistello_dev`)
- [ ] Redis: password required (`requirepass` set in config)
- [ ] RabbitMQ: non-default user/password
- [ ] JWT keys: RSA 2048+ bit, generated fresh per environment
- [ ] Stellar secret key: never logged, stored in `.env` only
- [ ] Nginx: rate limiting enabled on all routes
- [ ] Nginx: security headers set (HSTS, X-Frame-Options, etc.)
- [ ] SSL: A+ rating on SSL Labs
- [ ] Backups: verified restore works
- [ ] Updates: `unattended-upgrades` enabled for security patches

```bash
# Enable automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 12. Troubleshooting

| Symptom | Check |
|---------|-------|
| Frontend loads but API calls fail | `curl http://localhost:1100/health` — is backend running? |
| Database connection refused | `docker compose ps` — is postgres healthy? |
| Redis connection refused | Redis requires password. Check `.env` matches docker compose. |
| WebSocket disconnects | Check nginx `proxy_read_timeout`. WS needs 3600s. |
| SSL expired | `sudo certbot renew --force-renewal` |
| Disk full | `docker system prune -a` — cleans old images. Check backup rotation. |
| Memory exhausted | RabbitMQ is the hog. Set `RABBITMQ_VM_MEMORY_HIGH_WATERMARK=0.4` in compose. |
| Port 1110 already in use | `sudo lsof -i :1110` — kill stale process. |
