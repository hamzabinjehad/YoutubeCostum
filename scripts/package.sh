#!/bin/bash
# Wraps the web extension into macOS + iOS apps for App Store submission.
# Safe to re-run: the project references extension/ in place, so day-to-day
# edits there need no regeneration.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/apple/generated"
APP="Costum for YouTube"

# The converter cannot overwrite an existing project in place — it fails with
# "Unable to parse manifest.json". Move the old one aside rather than deleting
# it, so an Xcode project that already carries your signing team is recoverable.
if [ -d "$OUT" ]; then
  BAK="$OUT.bak-$(date +%Y%m%d-%H%M%S)"
  mv "$OUT" "$BAK"
  echo "Previous project moved to ${BAK#$ROOT/}"
fi

mkdir -p "$OUT"

xcrun safari-web-extension-converter "$ROOT/extension" \
  --project-location "$OUT" \
  --app-name "$APP" \
  --bundle-identifier "com.costum.youtube" \
  --swift \
  --no-open \
  --no-prompt \
  --force

# The generated handler is a stub; ours bridges settings into iCloud.
HANDLER="$OUT/$APP/Shared (Extension)/SafariWebExtensionHandler.swift"
cp "$ROOT/apple/Shared/CloudSync.swift" "$HANDLER"
echo "Installed CloudSync handler → ${HANDLER#$ROOT/}"

# The converter's container app is a placeholder: one line of text, and on iOS
# its only button is hidden and unwired. Ours explains how to switch the
# extension on and opens Settings. These live in the repo because this
# directory is regenerated.
RES="$OUT/$APP/Shared (App)/Resources"
cp "$ROOT/apple/App/Style.css" "$RES/Style.css"
cp "$ROOT/apple/App/Script.js" "$RES/Script.js"
cp "$ROOT/apple/App/Main.html" "$RES/Base.lproj/Main.html"
cp "$ROOT/apple/App/ViewController.swift" "$OUT/$APP/Shared (App)/ViewController.swift"
echo "Installed container app → ${RES#$ROOT/}"

echo
echo "Project written to ${OUT#$ROOT/}"
echo "Next:"
echo "  1. open '$OUT/$APP/$APP.xcodeproj'"
echo "  2. set your development team on all four targets"
echo "  3. add the iCloud key-value storage capability to both Extension targets"
