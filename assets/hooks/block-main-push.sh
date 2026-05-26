#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="block-main-push"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-extract-push-ref.sh"

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

TARGET=$(_extract_push_target "${COMMAND}")

case "${TARGET}" in
  main|master|dev|develop)
    _audit_log_append "${HOOK_NAME}" "blocked" "${COMMAND:0:80}"
    echo "Blocked: Direct push to main/master/dev/develop is not allowed." >&2
    exit 2
    ;;
esac

# Also block --force / --force-with-lease to any of those branches
if echo "${COMMAND}" | grep -qE '--force(|-with-lease)'; then
  case "${TARGET}" in
    main|master|dev|develop)
      _audit_log_append "${HOOK_NAME}" "blocked" "${COMMAND:0:80}"
      echo "Blocked: Direct push to main/master/dev/develop is not allowed." >&2
      exit 2
      ;;
  esac
fi

_audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
exit 0
