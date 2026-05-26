#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="block-unreviewed-merge"
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
  _audit_log_append "${HOOK_NAME}" "blocked" "no PR number"
  echo "Merge blocked: could not determine PR number." >&2
  exit 2
fi

HEAD_SHA=$(gh pr view "${PR_NUM}" --json headRefSha -q .headRefSha 2>/dev/null || echo "")

if [[ -z "${HEAD_SHA}" ]]; then
  _audit_log_append "${HOOK_NAME}" "blocked" "pr:${PR_NUM} no HEAD SHA"
  echo "Merge blocked: could not determine PR HEAD SHA." >&2
  exit 2
fi

REVIEW_DIR=".claude/session/reviews"

REX_MARKER="${REVIEW_DIR}/${PR_NUM}-rex.approved"
CEO_MARKER="${REVIEW_DIR}/${PR_NUM}-ceo.approved"

if [[ ! -f "${REX_MARKER}" ]]; then
  _audit_log_append "${HOOK_NAME}" "blocked" "pr:${PR_NUM} rex approval missing"
  echo "Merge blocked: approval SHA mismatch. Re-run /code-review and /approve-merge." >&2
  exit 2
fi

if [[ ! -f "${CEO_MARKER}" ]]; then
  _audit_log_append "${HOOK_NAME}" "blocked" "pr:${PR_NUM} ceo approval missing"
  echo "Merge blocked: approval SHA mismatch. Re-run /code-review and /approve-merge." >&2
  exit 2
fi

REX_SHA=$(cat "${REX_MARKER}" | tr -d '[:space:]')
CEO_SHA=$(cat "${CEO_MARKER}" | tr -d '[:space:]')

if [[ "${REX_SHA}" != "${HEAD_SHA}" || "${CEO_SHA}" != "${HEAD_SHA}" ]]; then
  _audit_log_append "${HOOK_NAME}" "blocked" "pr:${PR_NUM} SHA mismatch head:${HEAD_SHA}"
  echo "Merge blocked: approval SHA mismatch. Re-run /code-review and /approve-merge." >&2
  exit 2
fi

_audit_log_append "${HOOK_NAME}" "allowed" "pr:${PR_NUM} sha:${HEAD_SHA}"
exit 0
