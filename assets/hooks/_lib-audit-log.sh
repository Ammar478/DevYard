# Library — source only, do not execute directly
source "$(dirname "${BASH_SOURCE[0]}")/_lib-ops-root.sh"

_audit_log_append() {
  local hook_name="${1:-unknown}"
  local result="${2:-allowed}"
  local input_summary="${3:-}"

  local log_dir="${OPS_ROOT}/logs"
  local log_file="${log_dir}/hook-audit.log"
  local log_bak="${log_dir}/hook-audit.log.bak"

  mkdir -p "${log_dir}"

  # Rotate at 10MB
  if [[ -f "${log_file}" ]]; then
    local size
    size=$(stat -f%z "${log_file}" 2>/dev/null || stat -c%s "${log_file}" 2>/dev/null || echo 0)
    if (( size >= 10485760 )); then
      mv "${log_file}" "${log_bak}"
    fi
  fi

  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  printf '%s | %s | %s | %s\n' \
    "${timestamp}" "${hook_name}" "${result}" "${input_summary}" \
    >> "${log_file}"
}
