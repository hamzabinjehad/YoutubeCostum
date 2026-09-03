(function () {
  'use strict';
  const Costum = self.Costum;

  function comboOf(ev) {
    const parts = [];
    if (ev.ctrlKey) parts.push('Ctrl');
    if (ev.altKey) parts.push('Alt');
    if (ev.shiftKey) parts.push('Shift');
    if (ev.metaKey) parts.push('Meta');
    parts.push(ev.code);
    return parts.join('+');
  }

  function typing(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable ||
      /* `ytd-searchbox` was retired — it is `yt-searchbox` now, and this guard
         was the last place still naming the old one. Both ship, since the
         cost of a stale name here is a shortcut firing while someone types. */
      (target.closest && !!target.closest('#search, yt-searchbox, #contenteditable-root'));
  }

  Costum.register({
    name: 'shortcuts',
    apply(s, ctx) {
      if (window.__costumKeys) return;
      window.__costumKeys = true;

      window.addEventListener('keydown', (ev) => {
        const settings = ctx.settings();
        if (!settings.enabled || typing(ev.target)) return;
        const combo = comboOf(ev);
        const entry = Object.entries(settings.shortcuts).find(([, value]) => value === combo);
        if (!entry) return;
        const action = ctx.action(entry[0]);
        if (!action) return;
        ev.preventDefault();
        ev.stopPropagation();
        action(ctx);
      }, true);
    }
  });
})();
