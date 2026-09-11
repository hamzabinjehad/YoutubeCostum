/* The parts of a control that are logic rather than markup.
 *
 * These lived inside the settings page's renderer, which was fine while it was
 * the only place that drew a speed-preset row or a custom-stylesheet box. The
 * popup draws them too now, and a second copy of "sort, de-duplicate, refuse an
 * empty list" is a second copy that drifts. Both surfaces call these.
 *
 * Kept free of the DOM except where the DOM is the tool: counting the rules in
 * a stylesheet means asking a parser, and the browser's is the one that will be
 * parsing it for real.
 */
(function (root) {
  'use strict';

  /* A row of numbers typed as one line. Returns null when there is nothing
     usable, which the caller treats as "leave what was there" — refusing an
     empty result is what keeps a typo from removing the speed control from the
     in-page panel altogether. */
  function parseNumbers(text, min, max) {
    const parsed = String(text || '').split(/[,\s]+/)
      .map((piece) => Number(piece))
      .filter((n) => Number.isFinite(n) && n >= min && n <= max);
    // Sorted and de-duplicated: these become buttons in a row, and "1, 1, 0.5"
    // would draw a duplicate and an out-of-order one.
    const clean = [...new Set(parsed)].sort((a, b) => a - b);
    return clean.length ? clean : null;
  }

  /* How many rules a stylesheet actually yields. A sheet that does not parse is
     injected and silently dropped, so it is worth saying so where there is
     somewhere to say it. */
  function cssRuleCount(text) {
    if (!String(text || '').trim()) return null;
    const sheet = document.createElement('style');
    sheet.textContent = text;
    document.head.appendChild(sheet);
    const rules = sheet.sheet ? sheet.sheet.cssRules.length : 0;
    sheet.remove();
    return rules;
  }

  const splitLines = (text) => String(text || '').split('\n')
    .map((line) => line.trim()).filter(Boolean);

  root.CostumFields = { parseNumbers, cssRuleCount, splitLines };
})(typeof self !== 'undefined' ? self : this);
