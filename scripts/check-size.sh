#!/usr/bin/env bash
# Measures the compressed (zip) size of the extension _dist directory and
# fails if it exceeds MAX_BYTES. CWS evaluates the uploaded zip, so zip size
# is the meaningful gate — raw file totals overstate the real footprint.
set -euo pipefail

DIST_DIR="${1:-packages/extension/_dist}"
MAX_BYTES="${2:-2000000}"

if [[ ! -d "$DIST_DIR" ]]; then
  echo "FAIL: directory not found: $DIST_DIR" >&2
  exit 1
fi

# Count files portably before zipping
file_count=$(find "$DIST_DIR" -type f | wc -l)
if [[ "$file_count" -eq 0 ]]; then
  echo "FAIL: no files found in $DIST_DIR" >&2
  exit 1
fi

# Create a temp zip and measure its size using Python3 (available everywhere)
TMP_ZIP=$(mktemp /tmp/ext-size-check-XXXXXX.zip)
trap 'rm -f "$TMP_ZIP"' EXIT

python3 - "$DIST_DIR" "$TMP_ZIP" <<'PY'
import sys, zipfile, os
dist_dir, zip_path = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for root, dirs, files in os.walk(dist_dir):
        dirs.sort()
        for f in sorted(files):
            fp = os.path.join(root, f)
            arcname = os.path.relpath(fp, dist_dir)
            zf.write(fp, arcname)
PY

total=$(wc -c < "$TMP_ZIP")

echo "_dist/ zip size: ${total} bytes  (limit: ${MAX_BYTES})"

if [[ "$total" -gt "$MAX_BYTES" ]]; then
  echo "FAIL: zip exceeds ${MAX_BYTES} byte limit" >&2
  exit 1
fi

echo "PASS: size gate OK"
