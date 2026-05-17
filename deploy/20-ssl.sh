#!/usr/bin/env bash
# ── 20-ssl.sh ── Obtain SSL certificate via certbot and enable HTTPS
source "$(dirname "$0")/lib/common.sh"
set -euo pipefail

step_start "Obtain SSL certificate"
skip_if_done "20" && exit 0

require_root
require_command "certbot"
require_command "nginx"

NGINX_SITE="/etc/nginx/sites-available/moistello"
EMAIL="${SSL_EMAIL:-admin@${DOMAIN}}"

# ── DNS check ──────────────────────────────────────────────
info "Checking DNS for $DOMAIN..."

# Try getent hosts first, then dig, then public IP comparison
DIG_INSTALLED=false
command -v dig &>/dev/null && DIG_INSTALLED=true

SERVER_IP=$(public_ip)
if [ "$SERVER_IP" = "unknown" ]; then
    fail "Could not determine server public IP"
fi
info "Server public IP: $SERVER_IP"

DNS_OK=false
if getent hosts "$DOMAIN" &>/dev/null; then
    DNS_IP=$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1)
    info "DNS ($DOMAIN via getent): $DNS_IP"
    [ "$DNS_IP" = "$SERVER_IP" ] && DNS_OK=true
fi

if ! $DNS_OK && $DIG_INSTALLED; then
    DNS_IP=$(dig +short "$DOMAIN" 2>/dev/null | head -1 || true)
    if [ -n "$DNS_IP" ]; then
        info "DNS ($DOMAIN via dig): $DNS_IP"
        [ "$DNS_IP" = "$SERVER_IP" ] && DNS_OK=true
    fi
fi

if ! $DNS_OK; then
    warn "DNS for $DOMAIN does not resolve to this server ($SERVER_IP)"
    warn "Skipping SSL issuance. Run this step again after DNS propagates."
    warn "  certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL"
    mark_done "20"
    step_end
    exit 0
fi

ok "DNS verified: $DOMAIN → $SERVER_IP"

# ── Dry-run certificate issuance ───────────────────────────
info "Running certbot dry-run (to avoid rate limits)..."
if certbot --nginx \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --dry-run 2>&1; then
    ok "Certbot dry-run succeeded"
else
    fail "Certbot dry-run failed. Review the error above before retrying."
fi

# ── Actual certificate issuance ────────────────────────────
info "Obtaining real certificate (certbot --nginx)..."
if certbot --nginx \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" 2>&1; then
    ok "Certificate obtained for $DOMAIN"
else
    fail "Certbot failed to obtain certificate"
fi

# ── Uncomment HTTPS server block ───────────────────────────
info "Enabling HTTPS server block..."
# Uncomment all config lines in the HTTPS block (lines starting with #server, #    ssl_, #    listen 443, etc.)
# We match lines from '#server {' (the HTTPS one) to the next '}' at the start of a line
awk '
/^#server \{/ { in_ssl=1 }
in_ssl && /^#/ && !/^# ──/ { sub(/^#/, ""); print; next }
{ print }
' "$NGINX_SITE" > "${NGINX_SITE}.tmp" && mv "${NGINX_SITE}.tmp" "$NGINX_SITE"

# ── Add HTTP → HTTPS redirect ──────────────────────────────
info "Adding HTTP → HTTPS redirect..."
# Find the HTTP server block and insert a redirect before location blocks
sed -i '/server_name __DOMAIN__ www.__DOMAIN__;/{n;/# Security headers/{i\
    return 301 https://$host$request_uri;
}}' "$NGINX_SITE" 2>/dev/null || {
    # Fallback: insert after the first 'server_name' inside HTTP block but before security headers
    sed -i "/server_name ${DOMAIN}/a\\    return 301 https://\\\$host\\\$request_uri;" "$NGINX_SITE"
}
# Clean up placeholder if any remain
sed -i "s/__DOMAIN__/${DOMAIN}/g" "$NGINX_SITE"

# ── Validate and reload ────────────────────────────────────
info "Validating updated nginx config..."
if nginx -t 2>&1; then
    ok "Nginx config valid with SSL"
else
    fail "Nginx config validation failed after SSL changes"
fi

run systemctl reload nginx
ok "Nginx reloaded with SSL"

# ── Verify HTTPS ───────────────────────────────────────────
info "Verifying HTTPS..."
if HTTPS_RESP=$(curl -sI "https://${DOMAIN}" 2>&1 | head -3); then
    ok "HTTPS responding:"
    echo "$HTTPS_RESP"
else
    warn "HTTPS verification failed — check nginx and certbot logs"
fi

# ── Auto-renewal verification ──────────────────────────────
info "Verifying auto-renewal..."
if certbot renew --dry-run 2>&1; then
    ok "Auto-renewal dry-run succeeded"
else
    warn "Auto-renewal dry-run had issues — check certbot configuration"
fi

mark_done "20"
step_end
