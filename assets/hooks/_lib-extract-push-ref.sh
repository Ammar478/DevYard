# Library — source only, do not execute directly

_extract_push_target() {
  local cmd="${1:-}"

  # Strip leading "git push" and any flags (starting with -)
  local args
  args=$(echo "${cmd}" | sed -E 's/^git[[:space:]]+push[[:space:]]*//')

  # Remove ALL flag tokens (both -f and --force style)
  local positionals=()
  for token in ${args}; do
    if [[ "${token}" != -* ]]; then
      positionals+=("${token}")
    fi
  done

  _resolve_head() {
    git rev-parse --abbrev-ref HEAD 2>/dev/null || git branch --show-current 2>/dev/null || echo ""
  }

  # positionals[0] = remote, positionals[1] = branch (if present)
  if [[ ${#positionals[@]} -ge 2 ]]; then
    local target="${positionals[1]}"
    # Resolve symbolic HEAD to the actual branch name
    if [[ "${target}" == "HEAD" ]]; then
      _resolve_head
    else
      echo "${target}"
    fi
  elif [[ ${#positionals[@]} -eq 1 ]]; then
    # Only remote specified — derive branch from HEAD
    _resolve_head
  else
    # Bare "git push" — derive branch from HEAD
    _resolve_head
  fi
}
