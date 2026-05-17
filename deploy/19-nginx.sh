#!/usr/bin/env bash
# ── 19-nginx.sh ── Configure Nginx reverse proxy (HTTP only; SSL in step 20)
source "$(dirname "$0")/lib/common.sh"
set -euo pipefail

step_start "Configure Nginx"
skip_if_done "19" && exit 0

require_root
require_command "nginx"

NGINX_SITE="/etc/nginx/sites-available/moistello"
backup_file "$NGINX_SITE"

info "Writing nginx config (HTTP only; SSL block commented out for step 20)..."

cat > "$NGINX_SITE" << 'NGINXEOF'
# ──────────────────────────────────────────────────────────
# Rate limiting
# ──────────────────────────────────────────────────────────
limit_req_zone $binary_remote_addr zone=moistello_api:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=moistello_fe:10m rate=100r/s;

# ──────────────────────────────────────────────────────────
# Upstreams
# ──────────────────────────────────────────────────────────
upstream backend  { server 127.0.0.1:1100; }
upstream frontend { server 127.0.0.1:1110; }

# ──────────────────────────────────────────────────────────
# HTTP server (active now; HTTPS redirect added by step 20)
# ──────────────────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name __DOMAIN__ www.__DOMAIN__;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;
    gzip_comp_level 6;

    # Health check
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
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # API routes — rate limited
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

    # Frontend — everything else
    location / {
        limit_req zone=moistello_fe burst=50 nodelay;
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}

# ──────────────────────────────────────────────────────────
# HTTPS server (commented out — enabled by step 20/20-ssl.sh)
# ──────────────────────────────────────────────────────────
#server {
#    listen 443 ssl http2;
#    listen [::]:443 ssl http2;
#    server_name __DOMAIN__ www.__DOMAIN__;
#
#    ssl_certificate     /etc/letsencrypt/live/__DOMAIN__/fullchain.pem;
#    ssl_certificate_key /etc/letsencrypt/live/__DOMAIN__/privkey.pem;
#    ssl_trusted_certificate /etc/letsencrypt/live/__DOMAIN__/chain.pem;
#    ssl_protocols TLSv1.2 TLSv1.3;
#    ssl_session_cache shared:SSL:10m;
#
#    # Security headers (HSTS only on HTTPS)
#    add_header X-Frame-Options "DENY" always;
#    add_header X-Content-Type-Options "nosniff" always;
#    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
#    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
#
#    # Gzip
#    gzip on;
#    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
#    gzip_min_length 1000;
#    gzip_comp_level 6;
#
#    location /health {
#        proxy_pass http://backend;
#        proxy_http_version 1.1;
#        proxy_set_header Host $host;
#    }
#
#    location /ws {
#        proxy_pass http://backend;
#        proxy_http_version 1.1;
#        proxy_set_header Upgrade $http_upgrade;
#        proxy_set_header Connection "upgrade";
#        proxy_set_header Host $host;
#        proxy_read_timeout 3600s;
#        proxy_send_timeout 3600s;
#    }
#
#    location /v1/ {
#        limit_req zone=moistello_api burst=20 nodelay;
#        proxy_pass http://backend;
#        proxy_http_version 1.1;
#        proxy_set_header Host $host;
#        proxy_set_header X-Real-IP $remote_addr;
#        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#        proxy_set_header X-Forwarded-Proto $scheme;
#        proxy_read_timeout 30s;
#        client_max_body_size 10m;
#    }
#
#    location / {
#        limit_req zone=moistello_fe burst=50 nodelay;
#        proxy_pass http://frontend;
#        proxy_http_version 1.1;
#        proxy_set_header Host $host;
#        proxy_set_header X-Real-IP $remote_addr;
#        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#        proxy_set_header X-Forwarded-Proto $scheme;
#        proxy_read_timeout 60s;
#    }
#}
NGINXEOF

# Replace placeholders with the actual domain
sed -i "s/__DOMAIN__/${DOMAIN}/g" "$NGINX_SITE"
ok "Nginx config written to $NGINX_SITE"

info "Enabling site..."
ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/moistello
rm -f /etc/nginx/sites-enabled/default

info "Validating nginx config..."
if nginx -t 2>&1; then
    ok "Nginx config is valid"
else
    fail "Nginx config validation failed"
fi

run systemctl reload nginx
ok "Nginx reloaded — serving HTTP on port 80"

info "NOTE: SSL will be configured by step 20 (20-ssl.sh)"
mark_done "19"
step_end
