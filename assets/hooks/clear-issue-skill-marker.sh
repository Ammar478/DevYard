#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="clear-issue-skill-marker"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"

RESULT="allowed"
SUMMARY="session start — clear issue skill marker"

MARKER=".claude/session/active-issue-skill"

if [[ -f "${MARKER}" ]]; then
  rm -f "${MARKER}"
fi

_audit_log_append "${HOOK_NAME}" "${RESULT}" "${SUMMARY}"
exit 0
