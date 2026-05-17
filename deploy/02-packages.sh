#!/usr/bin/env bash
# ── 02-packages.sh ── Install system packages
set -euo pipefail
echo "=== STEP 02: Installing system packages ==="
export DEBIAN_FRONTEND=noninteractive
apt update -qq && apt upgrade -y -qq
apt install -y -qq curl wget git ufw nginx certbot python3-certbot-nginx \
    docker.io docker-compose-v2 htop iotop net-tools build-essential \
    openssl software-properties-common gnupg ca-certificates
echo "PASSED"
