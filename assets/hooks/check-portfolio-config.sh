#!/usr/bin/env bash
set -euo pipefail

HOOK_NAME="check-portfolio-config"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-audit-log.sh"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-read-config.sh"
source "$(dirname "${BASH_SOURCE[0]}")/_lib-portfolio-paths.sh"

RESULT="allowed"
SUMMARY="session start — portfolio config check"

MODE=$(_read_config portfolio.mode || echo "")

if [[ "${MODE}" == "split" ]]; then
  PUBLIC_ROOT=$(_get_public_root)
  PRIVATE_ROOT=$(_get_private_root)

  if [[ -z "${PUBLIC_ROOT}" || ! -d "${PUBLIC_ROOT}" ]]; then
    echo "Warning: portfolio.public_root is not set or does not exist: '${PUBLIC_ROOT}'." >&2
  fi

  if [[ -z "${PRIVATE_ROOT}" || ! -d "${PRIVATE_ROOT}" ]]; then
    echo "Warning: portfolio.private_root is not set or does not exist: '${PRIVATE_ROOT}'." >&2
  fi
fi

_audit_log_append "${HOOK_NAME}" "${RESULT}" "${SUMMARY}"
exit 0
