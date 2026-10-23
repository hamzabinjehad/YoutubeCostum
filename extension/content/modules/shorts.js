(function () {
  'use strict';
  const Costum = self.Costum;

  /* Hiding Shorts by tag name is a losing game: YouTube renames its custom
   * elements often, and the mobile and desktop apps use different ones. So the
   * CSS in common/css.js covers the tags we know for the no-flash fast path,
   * and this module covers everything else structurally — anything that links
   * to /shorts/ gets its surrounding card hidden, whatever that card is called
   * this month. */

  // Never hide these: they are the page, not an item in it.
  const NEVER = new Set([
    'ytd-app', 'ytm-app', 'ytd-page-manager', 'ytd-browse', 'ytm-browse',
    'ytd-two-column-browse-results-renderer', 'ytd-rich-grid-renderer',
    'ytd-section-list-renderer', 'ytd-item-section-renderer',
    'ytd-guide-renderer', 'ytd-mini-guide-renderer', 'ytd-watch-flexy',
    // mobile equivalents — leaving these out once blanked the whole search page
    'ytm-section-list-renderer', 'ytm-item-section-renderer', 'ytm-search',
    'ytm-single-column-browse-results-renderer', 'ytm-rich-grid-renderer',
    'ytm-two-column-browse-results-renderer', 'ytm-watch', 'ytm-pivot-bar-renderer',
    'body', 'html'
  ]);

  const IS_ITEM = /-(renderer|view-model|lockup[a-z-]*)$/;

  /* An allow-list of container tags can never be complete — YouTube ships new
   * ones. So the real guard is behavioural: a card that also contains ordinary
   * /watch links is not a card, it is a list, and hiding it would take the page
   * with it. Climb only as long as that stays false. */
  function holdsOtherVideos(el) {
    return !!el.querySelector('a[href*="/watch"]');
  }

  function cardFor(link) {
    let node = link.parentElement;
    let best = null;
    for (let depth = 0; node && depth < 8; depth++, node = node.parentElement) {
      const tag = node.tagName ? node.tagName.toLowerCase() : '';
      if (!tag.includes('-')) continue;
      if (NEVER.has(tag)) break;
      if (holdsOtherVideos(node)) break;
      if (IS_ITEM.test(tag)) best = node;   // keep climbing; take the outermost
    }
    // Nav entries — the sidebar row, the mobile bottom bar — are often a bare
    // anchor with no card around it. Hiding the link itself is enough there,
    // and is never wrong: the worst case is one dead link disappearing.
    return best || link;
  }

  function sweep(root) {
    const selector = 'a[href*="/shorts"], a[href$="/shorts"]';
    const links = [];
    if (root.querySelectorAll) links.push(...root.querySelectorAll(selector));
    if (root.matches && root.matches(selector)) links.push(root);

    links.forEach((link) => {
      const card = cardFor(link);
      if (!card || card.hasAttribute('costum-shorts')) return;
      card.setAttribute('costum-shorts', '');

    });
  }

  /* The way into Shorts is not always a link. YouTube's mobile bottom bar and
   * the desktop sidebar both use labelled buttons, so the second sweep goes by
   * accessible name — scoped to navigation containers, so a video that happens
   * to be titled "Shorts" is never touched. */
  const NAV_SCOPES = [
    'ytm-pivot-bar-renderer',
    '[role="tablist"]',
    'tp-yt-app-drawer',
    'ytd-mini-guide-renderer',
    '#guide',
    'nav',
    'header'
  ].join(',');

  const SHORTS_NAMES = ['shorts', 'شورتس', 'فيديوهات قصيرة'];

  function isShortsLabel(el) {
    const label = (el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().toLowerCase();
    if (label && SHORTS_NAMES.includes(label)) return true;
    const text = (el.textContent || '').trim().toLowerCase();
    return text.length < 24 && SHORTS_NAMES.includes(text);
  }

  function navItemFor(el, scope) {
    let node = el;
    let best = el;
    for (let depth = 0; node && node !== scope && depth < 6; depth++, node = node.parentElement) {
      if (node.getAttribute && (node.getAttribute('role') === 'tab' || node.getAttribute('role') === 'menuitem')) return node;
      const tag = node.tagName ? node.tagName.toLowerCase() : '';
      if (IS_ITEM.test(tag) && !NEVER.has(tag)) best = node;
    }
    return best;
  }

  function sweepNav(root) {
    const scopes = [];
    if (root.querySelectorAll) scopes.push(...root.querySelectorAll(NAV_SCOPES));
    if (root.matches && root.matches(NAV_SCOPES)) scopes.push(root);

    scopes.forEach((scope) => {
      scope.querySelectorAll('a, button, [role="tab"], [aria-label]').forEach((candidate) => {
        if (!isShortsLabel(candidate)) return;
        const item = navItemFor(candidate, scope);
        if (!item || item === scope || item.hasAttribute('costum-shorts')) return;
        if (holdsOtherVideos(item)) return;   // same guard: never hide a list
        item.setAttribute('costum-shorts', '');

      });
    });
  }

  /* The bottom bar is built once and never mutates again, so it has to be
     re-checked whenever anything else on the page changes. YouTube changes
     constantly, and re-scanning every navigation container on every batch was
     the most expensive thing this extension did on a phone: a document-wide
     querySelectorAll per scope, then the accessible name of every control in
     it. Coalescing to twice a second is still far faster than anyone can reach
     the bar, and it keeps the trailing edge — the run always happens, it is
     just not repeated. */
  let navTimer = null;
  let navRan = 0;

  function sweepNavSoon() {
    if (navTimer) return;
    navTimer = setTimeout(() => {
      navTimer = null;
      navRan = Date.now();
      sweepNav(document);
    }, Math.max(0, 500 - (Date.now() - navRan)));
  }

  function restore() {
    document.querySelectorAll('[costum-shorts]').forEach((el) => {
      el.removeAttribute('costum-shorts');

    });
  }

  /* The Shorts player itself. Hiding shelves does nothing if tapping through to
   * /shorts/ still plays — which is the whole point of turning Shorts off. */
  function interceptPlayer(mode) {
    // Covers both a single Short (/shorts/<id>) and the Shorts feed (/shorts).
    if (!location.pathname.startsWith('/shorts')) return false;
    const id = location.pathname.split('/')[2];

    if (mode === 'asVideo' && id) {
      location.replace('https://www.youtube.com/watch?v=' + id.split('?')[0]);
      return true;
    }
    if (mode === 'hide') {
      // Go back where they came from if we can; otherwise out to the feed.
      if (history.length > 1) history.back();
      else location.replace('https://www.youtube.com/');
      return true;
    }
    return false;
  }

  /* Safari gives an extension almost no way to inspect a page it is running
   * inside, which is how selector rot goes unnoticed. This reports what the
   * page actually looks like from in here, so a broken rule can be fixed from
   * evidence instead of guesswork. */
  function probe() {
    const lines = [];
    lines.push(location.href);
    lines.push('app: ' + (document.querySelector('ytd-app') ? 'ytd' : '')
      + (document.querySelector('ytm-app') ? 'ytm' : '') || 'unknown');

    const anchors = document.querySelectorAll('a[href*="shorts"]');
    lines.push('');
    lines.push('anchors matching shorts: ' + anchors.length);

    const named = [...document.querySelectorAll('*')].filter((el) => {
      if (el.children.length) return false;
      const text = (el.textContent || '').trim();
      return text === 'Shorts' || text === 'شورتس';
    });

    lines.push('leaf elements labelled Shorts: ' + named.length);

    named.slice(0, 4).forEach((leaf, index) => {
      lines.push('');
      lines.push('--- #' + (index + 1) + ' ancestry ---');
      let node = leaf;
      for (let depth = 0; node && depth < 9; depth++, node = node.parentElement) {
        const tag = node.tagName ? node.tagName.toLowerCase() : '?';
        const attrs = [...(node.attributes || [])]
          .filter((a) => ['href', 'role', 'aria-label', 'id', 'tab-title', 'class'].includes(a.name))
          .map((a) => a.name + '=' + String(a.value).slice(0, 40))
          .join(' ');
        lines.push(depth + ': ' + tag + (attrs ? '  ' + attrs : ''));
      }
    });

    return lines.join('\n');
  }

  Costum.register({
    name: 'shorts',
    disable() { clearTimeout(navTimer); navTimer = null; restore(); },

    apply(s) {
      const mode = s.declutter.shorts;
      if (interceptPlayer(mode)) return;
      if (mode === 'hide') { sweep(document); sweepNav(document); }
      else { clearTimeout(navTimer); navTimer = null; restore(); }
    },

    onMutation(nodes, s) {
      if (s.declutter.shorts !== 'hide') return;
      nodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        sweep(node);
        sweepNav(node);
      });
      sweepNavSoon();
    },

    actions: {
      shortsProbe: (ctx) => ctx.panel.showSummary({ state: 'done', text: probe() })
    }
  });

  // Exposed so the containment rules can be tested without a browser.
  self.CostumShortsInternals = { cardFor, holdsOtherVideos, NEVER, IS_ITEM, probe };
})();
