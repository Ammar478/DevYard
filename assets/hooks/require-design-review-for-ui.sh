#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="require-design-review-for-ui"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-extract-pr.sh"

INPUT=$(cat)

TOOL_NAME=$(echo "${INPUT}" | jq -r '.tool_name // ""')
COMMAND=$(echo "${INPUT}" | jq -r '.tool_input.command // ""')

if [[ "${TOOL_NAME}" != "Bash" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${TOOL_NAME}"
  exit 0
fi

if ! echo "${COMMAND}" | grep -q 'gh pr merge'; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
  exit 0
fi

PR_NUM=$(_extract_pr_number)

if [[ -z "${PR_NUM}" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "no PR number found"
  exit 0
fi

# Get changed files for this PR
CHANGED=$(gh pr view "${PR_NUM}" --json files -q '.files[].path' 2>/dev/null || echo "")

UI_CHANGED=$(echo "${CHANGED}" | grep -E '^(src/components/|src/pages/|src/screens/|.*\.(tsx|css))' || echo "")

if [[ -z "${UI_CHANGED}" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "no UI changes pr:${PR_NUM}"
  exit 0
fi

APPROVAL_MARKER=".claude/session/reviews/${PR_NUM}-design.approved"

if [[ ! -f "${APPROVAL_MARKER}" ]]; then
  _audit_log_append "${HOOK_NAME}" "blocked" "no design approval pr:${PR_NUM}"
  echo "UI changes require design review. Run /approve-design." >&2
  exit 2
fi

_audit_log_append "${HOOK_NAME}" "allowed" "design approved pr:${PR_NUM}"
exit 0
