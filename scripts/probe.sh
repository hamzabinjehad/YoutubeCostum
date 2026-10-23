#!/bin/bash
# Prints a script to paste into the console of a live youtube.com page. It
# counts, for every selector group in css.js that applies to that page, how
# many elements the group actually matches — and names the ones that match
# nothing.
#
# This is the only check that can tell a switch which works from one which only
# looks wired: wiring.py proves each setting has selectors behind it, and this
# proves the selectors reach something on today's YouTube. It found nine dead
# card switches at once, when YouTube moved the related column to a card format
# with no ids in it and every id-based selector quietly stopped matching.
#
# Read from css.js at generation time, never embedded, so it cannot drift from
# what the extension ships. Run on a watch page, then a search page, then the
# home page and a channel — a group that is empty on a page it does not apply to
# is not a finding.
#
#   ./scripts/probe.sh | pbcopy      then paste into the page's console
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Not GROUPS: that is a bash builtin (the user's group ids), assignment to it
# is silently ignored, and $GROUPS expanded to 20 — the staff gid on a Mac.
SELECTORS=$(osascript -l JavaScript "$ROOT/scripts/probe-dump.js" "$ROOT/extension/common")

cat <<JS
(() => {
const GROUPS = $SELECTORS;
const page = location.pathname;
const applies = (key) => {
  const p = key.split('.')[0];
  if (['global', 'header', 'sidebar', 'cards'].includes(p)) return true;
  if (p === 'watch') return page.startsWith('/watch');
  if (p === 'home') return page === '/' || page === '';
  if (p === 'search') return page.startsWith('/results');
  if (p === 'channel') return /^\\/(@|channel\\/|c\\/|user\\/)/.test(page);
  if (p === 'subscriptions') return page.startsWith('/feed/subscriptions');
  if (p === 'library') return page.startsWith('/feed/');
  if (p === 'shortsPlayer') return page.startsWith('/shorts');
  return false;
};
const r = { page, checked: 0, matched: [], empty: [], broken: [] };
for (const [name, sels] of Object.entries(GROUPS)) {
  if (!applies(name)) continue;
  r.checked += 1;
  let total = 0;
  for (const s of sels) {
    try { total += document.querySelectorAll(s).length; }
    catch (e) { r.broken.push(name + ' :: ' + s); }
  }
  (total ? r.matched : r.empty).push(total ? name + ' (' + total + ')' : name);
}
console.log('Costum probe on ' + page + ': ' + r.checked + ' groups, '
  + r.matched.length + ' matched, ' + r.empty.length + ' empty, ' + r.broken.length + ' broken');
if (r.empty.length) console.log('EMPTY (scroll first — comments and cards load lazily):\\n  ' + r.empty.join('\\n  '));
if (r.broken.length) console.log('BROKEN SELECTORS:\\n  ' + r.broken.join('\\n  '));
return r;
})();
JS
