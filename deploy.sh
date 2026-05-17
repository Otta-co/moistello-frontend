#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────
#  Moistello — One-Touch Production Deploy Script
#  Target: moistello.com  |  OS: Ubuntu 24.04 LTS
#  Usage:  bash deploy.sh
# ────────────────────────────────────────────────────────────────
set -euo pipefail
IFS=$'\n\t'

# ── Colors ─────────────────────────────────────────────────────
R='\033[0;31m' G='\033[0;32m' Y='\033[1;33m' B='\033[1;34m' C='\033[0;36m' W='\033[1;37m' N='\033[0m'
ok()   { echo -e "  ${G}✓${N} $1"; }
warn() { echo -e "  ${Y}⚠${N}  $1"; }
fail() { echo -e "  ${R}✗${N} $1"; exit 1; }
info() { echo -e "  ${B}→${N} $1"; }
step() { echo -e "\n${W}═══ $1 ═══${N}"; }

# ── Config ─────────────────────────────────────────────────────
DOMAIN="moistello.com"
WWW_DOMAIN="www.${DOMAIN}"
APP_DIR="/opt/moistello"
BACKEND_DIR="${APP_DIR}/backend"
FRONTEND_DIR="${APP_DIR}/frontend"
BIN_DIR="${APP_DIR}/bin"
SCRIPTS_DIR="${APP_DIR}/scripts"
SECRETS_DIR="${APP_DIR}/secrets"
BACKUP_DIR="${APP_DIR}/backups"
LOG_DIR="/var/log/moistello"

GITHUB_BACKEND="https://github.com/Otta-co/moistello-backend.git"
GITHUB_FRONTEND="https://github.com/Otta-co/moistello-frontend.git"

DEPLOY_USER="deploy"
API_PORT=1100
FRONTEND_PORT=1110

# ── Pre-flight ─────────────────────────────────────────────────
step "Pre-flight checks"

if [[ $EUID -ne 0 ]]; then fail "Must run as root"; fi

OS_ID=$(grep -oP '(?<=^ID=).+' /etc/os-release | tr -d '"')
OS_VER=$(grep -oP '(?<=^VERSION_ID=).+' /etc/os-release | tr -d '"')
if [[ "$OS_ID" != "ubuntu" ]]; then fail "This script targets Ubuntu (detected: $OS_ID)"; fi
ok "OS: Ubuntu ${OS_VER}"

