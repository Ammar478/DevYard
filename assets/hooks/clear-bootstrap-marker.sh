#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="clear-bootstrap-marker"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"

RESULT="allowed"
SUMMARY="session start — clear bootstrap marker"

MARKER=".claude/session/bootstrap"

if [[ -f "${MARKER}" ]]; then
  rm -f "${MARKER}"
fi

_audit_log_append "${HOOK_NAME}" "${RESULT}" "${SUMMARY}"
exit 0
