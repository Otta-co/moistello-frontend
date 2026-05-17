#!/usr/bin/env bash
# ── 11-clone-repos.sh ── Verify/clone all 3 repositories
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"

step_header "STEP 11: Repository Verification & Clone"

GIT_BASE="https://github.com/Otta-co"
REPOS=(
    "moistello-backend|backend"
    "moistello-frontend|frontend"
    "moistello-contracts|contracts"
)

for entry in "${REPOS[@]}"; do
    repo_name="${entry%%|*}"
    dir_name="${entry##*|}"
    target="${APP_DIR}/${dir_name}"

    if [ -d "${target}/.git" ]; then
        # Repo exists — verify it's not a broken shallow clone
        if git -C "$target" rev-parse HEAD &>/dev/null; then
            ok "${repo_name} already exists at $target"
            # Attempt to fetch and update if shallow
            if git -C "$target" rev-parse --is-shallow-repository &>/dev/null; then
                if git -C "$target" rev-parse --is-shallow-repository | grep -q true; then
                    info "${repo_name} is a shallow clone — unshallowing"
                    run git -C "$target" fetch --unshallow origin 2>/dev/null || {
                        warn "Could not unshallow ${repo_name}; re-cloning"
                        rm -rf "$target"
                        run git clone --depth 1 "${GIT_BASE}/${repo_name}.git" "$target"
                    }
                fi
            fi
        else
            warn "${repo_name} exists but is corrupted — re-cloning"
            rm -rf "$target"
            run git clone --depth 1 "${GIT_BASE}/${repo_name}.git" "$target"
        fi
    else
        info "Cloning ${repo_name} → $target"
        run git clone --depth 1 "${GIT_BASE}/${repo_name}.git" "$target"
    fi
done

ok "All 3 repositories verified"

mark_done "11"
