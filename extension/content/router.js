/* Costum for YouTube — the orchestrator.
 * One MutationObserver for the whole extension: every module shares it rather
 * than opening its own, which is what keeps memory sane on iOS. */
(function () {
  'use strict';

  const api = self.browser || self.chrome;
  const Costum = self.Costum;

  /* ---- page bridge ------------------------------------------------------ */
  const pending = new Map();   // bridge.js is injected by boot.js at document_start
  let nextId = 1;

  const bridge = self.CostumBridge || { injected: 'unknown', ready: false };

  window.addEventListener('message', (ev) => {
    if (ev.source !== window || !ev.data || ev.data.__costum !== 'from-page') return;
    if (ev.data.ready) { bridge.ready = true; return; }
    const resolve = pending.get(ev.data.id);
    if (resolve) { pending.delete(ev.data.id); resolve(ev.data.result); }
  });

  /* Every call used to wait the full two seconds for a bridge that was never
     coming, and each caller paid it again. Once one call has timed out with no
     bridge ever announcing itself, later calls give up immediately — the
     difference between a degraded page and an unusable one. */
  function toPage(cmd, payload) {
    if (bridge.dead) return Promise.resolve(null);
    return new Promise((resolve) => {
      const id = nextId++;
      pending.set(id, resolve);
      window.postMessage({ __costum: 'to-page', cmd, payload, id }, '*');
      setTimeout(() => {
        if (!pending.delete(id)) return;
        if (!bridge.ready) bridge.dead = true;
        resolve(null);
      }, 2000);
    });
  }

  /* ---- context handed to every module ----------------------------------- */
  function clock(seconds) {
    const total = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return (h ? h + ':' + pad(m) : String(m)) + ':' + pad(s);
  }

  function ask(type, payload) {
    return api.runtime.sendMessage(Object.assign({ type }, payload)).then((reply) => {
      if (!reply) return null;
      if (!reply.ok) throw new Error(reply.error);
      return reply.result;
    });
  }

  const ctx = {
    settings: () => self.CostumSettings || self.CostumDefaults.withDefaults(null),
    video: () => document.querySelector('video.html5-main-video') || document.querySelector('#movie_player video'),
    isMusic: () => /music/i.test(document.querySelector('ytd-channel-name a, #owner #text')?.textContent || ''),
    /* Read straight off the URL rather than through the page bridge: the loop
       consults this on every timeupdate and cannot wait on a round trip. */
    videoId: () => new URLSearchParams(location.search).get('v') || '',
    toPage,
    /* Without the bridge there is no player response, so no caption tracks —
       but the video id is in the URL and the title is in the DOM. Returning
       those keeps sponsor skipping working on a page where summaries cannot,
       instead of failing both because one source is missing. */
    meta: () => toPage('meta').then((m) => (m && m.videoId) ? m : {
      videoId: ctx.videoId(),
      title: (document.querySelector('#title h1, h1.ytd-watch-metadata, h1.title')?.textContent
        || document.title.replace(/ - YouTube$/, '')).trim(),
      captionTracks: []
    }),
    bridge: () => ({ injected: bridge.injected, ready: !!bridge.ready, gaveUp: !!bridge.dead }),
    ask,
    patch: (patch) => ask('settings.set', { patch }),
    clock,
    toast: (message) => self.CostumPanel && self.CostumPanel.toast(message),
    action(name) {
      const owner = Costum.modules.find((m) => m.actions && m.actions[name]);
      // Always hand back something callable so a missing module cannot throw
      // from a button's click handler.
      return owner ? owner.actions[name] : () => {};
    },
    panel: null
  };

  Costum.ctx = ctx;

  /* ---- lifecycle -------------------------------------------------------- */
  function safely(mod, hook, args) {
    if (!mod[hook]) return;
    try {
      mod[hook].apply(mod, args);
    } catch (err) {
      // One broken module must never take the rest of the extension down.
      console.warn('[Costum] ' + mod.name + '.' + hook + ' failed:', err);
    }
  }

  function applyAll() {
    const s = ctx.settings();
    if (!s.enabled) return;
    Costum.modules.forEach((m) => safely(m, 'apply', [s, ctx]));
    const video = ctx.video();
    if (video) Costum.modules.forEach((m) => safely(m, 'onVideo', [video, s, ctx]));
  }

  let currentVideo = null;

  function checkVideo() {
    const video = ctx.video();
    if (!video || video === currentVideo) return;
    currentVideo = video;
    const s = ctx.settings();
    Costum.modules.forEach((m) => safely(m, 'onVideo', [video, s, ctx]));
  }

  // A single observer, batched through one animation frame.
  let queued = [];
  let scheduled = false;
  let lastHref = location.href;

  function onNavigate() {
    currentVideo = null;
    window.dispatchEvent(new CustomEvent('costum:navigate'));
    setTimeout(applyAll, 120);
  }

  /* yt-navigate-finish is a desktop-polymer event; YouTube's mobile web app
   * never fires it. Since every navigation mutates the DOM, the shared observer
   * is a reliable place to notice the URL changed — on both layouts. */
  function checkNavigation() {
    if (location.href === lastHref) return;
    lastHref = location.href;
    onNavigate();
  }

  function flush() {
    scheduled = false;
    const nodes = queued;
    queued = [];
    const s = ctx.settings();
    if (!s.enabled) return;
    checkNavigation();
    Costum.modules.forEach((m) => safely(m, 'onMutation', [nodes, s, ctx]));
    checkVideo();
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === 1) queued.push(node);
      }
    }
    if (queued.length && !scheduled) {
      scheduled = true;
      requestAnimationFrame(flush);
    }
  });

  function start() {
    self.CostumPanel && self.CostumPanel.init(ctx);
    ctx.panel = self.CostumPanel;

    applyAll();
    observer.observe(document.documentElement, { childList: true, subtree: true });

    document.addEventListener('yt-navigate-finish', () => {
      lastHref = location.href;
      onNavigate();
    }, true);

    // Back and forward do not always mutate enough to trip the observer.
    window.addEventListener('popstate', checkNavigation);

    window.addEventListener('costum:settings', applyAll);

    document.addEventListener('visibilitychange', () => {
      const s = ctx.settings();
      if (!s.playback.pauseBackgroundTabs) return;
      const video = ctx.video();
      if (video && document.hidden) video.pause();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
