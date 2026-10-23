/* Costum for YouTube — the orchestrator.
 * One MutationObserver for the whole extension: every module shares it rather
 * than opening its own, which is what keeps memory sane on iOS. */
(function () {
  'use strict';

  const api = self.browser || self.chrome;
  const Costum = self.Costum;

  /* ---- am I here? -------------------------------------------------------
   * The popover used to say "On for this page" from two facts: the master
   * switch, and the tab being on youtube.com. Neither is evidence this script
   * is running. Safari grants a site to an extension only when the person
   * allows it from the address bar, and until then the popup opens, the
   * switches flip, and nothing on the page moves — while the line at the top
   * says everything is fine. This is the reply that makes that line honest. */
  if (api && api.runtime && api.runtime.onMessage) {
    api.runtime.onMessage.addListener((msg, sender, reply) => {
      if (!msg) return false;
      // Progress on a summary job: one event per paid request, from the
      // background, handed to whichever module is running that job.
      if (msg.type === 'summary.progress') {
        window.dispatchEvent(new CustomEvent('costum:summary-progress', { detail: msg }));
        return false;
      }
      if (msg.type !== 'ping') return false;
      reply({
        alive: true,
        modules: (Costum.modules || []).length,
        bridge: (self.CostumBridge || {}).injected || 'unknown',
        path: location.pathname,
        // Switches that are on here and finding nothing (diagnostics.js).
        health: self.CostumHealth && self.CostumHealth.path === location.pathname ? self.CostumHealth.dead : []
      });
      return true;
    });
  }

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
      if (!reply) throw new Error('Background unavailable');
      if (!reply.ok) throw new Error(reply.error);
      return reply.result;
    });
  }

  /* ---- the channel being watched ----------------------------------------
   * Found from the page, by stable identity: the owner link's /channel/UC… or
   * /@handle, the page's own channelId meta, or the player response through
   * the bridge. A display name alone is never enough. Valid for one video id;
   * a navigation forgets it. */
  const channel = self.CostumChannel = self.CostumChannel || { id: '', name: '', videoId: '' };

  function setChannel(id, name, videoId) {
    if (channel.id === id && channel.videoId === videoId) return false;
    channel.id = id; channel.name = name || channel.name; channel.videoId = videoId;
    return true;
  }

  function channelFromDom() {
    const key = self.CostumDefaults.channelKey;
    const owner = document.querySelector('ytd-video-owner-renderer a[href], ytm-slim-owner-renderer a[href], #owner #channel-name a[href]');
    const meta = document.querySelector('meta[itemprop="channelId"]');
    const id = (owner && key(owner.getAttribute('href'))) || (meta && key('/channel/' + meta.getAttribute('content'))) || '';
    const name = ((owner && owner.closest('ytd-video-owner-renderer, ytm-slim-owner-renderer, #owner') || document).querySelector('ytd-channel-name #text, #channel-name #text, .ytm-slim-owner-renderer .slim-owner-channel-name, [itemprop="author"] [itemprop="name"]') || {}).textContent
      || (owner && owner.textContent) || '';
    return { id, name: String(name || '').trim().slice(0, 80) };
  }

  let channelLookup = 0;
  function resolveChannel() {
    const videoId = ctx.videoId();
    if (!location.pathname.startsWith('/watch') || !videoId) {
      if (setChannel('', '', '')) return true;
      return false;
    }
    if (channel.videoId === videoId && channel.id) return false;
    const found = channelFromDom();
    if (found.id) return setChannel(found.id, found.name, videoId);
    // Not in the DOM yet: ask the page once per video, and let later
    // mutations try the DOM again.
    if (channelLookup !== 1 && !bridge.dead) {
      const ticket = channelLookup = 1;
      toPage('meta').then((m) => {
        if (channelLookup !== ticket) return;
        channelLookup = 0;
        if (!m || m.videoId !== ctx.videoId() || !m.channelId) return;
        if (setChannel(self.CostumDefaults.channelKey('/channel/' + m.channelId), m.author, m.videoId)) onChannel();
      });
    }
    return false;
  }

  /* A channel with preferences of its own changes the effective settings, so
     the page is painted and the modules re-applied as if a setting changed. */
  function announceChannel() {
    self.CostumBoot && self.CostumBoot.paint(ctx.settings());
    window.dispatchEvent(new CustomEvent('costum:channel', { detail: Object.assign({}, channel) }));
  }
  function onChannel() {
    announceChannel();
    applyAll();
  }

  const ctx = {
    settings: () => self.CostumSettings || self.CostumDefaults.withDefaults(null),
    /* What is in force on this page: the stored preferences with this
       channel's own on top. Read-only by construction — never hand it back to
       the store, or a channel's speed becomes everyone's. */
    effective: () => self.CostumDefaults.withChannel(ctx.settings(), channel.id),
    channel: () => ({ id: channel.id, name: channel.name, videoId: channel.videoId,
      prefs: self.CostumDefaults.channelPrefsOf(ctx.settings(), channel.id) }),
    video: () => document.querySelector('#costum-native') || document.querySelector('video.html5-main-video') || document.querySelector('#movie_player video'),
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
      return (...args) => {
        if (!ctx.settings().enabled || !owner) return;
        return Promise.resolve().then(() => owner.actions[name](...args))
          .catch(() => ctx.toast(ctx.settings().locale === 'ar' ? 'تعذّر تنفيذ الإجراء' : 'Could not complete this action'));
      };
    },
    panel: null
  };

  Costum.ctx = ctx;

  /* ---- lifecycle -------------------------------------------------------- */
  function safely(mod, hook, args) {
    if (!mod[hook]) return;
    try {
      const result = mod[hook].apply(mod, args);
      if (result && result.catch) result.catch((err) => console.warn('[Costum] ' + mod.name + '.' + hook + ' failed:', err));
    } catch (err) {
      // One broken module must never take the rest of the extension down.
      console.warn('[Costum] ' + mod.name + '.' + hook + ' failed:', err);
    }
  }

  let currentVideo = null;
  let navigateTimer = null;

  function applyAll() {
    clearTimeout(navigateTimer); navigateTimer = null;
    const s = ctx.settings();
    if (!s.enabled) {
      /* Forgotten here, so that switching back on treats whatever video is on
         the page as new and every module attaches to it again. */
      currentVideo = null;
      Costum.modules.forEach((m) => safely(m, 'disable', [ctx]));
      toPage('config', { forceQuality: 'auto', blockHighFramerate: false, preferAvc: false });
      return;
    }
    if (resolveChannel()) announceChannel();
    const e = ctx.effective();
    Costum.modules.forEach((m) => safely(m, 'apply', [e, ctx]));
    const video = ctx.video();
    if (video) {
      currentVideo = video;
      Costum.modules.forEach((m) => safely(m, 'onVideo', [video, e, ctx]));
    }
  }

  function checkVideo() {
    const video = ctx.video();
    if (!ctx.settings().enabled || !video || video === currentVideo) return;
    currentVideo = video;
    const e = ctx.effective();
    Costum.modules.forEach((m) => safely(m, 'onVideo', [video, e, ctx]));
  }

  // A single observer, batched through one animation frame.
  let queued = [];
  let scheduled = false;
  let lastHref = location.href;

  function onNavigate() {
    self.CostumBoot && self.CostumBoot.markPage && self.CostumBoot.markPage();
    currentVideo = null;
    channelLookup = 0;
    if (setChannel('', '', '')) self.CostumBoot && self.CostumBoot.paint(ctx.settings());
    Costum.modules.forEach((m) => safely(m, 'onNavigate', [ctx]));
    window.dispatchEvent(new CustomEvent('costum:navigate'));
    // One pending apply, however many navigations land in the same moment.
    clearTimeout(navigateTimer);
    navigateTimer = setTimeout(applyAll, 120);
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
    const nodes = [...new Set(queued)];
    queued = [];
    const s = ctx.settings();
    if (!s.enabled) return;
    checkNavigation();
    // The owner row arrives after the player; once it is here, the channel's
    // own preferences take over — a full re-apply, but once per video.
    if (resolveChannel()) { onChannel(); return; }
    Costum.modules.forEach((m) => safely(m, 'onMutation', [nodes, ctx.effective(), ctx]));
    checkVideo();
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      if (target) queued.push(target);
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
    /* A YouTube page opening is one of the moments another device's changes
       can be fetched — Safari has no push from the app to here. The background
       throttles it; a change that arrives comes back through storage as any
       other settings change would. */
    ask('sync.refresh').catch(() => {});
    // So the app's setup screen can say it is working (see bg.js).
    ask('extension.seen', {
      page: self.CostumCss.pageName(location.pathname),
      mobile: self.CostumCss.isMobileHost(location.hostname)
    }).catch(() => {});
    observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true });

    document.addEventListener('yt-navigate-finish', () => {
      lastHref = location.href;
      onNavigate();
    }, true);

    // Back and forward do not always mutate enough to trip the observer.
    window.addEventListener('popstate', checkNavigation);

    window.addEventListener('costum:settings', applyAll);

    document.addEventListener('visibilitychange', () => {
      const s = ctx.settings();
      if (!s.enabled || !s.playback.pauseBackgroundTabs) return;
      const video = ctx.video();
      if (video && document.hidden) video.pause();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Promise.resolve(self.CostumReady).then(start), { once: true });
  } else {
    Promise.resolve(self.CostumReady).then(start);
  }
})();
