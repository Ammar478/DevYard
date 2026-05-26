#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="block-git-add-all"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"

INPUT=$(cat)

TOOL_NAME=$(echo "${INPUT}" | jq -r '.tool_name // ""')
COMMAND=$(echo "${INPUT}" | jq -r '.tool_input.command // ""')

if [[ "${TOOL_NAME}" != "Bash" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${TOOL_NAME}"
  exit 0
fi

if echo "${COMMAND}" | grep -qE '(^|[[:space:]])git[[:space:]]+add[[:space:]]+(-A|--|--all|\.)([[:space:]]|$)'; then
  _audit_log_append "${HOOK_NAME}" "blocked" "${COMMAND:0:80}"
  echo "Blocked: 'git add -A/.' is not allowed. Stage specific files instead." >&2
  exit 2
fi

_audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
exit 0
