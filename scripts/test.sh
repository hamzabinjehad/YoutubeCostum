#!/bin/bash
# Runs the pure-logic tests — the settings model and the CSS builders, the
# parts that decide behaviour before any DOM exists. No browser needed.
# JavaScriptCore comes with macOS, so there is nothing to install.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Syntax:"
find "$ROOT/extension" -name '*.js' | sort > /tmp/costum-jsfiles.txt
COSTUM_ROOT="$ROOT" osascript -l JavaScript "$ROOT/tests/syntax.js"

echo
echo "Settings spec:"
COSTUM_ROOT="$ROOT" python3 "$ROOT/tests/spec-paths.py"

echo
echo "Logic:"
COSTUM_ROOT="$ROOT" osascript -l JavaScript "$ROOT/tests/logic.js"
