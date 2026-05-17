# Moistello — Deployment Setup

## Purpose

This document defines the **complete end state** of a Moistello production deployment at `moistello.com`. Each section is tagged:

| Tag | Meaning |
|-----|---------|
| ✋ **MANUAL** | You must do this by hand. Cannot be scripted. |
| 📜 **SCRIPT** | Handled automatically by `deploy.sh`. Shown here so you know the end state. |

**Domain**: `moistello.com`  
**Target**: Single VPS (Ubuntu 24.04 LTS)  
**Script**: `deploy.sh` (one command → live site)

---

## ✋ MANUAL — Before the VPS

These steps happen ONCE, outside any server. Do them before SSH-ing.

### 1. Buy the domain

| Action | Where | Cost |
|--------|-------|------|
| Register `moistello.com` | Namecheap / Cloudflare / Porkbun | ~$10–15/year |

**Why manual**: Registrar APIs exist but vary. Easier to use their web UI once than automate for one domain.

### 2. Provision the VPS

| Provider | Spec | Price | Link |
|----------|------|-------|------|
| **Hetzner** (recommended) | CX22: 2 vCPU, 4GB, 20GB | ~$7/mo | hetzner.com/cloud |
| DigitalOcean | Basic Droplet: 2 vCPU, 4GB | ~$24/mo | digitalocean.com |
| Vultr | Regular Cloud: 2 vCPU, 4GB | ~$18/mo | vultr.com |

- OS: **Ubuntu 24.04 LTS**
- Add your SSH public key during creation
- Note the **VPS IP address**

**Why manual**: Provisioning a VPS requires a billing account + choosing region/size. Script can't sign up for you.

### 3. Point DNS to the VPS

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `moistello.com` | `<VPS-IP>` | 300 |
| A | `www.moistello.com` | `<VPS-IP>` | 300 |

Log into your registrar's DNS panel and add these two A records.

**Why manual**: Every registrar has a different API. This takes 30 seconds in their web UI. DNS propagation takes 5–30 minutes — the script detects this and skips SSL until it's ready.

### 4. SSH into the VPS

```bash
ssh root@<VPS-IP>
```

**Why manual**: You need the IP from step 2. This is the entry point for the script.

---

## ✋ MANUAL — After the Script

These happen ONCE, after `deploy.sh` finishes.

### 5. Fund the Stellar testnet account

The script generates a Stellar keypair and prints the public key. Fund it:

| Action | URL |
|--------|-----|
| Get 10,000 testnet XLM | https://laboratory.stellar.org/#account-creator |
| Paste the public key | The script prints it at the end |

**Why manual**: The Stellar testnet faucet requires a CAPTCHA. Cannot be automated.

### 6. Verify the deployment

```bash
# Health check
curl -s https://moistello.com/health
# → {"status":"ok"}

# Frontend loads
curl -sI https://moistello.com | head -3
# → HTTP/2 200

# API responds
curl -s https://moistello.com/v1/circles
# → [] or [{"id":...}]
```

**Why manual**: You should visually confirm the site works. Automated curl tests exist in the script but a human should see it live.

---

## 📜 SCRIPT — Server State

Everything below this line is handled by `deploy.sh`. It exists here so you know **what end state the script produces**.

### 7. Operating System & Packages

**What `deploy.sh` does:**
- Updates all packages
- Installs: `docker.io`, `docker-compose-v2`, `nginx`, `certbot`, `python3-certbot-nginx`, `curl`, `wget`, `git`, `ufw`, `htop`, `build-essential`, `openssl`
- Installs **Go 1.23** (binary from go.dev)
- Installs **Node.js 20 LTS** (from NodeSource)
- Creates 2GB swap file
- Enables `unattended-upgrades` for automatic security patches

**End state:**
```
OS:            Ubuntu 24.04 LTS (fully patched)
Go:            go1.23.x
Node:          v20.x LTS
Swap:          2GB (/swapfile)
Firewall:      ufw — only ports 22, 80, 443 open
Auto-updates:  Security patches only
```

### 8. Users & Permissions

**What `deploy.sh` does:**
- Creates user `deploy` (if not exists)
- Adds to `docker` group
- Grants passwordless sudo for `systemctl`, `journalctl`, `nginx`
- Creates all directories under `/opt/moistello/` owned by `deploy`

