#!/usr/bin/env python3
"""Every setting has something behind it.

The promise this extension makes to itself is that it never ships a switch that
does nothing. That is easy to hold while a feature is being written and easy to
lose later: a setting gets renamed on one side, or added to the spec ahead of
the code meant to serve it, and the settings page happily draws a control that
writes a value nobody reads. `playback.blockAdRequests` sat that way — a switch
promising to block ad requests before they load, with no consumer at all.

Each family is checked the way it is actually wired:

  declutter.<page>.<leaf>   an entry under the same page in css.js, which is
                            where the selectors live, or a module that names it
  everything else           the full path, or its group destructured and the
                            leaf read off it, somewhere outside the spec and
                            the two generic UI renderers

The popup is excluded on purpose: it walks the spec and draws whatever is in
it, so it "reads" every path and would make every setting look wired. So is
the one line in defaults.js that declares a setting's default — declaring a
value is not reading it, and counting it made the check pass on the very bug it
was written for. A second mention in defaults.js is a genuine use: that file
also builds the home-redirect rule out of the path it declares.
"""

import glob
import os
import re
import sys

ROOT = os.environ.get(
    'COSTUM_ROOT', os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(*parts):
    with open(os.path.join(ROOT, *parts), encoding='utf-8') as handle:
        return handle.read()


spec = read('extension/common/spec.js')
paths = sorted(set(re.findall(r"path:\s*'([a-zA-Z0-9_.]+)'", spec)))

GENERIC = ('common/spec.js', 'ui/popup/popup.js', 'ui/shared/icons.js')
sources = {}
for f in sorted(glob.glob(os.path.join(ROOT, 'extension/**/*.js'), recursive=True)):
    rel = os.path.relpath(f, ROOT).replace(os.sep, '/')
    if rel.endswith(GENERIC):
        continue
    sources[rel] = read(rel)


def used_in(text, leaf, path_in_model):
    """Whether `text` reads the leaf, not merely declares its default."""
    hits = len(re.findall(r"(?<![\w$])%s(?![\w$])" % re.escape(leaf), text))
    return hits > (1 if path_in_model else 0)


MODEL = 'extension/common/defaults.js'

css = read('extension/common/css.js')


def css_groups():
    """page → the leaf names css.js knows about, from DECLUTTER and STYLE_ONLY."""
    groups = {}
    for block in ('DECLUTTER', 'STYLE_ONLY'):
        start = css.find('const %s = {' % block)
        if start == -1:
            continue
        depth, i = 0, css.index('{', start)
        for end in range(i, len(css)):
            if css[end] == '{':
                depth += 1
            elif css[end] == '}':
                depth -= 1
                if depth == 0:
                    break
        body = css[i:end]
        # one nesting level in: `watch: { comments: [...], ... }`
        for page, inner in re.findall(r'\n    ([a-zA-Z]+):\s*\{(.*?)\n    \}', body, re.S):
            leaves = set(re.findall(r'\n      ([a-zA-Z0-9]+):', inner))
            groups.setdefault(page, set()).update(leaves)
    return groups


GROUPS = css_groups()

missing = []
for path in paths:
    parts = path.split('.')

    if parts[0] == 'declutter' and len(parts) == 3:
        page, leaf = parts[1], parts[2]
        if leaf in GROUPS.get(page, set()):
            continue
        # a page group css.js does not own may still be served by a module
        if any(used_in(text, leaf, rel == MODEL) for rel, text in sources.items()):
            continue
        missing.append('%s — no selector under %s in css.js, and no module names it'
                       % (path, page))
        continue

    if any(path in text for text in sources.values()):
        continue
    # `const { forceQuality } = settings.playback` and friends: the group is
    # named somewhere and the leaf read off it in the same file.
    group = '.'.join(parts[:-1])
    leaf = parts[-1]
    if any(group in text and used_in(text, leaf, rel == MODEL)
           for rel, text in sources.items()):
        continue
    missing.append('%s — nothing reads it' % path)

# ---------------------------------------------------- the ad ruleset itself

import json

bg = read('extension/background/bg.js')
manifest = json.loads(read('extension/manifest.json'))
declared = {r['id'] for r in
            manifest.get('declarative_net_request', {}).get('rule_resources', [])}

named = re.search(r"ADS_RULESET\s*=\s*'([^']+)'", bg)
if not named:
    missing.append("the background script names no ad ruleset")
elif named.group(1) not in declared:
    missing.append("bg.js enables ruleset '%s', which the manifest does not declare (%s)"
                   % (named.group(1), ', '.join(sorted(declared)) or 'none'))

# Safari implements updateEnabledRulesets but not updateDynamicRules, so a
# static ruleset is the only form of blocking that works there. Reaching for
# the dynamic API here would make the switch dead on the one browser this is
# built for, while still looking wired to every check above.
sync = re.search(r'async function syncAdRules.*?\n  \}', bg, re.S)
if not sync:
    missing.append('syncAdRules is not defined')
elif 'updateEnabledRulesets' not in sync.group(0):
    missing.append('syncAdRules does not enable the static ruleset')
elif 'updateDynamicRules' in sync.group(0):
    missing.append('syncAdRules uses updateDynamicRules, which Safari does not implement')


if missing:
    print('  %d setting(s) with nothing behind them:' % len(missing))
    for line in missing:
        print('    ' + line)
    sys.exit(1)

print('  all %d settings are wired to something' % len(paths))
