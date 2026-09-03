(function () {
  'use strict';
  const Costum = self.Costum;

  /* YouTube prefixes the tab title with an unread count — "(3) Video — YouTube".
   * It is a notification badge in the one place you cannot turn notifications
   * off, and it follows you into every window that lists tabs. Minimal Theme
   * for Twitter (MIT) offers the same switch for the same reason. */

  const COUNT = /^\(\d+\)\s*/;

  // Pure, so the parsing can be tested without a document.
  function stripCount(title) {
    return String(title == null ? '' : title).replace(COUNT, '');
  }

  let watching = null;

  function start() {
    if (watching) return;
    const target = document.querySelector('title');
    if (!target) return;

    const fix = () => {
      const clean = stripCount(document.title);
      if (clean !== document.title) document.title = clean;
    };

    fix();
    // YouTube rewrites the title whenever the count changes, so this has to
    // watch rather than run once.
    watching = new MutationObserver(fix);
    watching.observe(target, { childList: true, characterData: true, subtree: true });
  }

  function stop() {
    if (!watching) return;
    watching.disconnect();
    watching = null;
  }

  Costum.register({
    name: 'tabTitle',
    apply(s) {
      if (s.declutter.titleCount) start();
      else stop();
    }
  });

  self.CostumTitleInternals = { stripCount };
})();
