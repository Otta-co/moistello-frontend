# Moistello — Deployment Setup

## Purpose

This document defines the **complete end state** of a Moistello production deployment at `moistello.com`. It describes every file, every config value, every service, and every relationship. The companion script `deploy.sh` automates reaching this state from a fresh VPS.

**Domain**: `moistello.com`
**Target**: Single VPS (Ubuntu 24.04 LTS)

---

## 1. Server State

### 1.1 Operating System

| Property              | Value                          |
|-----------------------|--------------------------------|
| OS                    | Ubuntu 24.04 LTS               |
| Kernel                | Latest stable                  |
| Timezone              | UTC                            |
| Hostname              | moistello                      |
| Swap                  | 2 GB (file-based)              |
| Automatic updates     | Security patches only          |
| SSH                   | Key-only auth, port 22         |

### 1.2 Installed Packages

```
docker.io docker-compose-v2 nginx certbot python3-certbot-nginx
curl wget git ufw htop iotop build-essential
openssl     (≥3.x)
golang      (≥1.23)
nodejs      (≥20 LTS)
npm         (≥10)
```

### 1.3 Firewall (UFW)

| Port  | Protocol | Purpose              |
|-------|----------|----------------------|
| 22    | TCP      | SSH                  |
| 80    | TCP      | HTTP (redirect → 443)|
| 443   | TCP      | HTTPS                |

All other ports closed. No database ports exposed to internet.

### 1.4 Filesystem Layout

```
/opt/moistello/
├── bin/
│   └── moistello-api          # Go backend binary (compiled)
├── scripts/
│   └── backup.sh              # PostgreSQL backup script
├── secrets/
│   └── .env                   # All generated credentials (symlinked from backend/.env)
├── backups/                   # PostgreSQL dump files (rotated 30 days)
├── backend/                   # git clone of moistello-backend
│   ├── .env                   # Backend environment (symlink → /opt/moistello/secrets/.env)
│   ├── config/
│   │   ├── config.yaml
│   │   └── keys/
│   │       ├── jwt-private.pem
│   │       └── jwt-public.pem
│   └── docker-compose.yml
│       docker-compose.prod.yml
└── frontend/                  # git clone of moistello-frontend
    ├── .env.local             # Frontend environment
    └── .next/                 # Build output

/etc/moistello/ → symlink → /opt/moistello/backend/config

/var/log/moistello/
├── api.log
├── api-error.log
├── frontend.log
├── frontend-error.log
├── backup.log
└── health.log

/etc/systemd/system/
├── moistello-api.service
└── moistello-frontend.service

/etc/nginx/sites-available/moistello → enabled
```

### 1.5 Users

| User    | Purpose                    | Groups     |
|---------|----------------------------|------------|
| deploy  | Run all app services       | docker, sudo|
| root    | Initial bootstrap only     | —          |

No services run as root.

---

## 2. Docker Services

### 2.1 Postgres 16

| Property          | Value                           |
|-------------------|---------------------------------|
| Container name    | moistello-postgres              |
| Image             | postgres:16-alpine              |
| Internal port     | 5432                            |
| Host port         | 127.0.0.1:5432 (localhost ONLY) |
| Database          | moistello                       |
| User              | moistello                       |
| Password          | [random 32-byte base64]         |
| Volume            | postgres_data:/var/lib/postgresql/data |
| Healthcheck       | pg_isready every 5s             |
| Restart           | unless-stopped                  |
| Log driver        | json-file, max 10MB × 3 files   |

### 2.2 Redis 7

| Property          | Value                           |
|-------------------|---------------------------------|
| Container name    | moistello-redis                 |
| Image             | redis:7-alpine                  |
| Internal port     | 6379                            |
| Host port         | 127.0.0.1:6379                  |
| Password          | [random 32-byte base64]         |
| Max memory        | 256MB                           |
| Eviction policy   | allkeys-lru                     |
| Restart           | unless-stopped                  |

### 2.3 RabbitMQ 3

| Property          | Value                           |
|-------------------|---------------------------------|
| Container name    | moistello-rabbitmq              |
| Image             | rabbitmq:3-management-alpine    |
| Ports             | 127.0.0.1:5672, 127.0.0.1:15672|
| User              | moistello                       |
| Password          | [random 32-byte base64]         |
| Restart           | unless-stopped                  |

### 2.4 Docker Compose File

See `docker-compose.yml` in the backend repo for the base config. The production override (`docker-compose.prod.yml`) adds:
- Secure passwords via environment variables
- Resource limits
- Log rotation
- Volume persistence
- Restart policies

---

## 3. Backend (Go API Server)

### 3.1 Binary

| Property          | Value                           |
|-------------------|---------------------------------|
| Source            | github.com/Otta-co/moistello-backend |
| Entry point       | cmd/api-server/main.go          |
| Compilation       | CGO_ENABLED=0, stripped, static|
| Binary location   | /opt/moistello/bin/moistello-api|
| Port              | 1100                            |
| Runs as           | deploy user                     |

