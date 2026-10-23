/* Runs at document_start. Creates the style holders before YouTube paints,
 * then fills them the moment settings resolve. */
(function () {
  'use strict';

  const api = self.browser || self.chrome;
  const { withDefaults, withChannel } = self.CostumDefaults;
  const { buildDeclutterCss, buildLayoutCss, buildModestyCss, pageName } = self.CostumCss;

  const sheets = {};

  function sheet(id) {
    if (sheets[id]) return sheets[id];
    const el = document.createElement('style');
    el.id = 'costum-' + id;
    (document.head || document.documentElement).appendChild(el);
    sheets[id] = el;
    return el;
  }

  /* Which page this is, for the mobile rules that cannot scope themselves
     (see pageName in css.js). Set before the first paint and again on every
     navigation, by the router. */
  function markPage() {
    document.documentElement.setAttribute('costum-page', pageName(location.pathname));
  }
  markPage();

  // Claim the slots now so ordering is stable once we have content.
  sheet('declutter');
  sheet('layout');
  sheet('modesty');
  sheet('effects');

  /* The channel being watched, once the router has found it. Painted here so
     a channel's clutter choices reach the stylesheet the same way global ones
     do; before it is known, the global preferences paint. */
  self.CostumChannel = self.CostumChannel || { id: '', name: '', videoId: '' };

  function paint(stored) {
    const settings = withChannel(stored, self.CostumChannel.id);
    if (!settings.enabled) {
      sheet('declutter').textContent = '';
      sheet('layout').textContent = '';
      sheet('modesty').textContent = '';
      sheet('effects').textContent = '';
      ['costum-cinema', 'costum-zen', 'costum-mini', 'costum-native'].forEach((name) => document.documentElement.removeAttribute(name));
      return;
    }
    sheet('effects').textContent = '[costum-blocked], [costum-shorts], [costum-row-clipped], [costum-related-clipped] { display: none !important; }';
    sheet('declutter').textContent = buildDeclutterCss(settings);
    sheet('layout').textContent = buildLayoutCss(settings);
    sheet('modesty').textContent = buildModestyCss(settings);
    document.documentElement.toggleAttribute('costum-cinema', !!settings.layout.cinema);
    // Zen only means anything on a watch page; elsewhere the attribute would
    // hide the header of a page that has no player to replace it with.
    document.documentElement.toggleAttribute(
      'costum-zen', !!settings.layout.zen && location.pathname.startsWith('/watch'));
  }

  self.CostumBoot = { paint, sheet, markPage };

  // The bridge patches ytInitialPlayerResponse and MediaSource.isTypeSupported.
  // Injected any later than this, the player has already read both.
  /* Safari applies the host page's Content-Security-Policy to scripts an
     extension injects, where Chrome exempts them. YouTube's CSP is strict, so
     this is a plausible way for the bridge to die silently on Safari only —
     and everything behind it (forced quality, codec choice, captions) dies
     with it. Record what happened so diagnostics can say so out loud instead
     of leaving three features mysteriously inert. */
  self.CostumBridge = { injected: 'pending', ready: false };

  (function injectBridge() {
    const script = document.createElement('script');
    script.src = api.runtime.getURL('content/page/bridge.js');
    script.onload = () => { self.CostumBridge.injected = 'loaded'; script.remove(); };
    script.onerror = () => { self.CostumBridge.injected = 'blocked'; script.remove(); };
    (document.head || document.documentElement).appendChild(script);
  })();

  self.CostumReady = api.storage.local.get('settings')
    .then((bag) => {
      const settings = withDefaults(bag && bag.settings);
      self.CostumSettings = settings;
      paint(settings);
    })
    .catch(() => {
      self.CostumSettings = withDefaults(null);
    });

  api.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.settings) return;
    const settings = withDefaults(changes.settings.newValue);
    self.CostumSettings = settings;
    paint(settings);
    window.dispatchEvent(new CustomEvent('costum:settings', { detail: settings }));
  });
})();

/* Module registry. Declared at document_start so every module file that
 * loads later has somewhere to register, whatever order they arrive in. */
(function () {
  'use strict';
  self.Costum = self.Costum || {
    modules: [],
    register(mod) { this.modules.push(mod); return mod; }
  };
})();
