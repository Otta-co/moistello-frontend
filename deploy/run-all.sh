#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
START="${1:-1}"

# ── Validate START argument ─────────────────────────────────────
if ! [[ "${START}" =~ ^[0-9]+$ ]]; then
    fail "START argument must be a number, got: ${START}"
fi
if [ "${START}" -lt 1 ] || [ "${START}" -gt 22 ]; then
    fail "START must be between 1 and 22, got: ${START}"
fi

_log()   { echo -e "[$(date -Iseconds)] $1"; }
_ok()    { _log "  ${G}✓${N} $1"; }
_fail()  { _log "  ${R}✗${N} $1"; }
_info()  { _log "  ${B}→${N} $1"; }

DEPLOY_LOG="${LOG_DIR}/deploy.log"
mkdir -p "${LOG_DIR}"

# ── List all scripts and verify ─────────────────────────────────
echo ""
_log "${W}═══ Moistello Deployment ─── Starting from step ${START} ═══${N}"
_log "Log file: ${DEPLOY_LOG}"
echo ""

_info "Scanning deploy scripts..."

ALL_SCRIPTS=()
MISSING_SCRIPTS=()
NOT_EXECUTABLE=()

for i in $(seq 1 22); do
    script_path="${SCRIPT_DIR}/$(printf "%02d" "${i}")-"*.sh
    # Glob expands; pick the first match
    found=$(ls ${script_path} 2>/dev/null | head -1 || true)
    if [ -z "${found}" ]; then
        MISSING_SCRIPTS+=("step ${i}")
    else
        ALL_SCRIPTS+=("${found}")
        if [ ! -x "${found}" ]; then
            NOT_EXECUTABLE+=("$(basename "${found}")")
        fi
    fi
done

if [ ${#MISSING_SCRIPTS[@]} -gt 0 ]; then
    fail "Missing scripts: ${MISSING_SCRIPTS[*]}"
fi
if [ ${#NOT_EXECUTABLE[@]} -gt 0 ]; then
    _log "  ${Y}⚠${N} Making non-executable scripts executable: ${NOT_EXECUTABLE[*]}"
    for f in "${NOT_EXECUTABLE[@]}"; do
        chmod +x "${SCRIPT_DIR}/${f}"
    done
fi

_info "All 22 deploy scripts present and executable"
echo ""

# ── Run each step ───────────────────────────────────────────────
TOTAL_START=$(date +%s)
PASSED_STEPS=()
FAILED_STEP=""

for i in $(seq "${START}" 22); do
    script=$(ls "${SCRIPT_DIR}/$(printf "%02d" "${i}")"-*.sh 2>/dev/null | head -1)
    script_name=$(basename "${script}")

    echo ""
    _log "${W}═══ Running step ${i}: ${script_name} ═══${N}"
    _log "  Started: $(date -Iseconds)"

    STEP_START=$(date +%s)

    if bash "${script}" 2>&1 | tee -a "${DEPLOY_LOG}"; then
        STEP_END=$(date +%s)
        STEP_DURATION=$((STEP_END - STEP_START))
        _ok "Step ${i} PASSED (${STEP_DURATION}s)"
        PASSED_STEPS+=("${i}")
    else
        EC=${PIPESTATUS[0]}
        STEP_END=$(date +%s)
        STEP_DURATION=$((STEP_END - STEP_START))
        _fail "Step ${i} FAILED (${STEP_DURATION}s)"

        echo ""
        _log "${R}═══════════════════════════════════════════════════════════════${N}"
        _fail "DEPLOYMENT FAILED AT STEP ${i} (${script_name})"
        _log "  Exit code:      ${EC}"
        _log "  Resume command: bash run-all.sh ${i}"
        _log "  Log file:       ${DEPLOY_LOG}"
        _log "${R}═══════════════════════════════════════════════════════════════${N}"
        FAILED_STEP="${i}"
        exit "${EC}"
    fi
done

# ── Success: print summary ──────────────────────────────────────
TOTAL_END=$(date +%s)
TOTAL_DURATION=$((TOTAL_END - TOTAL_START))
HOURS=$((TOTAL_DURATION / 3600))
MINUTES=$(((TOTAL_DURATION % 3600) / 60))
SECONDS=$((TOTAL_DURATION % 60))

echo ""
_log "${G}═══════════════════════════════════════════════════════════════${N}"
_log "${G}  DEPLOYMENT COMPLETE — All 22 steps passed${N}"
_log "${G}═══════════════════════════════════════════════════════════════${N}"
echo ""
_log "  Steps completed:  ${PASSED_STEPS[*]}"
_log "  Total time:       ${HOURS}h ${MINUTES}m ${SECONDS}s"
echo ""
_log "${W}  Verification URLs:${N}"
_log "    Frontend:  https://${DOMAIN}"
_log "    Backend:   https://${DOMAIN}/health"
_log "    API:       https://${DOMAIN}/v1/"
echo ""
_log "${W}  Next steps:${N}"
_log "    1. Fund the Stellar account"
_log "    2. Run: bash run-all.sh 09  (fund check)"
_log "    3. Verify the site: curl -s https://${DOMAIN}/health"
_log "    4. Monitor logs:    tail -f ${LOG_DIR}/deploy.log"
echo ""
