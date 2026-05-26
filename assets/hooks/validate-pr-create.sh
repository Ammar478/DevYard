#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="validate-pr-create"
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

ERRORS=()

# Extract --title
TITLE=$(echo "${COMMAND}" | grep -oP '(?<=--title )["\x27][^"'"'"']+["\x27]|(?<=--title )[^[:space:]]+' | head -1 | tr -d '"'"'" || echo "")

if [[ -z "${TITLE}" ]]; then
  ERRORS+=("PR title is required (--title)")
fi

# Extract --body
BODY=$(echo "${COMMAND}" | grep -oP '(?<=--body )["\x27][^"'"'"']+["\x27]|(?<=--body )[^[:space:]]+' | head -1 | tr -d '"'"'" || echo "")

if [[ -z "${BODY}" ]]; then
  ERRORS+=("PR body is required and must contain ## Testing and ## Summary sections")
else
  if ! echo "${BODY}" | grep -q '## Testing'; then
    ERRORS+=("PR body must contain '## Testing' section")
  fi

  if ! echo "${BODY}" | grep -qE '## (Glossary|Summary)'; then
    ERRORS+=("PR body must contain '## Summary' or '## Glossary' section")
  fi
fi

# Verify referenced issues are open
CLOSE_NUMS=$(echo "${BODY:-}" | grep -oP '(?<=(Closes|Fixes) #)[0-9]+' || echo "")
for NUM in ${CLOSE_NUMS}; do
  STATE=$(gh issue view "${NUM}" --json state -q .state 2>/dev/null || echo "")
  if [[ "${STATE}" != "OPEN" ]]; then
    ERRORS+=("Referenced issue #${NUM} is not open (state: ${STATE:-not found})")
  fi
done

if [[ ${#ERRORS[@]} -gt 0 ]]; then
  _audit_log_append "${HOOK_NAME}" "blocked" "${COMMAND:0:80}"
  echo "PR validation failed:" >&2
  for err in "${ERRORS[@]}"; do
    echo "  - ${err}" >&2
  done
  exit 2
fi

_audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
exit 0
