#!/usr/bin/env bash
# ── 11-clone-repos.sh ── Clone backend + frontend
set -euo pipefail
echo "=== STEP 11: Cloning repositories ==="
mkdir -p /opt/moistello

if [ ! -d /opt/moistello/backend/.git ]; then
    git clone --depth 1 https://github.com/Otta-co/moistello-backend.git /opt/moistello/backend
else
    git -C /opt/moistello/backend pull --ff-only origin master
fi
echo "Backend: done"

if [ ! -d /opt/moistello/frontend/.git ]; then
    git clone --depth 1 https://github.com/Otta-co/moistello-frontend.git /opt/moistello/frontend
else
    git -C /opt/moistello/frontend pull --ff-only origin master
fi
echo "Frontend: done"

chown -R deploy:deploy /opt/moistello/backend /opt/moistello/frontend
echo "PASSED"
