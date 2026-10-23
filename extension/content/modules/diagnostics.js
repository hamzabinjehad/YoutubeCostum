/* Costum for YouTube — what is actually working, right now, on this browser.
 *
 * Safari gives an extension no devtools for its background context and fails
 * several things silently rather than loudly: a bridge blocked by the page's
 * CSP, an AudioContext that will not start without a gesture, a Picture in
 * Picture API that is spelled differently here than everywhere else. Each of
 * those looks identical from the outside — a feature that simply does nothing.
 *
 * This turns that into a report someone can read out. */
(function () {
  'use strict';
  const Costum = self.Costum;

  const yes = (v) => (v ? 'yes' : 'no');

  function browserName() {
    const ua = navigator.userAgent;
    const safari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
    const version = (ua.match(/Version\/(\d+\.\d+)/) || [])[1];
    if (safari) return 'Safari ' + (version || '?') + (/iPhone|iPad/.test(ua) ? ' (iOS)' : ' (macOS)');
    if (/CriOS|Chrome/.test(ua)) return 'Chrome-family';
    return 'unknown';
  }

  function pipKind(video) {
    if (video && typeof video.webkitSupportsPresentationMode === 'function') {
      return video.webkitSupportsPresentationMode('picture-in-picture')
        ? 'webkit presentation mode' : 'webkit, but unsupported for this video';
    }
    if (video && typeof video.requestPictureInPicture === 'function') return 'standard';
    return 'none';
  }

  function audioState() {
    const Ctor = self.AudioContext || self.webkitAudioContext;
    if (!Ctor) return 'no AudioContext in this browser';
    // Reading state without creating one of our own: the audio module holds the
    // only context, and making a second here would be its own bug.
    const live = self.CostumAudioContext;
    if (!live) return 'not started (nothing asked for it yet)';
    return live.state + (live.state === 'suspended' ? ' — needs a click before sound can be processed' : '');
  }

  async function report(ctx) {
    const s = ctx.settings();
    const lines = [];
    const bridge = ctx.bridge ? ctx.bridge() : { injected: 'unknown', ready: false };

    lines.push('COSTUM DIAGNOSTICS');
    lines.push(new Date().toLocaleString());
    lines.push(browserName());
    lines.push(location.href);
    lines.push('');

    lines.push('extension enabled: ' + yes(s.enabled));
    lines.push('modules loaded: ' + Costum.modules.map((m) => m.name).join(', '));
    lines.push('');

    lines.push('--- page bridge ---');
    lines.push('script injected: ' + bridge.injected);
    lines.push('bridge answered: ' + yes(bridge.ready));
    if (bridge.gaveUp) lines.push('gave up waiting: yes');
    if (bridge.injected === 'blocked' || (!bridge.ready && bridge.gaveUp)) {
      lines.push('=> forced quality, 60fps blocking, H.264 preference and');
      lines.push('   video summaries cannot work without it.');
    }

    const meta = await ctx.meta();
    if (meta.world) lines.push('bridge world: ' + meta.world
      + (meta.world === 'isolated' ? ' — it cannot see the page, so captions and quality will not work' : ''));
    lines.push('video id seen: ' + (meta.videoId || '(none)'));
    lines.push('caption tracks: ' + meta.captionTracks.length);
    lines.push('');

    lines.push('--- audio ---');
    lines.push('context: ' + audioState());
    lines.push('boost ' + s.audio.boost + '×, bass ' + s.audio.bass + ' dB, mono ' + yes(s.audio.monoDownmix));
    lines.push('');

    lines.push('--- video ---');
    const video = ctx.video();
    lines.push('video element found: ' + yes(video));
    lines.push('picture in picture: ' + pipKind(video));
    lines.push('clipboard images: ' + yes(self.ClipboardItem && navigator.clipboard && navigator.clipboard.write));
    lines.push('');

    lines.push('--- storage and background ---');
    try {
      const round = await ctx.ask('settings.get');
      lines.push('settings read back: ' + yes(round && typeof round.enabled === 'boolean'));
    } catch (e) {
      lines.push('settings read back: FAILED — ' + e);
    }
    lines.push('native app messaging: ' + yes(self.browser && self.browser.runtime && self.browser.runtime.sendNativeMessage));

    try {
      const log = await ctx.ask('log.get');
      const errors = (log || []).filter((entry) => entry.level === 'error').slice(-6);
      lines.push('background errors: ' + (errors.length || 'none'));
      errors.forEach((entry) => lines.push('  ' + entry.where + ': ' + entry.detail.slice(0, 140)));
    } catch (e) {
      lines.push('background log: unreachable — ' + e);
    }

    lines.push('');
    lines.push('--- switches on this page ---');
    const health = self.CostumHealth;
    if (!health || health.path !== location.pathname) lines.push('not checked yet (a few seconds after the page loads)');
    else if (!health.dead.length) lines.push('every switch that is on is finding its target');
    else lines.push('on but finding nothing (YouTube may have renamed it): ' + health.dead.join(', '));

    const shorts = self.CostumShortsInternals;
    if (shorts && shorts.probe) {
      lines.push('');
      lines.push('--- shorts containment ---');
      lines.push(shorts.probe());
    }

    return lines.join('\n');
  }

  /* ---- switch health ----
     A switch that is on and whose target this page always has, but that
     matches nothing, means YouTube renamed something. Checked once the page
     has settled, and confirmed a second time before it is reported, so a
     slow page is not mistaken for a broken rule. The panel reads the result. */
  const HEALTH_DELAY = 5000;
  let healthTimer = 0;

  function publishHealth(path, dead) {
    self.CostumHealth = { path, dead, at: Date.now() };
    window.dispatchEvent(new CustomEvent('costum:health', { detail: self.CostumHealth }));
  }

  function checkHealth(ctx, path, attempt) {
    if (location.pathname !== path) return;
    const s = ctx.effective ? ctx.effective() : ctx.settings();
    if (!s.enabled) { publishHealth(path, []); return; }
    const C = self.CostumCss;
    const dead = C.deadSwitches(s, path, C.isMobileHost(location.hostname),
      (sel) => document.querySelectorAll(sel).length);
    if (dead.length && attempt === 0) {
      healthTimer = setTimeout(() => checkHealth(ctx, path, 1), HEALTH_DELAY);
      return;
    }
    publishHealth(path, dead);
  }

  function scheduleHealth(ctx) {
    clearTimeout(healthTimer);
    const path = location.pathname;
    healthTimer = setTimeout(() => checkHealth(ctx, path, 0), HEALTH_DELAY);
  }

  Costum.register({
    name: 'diagnostics',
    onNavigate: (ctx) => {
      // What was dead on the last page says nothing about this one.
      publishHealth(location.pathname, []);
      scheduleHealth(ctx);
    },
    apply: (s, ctx) => scheduleHealth(ctx),
    disable: () => { clearTimeout(healthTimer); publishHealth(location.pathname, []); },
    actions: {
      diagnose: async (ctx) => {
        if (!ctx.panel) return;
        ctx.panel.showSummary({ state: 'done', text: 'Checking…' });
        let text;
        try {
          text = await report(ctx);
        } catch (e) {
          text = 'Diagnostics failed: ' + e;
        }
        ctx.panel.showSummary({ state: 'done', text });
      }
    }
  });
})();
