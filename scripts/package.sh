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

# The converter's container app is a WKWebView showing one line of text, and
# on iOS its only button is hidden and unwired. Ours is native SwiftUI, built
# for iPhone first. It lives in the repo because this directory is regenerated.
cp "$ROOT/apple/App/ViewController.swift" "$OUT/$APP/Shared (App)/ViewController.swift"

# The converter builds the app icon from the extension's largest PNG: one
# image with transparent corners for every slot, which App Store Connect
# rejects on iOS, and the light icon reused as the dark and tinted ones.
# scripts/icons.swift draws the real set.
ASSETS="$OUT/$APP/Shared (App)/Assets.xcassets"
for SET in AppIcon.appiconset LargeIcon.imageset; do
  rm -rf "$ASSETS/$SET"
  cp -R "$ROOT/apple/App/Icons/$SET" "$ASSETS/$SET"
done

# The App Group the iOS app and its extension share, so the setup screen can
# say whether the extension has been seen working (ExtensionPresence in
# CloudSync.swift). iOS has no API to ask. Adding the iCloud capability in
# Xcode later edits these same files.
for TARGET in "iOS (App)" "iOS (Extension)"; do
  cat > "$OUT/$APP/$TARGET/$TARGET.entitlements" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>com.apple.security.application-groups</key>
	<array>
		<string>group.com.costum.youtube</string>
	</array>
</dict>
</plist>
PLIST
done
PBX_EARLY="$OUT/$APP/$APP.xcodeproj/project.pbxproj"
sed -i '' \
  -e 's|^\([[:space:]]*\)INFOPLIST_FILE = "iOS (App)/Info.plist";|&\
\1CODE_SIGN_ENTITLEMENTS = "iOS (App)/iOS (App).entitlements";|' \
  -e 's|^\([[:space:]]*\)INFOPLIST_FILE = "iOS (Extension)/Info.plist";|&\
\1CODE_SIGN_ENTITLEMENTS = "iOS (Extension)/iOS (Extension).entitlements";|' \
  "$PBX_EARLY"

# COSTUM_TEAM=ABCDE12345 ./scripts/package.sh signs every target with that
# team, instead of setting it by hand on all four in Xcode.
if [ -n "${COSTUM_TEAM:-}" ]; then
  if grep -q "DEVELOPMENT_TEAM = " "$PBX_EARLY"; then
    sed -i '' -e "s/DEVELOPMENT_TEAM = [A-Z0-9]*;/DEVELOPMENT_TEAM = $COSTUM_TEAM;/" "$PBX_EARLY"
  else
    sed -i '' -e "s/^\([[:space:]]*\)CODE_SIGN_STYLE = Automatic;/&\\
\1DEVELOPMENT_TEAM = $COSTUM_TEAM;/" "$PBX_EARLY"
  fi
  echo "Signing team set to $COSTUM_TEAM"
fi

# The setup screen's contentMargins and grouped Form need iOS 17 / macOS 14.
# The converter writes iOS 15 / macOS 10.14, and on 10.14 SwiftUI does not
# exist at all.
#
# The name under the icon is "Costum", the name the popover and the panel use.
# "Costum for YouTube" is too long for a Home Screen label: iOS squeezes the
# spaces out and truncates it to "CostumforYouT…". The store listing keeps
# the full name; that is set in App Store Connect, not here.
PBX="$OUT/$APP/$APP.xcodeproj/project.pbxproj"
sed -i '' \
  -e 's/IPHONEOS_DEPLOYMENT_TARGET = [0-9.]*;/IPHONEOS_DEPLOYMENT_TARGET = 17.0;/' \
  -e 's/MACOSX_DEPLOYMENT_TARGET = [0-9.]*;/MACOSX_DEPLOYMENT_TARGET = 14.0;/' \
  -e 's/INFOPLIST_KEY_CFBundleDisplayName = "Costum for YouTube";/INFOPLIST_KEY_CFBundleDisplayName = Costum;/' \
  "$PBX"
echo "Installed SwiftUI container app (iOS 17 / macOS 14) and app icons"

echo
echo "Project written to ${OUT#$ROOT/}"
echo "Next:"
echo "  1. open '$OUT/$APP/$APP.xcodeproj'"
echo "  2. set your development team on all four targets"
echo "  3. add the iCloud key-value storage capability to both Extension targets"
