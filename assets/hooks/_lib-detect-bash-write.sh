# Library — source only, do not execute directly

_is_bash_write_command() {
  local cmd="${1:-}"

  # Read-only commands — return 1 immediately on exact match prefixes
  case "${cmd}" in
    cat\ *|"cat"|ls\ *|"ls"|find\ *|"find"|grep\ *|"grep"|head\ *|"head"|tail\ *|"tail"|wc\ *|"wc")
      return 1 ;;
    "git log"*|"git diff"*|"git status"*|"git show"*|"git branch"*|"git tag"*)
      return 1 ;;
    "gh pr view"*|"gh pr list"*|"gh issue view"*|"gh issue list"*|"gh repo view"*)
      return 1 ;;
  esac

  # Write indicators
  if echo "${cmd}" | grep -qE '(^|[[:space:]])(tee|cp|mv|rm|mkdir|touch|chmod|chown)(\ |$)'; then
    return 0
  fi

  if echo "${cmd}" | grep -qE '(>>|>)[^>]'; then
    return 0
  fi

  if echo "${cmd}" | grep -qE '(^|[[:space:]])(cat|echo|printf)[[:space:]].*>'; then
    return 0
  fi

  if echo "${cmd}" | grep -qE '(^|[[:space:]])sed[[:space:]]+-i'; then
    return 0
  fi

  if echo "${cmd}" | grep -qE '(^|[[:space:]])awk[[:space:]]+-i'; then
    return 0
  fi

  return 1
}
