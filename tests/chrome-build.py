#!/usr/bin/env python3
"""Assert that the documented Chrome build is loadable MV3 input.

Safari and Chrome disagree about one manifest key. The source stays Safari
friendly, while scripts/build-chrome.sh creates the Chromium-only manifest.
This test uses a throwaway generated child of build/ so it exercises that exact
command without replacing a developer's loaded build/chrome directory.
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.environ.get('COSTUM_ROOT', os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUILD = os.path.join(ROOT, 'build')
SCRIPT = os.path.join(ROOT, 'scripts', 'build-chrome.sh')
SOURCE_MANIFEST = os.path.join(ROOT, 'extension', 'manifest.json')

os.makedirs(BUILD, exist_ok=True)
output = tempfile.mkdtemp(prefix='.chrome-test-', dir=BUILD)

try:
    env = os.environ.copy()
    env['COSTUM_CHROME_OUT'] = output
    subprocess.run([SCRIPT], check=True, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    with open(SOURCE_MANIFEST, encoding='utf-8') as source_file:
        source = json.load(source_file)
    with open(os.path.join(output, 'manifest.json'), encoding='utf-8') as output_file:
        chrome = json.load(output_file)

    errors = []
    background = chrome.get('background', {})
    if chrome.get('manifest_version') != 3:
        errors.append('the generated manifest is not Manifest V3')
    if set(background) != {'service_worker'}:
        errors.append('Chrome background contains keys other than service_worker')
    if background.get('service_worker') != source.get('background', {}).get('service_worker'):
        errors.append('Chrome and source manifests do not use the same worker')
    if 'scripts' in background:
        errors.append('Safari background.scripts leaked into the Chrome manifest')
    if 'nativeMessaging' in chrome.get('permissions', []):
        errors.append('Chrome build requests a native host it does not ship')

    required = [
        background.get('service_worker', ''),
        'common/defaults.js',
        'content/page/bridge.js',
        'ui/popup/popup.html',
        'rules/ads.json',
    ]
    missing = [path for path in required if not path or not os.path.isfile(os.path.join(output, path))]
    if missing:
        errors.append('generated build is missing ' + ', '.join(missing))

    if errors:
        print('  %d Chrome build failure(s):' % len(errors))
        for error in errors:
            print('    ' + error)
        sys.exit(1)

    print('  generated MV3 manifest loads the shared service worker without Safari-only keys')
finally:
    shutil.rmtree(output, ignore_errors=True)