**End state:**
```
/opt/moistello/
├── bin/           # moistello-api binary
├── scripts/       # backup.sh, health-check.sh
├── secrets/       # .env (generated credentials, chmod 600)
├── backups/       # PostgreSQL dump files (rotated 30 days)
├── backend/       # git clone, .env symlink to secrets/
└── frontend/      # git clone, .env.local, .next/

/var/log/moistello/    # All service + cron logs

User: deploy  Groups: deploy, docker, sudo (restricted)
No services run as root.
```

### 9. Secrets Generation

**What `deploy.sh` does:**
- `POSTGRES_PW` — 32 random bytes, base64 encoded
- `REDIS_PW` — 32 random bytes, base64 encoded
- `RABBITMQ_PW` — 32 random bytes, base64 encoded
- Stellar testnet keypair — via `stellar keys generate` (ed25519)
- JWT private/public keys — RSA 2048 PEM (`openssl genpkey`)
- Writes everything to `/opt/moistello/secrets/.env` (chmod 600)
- Symlinks to `/opt/moistello/backend/.env`

**End state:** One file with all credentials. Nothing hardcoded. Nothing shared.

---

## 📜 SCRIPT — Docker Services

### 10. PostgreSQL 16

**What `deploy.sh` does:**
- Pulls `postgres:16-alpine`
- Starts with generated password via Docker Compose
- Waits for health check (`pg_isready`)
- Binds to `127.0.0.1:5432` only (NOT exposed to internet)
- Runs all 15 database migrations via `go run ./cmd/migrate --direction up`

**End state:**
```
Container:   moistello-postgres (healthy)
Database:    moistello
User:        moistello
Access:      127.0.0.1:5432 ONLY
Logging:     json-file, max 10MB × 3
Restart:     unless-stopped
```

### 11. Redis 7

**What `deploy.sh` does:**
- Pulls `redis:7-alpine`
- Starts with `requirepass` set to generated password
- `maxmemory 256mb`, policy `allkeys-lru`
- Binds to `127.0.0.1:6379` only

**End state:**
```
Container:   moistello-redis (healthy)
Password:    required (allkeys-lru eviction)
Access:      127.0.0.1:6379 ONLY
```

### 12. RabbitMQ 3

**What `deploy.sh` does:**
- Pulls `rabbitmq:3-management-alpine`
- Custom user `moistello` with generated password
- Binds to `127.0.0.1:5672` and `127.0.0.1:15672` (management UI internal only)

**End state:**
```
Container:   moistello-rabbitmq (healthy)
User:        moistello
Access:      127.0.0.1:5672, 127.0.0.1:15672 ONLY
```

---

## 📜 SCRIPT — Applications

### 13. Backend (Go API Server)

**What `deploy.sh` does:**
- Builds: `CGO_ENABLED=0 go build -ldflags="-s -w"` → static stripped binary
- Output: `/opt/moistello/bin/moistello-api`
- Creates systemd unit at `/etc/systemd/system/moistello-api.service`
- Enables + starts service
- Verifies: `curl http://127.0.0.1:1100/health`

**End state:**
```
Binary:       /opt/moistello/bin/moistello-api (stripped, static)
Port:         1100 (localhost only)
User:         deploy
Auto-restart: yes (RestartSec=5)
Logs:         /var/log/moistello/api.log, api-error.log
Health:       GET /health → {"status":"ok"}
Metrics:      GET /metrics (127.0.0.1 only)
```

### 14. Frontend (Next.js)

**What `deploy.sh` does:**
- Writes `/opt/moistello/frontend/.env.local` with all feature flags = true
- Runs `npm ci --omit=dev` → `npm run build`
- Creates systemd unit at `/etc/systemd/system/moistello-frontend.service`
- Enables + starts service

**End state:**
```
Runtime:      Node.js 20 LTS
Port:         1110 (localhost only)
User:         deploy
Output:       /opt/moistello/frontend/.next/
Built with:   NODE_ENV=production
All flags:    true (governance, reputation tiers, multi-wallet, passkey, hardware wallet)
Auto-restart: yes
Logs:         /var/log/moistello/frontend.log, frontend-error.log
```

---

