#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="auto-code-review"
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

# Give the PR creation a moment to settle, then retrieve PR number
PR_NUM=$(gh pr view --json number -q .number 2>/dev/null || echo "")

if [[ -n "${PR_NUM}" ]]; then
  REVIEW_DIR=".claude/session/reviews"
  mkdir -p "${REVIEW_DIR}"
  echo "PENDING" > "${REVIEW_DIR}/${PR_NUM}-pending"
  echo "Code review required. Run /code-review to invoke Rex." >&2
  export GH_PR_NUMBER="${PR_NUM}"
fi

_audit_log_append "${HOOK_NAME}" "allowed" "pr:${PR_NUM:-unknown}"
exit 0
