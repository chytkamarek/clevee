#!/usr/bin/env bash
# Mutation check of one guard: apply a perl substitution to a COMMITTED file,
# run the given tests, print which failed, put the file back.
#
#   scripts/dev/mutate.sh <file> '<perl -0pi expression>' <test file>... [-- <label>]
#   scripts/dev/mutate.sh --literal <file> '<old text>' '<new text>' <test file>... [-- <label>]
#
# --literal replaces the first occurrence of the text as it is — no regex, no
# escaping of ( ) [ ] $ \u0000.
#
#   scripts/dev/mutate.sh src/db/orders.ts 's/ AND user_id = \$1//' \
#     tests/orders.test.ts -- "filters by owner"
#
# Fails loudly when no test ran or the substitution changed nothing (a silent no-op reads as
# "no test caught it"), when the file has uncommitted changes (restoring would
# be ambiguous), and when the file is not back byte for byte afterwards.
# Test files may come as one space-separated argument (a zsh "$T"). Exit 0 = some test
# failed (the guard is covered); 1 = no failure; 2 = usage or setup error.
# For each failed test it also prints the first lines of the error, so a test that failed for
# an unrelated reason does not pass as "caught".
set -euo pipefail

if [ "${1:-}" = "--literal" ]; then
  [ $# -ge 5 ] || { sed -n '2,19p' "$0" >&2; exit 2; }
  export MUT_OLD=$3 MUT_NEW=$4
  # The texts come in through the environment: perl never parses them as a pattern
  set -- "$2" 's/\Q$ENV{MUT_OLD}\E/$ENV{MUT_NEW}/' "${@:5}"
fi

if [ $# -lt 3 ]; then
  sed -n '2,19p' "$0" >&2
  exit 2
fi

file=$1; expr=$2; shift 2
tests=(); label=""
while [ $# -gt 0 ]; do
  if [ "$1" = "--" ]; then shift; label="$*"; break; fi
  # One argument may hold several space-separated files: zsh passes "$T" whole
  # (it does not word-split), and vitest would find no such file
  read -r -a parts <<< "$1"
  tests+=("${parts[@]}"); shift
done
label=${label:-${MUT_OLD:-$expr}}

[ -f "$file" ] || { echo "!! $file does not exist" >&2; exit 2; }
if ! git diff --quiet -- "$file" || ! git diff --cached --quiet -- "$file"; then
  echo "!! $file has uncommitted changes — mutate committed code only" >&2
  exit 2
fi

backup=$(mktemp)
cp "$file" "$backup"
restore() { cp "$backup" "$file"; rm -f "$backup"; }
trap restore EXIT

perl -0pi -e "$expr" "$file"
if cmp -s "$file" "$backup"; then
  echo "!! $label: the substitution changed nothing in $file" >&2
  exit 2
fi

out=$(npx vitest run "${tests[@]}" 2>&1 || true)
failed=$(printf '%s\n' "$out" | grep -E '^ +×' | sed 's/^ *//' || true)

restore
trap - EXIT
if [ -n "$(git diff -- "$file")" ]; then
  echo "!! $file is not back as committed" >&2
  exit 2
fi

if [ -n "$failed" ]; then
  printf '%s → caught by:\n%s\n' "$label" "$failed"
  # Why each test failed (first lines of its error): a test can fail on something other than its claim
  printf '%s\n' "$out" | awk '
    /^ FAIL / { sub(/^ FAIL +/, ""); print "  why: " $0; n = 0; on = 1; next }
    on && n < 3 && /(Error|^ *[+-] )/ && !/^ *[+-] (Expected|Received)$/ { sub(/^ +/, ""); print "       " $0; n++ }
    /^⎯+/ && n > 0 { on = 0 }'
  exit 0
fi
if printf '%s\n' "$out" | grep -q 'No test files found'; then
  printf '%s → tests did not run: no test files found for %s\n' "$label" "${tests[*]}" >&2
  exit 2
fi
if printf '%s\n' "$out" | grep -qE 'Tests +[0-9]+ passed'; then
  printf '%s → NO FAILURE\n' "$label"
  printf '%s\n' "$out" | grep -E 'Test Files|Tests ' | sed 's/^/   /'
  exit 1
fi
printf '%s → tests did not run:\n%s\n' "$label" "$(printf '%s\n' "$out" | tail -15)" >&2
exit 2
