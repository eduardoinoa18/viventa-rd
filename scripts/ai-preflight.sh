#!/usr/bin/env bash
set -euo pipefail

EXPECTED_SHA="${1:-}"

printf "\n[ai-preflight] Branch: "
git rev-parse --abbrev-ref HEAD

printf "[ai-preflight] HEAD: "
HEAD_SHA="$(git rev-parse --short HEAD)"
printf "%s\n" "$HEAD_SHA"

printf "[ai-preflight] Working tree: "
if [[ -n "$(git status --porcelain)" ]]; then
  echo "dirty"
  echo "[ai-preflight] ERROR: Uncommitted changes detected. Commit/stash before AI patch generation."
  git status --short
  exit 1
fi
echo "clean"

if [[ -n "$EXPECTED_SHA" && "$HEAD_SHA" != "$EXPECTED_SHA" ]]; then
  echo "[ai-preflight] ERROR: HEAD mismatch. expected=$EXPECTED_SHA actual=$HEAD_SHA"
  exit 1
fi

echo "[ai-preflight] Last 3 commits:"
git log --oneline -n 3

echo "[ai-preflight] OK"
