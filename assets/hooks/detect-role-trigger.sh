#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="detect-role-trigger"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"

INPUT=$(cat)

FILE_PATH=$(echo "${INPUT}" | jq -r '.tool_input.file_path // ""')
COMMAND=$(echo "${INPUT}" | jq -r '.tool_input.command // ""')

COMBINED="${FILE_PATH} ${COMMAND}"

# Order matters: more specific checks before general ones
if echo "${FILE_PATH}" | grep -qE 'src/components|\.tsx$'; then
  echo "Role advisory: Consider using the yasmin persona for this operation." >&2
elif echo "${FILE_PATH}" | grep -qE 'migrations/|db/'; then
  echo "Role advisory: Consider using the adel persona for this operation." >&2
elif echo "${COMBINED}" | grep -qE 'npm audit|security'; then
  echo "Role advisory: Consider using the hakim persona for this operation." >&2
elif echo "${COMMAND}" | grep -qE 'gh issue|gh pr'; then
  echo "Role advisory: Consider using the tariq persona for this operation." >&2
elif echo "${COMBINED}" | grep -qE 'src/|\.ts$'; then
  echo "Role advisory: Consider using the hisham persona for this operation." >&2
fi

_audit_log_append "${HOOK_NAME}" "allowed" "${COMBINED:0:80}"
exit 0
