#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="require-skill-for-issue-create"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"

INPUT=$(cat)

TOOL_NAME=$(echo "${INPUT}" | jq -r '.tool_name // ""')
COMMAND=$(echo "${INPUT}" | jq -r '.tool_input.command // ""')

if [[ "${TOOL_NAME}" != "Bash" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${TOOL_NAME}"
  exit 0
fi

if ! echo "${COMMAND}" | grep -q 'gh issue create'; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
  exit 0
fi

MARKER=".claude/session/active-issue-skill"

if [[ -f "${MARKER}" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
  exit 0
fi

if [[ "${APEXYARD_ALLOW_RAW_TICKET_CREATE:-}" == "1" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
  exit 0
fi

_audit_log_append "${HOOK_NAME}" "blocked" "${COMMAND:0:80}"
echo "Use a skill like /bug, /task, or /spike to create issues." >&2
exit 2
