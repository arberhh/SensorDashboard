#!/bin/bash
# usage: check-private-data.sh --staged | <base ref>
# Fails when a line being added holds private data: an Apple team id, a
# device UDID, a home-folder path, an email address or a secret. The
# pre-commit hook runs it on the staged changes and CI on the PR's diff.
# Only added lines are read, so what is already in the repo doesn't fail it.
set -euo pipefail

case ${1:-} in
  --staged) RANGE=(--cached) ;;
  "") echo "usage: $0 --staged | <base ref>" >&2; exit 2 ;;
  *) RANGE=("$1...HEAD") ;;
esac

# Every added line as file:line:text. Lock files are generated and full of
# package@version strings that read as emails.
ADDED=$(git diff "${RANGE[@]}" -U0 --no-color --diff-filter=ACMR -- . \
  ':!*package-lock.json' ':!*bun.lock' ':!*Podfile.lock' ':!*Cargo.lock' |
  awk '
    /^\+\+\+ b\// { file = substr($0, 7); next }
    /^@@/ { match($0, /\+[0-9]+/); line = substr($0, RSTART + 1, RLENGTH - 1) + 0; next }
    /^\+/ && !/^\+\+\+/ { print file ":" line ":" substr($0, 2); line++ }
  ')

FOUND=0
# check <what it is> <pattern> [pattern of matches to let through]
check() {
  local hits
  hits=$(grep -E -- "$2" <<<"$ADDED" || true)
  if [ -n "${3:-}" ]; then hits=$(grep -vE -- "$3" <<<"$hits" || true); fi
  [ -z "$hits" ] && return 0
  FOUND=1
  echo "$1:" >&2
  sed 's/^/  /' <<<"$hits" >&2
}

check "Apple team id (pass it at build time, write <team id> in docs)" \
  '(DEVELOPMENT_TEAM|TEAM_ID)[^A-Za-z0-9<$]{1,4}[A-Z0-9]{10}($|[^A-Za-z0-9])'
check "Device UDID (read it from an env var, write <udid> in docs)" \
  '(^|[^0-9A-Fa-f-])[0-9A-Fa-f]{8}-[0-9A-Fa-f]{16}($|[^0-9A-Fa-f-])'
check "Home-folder path (use a path relative to the repo)" \
  '/Users/[A-Za-z0-9._-]+/|~/(Desktop|Documents|Downloads)'
check "Email address" \
  '[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}' \
  '(noreply|git)@|@example\.(com|org)'
check "Secret (key or token)" \
  '-----BEGIN [A-Z ]*PRIVATE KEY|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{20,}|xox[abprs]-[A-Za-z0-9-]{10,}|lin_api_[A-Za-z0-9]{20,}'

if [ "$FOUND" = 1 ]; then
  echo "Private data in the lines above. Replace it with a placeholder or an env var." >&2
  exit 1
fi
