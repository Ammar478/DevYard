#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="require-agdr-for-arch-changes"
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

STAGED=$(git diff --cached --name-only 2>/dev/null || echo "")

ARCH_FILES=$(echo "${STAGED}" | grep -E '^(src/architecture/|src/domain/|infrastructure/)' || echo "")

if [[ -z "${ARCH_FILES}" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "no arch files"
  exit 0
fi

MSG=$(echo "${COMMAND}" | grep -oP '(?<=-m )["\x27]?[^"'"'"']+["\x27]?' | head -1 | tr -d '"'"'" || echo "")

AGDR_REF=$(echo "${MSG}" | grep -oE 'AgDR-[0-9]+' | head -1 || echo "")

if [[ -z "${AGDR_REF}" ]]; then
  _audit_log_append "${HOOK_NAME}" "blocked" "arch change without AgDR"
  echo "Architecture changes require an AgDR reference: AgDR-NNNN" >&2
  exit 2
fi

AGDR_NUM=$(echo "${AGDR_REF}" | grep -oE '[0-9]+')
PADDED=$(printf '%04d' "${AGDR_NUM}")

AGDR_DOC=$(find docs/agdr -name "AgDR-${PADDED}-*.md" -maxdepth 1 2>/dev/null | head -1 || echo "")

if [[ -z "${AGDR_DOC}" ]]; then
  _audit_log_append "${HOOK_NAME}" "blocked" "AgDR doc missing: ${AGDR_REF}"
  echo "Architecture changes require an AgDR reference: AgDR-NNNN (docs/agdr/AgDR-${PADDED}-*.md not found)" >&2
  exit 2
fi

_audit_log_append "${HOOK_NAME}" "allowed" "${AGDR_REF}"
exit 0
