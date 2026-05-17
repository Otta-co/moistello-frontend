#!/usr/bin/env bash
# ── run-all.sh ── Execute all 22 deploy steps in order
# Usage: bash run-all.sh [start_step]
# Example: bash run-all.sh     (runs all)
#          bash run-all.sh 08  (resumes from step 08)
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
START="${1:-1}"

LOG="/var/log/moistello/deploy.log"
mkdir -p "$(dirname "$LOG")"

run_step() {
    local num=$1
    local script
    script=$(printf "%s/%02d-*.sh" "$DIR" "$num" 2>/dev/null)
    script=$(ls $script 2>/dev/null | head -1)
    if [ -z "$script" ]; then
        echo "ERROR: Step $num script not found"
        exit 1
    fi
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  RUNNING STEP $num: $(basename "$script")"
    echo "  $(date -Iseconds)"
    echo "═══════════════════════════════════════════════════════════════"
    if bash "$script" 2>&1 | tee -a "$LOG"; then
        echo "✓ STEP $num PASSED" | tee -a "$LOG"
    else
        echo "✗ STEP $num FAILED — fix the issue then re-run: bash run-all.sh $num" | tee -a "$LOG"
        exit 1
    fi
}

echo "Moistello Deployment — Starting from step $START"
echo "Log: $LOG"

for i in $(seq "$START" 22); do
    run_step "$i"
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ALL 22 STEPS COMPLETE"
echo "  Moistello is live at https://moistello.com"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Verify: curl -s https://moistello.com/health"
