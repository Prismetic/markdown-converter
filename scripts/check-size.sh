#!/usr/bin/env bash
set -euo pipefail

DIST_DIR="${1:-packages/extension/_dist}"
MAX_BYTES="${2:-2000000}"

if [[ ! -d "$DIST_DIR" ]]; then
  echo "FAIL: directory not found: $DIST_DIR" >&2
  exit 1
fi

# Sum file sizes portably: -printf '%s\n' prints bytes per file, awk sums them
total=$(find "$DIST_DIR" -type f -printf '%s\n' | awk '{s+=$1} END{print s+0}')

if [[ "$total" -eq 0 ]]; then
  echo "FAIL: no files found in $DIST_DIR" >&2
  exit 1
fi

echo "_dist/ total: ${total} bytes  (limit: ${MAX_BYTES})"

if [[ "$total" -gt "$MAX_BYTES" ]]; then
  echo "FAIL: exceeds 2 MB limit" >&2
  exit 1
fi

echo "PASS: size gate OK"
