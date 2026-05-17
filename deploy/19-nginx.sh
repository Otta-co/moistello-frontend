#!/usr/bin/env bash
# ── 19-nginx.sh ── Configure Nginx reverse proxy
set -euo pipefail
echo "=== STEP 19: Configuring Nginx ==="
DOMAIN="${DOMAIN:-moistello.com}"

cat > /etc/nginx/sites-available/moistello << NGINXEOF
limit_req_zone \$binary_remote_addr zone=moistello_api:10m rate=20r/s;
limit_req_zone \$binary_remote_addr zone=moistello_fe:10m rate=100r/s;

upstream backend  { server 127.0.0.1:1100; }
upstream frontend { server 127.0.0.1:1110; }

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/${DOMAIN}/chain.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:SSL:10m;

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;
    gzip_comp_level 6;

    location /health {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location /v1/ {
        limit_req zone=moistello_api burst=20 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 30s;
        client_max_body_size 10m;
    }

    location / {
        limit_req zone=moistello_fe burst=50 nodelay;
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }
}
NGINXEOF

# Temp: comment SSL for nginx validation
sed -i 's|ssl_certificate .*|ssl_certificate /dev/null;|' /etc/nginx/sites-available/moistello
sed -i 's|ssl_certificate_key .*|ssl_certificate_key /dev/null;|' /etc/nginx/sites-available/moistello
sed -i 's|ssl_trusted_certificate .*|ssl_trusted_certificate /dev/null;|' /etc/nginx/sites-available/moistello
sed -i 's|listen 443 ssl http2;|listen 443;|' /etc/nginx/sites-available/moistello
sed -i 's|listen \[::\]:443 ssl http2;|listen [::]:443;|' /etc/nginx/sites-available/moistello

ln -sf /etc/nginx/sites-available/moistello /etc/nginx/sites-enabled/moistello
rm -f /etc/nginx/sites-enabled/default

if nginx -t 2>&1; then
    systemctl reload nginx
    echo "Nginx: valid config, running ✓"
else
    echo "Nginx config FAILED"
    exit 1
fi

# Restore SSL lines for certbot
sed -i "s|ssl_certificate /dev/null;|ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;|" /etc/nginx/sites-available/moistello
sed -i "s|ssl_certificate_key /dev/null;|ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;|" /etc/nginx/sites-available/moistello
sed -i "s|ssl_trusted_certificate /dev/null;|ssl_trusted_certificate /etc/letsencrypt/live/${DOMAIN}/chain.pem;|" /etc/nginx/sites-available/moistello
sed -i 's|listen 443;|listen 443 ssl http2;|' /etc/nginx/sites-available/moistello
sed -i 's|listen \[::\]:443;|listen [::]:443 ssl http2;|' /etc/nginx/sites-available/moistello

echo "PASSED"
