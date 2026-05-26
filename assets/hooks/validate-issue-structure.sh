#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="validate-issue-structure"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"

INPUT=$(cat)

TOOL_NAME=$(echo "${INPUT}" | jq -r '.tool_name // ""')
COMMAND=$(echo "${INPUT}" | jq -r '.tool_input.command // ""')

if [[ "${TOOL_NAME}" != "Bash" ]] || ! echo "${COMMAND}" | grep -q 'gh issue create'; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
  exit 0
fi

# Extract body from --body/-b flag
BODY=$(echo "${COMMAND}" | grep -oP '(?<=--body "|--body '"'"'|-b "|b '"'"')[^"'"'"']+' | head -1 || echo "")
if [[ -z "${BODY}" ]]; then
  # Try heredoc or multiline — best effort, can't block if body undetectable
  _audit_log_append "${HOOK_NAME}" "allowed" "body-undetectable"
  exit 0
fi

# Detect issue type from labels in command
LABELS=$(echo "${COMMAND}" | grep -oP '(?<=--label "|--label '"'"'|-l "|l '"'"')[^"'"'"']+' | tr ',' '\n' || echo "")

_check_sections() {
  local body="${1}"
  shift
  local missing=()
  for section in "$@"; do
    if ! echo "${body}" | grep -qF "${section}"; then
      missing+=("${section}")
    fi
  done
  echo "${missing[*]:-}"
}

MISSING=""
if echo "${LABELS}" | grep -qi 'migration'; then
  MISSING=$(_check_sections "${BODY}" "## Migration Plan" "## Rollback Plan")
elif echo "${LABELS}" | grep -qi 'bug'; then
  MISSING=$(_check_sections "${BODY}" "## Description" "## Steps to Reproduce" "## Expected Behavior")
elif echo "${LABELS}" | grep -qi 'spike'; then
  MISSING=$(_check_sections "${BODY}" "## Hypothesis" "## Budget" "## Kill Criteria")
elif echo "${LABELS}" | grep -qi 'investigation'; then
  MISSING=$(_check_sections "${BODY}" "## Hypothesis" "## Evidence")
elif echo "${LABELS}" | grep -qi 'task'; then
  MISSING=$(_check_sections "${BODY}" "## Description" "## Acceptance Criteria")
else
  # Default: feature
  MISSING=$(_check_sections "${BODY}" "## Problem" "## Proposed Solution" "## Acceptance Criteria")
fi

if [[ -n "${MISSING}" ]]; then
  _audit_log_append "${HOOK_NAME}" "blocked" "${COMMAND:0:80}"
  echo "Issue body is missing required sections: ${MISSING}" >&2
  exit 2
fi

_audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
exit 0