PUBLIC_IP=$(curl -4sf https://ifconfig.me 2>/dev/null || curl -4sf https://api.ipify.org 2>/dev/null || echo "unknown")
if [[ "$PUBLIC_IP" == "unknown" ]]; then warn "Could not detect public IP — DNS must be configured manually"; fi
ok "Public IP: $PUBLIC_IP"

# ── System Packages ────────────────────────────────────────────
step "Installing system packages"

export DEBIAN_FRONTEND=noninteractive
apt update -qq && apt upgrade -y -qq

apt install -y -qq \
    curl wget git ufw nginx certbot python3-certbot-nginx \
    docker.io docker-compose-v2 \
    htop iotop net-tools build-essential \
    openssl software-properties-common gnupg ca-certificates

ok "Base packages installed"

# ── Go ─────────────────────────────────────────────────────────
step "Installing Go 1.23"

if ! command -v go &>/dev/null || ! go version | grep -q 'go1\.2[3-9]'; then
    GO_VERSION="1.23.4"
    curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" -o /tmp/go.tar.gz
    rm -rf /usr/local/go
    tar -C /usr/local -xzf /tmp/go.tar.gz
    rm /tmp/go.tar.gz
    echo 'export PATH=$PATH:/usr/local/go/bin' > /etc/profile.d/go.sh
    export PATH=$PATH:/usr/local/go/bin
fi
ok "Go: $(go version | awk '{print $3}')"

# ── Node.js ────────────────────────────────────────────────────
step "Installing Node.js 20 LTS"

if ! command -v node &>/dev/null || ! node --version | grep -q 'v2[0-9]'; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y -qq nodejs
fi
ok "Node: $(node --version) / npm: $(npm --version)"

# ── Swap ───────────────────────────────────────────────────────
step "Configuring swap (2GB)"

if ! swapon --show | grep -q .; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
ok "Swap: 2GB active"

# ── Firewall ───────────────────────────────────────────────────
step "Configuring firewall"

ufw --force reset >/dev/null 2>&1
ufw default deny incoming  >/dev/null
ufw default allow outgoing >/dev/null
ufw allow 22/tcp  >/dev/null
ufw allow 80/tcp  >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null 2>&1
ok "UFW: 22/tcp 80/tcp 443/tcp open"

# ── Users & Directory ──────────────────────────────────────────
step "Creating deploy user and directories"

if ! id -u "$DEPLOY_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$DEPLOY_USER"
    usermod -aG docker "$DEPLOY_USER"
    # Allow passwordless sudo for service management
    echo "${DEPLOY_USER} ALL=(ALL) NOPASSWD: /usr/bin/systemctl, /usr/bin/journalctl, /usr/sbin/nginx" > "/etc/sudoers.d/${DEPLOY_USER}"
    chmod 440 "/etc/sudoers.d/${DEPLOY_USER}"
fi

mkdir -p "$APP_DIR" "$BIN_DIR" "$SCRIPTS_DIR" "$SECRETS_DIR" "$BACKUP_DIR" "$LOG_DIR"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "$APP_DIR" "$LOG_DIR"
ok "Directories created at $APP_DIR"

# ── Secrets Generation ─────────────────────────────────────────
step "Generating secrets"

mkdir -p "$SECRETS_DIR"

POSTGRES_PW=$(openssl rand -base64 32)
REDIS_PW=$(openssl rand -base64 32)
RABBITMQ_PW=$(openssl rand -base64 32)

# Generate Stellar testnet keypair using stellar CLI if available
if command -v stellar &>/dev/null; then
    STELLAR_OUTPUT=$(stellar keys generate --no-fund 2>&1 || true)
    STELLAR_PUBLIC=$(echo "$STELLAR_OUTPUT" | grep -oP 'G[A-Z2-7]{55}' | head -1)
    STELLAR_SECRET=$(echo "$STELLAR_OUTPUT" | grep -oP 'S[A-Z2-7]{55}' | head -1)
fi

# Fallback: generate via openssl ed25519 and format as Stellar key
if [[ -z "${STELLAR_SECRET:-}" ]]; then
    RAW_SECRET=$(openssl rand 32 | base64 | tr -d '=')
    STELLAR_PUBLIC="GENERATE_MANUALLY"
    STELLAR_SECRET="GENERATE_MANUALLY"
    warn "stellar CLI not available — generate a testnet keypair manually:"
    warn "  Visit: https://laboratory.stellar.org/#account-creator"
fi

# Generate JWT keys
JWT_PRIVATE="${BACKEND_DIR}/config/keys/jwt-private.pem"
JWT_PUBLIC="${BACKEND_DIR}/config/keys/jwt-public.pem"
mkdir -p "$(dirname "$JWT_PRIVATE")"
if [[ ! -f "$JWT_PRIVATE" ]]; then
    openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$JWT_PRIVATE" 2>/dev/null
    openssl rsa -pubout -in "$JWT_PRIVATE" -out "$JWT_PUBLIC" 2>/dev/null
    chmod 600 "$JWT_PRIVATE"
    chmod 644 "$JWT_PUBLIC"
fi

ok "Secrets generated"
ok "Stellar public key: ${STELLAR_PUBLIC:-see below}"
ok "JWT keys generated"

# ── Clone Repos ────────────────────────────────────────────────
step "Cloning repositories"

if [[ ! -d "${BACKEND_DIR}/.git" ]]; then
    git clone --depth 1 "$GITHUB_BACKEND" "$BACKEND_DIR"
else
    git -C "$BACKEND_DIR" pull --ff-only origin master
fi
ok "Backend repo cloned"

if [[ ! -d "${FRONTEND_DIR}/.git" ]]; then
    git clone --depth 1 "$GITHUB_FRONTEND" "$FRONTEND_DIR"
else
    git -C "$FRONTEND_DIR" pull --ff-only origin master
fi
ok "Frontend repo cloned"

chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "$BACKEND_DIR" "$FRONTEND_DIR"
ln -sf "${BACKEND_DIR}/config" "/etc/moistello"

# ── Backend Environment File ───────────────────────────────────
step "Writing backend environment file"

cat > "${SECRETS_DIR}/.env" << ENVEOF
# Moistello Backend — Production Environment
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

MOISTELLO_ENVIRONMENT=production
MOISTELLO_SERVER_PORT=${API_PORT}
MOISTELLO_SERVER_HOST=127.0.0.1
MOISTELLO_SERVER_READ_TIMEOUT=10s
MOISTELLO_SERVER_WRITE_TIMEOUT=30s

MOISTELLO_DATABASE_URL=postgres://moistello:${POSTGRES_PW}@127.0.0.1:5432/moistello?sslmode=disable
MOISTELLO_DATABASE_MAX_OPEN_CONNS=50
MOISTELLO_DATABASE_MAX_IDLE_CONNS=10

MOISTELLO_REDIS_URL=redis://:${REDIS_PW}@127.0.0.1:6379
MOISTELLO_RABBITMQ_URL=amqp://moistello:${RABBITMQ_PW}@127.0.0.1:5672/

MOISTELLO_AUTH_JWT_PRIVATE_KEY_PATH=${BACKEND_DIR}/config/keys/jwt-private.pem
MOISTELLO_AUTH_JWT_PUBLIC_KEY_PATH=${BACKEND_DIR}/config/keys/jwt-public.pem
MOISTELLO_AUTH_ACCESS_TOKEN_TTL=15m
MOISTELLO_AUTH_REFRESH_TOKEN_TTL=168h
MOISTELLO_AUTH_NONCE_TTL=5m

MOISTELLO_CORS_ALLOWED_ORIGINS=https://${DOMAIN}

MOISTELLO_LOGGING_LEVEL=info
MOISTELLO_LOGGING_FORMAT=json

MOISTELLO_RATE_LIMIT_GLOBAL=100
MOISTELLO_RATE_LIMIT_AUTHENTICATED=300
MOISTELLO_RATE_LIMIT_AUTH=10

MOISTELLO_STELLAR_NETWORK=testnet
MOISTELLO_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
MOISTELLO_STELLAR_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
MOISTELLO_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
MOISTELLO_STELLAR_MASTER_PUBLIC_KEY=${STELLAR_PUBLIC}
MOISTELLO_STELLAR_MASTER_SECRET_KEY=${STELLAR_SECRET}
ENVEOF

chmod 600 "${SECRETS_DIR}/.env"
ln -sf "${SECRETS_DIR}/.env" "${BACKEND_DIR}/.env"
ok "Backend .env written"

# ── Docker Compose Production Override ─────────────────────────
step "Writing Docker Compose production override"

cat > "${BACKEND_DIR}/docker-compose.prod.yml" << COMPOSEEOF
version: '3.8'
services:
  postgres:
    environment:
      POSTGRES_DB: moistello
      POSTGRES_USER: moistello
      POSTGRES_PASSWORD: "${POSTGRES_PW}"
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ${BACKUP_DIR}:/backups
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

ok "Docker Compose override written"

# ── Start Docker Services ──────────────────────────────────────
step "Starting Docker services (PostgreSQL + Redis + RabbitMQ)"

cd "$BACKEND_DIR"
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull -q 2>/dev/null || true
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --wait 2>&1 | head -5

# Wait for healthy
for i in $(seq 1 30); do
    if docker compose -f docker-compose.yml ps | grep -q '(healthy)'; then
        break
    fi
    sleep 2
done

docker compose -f docker-compose.yml ps
ok "Docker services running"

# ── Database Migrations ────────────────────────────────────────
step "Running database migrations"

export $(grep -v '^#' "${SECRETS_DIR}/.env" | xargs)
cd "$BACKEND_DIR"
go run ./cmd/migrate --direction up 2>&1 | tail -5
ok "Migrations applied"

# ── Build Backend ──────────────────────────────────────────────
step "Building backend binary"

cd "$BACKEND_DIR"
CGO_ENABLED=0 go build -ldflags="-s -w" -o "${BIN_DIR}/moistello-api" ./cmd/api-server
chown "${DEPLOY_USER}:${DEPLOY_USER}" "${BIN_DIR}/moistello-api"
chmod 755 "${BIN_DIR}/moistello-api"
ok "Backend binary: ${BIN_DIR}/moistello-api ($(du -h ${BIN_DIR}/moistello-api | cut -f1))"

# ── Frontend Build ─────────────────────────────────────────────
step "Building frontend"

cat > "${FRONTEND_DIR}/.env.local" << FEEOF
NEXT_PUBLIC_API_URL=https://${DOMAIN}/v1
NEXT_PUBLIC_WS_URL=wss://${DOMAIN}/ws
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_PASSKEY_RP_ID=${DOMAIN}
NEXT_PUBLIC_PASSKEY_PEPPER=moistello-passkey-pepper-v1
NEXT_PUBLIC_FEATURE_MULTI_WALLET=true
NEXT_PUBLIC_FEATURE_PASSKEY=true
NEXT_PUBLIC_FEATURE_HARDWARE_WALLET=true
NEXT_PUBLIC_FEATURE_GOVERNANCE=true
NEXT_PUBLIC_FEATURE_REPUTATION_TIERS=true
FEEOF

cd "$FRONTEND_DIR"
npm ci --omit=dev --silent 2>&1 | tail -3
npm run build 2>&1 | tail -5
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "$FRONTEND_DIR/.next"
ok "Frontend built"

# ── systemd Units ──────────────────────────────────────────────
step "Installing systemd services"

# Backend unit
cat > /etc/systemd/system/moistello-api.service << APIUNIT
[Unit]
Description=Moistello API Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=${DEPLOY_USER}
WorkingDirectory=${BACKEND_DIR}
EnvironmentFile=${SECRETS_DIR}/.env
ExecStart=${BIN_DIR}/moistello-api
Restart=always
RestartSec=5
StandardOutput=append:${LOG_DIR}/api.log
StandardError=append:${LOG_DIR}/api-error.log
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
APIUNIT

# Frontend unit
cat > /etc/systemd/system/moistello-frontend.service << FEUNIT
[Unit]
Description=Moistello Frontend (Next.js)
After=network.target

[Service]
Type=simple
User=${DEPLOY_USER}
WorkingDirectory=${FRONTEND_DIR}
Environment=NODE_ENV=production
Environment=PORT=${FRONTEND_PORT}
ExecStart=/usr/bin/node ${FRONTEND_DIR}/node_modules/.bin/next start
Restart=always
RestartSec=5
StandardOutput=append:${LOG_DIR}/frontend.log
StandardError=append:${LOG_DIR}/frontend-error.log
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
FEUNIT

chown "${DEPLOY_USER}:${DEPLOY_USER}" "$LOG_DIR"
systemctl daemon-reload
systemctl enable moistello-api moistello-frontend
systemctl restart moistello-api moistello-frontend

sleep 3
if systemctl is-active --quiet moistello-api; then ok "Backend service: running"; else fail "Backend service failed to start — check: journalctl -u moistello-api"; fi
if systemctl is-active --quiet moistello-frontend; then ok "Frontend service: running"; else fail "Frontend service failed to start — check: journalctl -u moistello-frontend"; fi

# Verify backend responds locally
sleep 2
if curl -sf http://127.0.0.1:${API_PORT}/health >/dev/null 2>&1; then
    ok "Backend health check: http://127.0.0.1:${API_PORT}/health OK"
else
    warn "Backend health check failed — may need a moment to start"
fi

# ── Nginx Configuration ────────────────────────────────────────
step "Configuring Nginx"

NGINX_SITE="/etc/nginx/sites-available/moistello"

cat > "$NGINX_SITE" << 'NGINXEOF'
limit_req_zone $binary_remote_addr zone=moistello_api:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=moistello_fe:10m rate=100r/s;

upstream backend  { server 127.0.0.1:1100; }
upstream frontend { server 127.0.0.1:1110; }

server {
    listen 80;
    listen [::]:80;
    server_name moistello.com www.moistello.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name moistello.com www.moistello.com;

    ssl_certificate     /etc/letsencrypt/live/moistello.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/moistello.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/moistello.com/chain.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;
    gzip_comp_level 6;

    location /health {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /metrics {
        allow 127.0.0.1;
        deny all;
        proxy_pass http://backend;
    }

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

    location /v1/ {
        limit_req zone=moistello_api burst=20 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
        client_max_body_size 10m;
    }

    location / {
        limit_req zone=moistello_fe burst=50 nodelay;
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
}
NGINXEOF

ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/moistello
rm -f /etc/nginx/sites-enabled/default
sed -i 's/# server_tokens off;/server_tokens off;/' /etc/nginx/nginx.conf 2>/dev/null || true

# Validate config BEFORE enabling SSL
sed -i "s|ssl_certificate .*|ssl_certificate /dev/null;|" "$NGINX_SITE"
sed -i "s|ssl_certificate_key .*|ssl_certificate_key /dev/null;|" "$NGINX_SITE"
sed -i "s|ssl_trusted_certificate .*|ssl_trusted_certificate /dev/null;|" "$NGINX_SITE"
sed -i 's|listen 443 ssl http2;|listen 443;|' "$NGINX_SITE"
sed -i 's|listen \[::\]:443 ssl http2;|listen [::]:443;|' "$NGINX_SITE"

if nginx -t 2>&1; then
    systemctl reload nginx
    ok "Nginx: config valid, running"
else
    fail "Nginx config invalid — check $NGINX_SITE"
fi

# ── SSL Certificate ────────────────────────────────────────────
step "Requesting SSL certificate"

# Restore SSL lines for certbot
sed -i "s|ssl_certificate /dev/null;|ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;|" "$NGINX_SITE"
sed -i "s|ssl_certificate_key /dev/null;|ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;|" "$NGINX_SITE"
sed -i "s|ssl_trusted_certificate /dev/null;|ssl_trusted_certificate /etc/letsencrypt/live/${DOMAIN}/chain.pem;|" "$NGINX_SITE"
sed -i 's|listen 443;|listen 443 ssl http2;|' "$NGINX_SITE"
sed -i 's|listen \[::\]:443;|listen [::]:443 ssl http2;|' "$NGINX_SITE"

# Check if DNS resolves before attempting SSL
DNS_READY=false
if host "$DOMAIN" 2>/dev/null | grep -q "$PUBLIC_IP"; then
    DNS_READY=true
fi

if $DNS_READY; then
    certbot --nginx -d "${DOMAIN}" -d "${WWW_DOMAIN}" \
        --non-interactive --agree-tos --email "admin@${DOMAIN}" \
        --redirect 2>&1 | tail -5
    ok "SSL certificate obtained for ${DOMAIN}"
else
    warn "DNS for ${DOMAIN} not yet pointing to ${PUBLIC_IP}"
    warn "Skipping SSL — run this once DNS propagates:"
    warn "  certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}"
    # Comment out SSL lines so nginx doesn't break
    sed -i 's|listen 443 ssl http2;|# listen 443 ssl http2; # SSL pending|' "$NGINX_SITE"
    sed -i 's|listen \[::\]:443 ssl http2;|# listen [::]:443 ssl http2; # SSL pending|' "$NGINX_SITE"
    nginx -t && systemctl reload nginx
fi

# ── Backup Cron ────────────────────────────────────────────────
step "Configuring automated backups"

cat > "${SCRIPTS_DIR}/backup.sh" << 'BACKUPEOF'
#!/bin/bash
set -euo pipefail
BACKUP_DIR="/opt/moistello/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_DIR"
docker exec moistello-postgres pg_dump -U moistello moistello 2>/dev/null \
    | gzip > "$BACKUP_DIR/postgres-${TIMESTAMP}.sql.gz"
find "$BACKUP_DIR" -name "postgres-*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
echo "[$(date -Iseconds)] Backup: postgres-${TIMESTAMP}.sql.gz ($(du -h $BACKUP_DIR/postgres-${TIMESTAMP}.sql.gz 2>/dev/null | cut -f1))"
BACKUPEOF

chmod +x "${SCRIPTS_DIR}/backup.sh"
chown "${DEPLOY_USER}:${DEPLOY_USER}" "${SCRIPTS_DIR}/backup.sh"

# Add cron job for deploy user (runs every 6 hours)
if ! crontab -u "$DEPLOY_USER" -l 2>/dev/null | grep -q 'backup.sh'; then
    (crontab -u "$DEPLOY_USER" -l 2>/dev/null; echo "0 */6 * * * ${SCRIPTS_DIR}/backup.sh >> ${LOG_DIR}/backup.log 2>&1") | crontab -u "$DEPLOY_USER" -
fi
ok "Backup cron: every 6 hours, 30-day retention"

# Run first backup immediately
su - "$DEPLOY_USER" -c "${SCRIPTS_DIR}/backup.sh" 2>&1 || warn "First backup failed — PostgreSQL may still be starting"

# ── Health Monitor Cron ────────────────────────────────────────
step "Configuring health monitor"

cat > "${SCRIPTS_DIR}/health-check.sh" << 'HEALTHEOF'
#!/bin/bash
echo "=== $(date -Iseconds) ==="
echo "DISK:  $(df -h / | tail -1 | awk '{print $5 " used (" $3 "/" $2 ")"}')"
echo "MEM:   $(free -h | grep Mem | awk '{print $3 "/" $2 " (" $3/$2*100 "% used)"}')"
echo "LOAD:  $(uptime | awk -F'load average:' '{print $2}')"
echo "API:   $(systemctl is-active moistello-api 2>/dev/null || echo 'dead')"
echo "FRONT: $(systemctl is-active moistello-frontend 2>/dev/null || echo 'dead')"
echo "PG:    $(docker inspect -f '{{.State.Status}}' moistello-postgres 2>/dev/null || echo 'down')"
echo "REDIS: $(docker inspect -f '{{.State.Status}}' moistello-redis 2>/dev/null || echo 'down')"
echo "RMQ:   $(docker inspect -f '{{.State.Status}}' moistello-rabbitmq 2>/dev/null || echo 'down')"
HEALTHEOF

chmod +x "${SCRIPTS_DIR}/health-check.sh"
chown "${DEPLOY_USER}:${DEPLOY_USER}" "${SCRIPTS_DIR}/health-check.sh"

if ! crontab -u "$DEPLOY_USER" -l 2>/dev/null | grep -q 'health-check.sh'; then
    (crontab -u "$DEPLOY_USER" -l 2>/dev/null; echo "*/15 * * * * ${SCRIPTS_DIR}/health-check.sh >> ${LOG_DIR}/health.log 2>&1") | crontab -u "$DEPLOY_USER" -
fi
ok "Health monitor: every 15 minutes"

# ── Auto Updates ───────────────────────────────────────────────
step "Enabling automatic security updates"

apt install -y -qq unattended-upgrades >/dev/null 2>&1 || true
cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF
ok "Auto security updates enabled"

# ── Final Summary ──────────────────────────────────────────────
step "Deployment Complete!"

cat << SUMMARY
   ╔═══════════════════════════════════════════════════════════╗
   ║         Moistello is deployed!                             ║
   ╚═══════════════════════════════════════════════════════════╝

   Website:     https://${DOMAIN}
   API:         https://${DOMAIN}/v1/
   Health:      https://${DOMAIN}/health

   ── Services ─────────────────────────────────────────────
   Backend:     systemctl status moistello-api
   Frontend:    systemctl status moistello-frontend
   Postgres:    docker compose -f ${BACKEND_DIR}/docker-compose.yml ps
   Logs:
     API:       journalctl -u moistello-api -f
     Frontend:  journalctl -u moistello-frontend -f
     Health:    tail -f ${LOG_DIR}/health.log
     Backups:   tail -f ${LOG_DIR}/backup.log

   ── Post-Deploy ──────────────────────────────────────────
   ① Fund Stellar testnet account:
      ${STELLAR_PUBLIC}
      → https://laboratory.stellar.org/#account-creator

   ② If SSL skipped (DNS not propagated yet):
      certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}

   ③ Verify:
      curl -s https://${DOMAIN}/health
      curl -sI https://${DOMAIN} | head -5
SUMMARY
