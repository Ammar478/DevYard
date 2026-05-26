#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="warn-stale-review-markers"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"

INPUT=$(cat)

TOOL_NAME=$(echo "${INPUT}" | jq -r '.tool_name // ""')
COMMAND=$(echo "${INPUT}" | jq -r '.tool_input.command // ""')

if [[ "${TOOL_NAME}" != "Bash" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${TOOL_NAME}"
  exit 0
fi

if ! echo "${COMMAND}" | grep -qE '(^|[[:space:]])git[[:space:]]+push([[:space:]]|$)'; then
  _audit_log_append "${HOOK_NAME}" "allowed" "${COMMAND:0:80}"
  exit 0
fi

REVIEW_DIR=".claude/session/reviews"

if [[ ! -d "${REVIEW_DIR}" ]]; then
  _audit_log_append "${HOOK_NAME}" "allowed" "no review dir"
  exit 0
fi

while IFS= read -r -d '' marker; do
  MARKER_FILE=$(basename "${marker}")
  # Extract PR number from filename: <N>-<type>
  PR_NUM=$(echo "${MARKER_FILE}" | grep -oE '^[0-9]+' || echo "")

  if [[ -z "${PR_NUM}" ]]; then
    continue
  fi

  HEAD_SHA=$(gh pr view "${PR_NUM}" --json headRefSha -q .headRefSha 2>/dev/null || echo "")

  if [[ -z "${HEAD_SHA}" ]]; then
    continue
  fi

  STORED_SHA=$(cat "${marker}" | tr -d '[:space:]')

  if [[ "${STORED_SHA}" != "${HEAD_SHA}" ]]; then
    echo "Warning: Review marker ${MARKER_FILE} is stale (stored SHA differs from current HEAD). Removing." >&2
    rm -f "${marker}"
  fi
done < <(find "${REVIEW_DIR}" -maxdepth 1 -type f -print0 2>/dev/null)

_audit_log_append "${HOOK_NAME}" "allowed" "stale marker check done"
exit 0