### 3.2 Environment Variables (.env)

```bash
MOISTELLO_ENVIRONMENT=production
MOISTELLO_SERVER_PORT=1100
MOISTELLO_SERVER_HOST=127.0.0.1
MOISTELLO_SERVER_READ_TIMEOUT=10s
MOISTELLO_SERVER_WRITE_TIMEOUT=30s

# Database
MOISTELLO_DATABASE_URL=postgres://moistello:<generated-pw>@127.0.0.1:5432/moistello?sslmode=disable
MOISTELLO_DATABASE_MAX_OPEN_CONNS=50
MOISTELLO_DATABASE_MAX_IDLE_CONNS=10

# Redis
MOISTELLO_REDIS_URL=redis://:<generated-pw>@127.0.0.1:6379

# RabbitMQ
MOISTELLO_RABBITMQ_URL=amqp://moistello:<generated-pw>@127.0.0.1:5672/

# Auth
MOISTELLO_AUTH_JWT_PRIVATE_KEY_PATH=/opt/moistello/backend/config/keys/jwt-private.pem
MOISTELLO_AUTH_JWT_PUBLIC_KEY_PATH=/opt/moistello/backend/config/keys/jwt-public.pem
MOISTELLO_AUTH_ACCESS_TOKEN_TTL=15m
MOISTELLO_AUTH_REFRESH_TOKEN_TTL=168h

# CORS
MOISTELLO_CORS_ALLOWED_ORIGINS=https://moistello.com

# Logging
MOISTELLO_LOGGING_LEVEL=info
MOISTELLO_LOGGING_FORMAT=json

# Rate Limiting
MOISTELLO_RATE_LIMIT_GLOBAL=100
MOISTELLO_RATE_LIMIT_AUTHENTICATED=300

# Stellar / Soroban
MOISTELLO_STELLAR_NETWORK=testnet
MOISTELLO_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
MOISTELLO_STELLAR_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
MOISTELLO_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
MOISTELLO_STELLAR_MASTER_PUBLIC_KEY=<generated>
MOISTELLO_STELLAR_MASTER_SECRET_KEY=<generated>
```

### 3.3 JWT Keys

```
/opt/moistello/backend/config/keys/jwt-private.pem   (RSA 2048, PEM)
/opt/moistello/backend/config/keys/jwt-public.pem    (RSA 2048, PEM)
```

Generated via: `openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048`

### 3.4 systemd Unit

```ini
[Unit]
Description=Moistello API Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/moistello/backend
EnvironmentFile=/opt/moistello/secrets/.env
ExecStart=/opt/moistello/bin/moistello-api
Restart=always
RestartSec=5
StandardOutput=append:/var/log/moistello/api.log
StandardError=append:/var/log/moistello/api-error.log
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

### 3.5 Database Migrations

All 15 migrations applied in order:
```
001_create_users → 002_create_circles → ... → 015_create_feature_flags
```

Final schema has tables: users, circles, circle_members, contributions, payouts, penalties, invites, notifications, audit_log, webhooks, api_keys, sessions, indexer_cursor, reputation_snapshots, feature_flags.

### 3.6 Health Endpoints

```
GET /health              → {"status":"ok","version":"0.1.0"}
GET /health/ready        → {"status":"ready","database":"ok","redis":"ok"}
GET /metrics             → Prometheus metrics (internal only, 127.0.0.1)
```

---

## 4. Frontend (Next.js)

### 4.1 Build

| Property          | Value                           |
|-------------------|---------------------------------|
| Runtime           | Node.js 20 LTS                  |
| Framework         | Next.js 14.2.35                 |
| Build command     | npm run build                   |
| Output            | /opt/moistello/frontend/.next/  |
| Port              | 1110                            |
| Runs as           | deploy user                     |

### 4.2 Environment Variables (.env.local)

```bash
NEXT_PUBLIC_API_URL=https://moistello.com/v1
NEXT_PUBLIC_WS_URL=wss://moistello.com/ws
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_PASSKEY_RP_ID=moistello.com
NEXT_PUBLIC_PASSKEY_PEPPER=moistello-passkey-pepper-v1
NEXT_PUBLIC_FEATURE_MULTI_WALLET=true
NEXT_PUBLIC_FEATURE_PASSKEY=true
NEXT_PUBLIC_FEATURE_HARDWARE_WALLET=true
NEXT_PUBLIC_FEATURE_GOVERNANCE=true
NEXT_PUBLIC_FEATURE_REPUTATION_TIERS=true
```

### 4.3 systemd Unit

```ini
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
```

---

## 5. Nginx

### 5.1 Reverse Proxy Rules

```
https://moistello.com/       → 127.0.0.1:1110  (Frontend Next.js)
https://moistello.com/v1/*   → 127.0.0.1:1100  (Backend API)
https://moistello.com/ws      → 127.0.0.1:1100  (WebSocket, upgrade)
https://moistello.com/health  → 127.0.0.1:1100  (Health, no rate limit)
https://moistello.com/metrics → 127.0.0.1:1100  (Metrics, 127.0.0.1 only)
http://moistello.com/*        → 301 https://     (Redirect)
```

### 5.2 SSL

| Property          | Value                           |
|-------------------|---------------------------------|
| Provider          | Let's Encrypt                   |
| Tool              | certbot                         |
| Domains           | moistello.com, www.moistello.com|
| Renewal           | Automatic (systemd timer)       |
| Min TLS           | 1.2                             |

### 5.3 Security Headers

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 5.4 Rate Limiting

```
Backend API (/v1/):    20 req/s burst
Frontend (/):          100 req/s burst
Health (/health):      Unlimited
```

---

## 6. Stellar Configuration

### 6.1 Master Account

| Property          | Value                           |
|-------------------|---------------------------------|
| Network           | Testnet                         |
| Public Key        | G... (generated at deploy)      |
| Secret Key        | S... (generated at deploy)      |
| Funding           | Manual — https://laboratory.stellar.org |

### 6.2 Deployed Contract IDs (Testnet)

```yaml
contracts:
  circle_factory:       "CADZWDGER6PYEWVHZDZ5HMEV6A5TKFVD4EY4DSPUTEKAM2KDPEABGJQU"
  reputation_registry:  "CCEEJKQCYO7CXBFZBSGHS6AK2CCBU2HY2HK4VXQDPZ3XX3X3KEDGXQ7K"
  governance_token:     "CDOBQSJZJD4RIE2V5Q2IOJ6PBPSE2FT46BCD5WXW64ZN4KEUMYGBX3CS"
  treasury:             "CASXVLHWI56BBKLZHDHCFMCXDWJ4XWEMZABVBUIQBPDHVK4UW6ICUSFI"
