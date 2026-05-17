#!/usr/bin/env bash
# ── 20-ssl.sh ── Get SSL certificate
set -euo pipefail
echo "=== STEP 20: Getting SSL certificate ==="
DOMAIN="${DOMAIN:-moistello.com}"

IP=$(curl -4sf https://ifconfig.me 2>/dev/null || echo "")
DNS_READY=false
if [ -n "$IP" ] && host "$DOMAIN" 2>/dev/null | grep -q "$IP"; then
    DNS_READY=true
fi

if $DNS_READY; then
    certbot --nginx -d "$DOMAIN" -d "www.${DOMAIN}" \
        --non-interactive --agree-tos --email "admin@${DOMAIN}" \
        --redirect 2>&1 | tail -5
    echo "SSL: obtained ✓"
else
    echo "WARNING: DNS for $DOMAIN not pointed to this server yet"
    echo "Run this once DNS propagates:"
    echo "  certbot --nginx -d $DOMAIN -d www.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}"
    # Disable SSL in nginx for now
    sed -i 's|listen 443 ssl http2;|# listen 443 ssl http2;|' /etc/nginx/sites-available/moistello
    sed -i 's|listen \[::\]:443 ssl http2;|# listen [::]:443 ssl http2;|' /etc/nginx/sites-available/moistello
    nginx -t && systemctl reload nginx
fi
echo "PASSED"
