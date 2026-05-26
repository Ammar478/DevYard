#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="verify-commit-refs"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"

INPUT=$(cat)

TOOL_NAME=$(echo "${INPUT}" | jq -r '.tool_name // ""')
COMMAND=$(echo "${INPUT}" | jq -r '.tool_input.command // ""')

if [[ "${TOOL_NAME}" != "Bash" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${TOOL_NAME}"
  exit 0
fi

if ! echo "${COMMAND}" | grep -qE '(^|[[:space:]])git[[:space:]]+commit([[:space:]]|$)'; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
  exit 0
fi

MSG=$(echo "${COMMAND}" | grep -oP '(?<=-m )["\x27]?[^"'"'"']+["\x27]?' | head -1 | tr -d '"'"'" || echo "")

if [[ -z "${MSG}" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "msg-undetectable"
  exit 0
fi

# Extract issue numbers from "Closes #N" or "Fixes #N"
ISSUE_NUMS=$(echo "${MSG}" | grep -oP '(?<=(Closes|Fixes) #)[0-9]+' || echo "")

if [[ -z "${ISSUE_NUMS}" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${MSG:0:60}"
  exit 0
fi

for NUM in ${ISSUE_NUMS}; do
  STATE=$(gh issue view "${NUM}" --json state -q .state 2>/dev/null || echo "")
  if [[ "${STATE}" != "OPEN" ]]; then
    _audit_log_append "${HOOK_NAME}" "blocked" "issue:${NUM} state:${STATE}"
    echo "Issue #${NUM} is not open." >&2
    exit 2
  fi
done

_audit_log_append "${HOOK_NAME}" "allowed" "${MSG:0:60}"
exit 0
