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

    /* The root is deliberately short: a viewer gets a current mode, a handful
       of page actions, and one deliberate route to the full workspace. */
    const quickRows = () => [...document.querySelectorAll('#quick .list-row')]
      .filter((row) => row.offsetParent !== null);
    t.ok('the Control Center opens instead of the settings directory',
      !$('control-center').hidden && $('customize-workspace').hidden);
    t.ok('it keeps page actions intentionally short',
      quickRows().length >= 1 && quickRows().length <= 5, quickRows().length);
    t.ok('it states the active mode before offering a mode change',
      !!$('active-profile').getAttribute('aria-label'), $('active-profile').textContent);
    t.ok('and offers a visible route to Customize',
      !$('open-customize').hidden && $('open-customize').offsetParent !== null);

    /* Three reaches were being described by one word, "page". Each section
       now says how far it goes, and the everywhere rows say so in their own
       heading. */
    t.ok('each section says how far its switches reach',
      ['scope-mode', 'scope-speed', 'scope-page'].every((id) => $(id).textContent.trim().length > 0),
      ['scope-mode', 'scope-speed', 'scope-page'].map((id) => $(id).textContent).join(' | '));
    t.ok('the site-wide distraction controls are on the front',
      document.querySelectorAll('#quick-all .list-row').length >= 2
      && document.querySelectorAll('#quick-playback .list-row').length >= 1);
    /* The picker is one exclusive choice and says so. */
    t.ok('the mode picker is a radio group',
      $('mode-picker').getAttribute('role') === 'radiogroup');

    /* The Active mode row opens the picker in place: a mode is two taps from
       the front and no navigation. */
    $('active-profile').click();
    await wait(SETTLE);
    t.ok('the active mode row opens a picker in place',
      $('active-profile').getAttribute('aria-expanded') === 'true' && !$('mode-picker').hidden
      && document.querySelectorAll('#mode-picker [role="radio"]').length >= 4);
    const pickStudy = () => document.querySelector('[data-control-id="pick:study"]');
    pickStudy().focus();
    pickStudy().click();
    await wait(SETTLE);
    t.ok('applying from the picker updates the row above it',
      /Study|دراسة/.test($('active-profile').textContent) && document.activeElement === pickStudy()
      && pickStudy().getAttribute('aria-checked') === 'true',
      $('active-profile').textContent);
    /* A slider says its value in words, and the popup's number matches the
       spec's: "1.5×" in the presets, the readout and the summary alike. */
    pickStudy().click();
    await wait(SETTLE);
    $('active-profile').click();
    await wait(SETTLE);
    t.ok('and it folds away again', $('mode-picker').hidden);

    const speedChoice = () => document.querySelector('[data-control-id="speed:1.5"]');
    speedChoice().focus();
    speedChoice().click();
    await wait(SETTLE);
    t.ok('a speed change retains focus and exposes its new state',
      document.activeElement === speedChoice() && speedChoice().getAttribute('aria-pressed') === 'true');
    document.querySelector('[data-control-id="speed:1"]').click();
    await wait(SETTLE);
    quickRows()[0].focus();
    key(quickRows()[0], 'Enter');
    await wait(SETTLE);
    t.ok('a keyboard quick toggle retains focus and exposes its new state',
      document.activeElement === quickRows()[0] && quickRows()[0].getAttribute('aria-pressed') === 'true');
    key(quickRows()[0], 'Enter');
    await wait(SETTLE);

    /* Customize opens at its top. It inherited the Control Center's scroll
       position for a while, which put the way back above the fold. */
    $('scroll').scrollTop = 300;
    $('open-customize').click();
    await wait(SETTLE);
    t.ok('Customize opens at its top, wherever the Control Center was scrolled',
      $('scroll').scrollTop === 0, $('scroll').scrollTop + 'px');
    t.ok('and sorts the catalogue by reach',
      document.querySelectorAll('#surface-list > .label').length === 3,
      document.querySelectorAll('#surface-list > .label').length + ' groups');

    /* Search is the fast path to 238 settings, but it belongs to the advanced
       workspace rather than competing with page controls on first open. */
    const focusable = () => [...document.querySelectorAll(
      'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])')]
      .filter((e) => e.offsetParent !== null);
    t.ok('Customize reveals search without scrolling',
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

    /* Read aloud, a surface row was "Player1 / 10" — two numbers with no word
       saying what they count. */
    t.ok('a surface row says what its number means',
      /\d+ (of|من) \d+/.test(surfaceRows()[0].getAttribute('aria-label') || ''),
      surfaceRows()[0].getAttribute('aria-label'));
    t.ok('each profile says what it will do before you press it',
      [...document.querySelectorAll('#profiles .list-row, #profiles-rest .list-row')]
        .every((b) => (b.getAttribute('aria-label') || '').length > 20));
    /* A lone chip in the segmented control's pressed style had no sibling to be
       selected against, so it did not say whether the profile was on. A switch
       does. */
    t.ok('a profile is a switch you can read the state of',
      !!document.querySelector('#profiles .list-row[aria-pressed] .sw-track'));
    t.ok('there is a live region for the changes a person cannot see',
      $('announce') && $('announce').getAttribute('aria-live') === 'polite');

    t.ok('Customize lists every surface', surfaceRows().length >= 15, surfaceRows().length);
    t.ok('each surface row carries a count',
      surfaceRows().every((r) => r.querySelector('.row-count')));

    /* The counts say how many settings are on; until this there was no way to
       ask which, short of opening all nineteen surfaces and reading them.
       Asserted as an invariant rather than against a clean start: the suite
       shares storage with whatever ran before it, and "nothing changed yet"
       was a claim about the previous call, not about this code. */
    const changedSaysNothing = /nothing|لسه/i.test($('changed-count').textContent);
    $('changed').open = true;
    t.ok('the changed list agrees with its own heading',
      changedSaysNothing === (document.querySelectorAll('#changed-list .list-row').length === 0),
      $('changed-count').textContent + ' vs '
        + document.querySelectorAll('#changed-list .list-row').length + ' rows');

    /* The Watch page carries forty settings and ran to five and a third screens
       of scrolling. Folded it is six names on one screen; a group holding
       anything switched on opens by itself, so the fold never hides state. */
    surfaceRows().find((r) => /watch|المشاهدة/i.test(r.textContent)).click();
    await wait(SETTLE);
    const groups = () => [...$('drill-body').querySelectorAll('details.group')];
    t.ok('a deep surface arrives folded', groups().length >= 4,
      groups().length + ' groups');
    const view = $('drill-scroll').clientHeight || 486;
    t.ok('and fits without a long scroll',
      $('drill-body').scrollHeight / view < 1.6,
      ($('drill-body').scrollHeight / view).toFixed(1) + ' screens');
    t.ok('a group with nothing on stays shut',
      groups().filter((g) => g.open && /0 \//.test(g.textContent)).length === 0);
    t.ok('a surface with nothing changed offers no reset', $('drill-reset').hidden);
    groups()[0].open = true;
    await wait(120);
    $('drill-body').querySelector('.list-row[role="button"]').click();
    await wait(SETTLE);
    t.ok('and one holding something on opens by itself',
      groups()[0].open && !/0 \//.test(groups()[0].textContent),
      groups()[0].textContent.slice(0, 30));
    /* One way back for the whole surface, asked in place first. */
    t.ok('a changed surface offers a reset', !$('drill-reset').hidden);
    $('drill-reset').click();
    // Arabic counts one and two in words, so a digit is not the test.
    t.ok('which asks before it acts', !$('drill-reset-confirm').hidden && /\d|واحد|إعدادان/.test($('drill-reset-body').textContent),
      $('drill-reset-body').textContent);
    $('drill-reset-go').click();
    await wait(SETTLE);
    t.ok('and puts the surface back',
      $('drill-reset').hidden && $('drill-body').querySelector('.list-row[role="button"]').getAttribute('aria-pressed') === 'false'
      && $('announce').textContent.length > 0, $('announce').textContent);
    $('back').click();
    await wait(SETTLE);

    // --- the biggest write this surface makes, said out loud ---
    $('more-profiles').open = true;
    const profileChip = () => document.querySelectorAll('#profiles-rest .list-row')[0];
    profileChip().focus();
    profileChip().click();
    await wait(SETTLE);
    t.ok('a profile change keeps focus on the chosen profile', document.activeElement === profileChip());
    t.ok('applying a profile announces itself', /\d/.test($('announce').textContent),
      $('announce').textContent);
    profileChip().click();
    await wait(SETTLE);
    t.ok('and so does taking it back', $('announce').textContent.length > 0,
      $('announce').textContent);

    // a profile is the fastest way to change several things at once
    profileChip().click();
    await wait(SETTLE);
    t.ok('and what changed is listed, not just counted',
      /\d/.test($('changed-count').textContent), $('changed-count').textContent);
    $('changed').open = true;
    t.ok('each row names the setting and where it lives',
      document.querySelectorAll('#changed-list .list-row').length > 0,
      document.querySelectorAll('#changed-list .list-row').length + ' rows');
    profileChip().click();
    await wait(SETTLE);

    /* The explanation the spec wrote for a setting draws under its name. The
       second string of every label was being thrown away, so "Prefer H.264
       over VP9/AV1" had to be guessed at. Player carries the most of them. */
    surfaceRows()[0].click();
    await wait(SETTLE);
    $('drill-body').querySelectorAll('details.group').forEach((g) => { g.open = true; });
    t.ok('settings carry their explanations',
      $('drill-body').querySelectorAll('.list-row .row-label small, .stack-row .row-note').length >= 5,
      $('drill-body').querySelectorAll('.list-row .row-label small, .stack-row .row-note').length + ' explained');
    /* A slider's readout is its way back once the value has moved. */
    const range = $('drill-body').querySelector('input[type="range"]');
    const readout = () => $('drill-body').querySelector('[data-control-id="reset:' + range.getAttribute('data-control-id').slice(6) + '"]');
    t.ok('an untouched slider has nothing to reset', readout().disabled && !readout().hasAttribute('data-modified')
      && readout().getAttribute('aria-hidden') === 'true');
    t.ok('a slider speaks its formatted value', /×|%|dB|s$|±|off|مطفي/.test(range.getAttribute('aria-valuetext') || ''),
      range.getAttribute('aria-valuetext'));
    range.value = range.max;
    range.dispatchEvent(new Event('change'));
    await wait(SETTLE);
    t.ok('a moved slider offers its default back', !readout().disabled && readout().hasAttribute('data-modified'));
    readout().click();
    await wait(SETTLE);
    t.ok('and one press returns it', readout().disabled, readout().textContent);
    $('back').click();
    await wait(SETTLE);

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
    t.ok('back returns to Customize', !$('customize-workspace').hidden && $('control-center').hidden);
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
    t.ok('and the results say how many there are',
      !$('label-results').hidden && /\d|واحدة|نتيجتان/.test($('label-results').textContent), $('label-results').textContent);
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
      if (!$('root-footer').hidden) footerLeaks.push(name + ' (footer)');
      if (!$('search-bar').hidden) footerLeaks.push(name + ' (search)');
      /* Groups fold now, and a folded group renders nothing — which would have
         quietly narrowed this sweep to whatever happened to be open. Everything
         is opened before measuring, so the check still sees all 238 rows. */
      $('drill-body').querySelectorAll('details.group').forEach((g) => { g.open = true; });
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
    t.ok('the root list keeps its own furniture', !footerLeaks.length,
      footerLeaks.slice(0, 4).join(', '));

    // --- search belongs to the root, and to nowhere else ---
    surfaceRows()[2].click();
    await wait(SETTLE);
    t.ok('search is not offered inside a surface', $('search-bar').hidden);
    $('back').click();
    await wait(SETTLE);
    t.ok('and comes back with the list', !$('search-bar').hidden);

    $('search').value = 'comments';
    $('search').dispatchEvent(new Event('input'));
    await wait(SETTLE);
    t.ok('the footer is not under a set of results', $('root-footer').hidden);
    /* A hit under the Comments heading is found by the heading's name, and
       says which group it came from. */
    t.ok('a result names its surface and its group',
      [...document.querySelectorAll('#search-results .result-where')].some((w) => / · /.test(w.textContent)),
      [...document.querySelectorAll('#search-results .result-where')].slice(0, 2).map((w) => w.textContent).join(' | '));
    $('search').value = '';
    $('search').dispatchEvent(new Event('input'));
    await wait(SETTLE);
    t.ok('clearing it brings the footer back', !$('root-footer').hidden);

    /* --- modes of your own ---
       Save what is set now, see what applying it would change, rename it,
       and delete it — all from the same list the built-in modes live in. */
    document.querySelector('[data-control-id="speed:1.25"]') && $('customize-back').click();
    await wait(SETTLE);
    document.querySelector('[data-control-id="speed:1.25"]').click();
    await wait(SETTLE);
    $('open-customize').click();
    await wait(SETTLE);
    $('mode-save').click();
    $('mode-name').value = 'Lectures';
    $('mode-go').click();
    await wait(SETTLE);
    const modeRow = () => document.querySelector('[data-control-id^="mode:"]');
    t.ok('saving a mode lists it as active', !!modeRow() && modeRow().getAttribute('aria-pressed') === 'true',
      modeRow() && modeRow().outerHTML.slice(0, 120));
    t.ok('the active mode line names it', $('active-profile').textContent.includes('Lectures'));
    document.querySelector('[data-control-id="speed:1"]') && ($('customize-back').click(), await wait(SETTLE),
      document.querySelector('[data-control-id="speed:1"]').click(), await wait(SETTLE), $('open-customize').click(), await wait(SETTLE));
    t.ok('changing a setting says what the mode would put back',
      modeRow().getAttribute('aria-pressed') === 'false' && /1 setting|إعداد/.test(modeRow().textContent), modeRow().textContent);
    document.querySelector('[data-control-id^="mode-tools:"]').click();
    await wait(SETTLE);
    t.ok('the tools open a preview of the change', !!document.querySelector('.mode-preview li'));
    const rename = document.querySelector('[data-control-id^="mode-rename:"]');
    rename.value = 'Talks';
    document.querySelector('[data-control-id^="mode-rename-go:"]').click();
    await wait(SETTLE);
    t.ok('renaming keeps the row and changes its name', modeRow().textContent.includes('Talks'), modeRow().textContent);
    modeRow().click();
    await wait(SETTLE);
    t.ok('applying puts the saved speed back', (await self.CostumStore.read()).playback.defaultSpeed === 1.25);
    // The tools stay open across the re-render; open them only if they closed.
    if (!document.querySelector('[data-control-id^="mode-delete:"]')) {
      document.querySelector('[data-control-id^="mode-tools:"]').click();
      await wait(SETTLE);
    }
    document.querySelector('[data-control-id^="mode-delete:"]').click();
    await wait(SETTLE);
    t.ok('deleting removes the mode and keeps the settings',
      !modeRow() && (await self.CostumStore.read()).playback.defaultSpeed === 1.25 && (await self.CostumStore.read()).profile === 'default');
    // Leave the speed where the next section expects it.
    $('customize-back').click();
    await wait(SETTLE);
    document.querySelector('[data-control-id="speed:1"]').click();
    await wait(SETTLE);
    $('open-customize').click();
    await wait(SETTLE);

    /* --- the bookmark library ---
       Seeded through the same messages the panel sends, then searched, edited,
       opened at the right second, and deleted. */
    const bapi = self.browser || self.chrome;
    await bapi.runtime.sendMessage({ type: 'bookmarks.add', entry: { videoId: 'dQw4w9WgXcQ', at: 83, note: 'The good bit', title: 'A talk' } });
    await bapi.runtime.sendMessage({ type: 'bookmarks.add', entry: { videoId: 'aaaaaaaaaaa', at: 5, note: 'Chorus', title: 'A song' } });
    $('customize-back').click();
    await wait(SETTLE);
    $('open-customize').click();
    await wait(SETTLE);
    const bookmarkRows = () => [...document.querySelectorAll('#bookmarks-list .bookmark-row')];
    t.ok('the library lists saved bookmarks with their time', bookmarkRows().length === 2 && /1:23/.test(bookmarkRows()[1].textContent) || bookmarkRows().some((r) => /1:23/.test(r.textContent)),
      bookmarkRows().map((r) => r.textContent).join(' | '));
    t.ok('and says how many, and that they stay in this browser', /2 of 500|2 من 500/.test($('bookmarks-count').textContent), $('bookmarks-count').textContent);
    $('bookmark-search').value = 'chorus';
    $('bookmark-search').dispatchEvent(new Event('input'));
    await wait(100);
    t.ok('search narrows the list', bookmarkRows().length === 1 && /Chorus/.test(bookmarkRows()[0].textContent));
    $('bookmark-search').value = '';
    $('bookmark-search').dispatchEvent(new Event('input'));
    await wait(100);
    document.querySelector('[data-control-id^="bookmark-open:"]').click();
    t.ok('opening goes to the video at the saved second',
      /youtube\.com\/watch\?v=[\w-]+&t=\d+s$/.test(bapi.tabs.created[0] || ''), bapi.tabs.created[0]);
    const editKey = document.querySelector('[data-control-id^="bookmark-edit:"]').getAttribute('data-control-id').split(':')[1];
    document.querySelector('[data-control-id="bookmark-edit:' + editKey + '"]').click();
    await wait(100);
    document.querySelector('[data-control-id="bookmark-note:' + editKey + '"]').value = 'Rewritten';
    document.querySelector('[data-control-id="bookmark-note-save:' + editKey + '"]').click();
    await wait(SETTLE);
    t.ok('a note can be edited in place', bookmarkRows().some((r) => /Rewritten/.test(r.textContent)));
    document.querySelector('[data-control-id="bookmark-delete:' + editKey + '"]').click();
    await wait(SETTLE);
    t.ok('deleting removes the row', bookmarkRows().length === 1 && !bookmarkRows().some((r) => /Rewritten/.test(r.textContent)));
    $('bookmarks-clear').click();
    $('bookmarks-clear-go').click();
    await wait(SETTLE);
    t.ok('delete all asks first, then empties the library', bookmarkRows().length === 0 && !$('bookmarks-empty').hidden);

    /* --- saved summaries (seeded with ?summaries=1) --- */
    if (new URLSearchParams(location.search).get('summaries')) {
      const rows = () => [...document.querySelectorAll('#summaries-list .list-row')];
      t.ok('saved summaries are listed with their detail level', rows().length === 2 && /brief|موجز/.test(rows()[0].textContent), rows().length);
      const key = document.querySelector('[data-control-id^="summary-delete:"]').getAttribute('data-control-id').split(':')[1];
      document.querySelector('[data-control-id="summary-delete:' + key + '"]').click();
      await wait(SETTLE);
      t.ok('one summary can be deleted on its own', rows().length === 1);
    }

    /* --- where the settings live, and the way back ---
       The footer says truthfully which storage holds the settings, previews an
       import before it lands, and keeps what a reset or import displaced. */
    const browser = new URLSearchParams(location.search).get('browser');
    const status = $('sync-status').textContent;
    t.ok('the footer says where settings are stored',
      browser === 'chrome' ? /browser|المتصفح/.test(status) : /iCloud/.test(status), status);
    t.ok('a manual sync is offered only where sync exists',
      $('sync-now').hidden === (browser === 'chrome'));

    const untouched = JSON.stringify(await self.CostumStore.read());
    const preview = self.CostumPopupInternals.previewImport({ nonsense: true });
    t.ok('a file that is not a settings export is refused', preview.ok === false && !!preview.message);
    const good = self.CostumPopupInternals.previewImport({
      format: 'costum-settings', version: 1, settings: { audio: { boost: 4 }, future: 1 } });
    // A file is whole: a seeded ?lang=ar is a change the file would undo too.
    t.ok('a preview names what would change',
      good.ok && good.changes.filter((p) => p !== 'locale').join() === 'audio.boost' && good.unknown.join() === 'future',
      JSON.stringify(good.changes));
    t.ok('previewing changes nothing', JSON.stringify(await self.CostumStore.read()) === untouched);

    $('reset').click();
    $('reset-go').click();
    await wait(SETTLE);
    const restoreRows = () => [...document.querySelectorAll('#restore-list .list-row')];
    t.ok('a reset keeps a way back', !$('restore-box').hidden && restoreRows().length === 1,
      restoreRows().length);
    $('customize-back').click();
    await wait(SETTLE);
    document.querySelector('[data-control-id="speed:1.5"]').click();
    await wait(SETTLE);
    $('open-customize').click();
    await wait(SETTLE);
    restoreRows()[0].click();
    await wait(SETTLE);
    t.ok('restoring puts the previous settings back',
      (await self.CostumStore.read()).playback.defaultSpeed === 1);
    t.ok('and restoring is itself undoable', restoreRows().length === 1);

    $('customize-back').click();
    await wait(SETTLE);
    t.ok('leaving Customize returns to the Control Center',
      !$('control-center').hidden && $('customize-workspace').hidden);

    // --- the popover is a fixed pane, not a growing document ---
    t.ok('the page itself never scrolls',
      document.documentElement.scrollHeight <= Math.max(innerHeight, 560) + 1);
    t.ok('the header stays put', document.querySelector('.hero').getBoundingClientRect().top < 60);

    /* One typeface, everywhere. Form controls do not inherit font-family, so a
       control is one moved selector away from the browser's own UI font — the
       search field spent a session in Arial next to a popover set in the system
       face, because `#surfaces .search input` stopped matching when the field
       moved into the header. */
    const families = new Set();
    document.querySelectorAll('*').forEach((el) => {
      if (el.offsetParent === null) return;
      families.add(getComputedStyle(el).fontFamily.split(',')[0].trim().replace(/"/g, ''));
    });
    t.ok('everything is set in one typeface', families.size === 1,
      [...families].join(' | '));

    /* SF is tracked by size. Every step was at the browser's `normal`, which is
       a different thing from the system's spacing at that size. */
    const tracked = (sel) => getComputedStyle(document.querySelector(sel)).letterSpacing;
    /* "2×" has no letter in it, so under dir=rtl the bidi algorithm drew it
       as "×2". Each segment sets its own direction. */
    t.ok('numerals keep their order in either direction',
      getComputedStyle(document.querySelector('#speeds button')).unicodeBidi === 'plaintext',
      getComputedStyle(document.querySelector('#speeds button')).unicodeBidi);
    t.ok('small text is opened up and large text is tightened',
      tracked('.label') !== 'normal' && parseFloat(tracked('.label')) > 0
      && parseFloat(tracked('.hero-text b')) < 0,
      'caption ' + tracked('.label') + ', title ' + tracked('.hero-text b'));

    /* The popup once opened showing its header and search field and nothing
       else: a media query meant for phones fired at the popover's own 340px
       width, `height: 100vh` went circular against a window that takes its
       height from the document, and the scroll region collapsed to nothing.
       Thirty-seven assertions passed through it, because every one of them
       asked the DOM what existed and none asked whether it had any room. */
    const box = $('scroll').getBoundingClientRect();
    t.ok('the scrolling region has real height', box.height > 200,
      Math.round(box.height) + 'px');
    t.ok('and the list below the header is actually on screen',
      [...document.querySelectorAll('#quick .list-row')]
        .filter((r) => r.getBoundingClientRect().bottom <= innerHeight).length >= 3,
      [...document.querySelectorAll('#quick .list-row')]
        .filter((r) => r.getBoundingClientRect().bottom <= innerHeight).length + ' rows in view');
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

  /* The state line used to say "On for this page" from two facts — the switch
     and the tab's host — neither of which is evidence the content script is
     running. On a site Safari has not allowed, every switch in this popover is
     inert and the line said everything was fine. The harness plays that site
     with ?dead=1; this is what the popover has to say there. */
  async function dead(t) {
    const $ = (id) => document.getElementById(id);
    const chrome = new URLSearchParams(location.search).get('browser') === 'chrome';
    await wait(1600);   // the ping gives the page a second to answer
    t.ok('a site that does not answer is not called "on"',
      !/on for this page|شغّال على/i.test($('state').textContent), $('state').textContent);
    t.ok('and the reason is in the strip under the header',
      $('announce').textContent.length > 40 && $('announce').getBoundingClientRect().top < 300,
      Math.round($('announce').getBoundingClientRect().top) + 'px');
    t.ok('and says what to do about it',
      chrome
        ? /extensions menu|قائمة الإضافات/i.test($('announce').textContent)
        : /address bar|شريط العنوان/i.test($('announce').textContent));
    t.ok('page controls cannot imply an applied change without permission',
      [...document.querySelectorAll('#quick .list-row')]
        .every((row) => row.getAttribute('aria-disabled') === 'true'));
    t.ok('speed choices are disabled without permission',
      [...document.querySelectorAll('#speeds button')].every((button) => button.disabled));
  }

  async function run() {
    const t = reporter();
    const which = new URLSearchParams(location.search).get('dead') ? 'dead' : 'popup';

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
      await (which === 'dead' ? dead(t) : popup(t));
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

  root.CostumUiTests = { run, popup, dead };
})(typeof self !== 'undefined' ? self : this);
