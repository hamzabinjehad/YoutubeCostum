#!/usr/bin/env python3
"""Design defaults that creep back in, checked against the stylesheets.

The rules here are a subset of the impeccable.style detector vocabulary
(impeccable.style/slop) — the ones that are decidable from CSS text and that
actually apply to a settings surface. The landing-page rules it also carries
(hero eyebrows, italic serif display headlines, oversized hero metrics) have no
counterpart here and are not pretended at.

The one that caught something real was the flat type hierarchy: eleven sizes
between 9px and 16px, with the same job done at 11.5px in one place and 12.5px
in another. Close steps are not a hierarchy — they read as one size rendered
inconsistently, which is what they were.
"""

import glob
import os
import re
import sys

ROOT = os.environ.get(
    'COSTUM_ROOT', os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

SHEETS = sorted(glob.glob(os.path.join(ROOT, 'extension/ui/**/*.css'), recursive=True))
failures = []


def check(name, ok, detail=''):
    if not ok:
        failures.append('%s%s' % (name, ('  → ' + detail) if detail else ''))


def rules(css):
    """(selector, body) for every rule in the sheet, comments stripped."""
    css = re.sub(r'/\*.*?\*/', ' ', css, flags=re.S)
    out = []
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
        out.append((m.group(1).strip().replace('\n', ' '), m.group(2)))
    return out


INTERACTIVE = re.compile(
    r'^(?:button|input|textarea|select|a)\b|\[role="button"\]'
    r'|\.chip|\.check|\.tick|\.keycap|\.btn|\.list-row$|\.settings-row|\.tabs?$'
    r'|button|input|textarea|select')


def subjects(selector):
    """The element each comma-separated selector actually styles.

    `.list-row .row-label small` styles the `small`, not the row, and
    `.field:has(input.ticked) datalist` styles the datalist — an ancestor being
    interactive says nothing about the thing being sized. Judging the whole
    string called both of those interactive and was wrong twice out of three
    times it fired."""
    out = []
    for part in selector.split(','):
        part = re.sub(r':has\([^)]*\)', '', part).strip()
        out.append(part.split()[-1] if part.split() else part)
    return out

for path in SHEETS:
    rel = os.path.relpath(path, ROOT)
    css = open(path, encoding='utf-8').read()
    parsed = rules(css)

    # --- one type scale, declared once, used everywhere ------------------
    # A raw pixel font-size is how eleven sizes happened: each was reasonable
    # where it was written and nobody could see the set.
    raw = []
    for sel, body in parsed:
        if ':root' in sel:
            continue
        for m in re.finditer(r'font-size:\s*([0-9.]+)px', body):
            raw.append('%s { %spx }' % (sel[-40:], m.group(1)))
    check('%s: type comes from the scale, not a literal' % rel,
          not raw, '; '.join(raw[:4]))

    # --- nothing you operate is set at caption size ----------------------
    small = [sel[-46:] for sel, body in parsed
             if 'var(--t-caption)' in body
             and any(INTERACTIVE.search(s) for s in subjects(sel))]
    check('%s: nothing interactive is set at caption size' % rel,
          not small, '; '.join(small[:4]))

    # --- corners: cards capped, pills explicit ---------------------------
    fat = []
    for sel, body in parsed:
        for m in re.finditer(r'border-radius:\s*([0-9.]+)px', body):
            size = float(m.group(1))
            if 16 < size < 900:
                fat.append('%s { %spx }' % (sel[-36:], m.group(1)))
    check('%s: no card is rounded past 16px' % rel, not fat, '; '.join(fat[:4]))

    # --- the side-tab accent border, the most recognisable tell ----------
    tab = [sel[-40:] for sel, body in parsed
           if re.search(r'border-(?:left|right|inline-start|inline-end):\s*[3-9][0-9.]*px', body)]
    check('%s: no thick accent border down one side' % rel, not tab, '; '.join(tab[:3]))

    # --- gradients where they do not belong ------------------------------
    check('%s: text is a solid colour, not a gradient' % rel,
          'background-clip: text' not in css and '-webkit-background-clip: text' not in css)
    purple = re.findall(r'(?:linear|radial)-gradient\([^)]*(?:#[89ab][0-9a-f]{2}[0-9a-f]{3}|purple|violet|indigo)[^)]*\)',
                        css, re.I)
    check('%s: no purple gradient' % rel, not purple, '; '.join(purple[:2]))

    # --- motion ----------------------------------------------------------
    jank = [sel[-40:] for sel, body in parsed
            if re.search(r'transition:[^;]*\b(?:width|height|padding|margin|top|left|right|bottom)\b',
                         body.replace('line-height', ''))]
    check('%s: motion animates transform and opacity, not layout' % rel,
          not jank, '; '.join(jank[:3]))

    check('%s: nothing animates forever' % rel, 'infinite' not in css)

    # Spring physics on an interface element: a bezier that overshoots has a
    # control point outside 0..1 on the y axis.
    springs = []
    for m in re.finditer(r'cubic-bezier\(([^)]*)\)', css):
        nums = [float(n) for n in m.group(1).split(',')]
        if len(nums) == 4 and (nums[1] < 0 or nums[1] > 1 or nums[3] < 0 or nums[3] > 1):
            springs.append(m.group(0))
    check('%s: easing does not overshoot' % rel, not springs, '; '.join(springs[:2]))


# ------------------------------------------------------------- contrast

def channel(v):
    v /= 255.0
    return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4


def luminance(hexcolour):
    r, g, b = (int(hexcolour[i:i + 2], 16) for i in (1, 3, 5))
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)


