# Library — source only, do not execute directly

_get_active_repo_root() {
  local root
  root=$(git rev-parse --show-toplevel 2>/dev/null)
  if [[ -n "${root}" ]]; then
    echo "${root}"
  else
    pwd
  fi
}
