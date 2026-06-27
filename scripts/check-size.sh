#!/usr/bin/env bash
set -euo pipefail

MAX_BYTES=2000000
DIST_DIR="${1:-packages/extension/_dist}"

if [ ! -d "$DIST_DIR" ]; then
  echo "FAIL: dist directory not found: $DIST_DIR" >&2
  exit 1
fi

total=$(find "$DIST_DIR" -type f -print0 | xargs -0 wc -c 2>/dev/null | tail -1 | awk '{print $1}')

if [ -z "$total" ] || [ "$total" -eq 0 ]; then
  echo "FAIL: no files found in $DIST_DIR" >&2
  exit 1
fi

if [ "$total" -gt "$MAX_BYTES" ]; then
  echo "FAIL: _dist/ is ${total} bytes (limit: ${MAX_BYTES})" >&2
  exit 1
fi

echo "OK: _dist/ is ${total} bytes (limit: ${MAX_BYTES})"
