#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="require-agdr-for-arch-pr"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"

INPUT=$(cat)

TOOL_NAME=$(echo "${INPUT}" | jq -r '.tool_name // ""')
COMMAND=$(echo "${INPUT}" | jq -r '.tool_input.command // ""')

if [[ "${TOOL_NAME}" != "Bash" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${TOOL_NAME}"
  exit 0
fi

if ! echo "${COMMAND}" | grep -q 'gh pr create'; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
  exit 0
fi

CHANGED=$(git diff main...HEAD --name-only 2>/dev/null || echo "")

ARCH_CHANGED=$(echo "${CHANGED}" | grep -E '^(src/architecture/|src/domain/|infrastructure/)' || echo "")

if [[ -z "${ARCH_CHANGED}" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "no arch changes"
  exit 0
fi

BODY=$(echo "${COMMAND}" | grep -oP '(?<=--body )["\x27][^"'"'"']+["\x27]|(?<=--body )[^[:space:]]+' | head -1 | tr -d '"'"'" || echo "")

if ! echo "${BODY}" | grep -qE 'AgDR-[0-9]+'; then
  _audit_log_append "${HOOK_NAME}" "blocked" "arch PR without AgDR"
  echo "PR touching architecture paths requires an AgDR reference." >&2
  exit 2
fi

_audit_log_append "${HOOK_NAME}" "allowed" "arch PR with AgDR"
exit 0
