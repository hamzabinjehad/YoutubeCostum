/* Interaction tests for the two HTML surfaces.
 *
 * The logic suite covers everything that can be decided without a browser, and
 * the contract suite covers the agreements between files. What neither can
 * reach is behaviour: does drilling in and coming back put you where you were,
 * does a group flip actually undo, does searching a surface name take you to
 * the surface. Every one of those was checked by hand while it was being
 * built, which is not the same as being checked again next month.
 *
 * Run it in the console of the popup served by scripts/harness.sh:
 *
 *   const src = await (await fetch('/ui-browser.js')).text();
 *   (0, eval)(src);
 *   await CostumUiTests.run();
 *
 * Each test re-queries the DOM rather than holding references: every save
 * rebuilds the pane it lives in, so a reference taken before a click points at
 * a detached node afterwards. Getting that wrong once produced a failure that
 * looked exactly like a broken bulk toggle.
 */
(function (root) {
  'use strict';

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const SETTLE = 400;

  function reporter() {
    const results = [];
    return {
      results,
      ok(name, condition, detail) {
        results.push({ name, pass: !!condition, detail: condition ? '' : String(detail || '') });
      }
    };
  }

  /* ------------------------------------------------------------- the popup */

  async function popup(t) {
    const $ = (id) => document.getElementById(id);
    const surfaceRows = () => [...document.querySelectorAll('#surface-list .list-row')];
    const key = (el, k) => el.dispatchEvent(
      new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

    /* Search used to start 624px into a 486px viewport and sat eighteen tab
       stops from the first focusable thing — the fast path to 238 settings,
       invisible on open. Both numbers are the assertion now. */
    const focusable = () => [...document.querySelectorAll(
      'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])')]
      .filter((e) => e.offsetParent !== null);
    t.ok('search is visible without scrolling',
      $('search').getBoundingClientRect().top < 560,
      Math.round($('search').getBoundingClientRect().top) + 'px down');
    t.ok('and the keyboard reaches it early',
      focusable().findIndex((e) => e.id === 'search') <= 2,
      focusable().findIndex((e) => e.id === 'search') + ' tab stops');

    /* 238 settings and no way to save, move or undo them was the lowest score
       the review gave this surface. */
    t.ok('there is a way to export, import and reset',
      ['export', 'import', 'reset'].every((id) => !!$(id)));
    $('reset').click();
    t.ok('reset asks before it does anything', !$('reset-confirm').hidden);
    $('reset-cancel').click();
    t.ok('and taking it back closes the question', $('reset-confirm').hidden);

    t.ok('the root lists every surface', surfaceRows().length >= 15, surfaceRows().length);
    t.ok('each surface row carries a count',
      surfaceRows().every((r) => r.querySelector('.row-count')));

    // --- drilling in and back ---
    $('scroll').scrollTop = 240;
    const wasAt = $('scroll').scrollTop;
    surfaceRows()[1].click();
    await wait(SETTLE);

    t.ok('drilling in shows the surface', !!$('drill-title').textContent);
    t.ok('and hides the root', document.querySelector('main').hidden);
    t.ok('the surface opens at its top', $('drill-scroll').scrollTop === 0);
    t.ok('groups inside show their own counts',
      document.querySelectorAll('#drill-body .group-count').length > 0);

    // --- a switch inside, and the count that follows it ---
    const countBefore = document.querySelector('#drill-body .group-count').textContent;
    const row = document.querySelector('#drill-body .list-row[role="button"]');
    row.click();
    await wait(SETTLE);
    t.ok('toggling a row moves its group count',
      document.querySelector('#drill-body .group-count').textContent !== countBefore,
      countBefore);

    // --- keyboard reaches the same things ---
    const before = document.querySelector('#drill-body .list-row[role="button"]')
      .getAttribute('aria-pressed');
    key(document.querySelector('#drill-body .list-row[role="button"]'), ' ');
    await wait(SETTLE);
    t.ok('space toggles a row',
      document.querySelector('#drill-body .list-row[role="button"]')
        .getAttribute('aria-pressed') !== before);

    // --- back returns you where you were ---
    $('back').click();
    await wait(SETTLE);
    t.ok('back returns to the root list', !document.querySelector('main').hidden);
    t.ok('and to where the list was scrolled', $('scroll').scrollTop === wasAt,
      $('scroll').scrollTop + ' vs ' + wasAt);

    // --- search ---
    // The query is taken from a surface's own name rather than written in, so
    // this runs under ?lang=ar as well — which is where the RTL bugs are.
    const search = $('search');
    const wanted = surfaceRows()[3].querySelector('.row-label').textContent.trim();
    search.value = wanted;
    search.dispatchEvent(new Event('input'));
    await wait(SETTLE);
    const first = document.querySelector('#search-results .list-row');
    t.ok('a surface whose name matches is offered first',
      first && first.textContent.includes(wanted), wanted + ' → ' + (first && first.textContent));
    t.ok('the surface list steps aside while searching', $('surface-list').hidden);
    first.click();
    await wait(SETTLE);
    t.ok('and it takes you there', $('drill-title').textContent.includes(wanted),
      wanted + ' → ' + $('drill-title').textContent);

    $('back').click();
    await wait(SETTLE);
    t.ok('coming back clears the search', $('search').value === '');
    t.ok('and puts the surface list back', !$('surface-list').hidden);

    search.value = 'zzzznothing';
    search.dispatchEvent(new Event('input'));
    await wait(SETTLE);
    t.ok('a query with no matches says so', !$('no-hits').hidden);
    search.value = '';
    search.dispatchEvent(new Event('input'));
    await wait(SETTLE);

    // --- every surface, laid out ---
    // Nineteen of them, and the fault was in three. Opening one and calling it
    // covered is how it survived.
    // No waits in this loop, deliberately. Drilling in renders synchronously —
    // the title and the body are both there on the line after the click — and
    // a browser throttles timers in a hidden tab to about a second each, so
    // nineteen surfaces with two sleeps apiece cost roughly forty seconds and
    // ran the whole suite past the point where the runner gives up. The sleeps
    // were never buying anything here; they were only paying for themselves.
    const spills = [];
    const footerLeaks = [];
    const count = surfaceRows().length;
    for (let i = 0; i < count; i += 1) {
      surfaceRows()[i].click();
      const name = $('drill-title').textContent.trim();
      if (!$('root-footer').hidden) footerLeaks.push(name);
      const before = t.results.length;
      await noOverflow(t, $('drill-body'), name);
      if (!t.results[before].pass) spills.push(name);
      t.results.length = before;              // one verdict for the sweep, not 19
      const box = $('drill-scroll');
      if (box && box.scrollWidth > box.clientWidth + 1) spills.push(name + ' (sideways)');
      $('back').click();
    }
    t.ok('every surface lays out without overflowing', !spills.length,
      spills.slice(0, 4).join(', '));
    /* The root list's footer stayed behind when the drill opened over it, so
       "Your settings — Export, Import, Reset all" sat under all nineteen. */
    t.ok('the root footer stays on the root', !footerLeaks.length,
      footerLeaks.slice(0, 4).join(', '));

    // --- a pinned search has to work from wherever it is pinned ---
    surfaceRows()[2].click();
    $('search').value = 'comments';
    $('search').dispatchEvent(new Event('input'));
    await wait(SETTLE);
    t.ok('typing inside a surface steps back out to the results',
      $('drill').hidden && $('search-results').children.length > 0,
      'drill hidden: ' + $('drill').hidden + ', hits: ' + $('search-results').children.length);
    t.ok('and the footer is not under the results', $('root-footer').hidden);
    $('search').value = '';
    $('search').dispatchEvent(new Event('input'));
    await wait(SETTLE);
    t.ok('clearing it brings the footer back', !$('root-footer').hidden);

    // --- the popover is a fixed pane, not a growing document ---
    t.ok('the page itself never scrolls',
      document.documentElement.scrollHeight <= Math.max(innerHeight, 560) + 1);
    t.ok('the header stays put', document.querySelector('.hero').getBoundingClientRect().top < 60);
  }

  /* Text that does not fit its box.
   *
   * This is the check that was missing. A segmented control sized every button
   * to the same width regardless of its label, so "Show normally" was handed a
   * 60px box and drew its text 39px over its neighbour, while the row label was
   * squeezed to 19px and broke into four lines. The suite reported nineteen
   * passes through all of it, because every assertion it made was about the
   * DOM — which rows exist, what they are pressed to — and none about where any
   * of it landed. A control can be perfectly correct and completely unusable.
   *
   * `scrollWidth` beyond the layout box is the tell for both failures at once:
   * text overflowing a button, and text clipped to an ellipsis. Leaf elements
   * only, since a container legitimately holds more than it shows.
   */
  async function noOverflow(t, root, where) {
    const bad = [];
    root.querySelectorAll('*').forEach((el) => {
      if (el.children.length) return;
      const box = el.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) return;
      const over = el.scrollWidth - Math.ceil(box.width);
      if (over > 1) bad.push(el.textContent.trim().slice(0, 24) + ' +' + over + 'px');
    });
    t.ok('nothing overflows its box in ' + where, !bad.length, bad.slice(0, 3).join(' | '));
  }

  /* The settings page this file used to also drive is gone: the popover draws
     every one of the 238 settings itself, so there is one surface to test. */

  async function run() {
    const t = reporter();
    const which = 'popup';

    /* An exception thrown inside an event listener does not reach the code that
       dispatched the event — the browser catches it, logs it, and carries on.
       So a page can be throwing on every keystroke while every assertion about
       the DOM still passes, which is exactly what happened: a render function
       that called itself recursively blew the stack on each search and the
       suite reported eighteen passes, because the rows were appended before the
       overflow and were still there once it unwound. Nothing here is trusted
       until the page has also gone the whole way without raising. */
    const raised = [];
    const note = (ev) => raised.push(String(
      (ev && ev.message) || (ev && ev.reason && ev.reason.message) || ev && ev.reason || ev));
    addEventListener('error', note);
    addEventListener('unhandledrejection', note);

    try {
      await popup(t);
    } catch (error) {
      t.ok('the suite ran to the end', false, String(error && error.message || error));
    }

    await wait(50);   // let anything thrown on the last interaction arrive
    removeEventListener('error', note);
    removeEventListener('unhandledrejection', note);
    t.ok('the page raised nothing along the way', raised.length === 0,
      raised.length + ': ' + [...new Set(raised)].slice(0, 3).join(' | '));
    const failed = t.results.filter((r) => !r.pass);
    return {
      surface: which,
      passed: t.results.length - failed.length,
      failed: failed.length,
      failures: failed.map((r) => r.name + (r.detail ? '  → ' + r.detail : ''))
    };
  }

  root.CostumUiTests = { run, popup };
})(typeof self !== 'undefined' ? self : this);
