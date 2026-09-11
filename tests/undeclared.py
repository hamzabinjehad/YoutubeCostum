#!/usr/bin/env python3
"""Functions that are called but never defined.

`syncAdRules(settings)` sat in three call sites of the background script with
no definition anywhere. Nothing caught it: the file parses, so the syntax check
passed, and a background script has no DOM for the interaction suite to poke,
so it threw on every settings change and on every startup in silence — while
the switch it was meant to serve sat in the settings page promising to block ad
requests.

This looks for the same shape: a bare `name(...)` call where `name` is never
declared in that file, is not a parameter, and is not something the platform
provides. It is deliberately narrow — bare calls only, never `a.b()` — because
a member call can come from anywhere and guessing would produce noise instead
of findings.
"""

import glob
import os
import re
import sys

ROOT = os.environ.get(
    'COSTUM_ROOT', os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Everything reachable without declaring it: the platform, and the globals the
# extension's own modules publish for each other.
PROVIDED = {
    # language and platform
    'Array', 'Boolean', 'Date', 'Error', 'Function', 'JSON', 'Map', 'Math',
    'Number', 'Object', 'Promise', 'RegExp', 'Set', 'String', 'Symbol',
    'WeakMap', 'WeakSet', 'BigInt', 'Proxy', 'Reflect', 'Intl',
    'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent',
    'decodeURIComponent', 'encodeURI', 'decodeURI', 'eval', 'structuredClone',
    'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask',
    'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback',
    'fetch', 'atob', 'btoa', 'alert', 'confirm', 'prompt', 'importScripts',
    'addEventListener', 'removeEventListener', 'dispatchEvent', 'postMessage',
    'getComputedStyle', 'matchMedia', 'crypto', 'TextEncoder', 'TextDecoder',
    'URL', 'URLSearchParams', 'AbortController', 'Blob', 'FileReader',
    'MutationObserver', 'IntersectionObserver', 'ResizeObserver',
    'CustomEvent', 'Event', 'KeyboardEvent', 'MouseEvent', 'Response', 'Request',
    'DOMParser', 'Element', 'HTMLElement', 'Node', 'NodeFilter', 'CSS',
    # a few names that only ever appear as types or in typeof guards
    'BigInt64Array', 'Uint8Array', 'ArrayBuffer', 'ClipboardItem',
}

# Keywords that take a parenthesis and are not calls.
KEYWORDS = {
    'if', 'for', 'while', 'switch', 'catch', 'return', 'typeof', 'function',
    'do', 'else', 'await', 'new', 'delete', 'void', 'in', 'of', 'case',
    'throw', 'yield', 'instanceof', 'constructor', 'get', 'set', 'try',
    'async',   # `async (a) => …` looks exactly like a call to `async`
}


def strip_noise(text):
    """Comments and string bodies, so a name mentioned in prose is not a call."""
    text = re.sub(r'/\*.*?\*/', ' ', text, flags=re.S)
    text = re.sub(r'(^|[^:])//[^\n]*', r'\1', text)
    text = re.sub(r"'(?:\\.|[^'\\])*'", "''", text)
    text = re.sub(r'"(?:\\.|[^"\\])*"', '""', text)
    text = re.sub(r'`(?:\\.|[^`\\])*`', '``', text)
    # regex literals: `/^Hide (the )?/i` reads as a call to `Hide` otherwise.
    # Only after an operator or an opening bracket, so division survives.
    text = re.sub(r'(?<=[=(,:&|!?{;\[])\s*/(?![/*])(?:\\.|\[[^\]]*\]|[^/\\\n])+/[gimsuy]*',
                  ' RE ', text)
    return text


def declared_in(text):
    """Every name this file binds, by any means it actually uses."""
    names = set()
    names |= set(re.findall(r'\bfunction\s*\*?\s*([A-Za-z_$][\w$]*)', text))
    names |= set(re.findall(r'\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)', text))
    names |= set(re.findall(r'\bclass\s+([A-Za-z_$][\w$]*)', text))
    # destructuring, both object and array, including renames and defaults
    for body in re.findall(r'\b(?:const|let|var)\s*\{([^{}]*)\}\s*=', text):
        for part in body.split(','):
            part = part.strip()
            if not part:
                continue
            part = part.split('=')[0].strip()
            names.add((part.split(':')[-1] if ':' in part else part).strip())
    for body in re.findall(r'\b(?:const|let|var)\s*\[([^\[\]]*)\]\s*=', text):
        for part in body.split(','):
            part = part.split('=')[0].strip().lstrip('.')
            if part:
                names.add(part)
    # every parameter list, which is coarse but errs towards silence
    for body in re.findall(r'\(([^()]*)\)\s*(?:=>|\{)', text):
        for part in re.split(r'[,{}\[\]]', body):
            part = part.split('=')[0].split(':')[-1].strip().lstrip('.')
            if re.fullmatch(r'[A-Za-z_$][\w$]*', part or ''):
                names.add(part)
    names |= set(re.findall(r'\bcatch\s*\(\s*([A-Za-z_$][\w$]*)', text))
    # method shorthand in an object literal — `apply(settings, ctx) { … }` is a
    # definition, not a call, and reads identically to one
    names |= set(re.findall(r'([A-Za-z_$][\w$]*)\s*\([^()]*\)\s*\{', text))
    # a labelled function expression assigned to a property still binds nothing,
    # but `self.Foo = ...` publishes a global other files may call
    return names


def published_globals(texts):
    names = set()
    for text in texts:
        names |= set(re.findall(r'\b(?:self|globalThis|window)\.([A-Za-z_$][\w$]*)\s*=', text))
    return names


def module_exports(texts):
    """Each `root.CostumX = { a, b, c }` and the names it publishes.

    Bare calls are only half the problem. `Lock.check(...)` parses, passes every
    check above, and throws at the moment the button is pressed — inside a
    listener, where the exception never reaches the caller and nothing appears
    on screen. The module is named `CostumLock` and exports `verify`, and that
    is knowable from the source.
    """
    out = {}
    for text in texts:
        for m in re.finditer(r'root\.(Costum[A-Za-z]*)\s*=\s*\{([^{}]*)\}', text):
            names = set()
            for part in m.group(2).split(','):
                part = part.strip()
                if not part:
                    continue
                names.add(part.split(':')[0].strip())
            out[m.group(1)] = names
    return out


files = sorted(glob.glob(os.path.join(ROOT, 'extension/**/*.js'), recursive=True))
cleaned = {f: strip_noise(open(f, encoding='utf-8').read()) for f in files}
globals_published = published_globals(cleaned.values())
EXPORTS = module_exports(cleaned.values())

failures = []
for path, text in cleaned.items():
    declared = declared_in(text)
    called = set(re.findall(r'(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(', text))
    unknown = sorted(
        name for name in called
        if name not in declared
        and name not in KEYWORDS
        and name not in PROVIDED
        and name not in globals_published
    )
    if unknown:
        failures.append('%s → %s' % (os.path.relpath(path, ROOT), ', '.join(unknown)))

    # Calls on one of this extension's own modules, whether reached through the
    # global or through a local alias bound to it.
    aliases = dict(re.findall(
        r'(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*'
        r'(?:self|root|globalThis|window)\.(Costum[A-Za-z]*)(?![\w$.])',
        text))   # the trailing guard: `const clean = self.CostumFields.parse(...)`
                 # binds a result, not an alias for the module
    for module, names in EXPORTS.items():
        aliases.setdefault(module, module)
    wrong = []
    for local, module in list(aliases.items()) + [(m, m) for m in EXPORTS]:
        names = EXPORTS.get(module)
        if not names:
            continue
        for m in re.finditer(r'(?<![\w$.])%s\.([A-Za-z_$][\w$]*)\s*\(' % re.escape(local), text):
            if m.group(1) not in names:
                wrong.append('%s.%s' % (local, m.group(1)))
    if wrong:
        failures.append('%s → %s (not exported)'
                        % (os.path.relpath(path, ROOT), ', '.join(sorted(set(wrong)))))

if failures:
    print('  %d file(s) calling something undefined:' % len(failures))
    for line in failures:
        print('    ' + line)
    sys.exit(1)

print('  every function called is defined (%d files)' % len(files))
