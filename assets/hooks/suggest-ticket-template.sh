#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="suggest-ticket-template"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"

INPUT=$(cat)

TOOL_NAME=$(echo "${INPUT}" | jq -r '.tool_name // ""')
COMMAND=$(echo "${INPUT}" | jq -r '.tool_input.command // ""')

if [[ "${TOOL_NAME}" == "Bash" ]] && echo "${COMMAND}" | grep -q 'gh issue create'; then
  echo "Tip: Consider using /bug, /task, or /spike for structured issue creation." >&2
fi

_audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
exit 0
