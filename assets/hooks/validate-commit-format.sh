#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="validate-commit-format"
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

# Extract -m value — handles: -m "msg" or -m 'msg' or -m msg
MSG=$(echo "${COMMAND}" | grep -oP '(?<=-m )["\x27]?[^"'"'"']+["\x27]?' | head -1 | tr -d '"'"'" || echo "")

if [[ -z "${MSG}" ]]; then
  # Can't extract message — allow and let git validate
  _audit_log_append "${HOOK_NAME}" "allowed" "msg-undetectable"
  exit 0
fi

VALID_PATTERN='^(feat|fix|refactor|chore|test|docs|perf|spike|build|ci)(\([^)]+\))?:[[:space:]].+'

if ! echo "${MSG}" | grep -qE "${VALID_PATTERN}"; then
  _audit_log_append "${HOOK_NAME}" "blocked" "msg:${MSG:0:60}"
  echo "Commit must match conventional format: type[(scope)]: subject" >&2
  echo "  Examples: feat(auth): add login, fix: resolve crash on startup" >&2
  exit 2
fi

_audit_log_append "${HOOK_NAME}" "allowed" "msg:${MSG:0:60}"
exit 0