def contrast(a, b):
    x, y = luminance(a), luminance(b)
    return (max(x, y) + 0.05) / (min(x, y) + 0.05)


sheet = open(os.path.join(ROOT, 'extension/ui/shared/apple.css'), encoding='utf-8').read()


def token(name, dark=False):
    """The value of a token, from the dark block or the light one."""
    body = sheet
    if dark:
        cut = sheet.find('prefers-color-scheme: dark')
        body = sheet[cut:] if cut != -1 else ''
    m = re.search(r'--%s:\s*(#[0-9A-Fa-f]{6})' % re.escape(name), body)
    return m.group(1) if m else None


# The accent as text is the case that failed: a filled switch carries its own
# contrast, a word does not, and the two most status-bearing strings in the
# popup — whether the extension is on, and how many settings a surface has
# running — are set in it. 4.5:1 is AA for text this size.
PAIRS = [
    ('accent-text on the grouped background', token('accent-text'), '#F2F2F7', False),
    ('accent-text on white', token('accent-text'), '#FFFFFF', False),
    ('accent-text on the raised surface (dark)', token('accent-text', True), '#2C2C2E', True),
    ('accent-text on the base surface (dark)', token('accent-text', True), '#1C1C1E', True),
]
for label, fg, bg, _ in PAIRS:
    if not fg:
        check('the text accent is declared: ' + label, False)
        continue
    got = contrast(fg, bg)
    check('%s reaches AA' % label, got >= 4.5, '%s on %s is %.2f:1' % (fg, bg, got))

# A fill with a word on it is a text pairing too, and the test did not look at
# them: white on the system blue is 3.65:1, which is what the only button on the
# focus block screen was set in.
FILLS = [
    ('white on the button fill (light)', '#FFFFFF', token('accent-fill')),
    ('white on the button fill (dark)', '#FFFFFF', token('accent-fill', True)),
]
for label, fg, bg in FILLS:
    if not bg:
        check('a fill for buttons that carry words is declared: ' + label, False)
        continue
    got = contrast(fg, bg)
    check('%s reaches AA' % label, got >= 4.5, '%s on %s is %.2f:1' % (fg, bg, got))

# The filled button must use it, not the switch accent.
check('filled buttons use the fill, not the switch accent',
      re.search(r'\.btn\.filled\s*\{[^}]*background:\s*var\(--accent-fill\)', sheet) is not None)

panel_src = open(os.path.join(ROOT, 'extension/content/panel.js'), encoding='utf-8').read()
focus_src = open(os.path.join(ROOT, 'extension/content/modules/focus.js'), encoding='utf-8').read()
white_on_blue = re.search(r'background:\s*#0A84FF;\s*color:\s*#FFFFFF', focus_src)
check('the block screen does not put white on the system blue',
      white_on_blue is None, white_on_blue and white_on_blue.group(0))


# And it has to actually be the one used for words.
for path in SHEETS:
    page = os.path.relpath(path, ROOT)
    css = open(path, encoding='utf-8').read()
    css = re.sub(r'/\*.*?\*/', ' ', css, flags=re.S)
    # `accent-color` and `border-color` both end in "color", and matching those
    # made this fire on a range slider and a checkbox — controls, which are
    # exactly what the control accent is for.
    painted = re.findall(r'([^{}]+)\{[^{}]*(?<![-\w])color:\s*var\(--accent\)\s*[;}]', css)
    painted = [p.strip().replace('\n', ' ')[-40:] for p in painted]
    check('%s: words use the text accent, not the control accent' % page,
          not painted, '; '.join(painted[:3]))


scale = open(os.path.join(ROOT, 'extension/ui/shared/apple.css'), encoding='utf-8').read()
steps = re.findall(r'--t-[a-z]+:\s*([0-9.]+)px', scale)
check('the scale is declared and small', 3 <= len(steps) <= 6, ', '.join(steps))
check('the scale has no step below 11px',
      all(float(s) >= 11 for s in steps), ', '.join(steps))

# --------------------------------------------------- one product, two surfaces

# The panel lives on YouTube's page and cannot share the stylesheet, so its
# tokens are copied. Copies drift: the popover moved to four type steps and
# sentence-case section labels and the panel kept five sizes and shouting
# headers, which is how one product comes to look like two.
panel = open(os.path.join(ROOT, 'extension/content/panel.js'), encoding='utf-8').read()
shared = open(os.path.join(ROOT, 'extension/ui/shared/apple.css'), encoding='utf-8').read()

for token in ('--t-caption', '--t-body', '--t-title'):
    here = re.search(re.escape(token) + r':\s*([0-9.]+px)', shared)
    there = re.search(re.escape(token) + r':\s*([0-9.]+px)', panel)
    check('the panel shares the popover\'s %s' % token,
          here and there and here.group(1) == there.group(1),
          '%s vs %s' % (here and here.group(1), there and there.group(1)))

panel_css = re.search(r'const CSS = `(.*?)`;', panel, re.S)
if panel_css:
    body = panel_css.group(1)
    raw = re.findall(r'font-size:\s*([0-9.]+)px', body)
    check('the panel takes its type from the scale, not from literals',
          not raw, ', '.join(sorted(set(raw))))
    check('the panel does not shout its section labels',
          'text-transform: uppercase' not in body)
    # all:initial resets the face to the browser's serif, and the floating
    # button spent a session in Times because the face was set a level too low.
    check('the panel sets its face on the host, where all:initial resets it',
          re.search(r':host\s*\{[^}]*font-family', body) is not None)


if failures:
    print('  %d style finding(s):' % len(failures))
    for line in failures:
        print('    ' + line)
    sys.exit(1)

print('  %d stylesheet(s) clean' % len(SHEETS))
