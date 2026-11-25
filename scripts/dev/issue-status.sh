#!/usr/bin/env bash
# Moves an issue to a workflow status: swaps its `status: *` label and, when a
# GitHub Project is configured, moves its card (adds the issue if missing).
#
#   scripts/dev/issue-status.sh <issue> <backlog|in-progress|in-review|done>
#
# Board: set PROJECT_OWNER / PROJECT_NUMBER below (or in the environment).
# Empty = labels only. Column names are matched case-insensitively:
# backlog → Todo/Backlog, in-progress → In Progress, in-review → In Review, done → Done.
set -euo pipefail

PROJECT_OWNER=${PROJECT_OWNER:-chytkamarek}
PROJECT_NUMBER=${PROJECT_NUMBER:-1}

if [ $# -ne 2 ]; then
  sed -n '2,9p' "$0" >&2
  exit 2
fi
issue=$1
status=$2

case "$status" in
  backlog)     columns="todo|backlog" ;;
  in-progress) columns="in progress" ;;
  in-review)   columns="in review" ;;
  done)        columns="done" ;;
  *) echo "unknown status: $status" >&2; exit 2 ;;
esac

# Remove only status labels the issue has: gh fails on a label missing from the repo
remove=()
while IFS= read -r l; do
  [ -n "$l" ] && [ "$l" != "status: $status" ] && remove+=(--remove-label "$l")
done < <(gh issue view "$issue" --json labels -q '.labels[].name | select(startswith("status: "))')
gh label create "status: $status" >/dev/null 2>&1 || true
gh issue edit "$issue" ${remove[@]+"${remove[@]}"} --add-label "status: $status" >/dev/null

if [ -z "$PROJECT_OWNER" ] || [ -z "$PROJECT_NUMBER" ]; then
  echo "#$issue → status: $status"
  exit 0
fi

project_id=$(gh project view "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json -q .id)
read -r field_id option_id < <(COLUMNS_RE="^($columns)$" gh project field-list "$PROJECT_NUMBER" \
  --owner "$PROJECT_OWNER" --format json -q '
    .fields[] | select(.name == "Status")
    | "\(.id) \([.options[] | select(.name | ascii_downcase | test(env.COLUMNS_RE)) | .id][0] // "")"') || true
if [ -z "${option_id:-}" ]; then
  echo "no column for \"$status\" in project $PROJECT_OWNER/$PROJECT_NUMBER" >&2
  exit 1
fi

url=$(gh issue view "$issue" --json url -q .url)
item_id=$(gh project item-add "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --url "$url" --format json -q .id)
gh project item-edit --id "$item_id" --project-id "$project_id" \
  --field-id "$field_id" --single-select-option-id "$option_id" >/dev/null
echo "#$issue → status: $status (board)"
