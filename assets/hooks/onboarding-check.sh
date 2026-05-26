#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="onboarding-check"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"

ONBOARDING_FILE="${HOME}/.devyard/onboarding.yaml"
RESULT="allowed"
SUMMARY="session start"

if [[ ! -f "${ONBOARDING_FILE}" ]]; then
  echo "Warning: ${ONBOARDING_FILE} not found. Run 'devyard init' to complete onboarding." >&2
  RESULT="allowed"
elif grep -qE '<[^>]+>|PLACEHOLDER' "${ONBOARDING_FILE}" 2>/dev/null; then
  echo "Warning: onboarding.yaml contains placeholder values. Update them before using DevYard." >&2
  RESULT="allowed"
fi

_audit_log_append "${HOOK_NAME}" "${RESULT}" "${SUMMARY}"
exit 0