## 📜 SCRIPT — Nginx + SSL

### 15. Reverse Proxy & SSL

**What `deploy.sh` does:**
- Writes full Nginx config to `/etc/nginx/sites-available/moistello`
- Enables site, removes default
- Configures rate limiting zones
- Validates config with `nginx -t` before reloading
- Runs `certbot --nginx` for Let's Encrypt SSL
- If DNS hasn't propagated yet: deploys HTTP-only, prints the certbot command to run later

**End state:**
```
https://moistello.com/       → 127.0.0.1:1110  (Frontend)
https://moistello.com/v1/*   → 127.0.0.1:1100  (Backend API)
https://moistello.com/ws      → 127.0.0.1:1100  (WebSocket upgrade)
https://moistello.com/health  → 127.0.0.1:1100  (No rate limit)
http://moistello.com/*        → 301 → https://

SSL:          Let's Encrypt (auto-renew via certbot.timer)
TLS:          1.2 minimum
Rate limits:  /v1/*: 20 req/s burst, /*: 100 req/s burst
Headers:      HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
              Permissions-Policy (camera/microphone/geolocation denied)
Gzip:         text/plain, css, json, js, xml, svg
```

---

## 📜 SCRIPT — Operations

### 16. Backups

**What `deploy.sh` does:**
- Creates `/opt/moistello/scripts/backup.sh`
- Schedules via deploy user crontab: every 6 hours
- Runs first backup immediately after deploy
- Rotates: deletes files older than 30 days

**End state:**
```
Schedule:     Every 6 hours (0 */6 * * *)
Command:      docker exec moistello-postgres pg_dump -U moistello moistello | gzip
Location:     /opt/moistello/backups/postgres-YYYYMMDD-HHMMSS.sql.gz
Retention:    30 days
Log:          /var/log/moistello/backup.log
```

### 17. Health Monitoring

**What `deploy.sh` does:**
- Creates `/opt/moistello/scripts/health-check.sh`
- Schedules via deploy user crontab: every 15 minutes
- Checks: disk usage, memory, load, systemd service status, Docker container status

**End state:**
```
Schedule:     Every 15 minutes (*/15 * * * *)
Checks:       disk, mem, load, moistello-api, moistello-frontend,
              postgres, redis, rabbitmq
Log:          /var/log/moistello/health.log
```

---

## ✋ MANUAL — Ongoing

### 18. CI/CD (if desired)

A GitHub Actions workflow exists in the repo for auto-deploy on push to `master`. It:
- Runs tests
- Builds the binary
- SCPs it to the VPS
- Restarts the service

To enable it, add these GitHub secrets:
```
VPS_HOST        → <your VPS IP>
SSH_PRIVATE_KEY → <your deploy user's SSH private key>
```

**Why manual**: SSH keys are personal. You decide if you want push-to-deploy or manual deploys.

### 19. Rollback

```
# Backend: swap binary + restart
cp moistello-api moistello-api.broken
cp moistello-api.previous moistello-api
systemctl restart moistello-api

# Frontend: git checkout + rebuild
cd /opt/moistello/frontend
git checkout HEAD~1 && npm ci --omit=dev && npm run build
systemctl restart moistello-frontend

# Feature flag: flip, rebuild, restart (< 5 minutes)
echo "NEXT_PUBLIC_FEATURE_GOVERNANCE=false" >> .env.local
npm run build && systemctl restart moistello-frontend
```

**Why manual**: You decide when and what to roll back. The script sets up the structure; you execute the rollback.

---

## Summary

| # | Category | Who | How Long |
|---|----------|-----|----------|
| 1 | Buy domain | ✋ You | 2 min |
| 2 | Provision VPS | ✋ You | 3 min |
| 3 | DNS A records | ✋ You | 2 min |
| 4 | SSH into VPS | ✋ You | 10 sec |
| **5** | **Run `bash deploy.sh`** | **📜 Script** | **~15 min** |
| 6 | Fund Stellar testnet | ✋ You | 2 min |
| 7 | Verify site is live | ✋ You | 1 min |
| 8 | CI/CD secrets (optional) | ✋ You | 5 min |

**Total human time**: ~15 minutes. **Script time**: ~15 minutes. **Total to live**: ~30 minutes.
