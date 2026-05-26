#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="validate-branch-name"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"

INPUT=$(cat)

TOOL_NAME=$(echo "${INPUT}" | jq -r '.tool_name // ""')
COMMAND=$(echo "${INPUT}" | jq -r '.tool_input.command // ""')

if [[ "${TOOL_NAME}" != "Bash" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${TOOL_NAME}"
  exit 0
fi

if ! echo "${COMMAND}" | grep -qE '(^|[[:space:]])git[[:space:]]+push([[:space:]]|$)'; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
  exit 0
fi

BRANCH=$(git branch --show-current 2>/dev/null || echo "")

if [[ -z "${BRANCH}" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "no-branch"
  exit 0
fi

VALID_PATTERN='^(feat|fix|refactor|chore|test|docs|perf|spike)/[A-Z]+-[0-9]+-[a-z0-9-]+$'

if ! echo "${BRANCH}" | grep -qE "${VALID_PATTERN}"; then
  _audit_log_append "${HOOK_NAME}" "blocked" "branch:${BRANCH}"
  echo "Branch name must match: {type}/{TICKET-ID}-{description} (e.g. feat/PROJ-123-add-login)" >&2
  exit 2
fi

_audit_log_append "${HOOK_NAME}" "allowed" "branch:${BRANCH}"
exit 0
