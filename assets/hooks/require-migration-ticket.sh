#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="require-migration-ticket"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-detect-bash-write.sh"

INPUT=$(cat)

TOOL_NAME=$(echo "${INPUT}" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "${INPUT}" | jq -r '.tool_input.file_path // ""')
COMMAND=$(echo "${INPUT}" | jq -r '.tool_input.command // ""')

_is_migration_path() {
  local path="${1:-}"
  case "${path}" in
    *migrations/*|*db/migrate/*|*prisma/migrations/*) return 0 ;;
  esac
  return 1
}

TARGET=""
case "${TOOL_NAME}" in
  Write|Edit|MultiEdit)
    TARGET="${FILE_PATH}"
    ;;
  Bash)
    if ! _is_bash_write_command "${COMMAND}"; then
      _audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
      exit 0
    fi
    # Extract likely file target from command (best-effort)
    TARGET=$(echo "${COMMAND}" | grep -oE '[^ ]+migrations[^ ]*|[^ ]+db/migrate[^ ]*|[^ ]+prisma/migrations[^ ]*' | head -1 || echo "")
    ;;
  *)
    _audit_log_append "${HOOK_NAME}" "allowed" "${TOOL_NAME}"
    exit 0
    ;;
esac

if ! _is_migration_path "${TARGET}"; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${TARGET:-${COMMAND:0:80}}"
  exit 0
fi

# Determine project from git root basename
PROJECT=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")
TICKET_DIR=".claude/session/tickets/${PROJECT}"

ACTIVE_TICKET=""
if [[ -d "${TICKET_DIR}" ]]; then
  ACTIVE_TICKET=$(ls -A "${TICKET_DIR}" 2>/dev/null | head -1)
fi

if [[ -z "${ACTIVE_TICKET}" ]]; then
  _audit_log_append "${HOOK_NAME}" "blocked" "${TARGET}"
  echo "Migration changes require an active ticket. Run /start-ticket first." >&2
  exit 2
fi

TICKET_NUM=$(echo "${ACTIVE_TICKET}" | grep -oE '[0-9]+' | head -1)

if [[ -n "${TICKET_NUM}" ]]; then
  LABELS=$(gh issue view "${TICKET_NUM}" --json labels -q '.labels[].name' 2>/dev/null || echo "")
  if ! echo "${LABELS}" | grep -qi 'migration'; then
    _audit_log_append "${HOOK_NAME}" "blocked" "${TARGET}"
    echo "Migration changes require a ticket with the 'migration' label. Add label to issue #${TICKET_NUM}." >&2
    exit 2
  fi

  BODY=$(gh issue view "${TICKET_NUM}" --json body -q '.body' 2>/dev/null || echo "")
  if ! echo "${BODY}" | grep -qE 'AgDR-[0-9]+'; then
    _audit_log_append "${HOOK_NAME}" "blocked" "${TARGET}"
    echo "Migration ticket #${TICKET_NUM} must reference an AgDR (AgDR-NNNN) in its body." >&2
    exit 2
  fi
fi

_audit_log_append "${HOOK_NAME}" "allowed" "${TARGET}"
exit 0
