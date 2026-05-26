# Library — source only, do not execute directly
source "$(dirname "${BASH_SOURCE[0]}")/_lib-ops-root.sh"

_check_deprecated_config() {
  local config_file="${OPS_ROOT}/config.yaml"

  if [[ ! -f "${config_file}" ]]; then
    return 0
  fi

  if grep -q 'api_key:' "${config_file}" 2>/dev/null; then
    echo "Warning: 'api_key' in config.yaml is deprecated. Use environment variables for tokens." >&2
  fi
}