```

These are already deployed on testnet and configured in `config/config.yaml`.

---

## 7. Backup System

### 7.1 Schedule

```
Every 6 hours:  PostgreSQL pg_dump (gzip compressed)
Retention:      30 days
Location:       /opt/moistello/backups/
Naming:         postgres-YYYYMMDD-HHMMSS.sql.gz
```

### 7.2 Verification

Run monthly: restore latest backup to a fresh Postgres container, run migrations, verify row counts.

---

## 8. Monitoring

### 8.1 System Health

Script at `/opt/moistello/scripts/health-check.sh` runs every 15 minutes via cron. Logs to `/var/log/moistello/health.log`. Checks:
- Disk usage (>80% triggers alert)
- Memory usage
- Service status (systemctl is-active)
- Docker container status
- Load average

### 8.2 Application Metrics

Backend exposes Prometheus metrics at `/metrics` (internal only). Frontend `src/lib/monitoring.ts` buffers metrics and flushes periodically.

---

## 9. Feature Flag State

All flags are **TRUE** in production:

| Flag                                | Value |
|-------------------------------------|-------|
| NEXT_PUBLIC_FEATURE_MULTI_WALLET    | true  |
| NEXT_PUBLIC_FEATURE_PASSKEY         | true  |
| NEXT_PUBLIC_FEATURE_HARDWARE_WALLET | true  |
| NEXT_PUBLIC_FEATURE_GOVERNANCE      | true  |
| NEXT_PUBLIC_FEATURE_REPUTATION_TIERS| true  |

Rollback: set flag to `false` → `npm run build` → `systemctl restart moistello-frontend`. <5 minutes.

---

## 10. Pre-Flight Checklist

Before running `deploy.sh`, these must be manually completed:

| # | Task                                     | How                                                          |
|---|------------------------------------------|--------------------------------------------------------------|
| 1 | Buy domain `moistello.com`              | Namecheap / Cloudflare / any registrar                      |
| 2 | Point A record to VPS IP                 | DNS: `moistello.com` A → `<VPS-IP>`                         |
| 3 | Point www A record to VPS IP             | DNS: `www.moistello.com` A → `<VPS-IP>`                     |
| 4 | Provision VPS                            | Ubuntu 24.04, ≥2 vCPU, ≥4GB RAM, ≥20GB disk                |
| 5 | SSH into VPS as root                     | `ssh root@<VPS-IP>`                                         |
| 6 | Run deploy.sh                            | `bash deploy.sh` (the script handles everything else)       |
| 7 | Fund Stellar testnet account             | Copy public key from script output → laboratory.stellar.org |
| 8 | Wait for DNS propagation (5-30 min)      | `dig moistello.com` returns VPS IP                          |
| 9 | Verify SSL                               | `curl -I https://moistello.com` → 200                      |

Steps 1-4 are one-time manual. Steps 5-6 are the script. Steps 7-9 are post-deploy verification.
