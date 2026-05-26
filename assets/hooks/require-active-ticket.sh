#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="require-active-ticket"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-detect-bash-write.sh"

INPUT=$(cat)

TOOL_NAME=$(echo "${INPUT}" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "${INPUT}" | jq -r '.tool_input.file_path // ""')
COMMAND=$(echo "${INPUT}" | jq -r '.tool_input.command // ""')

# Only gate on write-class tools
case "${TOOL_NAME}" in
  Write|Edit|MultiEdit) : ;;
  Bash) : ;;
  *)
    _audit_log_append "${HOOK_NAME}" "allowed" "${TOOL_NAME}"
    exit 0
    ;;
esac

# Exempt paths for Write/Edit/MultiEdit
_is_exempt_path() {
  local path="${1:-}"
  case "${path}" in
    .claude/*|docs/*|*.md|.claude/session/bootstrap) return 0 ;;
  esac
  return 1
}

if [[ "${TOOL_NAME}" == "Bash" ]]; then
  if ! _is_bash_write_command "${COMMAND}"; then
    _audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
    exit 0
  fi
else
  if _is_exempt_path "${FILE_PATH}"; then
    _audit_log_append "${HOOK_NAME}" "allowed" "${FILE_PATH}"
    exit 0
  fi
fi

# Check for active ticket marker
TICKET_DIR=".claude/session/tickets"
if [[ -d "${TICKET_DIR}" ]] && [[ -n "$(ls -A "${TICKET_DIR}" 2>/dev/null)" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${TOOL_NAME}:${COMMAND:-${FILE_PATH}}"
  exit 0
fi

SUMMARY="${TOOL_NAME}:${COMMAND:-${FILE_PATH}}"
_audit_log_append "${HOOK_NAME}" "blocked" "${SUMMARY:0:80}"
echo "No active ticket. Run /start-ticket first." >&2
exit 2
