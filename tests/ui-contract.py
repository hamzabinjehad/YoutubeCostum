#!/usr/bin/env python3
"""The contracts between a page's markup, its script and its copy deck.

Every check here exists because the matching mistake was actually made while
building this, and none of them are caught by the logic suite: that suite loads
data modules, while these are agreements *between* files that only break at
runtime, in a browser, usually silently.

  - a script reaching for an element id the markup does not define
  - a string key used in one language and missing in the other, which renders
    as `undefined` or as nothing at all
  - a control type in the spec that no renderer has a branch for, which draws
    an empty row
  - a group heading whose label collides with a surface name, which once
    carried twelve settings into the wrong tab

Text checks on purpose: these files need a DOM to execute, and standing one up
to assert that an id exists would be a great deal of machinery for a grep.
"""

import os
import re
import sys

ROOT = os.environ.get(
    'COSTUM_ROOT', os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

failures = []


def read(*parts):
    with open(os.path.join(ROOT, *parts), encoding='utf-8') as handle:
        return handle.read()


def check(name, ok, detail=''):
    if ok:
        return
    failures.append('%s%s' % (name, ('  → ' + detail) if detail else ''))


# ---------------------------------------------------------------- element ids

def ids_in_markup(html):
    return set(re.findall(r'\bid="([^"]+)"', html))


def ids_wanted_by(script):
    return set(re.findall(r"getElementById\(\s*'([^']+)'\s*\)", script))


for page in ('popup',):
    html = read('extension/ui', page, page + '.html')
    script = read('extension/ui', page, page + '.js')
    missing = sorted(ids_wanted_by(script) - ids_in_markup(html))
    check('%s: every id the script reaches for exists in the markup' % page,
          not missing, ', '.join(missing))


# --------------------------------------------------------------- string decks

def deck(script, lang):
    """The keys defined for one language in a page's STR object."""
    match = re.search(r"\n\s{4}%s: \{(.*?)\n\s{4}\}" % lang, script, re.S)
    if not match:
        return None
    body = match.group(1)
    # `tabs: { … }` and other nested objects contribute their own keys, which
    # are looked up as STR[lang].tabs[x], not STR[lang].x — so skip inside them.
    body = re.sub(r'\{[^{}]*\}', '', body)
    return set(re.findall(r"(?:^|[\s,{])([a-zA-Z][a-zA-Z0-9]*)\s*:", body))


for page in ('popup',):
    script = read('extension/ui', page, page + '.js')
    en, ar = deck(script, 'en'), deck(script, 'ar')
    if en is None or ar is None:
        check('%s: both language decks are readable' % page, False)
        continue

    only_en = sorted(en - ar)
    only_ar = sorted(ar - en)
    check('%s: every English string has an Arabic one' % page,
          not only_en, ', '.join(only_en))
    check('%s: every Arabic string has an English one' % page,
          not only_ar, ', '.join(only_ar))

    # A key used but never defined renders as `undefined` — silently, in the UI.
    used = set(re.findall(r"(?:STR\[lang\]|L\(\))\.([a-zA-Z][a-zA-Z0-9]*)", script))
    undefined = sorted(used - en - {'tabs'})
    check('%s: every string the script uses is defined' % page,
          not undefined, ', '.join(undefined))


# -------------------------------------------------------------- control types

spec = read('extension/common/spec.js')
# camelCase included: `[a-z]+` could not see `blockNow`, so the check reported
# that every declared type had a renderer while one had none, and the setting
# drew a dead row with the word "blockNow" in it.
declared_types = set(re.findall(r"type:\s*'([a-zA-Z]+)'", spec))

popup_js = read('extension/ui/popup/popup.js')
handled = re.search(r"HANDLED = new Set\(\[([^\]]*)\]\)", popup_js)
check('popup: it declares which control types it can draw', handled is not None)
if handled:
    popup_types = set(re.findall(r"'([a-zA-Z]+)'", handled.group(1)))
    # The popover is the only surface there is. A type the spec declares and the
    # popup cannot draw is a setting with nowhere to be changed, not a setting
    # that lives somewhere else.
    unrendered = sorted(declared_types - popup_types)
    check('popup: every control type in the spec has a renderer',
          not unrendered, ', '.join(unrendered))
    check('popup: it does not claim a type the spec never uses',
          not (popup_types - declared_types),
          ', '.join(sorted(popup_types - declared_types)))
    drawn = set(re.findall(r"field\.type === '([a-zA-Z]+)'", popup_js))
    # `range` is the one the function falls through to, so it is never compared
    # by name; every other type is reached by an explicit branch.
    missing = sorted(popup_types - drawn - {'range'})
    check('popup: each type it claims has a branch that draws it',
          not missing, ', '.join(missing))


# ------------------------------------------------------------ surface headings

surface_markers = dict(re.findall(r"surface:\s*'([a-z]+)',\s*en:\s*'([^']+)'", spec))
check('the spec marks its surfaces explicitly', bool(surface_markers))

# Every heading label in the whole spec, surface or sub-group.
all_headings = re.findall(r"heading:\s*true,(?:\s*surface:\s*'[a-z]+',)?\s*en:\s*'([^']+)'", spec)
sub_headings = [h for h in all_headings if h not in surface_markers.values()]

collisions = sorted(set(sub_headings) & set(surface_markers.values()))
check('no sub-group is named after a surface', not collisions, ', '.join(collisions))

names = re.search(r"SURFACE_NAMES = \{\s*en:\s*(\{[^}]*\})", spec)
check('the spec carries the surface names', names is not None)
if names:
    named = set(re.findall(r"([a-zA-Z]+):", names.group(1)))
    unnamed = sorted(set(surface_markers) - named)
    check('every surface has a name of its own', not unnamed, ', '.join(unnamed))


# -------------------------------------------------------------------- icons

icons = read('extension/ui/shared/icons.js')
drawn = set(re.findall(r"^\s{4}([a-zA-Z]+):\s*\['#", icons, re.M))

if names:
    missing = sorted(named - drawn)
    check('every surface has an icon', not missing, ', '.join(missing))
    stray = sorted(drawn - named)
    check('no icon is drawn for a surface that does not exist',
          not stray, ', '.join(stray))

# The popup and the settings page each had their own idea of this once, and
# only one of them had icons at all.
for page in ('popup',):
    script = read('extension/ui', page, page + '.js')
    check('%s: it uses the shared icon set' % page, 'CostumIcons' in script)
    check('%s: it keeps no icon set of its own' % page,
          not re.search(r"\['#[0-9A-Fa-f]{6}', '<", script))

# One definition of the tile, in the sheet both pages link. A page may still
# size it for its own rows — that is what the variable is for — so what is
# forbidden is a second base rule, not a scoped override.
shared = read('extension/ui/shared/apple.css')
check('the tile is styled in the shared sheet',
      re.search(r'^\.tab-icon\s*\{', shared, re.M) is not None)
for page in ('popup',):
    css = read('extension/ui', page, page + '.css')
    check('%s: it does not redefine the tile' % page,
          re.search(r'^\.tab-icon\s*\{', css, re.M) is None)


# ------------------------------------------------------------ mirrored shapes

# A shape that mirrors itself for RTL with a flipped rotation must not also be
# built from logical borders, which flip on their own: the two mirrorings
# compose instead of cancelling, and the arrow ends up pointing somewhere it
# was never meant to. The row chevron pointed at the floor in Arabic this way.
for page in ('popup',):
    css = read('extension/ui', page, page + '.css')
    mirrored = set(re.findall(r'\[dir="rtl"\][^{]*?\.([a-zA-Z-]+)\s*\{[^}]*transform', css))
    for name in sorted(mirrored):
        base = re.search(r'^\.%s\s*\{([^}]*)\}' % re.escape(name), css, re.M)
        if not base:
            continue
        logical = re.findall(r'border-(?:inline|block)[a-z-]*', base.group(1))
        check('%s: .%s mirrors once, not twice' % (page, name),
              not logical, ', '.join(sorted(set(logical))))


# ------------------------------------------------------------------- verdict

if failures:
    print('  %d UI contract failure(s):' % len(failures))
    for line in failures:
        print('    ' + line)
    sys.exit(1)

print('  markup, scripts and copy decks agree')
