#!/usr/bin/env python3
"""Every setting must appear exactly once in the options spec.

The same switch shown on two surfaces is one switch too many: the two copies
sit in different tabs, so a reader who flips one has no reason to think the
other exists, and the pair disagree on sight until the page is rebuilt.
This is a text check on purpose — options.js needs a DOM to load.
"""
import re, sys, os, collections

root = os.environ.get('COSTUM_ROOT', os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
source = open(os.path.join(root, 'extension/ui/options/options.js')).read()

paths = re.findall(r"path: '([a-zA-Z0-9_.]+)'", source)
counts = collections.Counter(paths)
dupes = sorted(p for p, n in counts.items() if n > 1)

if dupes:
    print('  %d setting(s) appear more than once: %s' % (len(dupes), ', '.join(dupes)))
    sys.exit(1)
print('  %d settings, each declared once' % len(paths))
