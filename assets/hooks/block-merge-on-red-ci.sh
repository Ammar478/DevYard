#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="block-merge-on-red-ci"
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
  _audit_log_append "${HOOK_NAME}" "allowed" "no PR number"
  exit 0
fi

# Collect CI check states
STATES=$(gh pr checks "${PR_NUM}" --json state -q '.[].state' 2>/dev/null || echo "")

if echo "${STATES}" | grep -qE 'FAILURE|CANCELLED|PENDING'; then
  BAD=$(echo "${STATES}" | grep -E 'FAILURE|CANCELLED|PENDING' | sort -u | tr '\n' ' ')
  _audit_log_append "${HOOK_NAME}" "blocked" "CI not passing pr:${PR_NUM} states:${BAD}"
  echo "CI checks are not all passing. Wait for green CI." >&2
  exit 2
fi

_audit_log_append "${HOOK_NAME}" "allowed" "CI green pr:${PR_NUM}"
exit 0
