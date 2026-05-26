#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="block-private-refs-in-public-repos"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"

INPUT=$(cat)

TOOL_NAME=$(echo "${INPUT}" | jq -r '.tool_name // ""')
COMMAND=$(echo "${INPUT}" | jq -r '.tool_input.command // ""')

if [[ "${TOOL_NAME}" != "Bash" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${TOOL_NAME}"
  exit 0
fi

if ! echo "${COMMAND}" | grep -qE 'gh (issue create|pr create|issue comment|pr comment)'; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
  exit 0
fi

IS_PRIVATE=$(gh repo view --json isPrivate -q .isPrivate 2>/dev/null || echo "true")

if [[ "${IS_PRIVATE}" == "true" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "private repo"
  exit 0
fi

PRIVATE_NAMES_FILE="${HOME}/.devyard/private-names.yaml"

if [[ ! -f "${PRIVATE_NAMES_FILE}" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "no private-names.yaml"
  exit 0
fi

BODY=$(echo "${COMMAND}" | grep -oP '(?<=--body )["\x27][^"'"'"']+["\x27]|(?<=--body )[^[:space:]]+' | head -1 | tr -d '"'"'" || echo "")

if [[ -z "${BODY}" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "no body detected"
  exit 0
fi

# Read private names (one per line, strip YAML list markers)
while IFS= read -r line; do
  name=$(echo "${line}" | sed 's/^[[:space:]]*-[[:space:]]*//' | tr -d '"'"'" | tr -d '[:space:]')
  if [[ -z "${name}" ]]; then
    continue
  fi
  if echo "${BODY}" | grep -qF "${name}"; then
    _audit_log_append "${HOOK_NAME}" "blocked" "private name '${name}' in public repo"
    echo "Private project name detected in public repo. Remove reference." >&2
    exit 2
  fi
done < "${PRIVATE_NAMES_FILE}"

_audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
exit 0
