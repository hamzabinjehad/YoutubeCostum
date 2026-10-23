#!/bin/bash
# Create the Chromium Manifest V3 variant without maintaining a second source
# tree. Safari accepts a background-script list; Chrome MV3 requires the same
# background entry to be a service worker, so the one incompatible key is
# removed only in the generated artifact.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/extension"
OUT="${COSTUM_CHROME_OUT:-$ROOT/build/chrome}"

# This script deletes only a generated child of build/. An arbitrary output
# path would make the convenient rebuild command unnecessarily dangerous.
case "$OUT" in
  "$ROOT"/build/*) ;;
  *)
    echo "Refusing Chrome build output outside $ROOT/build: $OUT" >&2
    exit 2
    ;;
esac

TMP="$OUT.tmp.$$"
rm -rf "$TMP"
mkdir -p "$TMP"
trap 'rm -rf "$TMP"' EXIT

cp -R "$SOURCE/." "$TMP/"

python3 - "$SOURCE/manifest.json" "$TMP/manifest.json" <<'PY'
import json
import sys

source_path, output_path = sys.argv[1:]
with open(source_path, encoding='utf-8') as source_file:
    source = json.load(source_file)

background = source.get('background')
if not isinstance(background, dict):
    raise SystemExit('Source manifest has no background object')

worker = background.get('service_worker')
scripts = background.get('scripts')
if not isinstance(worker, str) or not worker:
    raise SystemExit('Source manifest has no MV3 background.service_worker')
if not isinstance(scripts, list) or worker not in scripts:
    raise SystemExit('Safari and Chromium background entries no longer point at the same file')

# Work on the copied manifest only. `scripts` is invalid in Chromium MV3;
# bg.js loads defaults.js itself with importScripts when it runs as a worker.
background.pop('scripts', None)
if set(background) != {'service_worker'}:
    raise SystemExit('Chrome background has unsupported keys: ' + ', '.join(sorted(background)))

with open(output_path, 'w', encoding='utf-8') as output_file:
    json.dump(source, output_file, indent=2)
    output_file.write('\n')
PY

if [ ! -f "$TMP/background/bg.js" ] || [ ! -f "$TMP/common/defaults.js" ]; then
  echo "Chrome build is missing its service worker dependencies" >&2
  exit 1
fi

rm -rf "$OUT"
mv "$TMP" "$OUT"
trap - EXIT

echo "Chrome/Edge extension written to ${OUT#$ROOT/}"
