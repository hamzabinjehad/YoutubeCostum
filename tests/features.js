/* Browser regression suite. Served by scripts/harness.sh at /tests/features.html. */
(async function () {
  'use strict';
  const results = [];
  const sources = new Map();
  const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
  const source = async (path) => {
    if (!sources.has(path)) sources.set(path, await (await fetch('/extension/' + path)).text());
    return sources.get(path);
  };
  async function frameTest(name, run) {
    const frame = document.createElement('iframe');
    frame.src = '/tests/blank.html';
    const loaded = new Promise((resolve) => { frame.onload = resolve; });
    document.body.appendChild(frame);
    await loaded;
    const w = frame.contentWindow;
    const errors = [];
    w.addEventListener('error', (event) => errors.push(event.message));
    w.addEventListener('unhandledrejection', (event) => errors.push(String(event.reason)));
    try {
      w.history.replaceState({}, '', '/watch?v=A');
      const load = async (path) => w.eval(await source(path));
      await load('common/defaults.js');
      w.eval(`
        self.Costum = { modules: [], register(mod) { this.modules.push(mod); return mod; } };
        self.settings = CostumDefaults.withDefaults(null);
        self.patch = (p) => { settings = CostumDefaults.merge(settings, p); return Promise.resolve(settings); };
        self.shown = []; self.toasts = [];
        self.ctx = {
          settings: () => settings,
          videoId: () => new URLSearchParams(location.search).get('v') || '',
          video: () => document.querySelector('#costum-native, video'),
          isMusic: () => false, clock: (s) => String(s),
          patch, toast: (s) => toasts.push(s),
          toPage: async () => null,
          panel: { showSummary: (s) => shown.push(s) },
          ask: async () => null,
          meta: async () => ({ videoId: ctx.videoId(), captionVideoId: ctx.videoId(), captionsReady: true, title: ctx.videoId(), captionTracks: [{ baseUrl: 'https://www.youtube.com/api/timedtext?v=' + ctx.videoId(), lang: 'en', kind: '', name: 'English' }] }),
          action: (name) => (...args) => { const owner = Costum.modules.find(m => m.actions && m.actions[name]); return owner ? owner.actions[name](...args) : undefined; }
        };
        self.mod = (name) => Costum.modules.find((m) => m.name === name);
        self.makeVideo = (parent) => {
          const video = document.createElement('video'); video.className = 'html5-main-video';
          Object.defineProperty(video, 'duration', { value: 600 });
          let paused = true;
          Object.defineProperty(video, 'paused', { get: () => paused, configurable: true });
          video.play = () => { paused = false; return Promise.resolve(); }; video.pause = () => { paused = true; };
          (parent || document.body).appendChild(video); return video;
        };
        /* A Web Audio stand-in that records the graph, so "audible" can be
           asserted: a path from the media source to the destination, with the
           gain at 1. State and resume() are scriptable, for Safari's
           gesture rule. */
        self.FakeAudioContext = class {
          constructor() { this.state = FakeAudioContext.initialState; this.resumes = 0; this.sources = 0; this.destination = this.node('destination'); FakeAudioContext.last = this; }
          node(kind) { const n = { kind, outputs: new Set(), connect(to) { n.outputs.add(to); }, disconnect() { n.outputs.clear(); } }; return n; }
          resume() { this.resumes++; if (FakeAudioContext.resumable) this.state = 'running'; return Promise.resolve(); }
          createMediaElementSource(video) { this.sources++; this.sourceNode = Object.assign(this.node('source'), { video }); return this.sourceNode; }
          createBiquadFilter() { return Object.assign(this.node('biquad'), { frequency: { value: 0 }, gain: { value: 0 } }); }
          createDynamicsCompressor() { return Object.assign(this.node('compressor'), { threshold: { value: 0 }, knee: { value: 0 }, ratio: { value: 0 }, attack: { value: 0 }, release: { value: 0 } }); }
          createGain() { return Object.assign(this.node('gain'), { gain: { value: 1 } }); }
          /* The gain product along the path from the source to the speakers,
             or null when no path exists — which is silence. */
          audible(source) {
            const seen = new Set();
            const walk = (n, g) => {
              if (n === this.destination) return g;
              if (seen.has(n)) return null; seen.add(n);
              const gain = n.kind === 'gain' ? g * n.gain.value : g;
              for (const next of n.outputs) { const r = walk(next, gain); if (r !== null) return r; }
              return null;
            };
            return walk(source, 1);
          }
        };
        FakeAudioContext.initialState = 'running'; FakeAudioContext.resumable = true;
        self.AudioContext = FakeAudioContext; self.webkitAudioContext = undefined;
      `);
      await Promise.race([run(w, load), delay(15000).then(() => { throw new Error('Test timed out'); })]);
      await delay();
      assert(!errors.length, 'Unexpected browser errors: ' + errors.join('; '));
      results.push({ name, passed: true });
    } catch (error) { results.push({ name, passed: false, error: String(error.stack || error) }); }
    finally { frame.remove(); }
    document.getElementById('report').textContent = JSON.stringify(results, null, 2);
  }

  /* The real stack: background desk, boot.js, every module, the panel and
     the router, over an in-memory storage whose change events reach both
     ends — the same wiring an installed extension has, minus the browser. */
  const MODULES = ['playback', 'audio', 'filters', 'layout', 'tabtitle', 'homegrid', 'nativeplayer', 'shorts',
    'declutter', 'contentblock', 'shortcuts', 'capture', 'sponsors', 'ads', 'summary', 'focus', 'bookmarks', 'diagnostics'];
  async function runtime(w, load, seed = {}, extra = { welcomed: true }) {
    // Seen the one-time welcome already, unless a test is about the welcome.
    const memory = Object.assign({ settings: w.CostumDefaults.withDefaults(seed) }, extra);
    const changed = [];
    const desks = [];
    const natives = [];
    const api = {
      storage: { local: {
        get: async (key) => { await delay(1); return structuredClone(key ? { [key]: memory[key] } : memory); },
        set: async (bag) => {
          await delay(1);
          const changes = {};
          for (const key in bag) { changes[key] = { oldValue: memory[key], newValue: structuredClone(bag[key]) }; memory[key] = structuredClone(bag[key]); }
          changed.forEach((fn) => fn(changes, 'local'));
        }
      }, onChanged: { addListener: (fn) => changed.push(fn) } },
      runtime: {
        getURL: (path) => '/extension/' + path,
        onMessage: { addListener: (fn) => desks.push(fn) },
        onInstalled: { addListener() {} },
        sendNativeMessage: async (_, msg) => { natives.push(msg); return { ok: true }; },
        sendMessage: (msg) => new Promise((resolve) => {
          for (const fn of desks) if (fn(msg, { tab: { id: 1 } }, resolve) === true) return;
          resolve(undefined);
        })
      },
      tabs: { sendMessage: async () => ({}) }
    };
    w.browser = api;
    await load('common/bookmarks.js');
    await load('background/bg.js');
    await load('common/css.js');
    await load('content/boot.js');
    for (const name of MODULES) await load('content/modules/' + name + '.js');
    await load('content/panel.js');
    await load('content/router.js');
    await w.CostumReady; await delay(30);
    const set = async (patch) => { await api.runtime.sendMessage({ type: 'settings.set', patch }); await delay(30); };
    const ctx = w.Costum.ctx;
    return { api, memory, set, ctx, natives };
  }

  const firstSource = (w) => w.FakeAudioContext.last.sourceNode;
  const focusVeil = (w) => [...w.document.documentElement.children].find((el) => el.shadowRoot && el.shadowRoot.querySelector('.veil'));
  const panelRoot = (w) => w.document.getElementById('costum-host').shadowRoot;

  await frameTest('Summary language matching and empty captions', async (w, load) => {
    await load('content/modules/summary.js');
    const api = w.CostumSummaryInternals;
    const track = api.pickTrack([{ lang: 'en', kind: '' }, { lang: 'ar-SA', kind: 'asr' }], 'ar');
    assert(track.lang === 'ar-SA', 'Regional language was ignored');
    let error;
    try { api.extractTranscript({ events: [{ segs: [{ utf8: '   ' }] }] }); } catch (e) { error = e.message; }
    assert(error === 'empty-transcript', 'Empty transcript accepted');
    const tiny = api.extractTranscript({ events: [{ tStartMs: 1000, segs: [{ utf8: 'I' }] }] });
    assert(tiny.text === '[00:01] I', 'Short but valid captions were discarded');
  });

  await frameTest('Long transcripts retain timestamps and report partial coverage', async (w, load) => {
    await load('content/modules/summary.js');
    const data = { events: Array.from({ length: 300 }, (_, i) => ({ tStartMs: i * 1000, segs: [{ utf8: 'word '.repeat(200) }] })) };
    const result = w.CostumSummaryInternals.extractTranscript(data);
    assert(result.partial && result.text.length <= 116000 && result.lastSeconds < 299, 'Long input not bounded honestly');
    assert(result.timestamps[0] === 0 && result.timestamps.length > 1, 'Source timestamps lost');
  });

  async function setupSummary(w, load) {
    await load('content/modules/summary.js');
    await w.patch({ summary: { enabled: true, apiKey: 'fake-test-key' } });
    w.fetch = async () => ({ ok: true, json: async () => ({ events: [{ tStartMs: 12000, segs: [{ utf8: 'Example source fact.' }] }] }) });
  }

  await frameTest('Double-click deduplication and stale summary completion', async (w, load) => {
    await setupSummary(w, load);
    const reply = deferred();
    let calls = 0;
    w.ctx.ask = async (type, p) => { if (type === 'summary.make') { if (p.check) return { cached: false, requests: 1 }; calls++; return reply.promise; } return type === 'summary.list' ? [] : true; };
    const first = w.mod('summary').actions.summarize(w.ctx);
    await delay(10);
    await w.mod('summary').actions.summarize(w.ctx);
    assert(calls === 1, 'Duplicate click started another request');
    w.history.replaceState({}, '', '/watch?v=B');
    w.mod('summary').onNavigate(w.ctx);
    reply.resolve({ text: 'Old video result' });
    await first;
    assert(!w.shown.some((s) => s.state === 'done'), 'Old summary rendered on new video');
  });

  await frameTest('Cancellation and reversed completion preserve newest summary', async (w, load) => {
    await setupSummary(w, load);
    const replies = [deferred(), deferred()]; let index = 0; let cancels = 0;
    w.ctx.ask = (type, p) => { if (type === 'summary.make') { if (p.check) return Promise.resolve({ cached: false, requests: 1 }); return replies[index++].promise; } if (type === 'summary.cancel') cancels++; return Promise.resolve(type === 'summary.list' ? [] : true); };
    const first = w.mod('summary').actions.summarize(w.ctx);
    await delay(10);
    const second = w.mod('summary').actions.summarize(w.ctx, 'detailed');
    await delay(10);
    replies[1].resolve({ text: 'Newest' }); await second;
    replies[0].resolve({ text: 'Old' }); await first;
    assert(cancels === 1 && w.shown.at(-1).text === 'Newest', 'Older job won');
  });

  await frameTest('No paid request for empty or mismatched captions', async (w, load) => {
    await setupSummary(w, load); let paid = 0;
    w.ctx.ask = async () => { paid++; };
    w.ctx.meta = async () => ({ videoId: 'A', captionVideoId: 'B', captionTracks: [] });
    await w.mod('summary').actions.summarize(w.ctx);
    assert(paid === 0 && w.shown.at(-1).state === 'error', 'Mismatched captions sent');
    w.ctx.meta = async () => ({ videoId: 'A', captionVideoId: 'A', captionTracks: [{ lang: 'en', baseUrl: 'https://www.youtube.com/api/timedtext' }] });
    w.fetch = async () => ({ ok: true, json: async () => ({ events: [] }) });
    await w.mod('summary').actions.summarize(w.ctx);
    assert(paid === 0, 'Empty transcript sent');
  });

  /* A stand-in for the containing app: one iCloud key-value slot, shared by
     every "device" (background instance) handed the same `cloud` object.
     `cloud.offline` makes pushes fail the way an unreachable app would. */
  const makeCloud = () => ({ stored: null, offline: false, signedIn: true, pushes: [] });
  async function background(w, load, safari = false, cloud = makeCloud()) {
    const memory = { settings: w.CostumDefaults.withDefaults({ summary: { enabled: true, apiKey: 'fake-test-key' } }) };
    const listeners = [];
    const pushes = cloud.pushes;
    const dev = { offline: false };   // this device's own reachability
    let desk;
    const api = {
      storage: { local: {
        get: async (key) => { await delay(1); return structuredClone(key ? { [key]: memory[key] } : memory); },
        set: async (bag) => {
          await delay(1);
          const changes = {};
          for (const key in bag) { changes[key] = { oldValue: memory[key], newValue: structuredClone(bag[key]) }; memory[key] = structuredClone(bag[key]); }
          listeners.forEach((fn) => fn(changes, 'local'));
        }
      }, onChanged: { addListener: (fn) => listeners.push(fn) } },
      runtime: {
        getManifest: () => ({ version: 'test' }),
        onMessage: { addListener: (fn) => { desk = fn; } }, onInstalled: { addListener() {} },
        sendNativeMessage: async (_, msg) => {
          await delay(1);
          if (cloud.offline || dev.offline) throw new Error('native unavailable');
          if (msg.type === 'sync.status') return { ok: true, available: cloud.signedIn };
          if (msg.type === 'sync.push') {
            pushes.push(msg.payload || msg.settings);
            if (!cloud.signedIn) return { ok: false, error: 'not-signed-in' };
            cloud.stored = structuredClone(msg.payload);
            return { ok: true };
          }
          if (msg.type === 'sync.pull') return cloud.stored ? { ok: true, payload: structuredClone(cloud.stored) } : { ok: true };
          return { ok: false, error: 'unknown-message' };
        }
      }
    };
    /* Two devices in one window: each background reads its own namespace, so
       the second is loaded as a fresh scope with its own `browser`. */
    const scope = safari ? { browser: api } : { chrome: api };
    // The first device also owns the window's namespace, for store.js.
    if (safari && !w.browser) w.browser = api;
    if (!safari && !w.chrome) w.chrome = api;
    if (!w.CostumBookmarks) await load('common/bookmarks.js');
    w.eval('(function (self, browser, chrome) { ' + await source('background/bg.js') + ' })')(Object.assign({ CostumDefaults: w.CostumDefaults, CostumBookmarks: w.CostumBookmarks }, scope), scope.browser, scope.chrome);
    api.runtime.sendMessage = (msg) => new Promise((resolve) => desk(msg, { tab: { id: 1 } }, resolve));
    const ask = (type, payload = {}, tabId = 1) => new Promise((resolve) => desk({ type, ...payload }, { tab: { id: tabId } }, resolve));
    return { memory, api, ask, pushes, cloud, dev };
  }

  await frameTest('Concurrent settings patches and replacement share one writer', async (w, load) => {
    const { memory, ask } = await background(w, load);
    const replies = await Promise.all([ask('settings.set', { patch: { audio: { boost: 2 } } }), ask('settings.set', { patch: { picture: { brightness: 80 } } })]);
    assert(replies.every((r) => r.ok), 'Save rejected');
    assert(memory.settings.audio.boost === 2 && memory.settings.picture.brightness === 80, 'Concurrent patch lost');
    await Promise.all([ask('settings.replace', { settings: { audio: { boost: 3 } } }), ask('settings.set', { patch: { picture: { contrast: 120 } } })]);
    assert(memory.settings.audio.boost === 3 && memory.settings.picture.contrast === 120, 'Replace bypassed queue');
  });

  await frameTest('Failed storage read cannot erase settings or poison later saves', async (w, load) => {
    const { memory, ask, api } = await background(w, load);
    await delay(10); const get = api.storage.local.get;
    api.storage.local.get = async () => { throw new Error('storage offline'); };
    const failed = await ask('settings.set', { patch: { audio: { boost: 5 } } });
    assert(!failed.ok && memory.settings.audio.boost === 1, 'Read failure overwrote settings');
    api.storage.local.get = get;
    const next = await ask('settings.set', { patch: { audio: { boost: 2 } } });
    assert(next.ok && memory.settings.audio.boost === 2, 'Queue stayed rejected');
  });

  await frameTest('Popup saves use background and sync without leaking the API key', async (w, load) => {
    const { memory, pushes } = await background(w, load, true);
    await load('common/store.js');
    await w.CostumStore.write({ audio: { boost: 4 } });
    await delay(20);
    assert(memory.settings.audio.boost === 4 && pushes.length === 1, 'Popup did not sync');
    assert(pushes[0].settings.summary.apiKey === '' && pushes[0].updatedAt > 0, 'API key leaked to sync, or no timestamp');
  });

  await frameTest('Summary cache, model/language/detail invalidation and clear', async (w, load) => {
    const { ask } = await background(w, load); let requests = 0;
    w.fetch = async (_, init) => { requests++; assert(init.headers['x-api-key'] === 'fake-test-key', 'Background did not use stored key'); return { ok: true, json: async () => ({ content: [{ type: 'text', text: '[00:12] Example.' }] }) }; };
    const job = { videoId: 'A', title: 'A', transcript: '[00:12] Example source.', captionTrack: 'en', requestId: 'one' };
    assert((await ask('summary.make', job)).ok, 'Summary failed');
    const cached = await ask('summary.make', { ...job, requestId: 'two' });
    assert(cached.result.cached && requests === 1, 'Cache missed');
    await ask('summary.make', { ...job, requestId: 'three', detail: 'detailed' });
    await ask('settings.set', { patch: { summary: { language: 'ar' } } });
    await ask('summary.make', { ...job, requestId: 'four' });
    await ask('settings.set', { patch: { summary: { model: 'claude-sonnet-5' } } });
    await ask('summary.make', { ...job, requestId: 'five' });
    assert(requests === 4, 'Cache identity ignored settings');
    await ask('summary.clear');
    await ask('summary.make', { ...job, requestId: 'six' });
    assert(requests === 5, 'Clear left cached results');
  });

  await frameTest('Provider errors are actionable and requests are not auto-retried', async (w, load) => {
    const { ask } = await background(w, load); let requests = 0;
    const job = { videoId: 'A', transcript: '[00:01] Example.', requestId: 'error' };
    for (const [status, code] of [[401, 'invalid-key'], [404, 'model-unavailable'], [429, 'rate-limited'], [503, 'service-unavailable']]) {
      w.fetch = async () => { requests++; return { ok: false, status }; };
      const reply = await ask('summary.make', job);
      assert(!reply.ok && reply.error === code, 'Wrong error for ' + status);
    }
    assert(requests === 4, 'Paid request retried automatically');
  });

  await frameTest('Provider cancellation is scoped to its tab and never cached', async (w, load) => {
    const { ask, memory } = await background(w, load);
    const started = deferred(); let aborted = false;
    w.fetch = (_, init) => new Promise((resolve, reject) => { started.resolve(); init.signal.addEventListener('abort', () => { aborted = true; reject(new Error('aborted')); }); });
    const job = { videoId: 'A', transcript: '[00:01] Example.', requestId: 'cancel' };
    const running = ask('summary.make', job);
    await started.promise;
    await ask('summary.cancel', job, 2);
    assert(!aborted, 'Other tab cancelled this job');
    await ask('summary.cancel', job, 1);
    const result = await running;
    assert(aborted && result.error === 'cancelled' && !memory.summaryCache, 'Cancelled job persisted');
  });

  await frameTest('Long summaries use bounded chunks followed by synthesis', async (w, load) => {
    const { ask } = await background(w, load); const bodies = [];
    w.fetch = async (_, init) => { bodies.push(JSON.parse(init.body)); return { ok: true, json: async () => ({ content: [{ type: 'text', text: '[00:01] Source note.' }] }) }; };
    const transcript = Array.from({ length: 90 }, (_, i) => '[00:01] ' + 'x'.repeat(990)).join('\n');
    const result = await ask('summary.make', { requestId: 'long', videoId: 'A', transcript });
    assert(result.ok && bodies.length === 4, 'Expected three chunks plus synthesis');
    assert(bodies.at(-1).messages[0].content.includes('chronological notes'), 'Missing synthesis');
    assert(bodies.every((b) => b.system.includes('untrusted data')), 'Source instructions not separated');
  });

  await frameTest('Expired caption link is refreshed once', async (w, load) => {
    await setupSummary(w, load); let calls = 0;
    w.fetch = async () => ++calls === 1 ? { ok: false, status: 403 } : { ok: true, json: async () => ({ events: [{ tStartMs: 0, segs: [{ utf8: 'Refreshed.' }] }] }) };
    w.ctx.ask = async (type, p) => (type === 'summary.list' ? [] : p && p.check ? { cached: false, requests: 1 } : { text: 'Summary' });
    await w.mod('summary').actions.summarize(w.ctx);
    assert(calls === 2 && w.shown.at(-1).state === 'done', 'Caption refresh failed');
  });

  await frameTest('Panel keeps structured state and validates timestamp seeking', async (w, load) => {
    await load('common/css.js'); await load('content/panel.js');
    const video = w.makeVideo();
    w.CostumPanel.init(w.ctx);
    w.CostumPanel.showSummary({ state: 'done', videoId: 'A', title: 'Sample', text: '[00:12] Valid. [00:13] Invented.', timestamps: [12] });
    const root = w.document.getElementById('costum-host').shadowRoot;
    assert(root.querySelectorAll('.summary-seek').length === 1, 'Invented timestamp made clickable');
    root.querySelector('.summary-seek').click();
    assert(video.currentTime === 12, 'Timestamp did not seek');
    w.dispatchEvent(new w.Event('costum:settings'));
    assert(root.querySelector('.summary strong').textContent === 'Sample' && root.querySelector('.summary-seek'), 'Rerender lost structured state');
    w.history.replaceState({}, '', '/watch?v=B'); video.currentTime = 0;
    root.querySelector('.summary-seek').click();
    assert(video.currentTime === 0, 'Timestamp sought the wrong video');
    w.CostumPanel.showSummary({ state: 'loading', videoId: 'B', title: 'New video' });
    w.dispatchEvent(new w.Event('costum:settings'));
    assert(root.querySelector('.summary').getAttribute('aria-busy') === 'true', 'Loading became done on settings change');
    await w.patch({ locale: 'ar' }); w.dispatchEvent(new w.Event('costum:settings'));
    assert(root.querySelector('.summary-actions').textContent.includes('إلغاء'), 'Arabic actions missing');
  });

  await frameTest('Filters and playback restore on disable; listeners stay inert', async (w, load) => {
    await load('content/modules/filters.js'); await load('content/modules/playback.js');
    const video = w.makeVideo(); video.style.filter = 'sepia(1)'; video.playbackRate = 1.25;
    await w.patch({ picture: { brightness: 80 }, playback: { defaultSpeed: 2, loop: { enabled: true, videoId: 'A', start: 10, end: 20 } } });
    w.mod('filters').onVideo(video, w.settings); w.mod('playback').onVideo(video, w.settings, w.ctx);
    assert(video.style.filter.includes('brightness') && video.playbackRate === 2, 'Effects not active');
    await w.patch({ enabled: false });
    w.mod('filters').disable(); w.mod('playback').disable();
    video.currentTime = 25; video.dispatchEvent(new w.Event('timeupdate')); video.dispatchEvent(new w.Event('loadeddata'));
    assert(video.style.filter === 'sepia(1)' && video.playbackRate === 1.25 && video.currentTime === 25, 'Disabled effects persisted');
  });

  await frameTest('Delayed card metadata, recycled cards and reveal exemptions', async (w, load) => {
    await load('content/modules/contentblock.js');
    const card = w.document.createElement('ytd-video-renderer'); w.document.body.appendChild(card);
    await w.patch({ block: { keywords: ['spoiler'] } });
    w.mod('contentblock').apply(w.settings);
    const title = w.document.createElement('a'); title.id = 'video-title'; title.textContent = 'Movie spoiler'; card.appendChild(title);
    w.mod('contentblock').onMutation([title], w.settings);
    assert(card.hasAttribute('costum-blocked'), 'Delayed title escaped blocking');
    w.mod('contentblock').actions.revealBlocked(w.ctx);
    w.mod('contentblock').onMutation([title], w.settings);
    assert(!card.hasAttribute('costum-blocked') && w.toasts.at(-1).includes('spoiler'), 'Reveal did not persist or explain rule');
    title.textContent = 'Another spoiler'; w.mod('contentblock').onMutation([title], w.settings);
    assert(card.hasAttribute('costum-blocked'), 'Exemption leaked to recycled card');
    await w.patch({ block: { keywords: [] } }); w.mod('contentblock').apply(w.settings);
    assert(!card.hasAttribute('costum-blocked'), 'Cleared rule kept card hidden');
  });

  await frameTest('Sponsor retries, undo and disable', async (w, load) => {
    await load('content/modules/sponsors.js');
    const video = w.makeVideo(); let calls = 0;
    await w.patch({ sponsors: { enabled: true } });
    const originalTimeout = w.setTimeout;
    w.setTimeout = (fn) => originalTimeout(fn, 5);
    w.ctx.ask = async () => { calls++; if (calls === 1) throw new Error('offline'); return [{ start: 10, end: 20, category: 'sponsor' }]; };
    w.mod('sponsors').onVideo(video, w.settings, w.ctx);
    await delay(30);
    video.currentTime = 12; video.dispatchEvent(new w.Event('timeupdate'));
    assert(calls === 2 && video.currentTime === 20, 'Retry did not recover');
    w.mod('sponsors').actions.sponsorUndo(w.ctx); video.dispatchEvent(new w.Event('timeupdate'));
    assert(video.currentTime === 12, 'Undo immediately skipped again');
    await w.patch({ enabled: false }); w.mod('sponsors').disable();
    video.currentTime = 15; video.dispatchEvent(new w.Event('timeupdate'));
    assert(video.currentTime === 15, 'Disabled sponsor handler skipped');
  });

  await frameTest('Native player teardown restores original state and rejects stale setup', async (w, load) => {
    await load('content/modules/nativeplayer.js');
    const holder = w.document.createElement('div'); holder.id = 'movie_player'; w.document.body.appendChild(holder);
    const original = w.makeVideo(); holder.appendChild(original); original.currentTime = 24; original.muted = false;
    await w.patch({ playback: { nativePlayer: true } });
    w.ctx.toPage = async () => [{ url: 'data:video/mp4;base64,', mimeType: 'video/mp4', height: 360 }];
    await w.mod('nativePlayer').apply(w.settings, w.ctx);
    const native = w.document.getElementById('costum-native');
    assert(native && original.muted, 'Native player did not mount');
    // The person paused the native player at 31 — that, not the pre-mount
    // state, is what YouTube's player must wake up to.
    native.currentTime = 31; w.mod('nativePlayer').disable();
    assert(!original.muted && original.currentTime === 31 && original.paused && !w.document.getElementById('costum-native'), 'Original state not restored');
    const pending = deferred(); w.ctx.toPage = () => pending.promise;
    const mount = w.mod('nativePlayer').apply(w.settings, w.ctx);
    await delay(); w.mod('nativePlayer').disable();
    pending.resolve([{ url: 'data:video/mp4;base64,', mimeType: 'video/mp4' }]); await mount;
    assert(!w.document.getElementById('costum-native'), 'Stale setup mounted after disable');
  });

  await frameTest('Bridge refuses old captions and changes page-world volume', async (w, load) => {
    const player = w.document.createElement('div'); player.id = 'movie_player'; w.document.body.appendChild(player);
    let volume = 50;
    player.getVolume = () => volume; player.setVolume = (n) => { volume = n; };
    player.getVideoData = () => ({ video_id: 'A', title: 'Current' });
    w.ytInitialPlayerResponse = { videoDetails: { videoId: 'OLD' }, captions: { playerCaptionsTracklistRenderer: { captionTracks: [{ languageCode: 'en', baseUrl: 'https://www.youtube.com/old' }] } } };
    await load('content/page/bridge.js');
    const request = (cmd, payload) => new Promise((resolve) => {
      const listener = (event) => { if (event.data && event.data.__costum === 'from-page' && event.data.id === 100) { w.removeEventListener('message', listener); resolve(event.data.result); } };
      w.addEventListener('message', listener); w.testMessage = { __costum: 'to-page', id: 100, cmd, payload }; w.eval("window.postMessage(testMessage, '*')");
    });
    const meta = await request('meta');
    assert(!meta.captionsReady && !meta.captionTracks.length && meta.videoId === 'A', 'Old captions escaped');
    assert((await request('volume', { delta: 5 })).volume === 55 && volume === 55, 'Page volume unchanged');
  });



  await frameTest('Two Safari devices exchange changes through iCloud without reinstalling', async (w, load) => {
    const cloud = makeCloud();
    const a = await background(w, load, true, cloud);
    const b = await background(w, load, true, cloud);
    await a.ask('settings.set', { patch: { audio: { boost: 4 }, summary: { apiKey: 'device-a-key' } } });
    await delay(20);
    assert(cloud.stored && cloud.stored.settings.audio.boost === 4 && cloud.stored.settings.summary.apiKey === '', 'Push did not land, or leaked the key');
    const status = (await a.ask('sync.status')).result;
    assert(status.mode === 'icloud' && !status.dirty && status.lastSuccessAt > 0 && !status.lastError, 'Status wrong after a good push: ' + JSON.stringify(status));
    const refresh = await b.ask('sync.refresh', { force: true });
    assert(refresh.result.result === 'applied' && b.memory.settings.audio.boost === 4, 'Device B did not receive A\'s change: ' + JSON.stringify(refresh));
    assert(b.memory.settings.summary.apiKey === 'fake-test-key', 'B\'s own key was overwritten by sync');
    // An echo of what B already has is not applied again, and does not push.
    const pushesBefore = cloud.pushes.length;
    assert((await b.ask('sync.refresh', { force: true })).result.result === 'stale' && cloud.pushes.length === pushesBefore, 'Echo re-applied or re-pushed');
    // Throttling: a second unforced refresh within the minute is a no-op.
    assert((await b.ask('sync.refresh')).result.result === 'throttled', 'Page-load refresh not throttled');
  });

  await frameTest('Offline edits survive reconnection: newest wins, displaced edits are kept as a backup', async (w, load) => {
    const cloud = makeCloud();
    const a = await background(w, load, true, cloud);
    const b = await background(w, load, true, cloud);
    // B edits while the app cannot be reached: the push fails and is owed.
    b.dev.offline = true;
    await b.ask('settings.set', { patch: { picture: { brightness: 70 } } });
    await delay(20);
    let status = (await b.ask('sync.status')).result;
    assert(status.dirty && status.lastError === 'native-unavailable', 'Failed push reported as success: ' + JSON.stringify(status));
    // Cloud is empty when B comes back: B's edit seeds it.
    b.dev.offline = false;
    assert((await b.ask('sync.refresh', { force: true })).result.result === 'pushed' && cloud.stored.settings.picture.brightness === 70, 'Owed push was not retried');
    status = (await b.ask('sync.status')).result;
    assert(!status.dirty && !status.lastError, 'Debt not cleared after retry');
    // Now A makes a newer change while B is offline with an older unsent one.
    b.dev.offline = true;
    await b.ask('settings.set', { patch: { audio: { bass: 3 } } });
    await delay(30);
    await a.ask('settings.set', { patch: { audio: { bass: -6 } } });
    await delay(20);
    b.dev.offline = false;
    const outcome = await b.ask('sync.refresh', { force: true });
    assert(outcome.result.result === 'replaced-unsent' && b.memory.settings.audio.bass === -6, 'Newer cloud edit did not win: ' + JSON.stringify(outcome));
    const backups = (await b.ask('backup.list')).result;
    assert(backups.some((x) => x.kind === 'beforeSync'), 'Displaced edit was not backed up');
    await b.ask('backup.restore', { kind: 'beforeSync' });
    assert(b.memory.settings.audio.bass === 3, 'Backup did not restore the unsent edit');
    // A sign-out is reported, not acknowledged.
    cloud.signedIn = false;
    await a.ask('settings.set', { patch: { audio: { boost: 2 } } });
    await delay(20);
    status = (await a.ask('sync.status')).result;
    assert(status.lastError === 'not-signed-in' && status.available === false && status.dirty, 'Not-signed-in push acknowledged: ' + JSON.stringify(status));
  });

  await frameTest('A cloud snapshot never overwrites an edit made while the pull was in flight', async (w, load) => {
    const cloud = makeCloud();
    cloud.stored = { settings: w.CostumDefaults.withDefaults({ audio: { boost: 5 } }), updatedAt: Date.now() + 5000 };
    const b = await background(w, load, true, cloud);
    const native = b.api.runtime.sendNativeMessage;
    const gate = deferred(); const pulled = deferred();
    // The pull has fetched its snapshot; applying it waits for the gate.
    b.api.runtime.sendNativeMessage = async (host, msg) => { const reply = await native(host, msg); if (msg.type === 'sync.pull') { pulled.resolve(); await gate.promise; } return reply; };
    const refresh = b.ask('sync.refresh', { force: true });
    await pulled.promise;
    await b.ask('settings.set', { patch: { audio: { boost: 9 } } });
    gate.resolve();
    const outcome = await refresh;
    assert(outcome.result.result === 'raced' && b.memory.settings.audio.boost === 9, 'Racing pull overwrote a fresh edit: ' + JSON.stringify(outcome));
    await delay(20);
    // The edit's own push has landed by now, so the next refresh is an echo.
    assert((await b.ask('sync.refresh', { force: true })).result.result === 'stale' && b.memory.settings.audio.boost === 9, 'Follow-up refresh disturbed the edit');
  });

  await frameTest('Chrome reports local-only storage and never calls a native host', async (w, load) => {
    const { ask, pushes } = await background(w, load, false);
    await ask('settings.set', { patch: { audio: { boost: 2 } } });
    await delay(10);
    const status = (await ask('sync.status')).result;
    assert(status.mode === 'local' && pushes.length === 0 && !status.dirty, 'Chrome pretended to sync: ' + JSON.stringify(status));
    assert((await ask('sync.refresh', { force: true })).result.mode === 'local', 'Chrome refresh did not say local');
  });

  await frameTest('Invalid imports leave settings untouched; valid ones back up and can be restored', async (w, load) => {
    const { ask, memory } = await background(w, load, true);
    await ask('settings.set', { patch: { audio: { boost: 3 } } });
    const before = JSON.stringify(memory.settings);
    const bad = await ask('settings.import', { payload: { format: 'costum-settings', version: 1, settings: { audio: { boost: 'loud' } } } });
    assert(!bad.ok && bad.error === 'invalid-value' && JSON.stringify(memory.settings) === before, 'Invalid import changed settings');
    const junk = await ask('settings.import', { payload: { random: true } });
    assert(!junk.ok && junk.error === 'not-costum' && JSON.stringify(memory.settings) === before, 'Junk import changed settings');
    const good = await ask('settings.import', { payload: w.CostumDefaults.packageExport(w.CostumDefaults.withDefaults({ audio: { boost: 6 }, summary: { apiKey: 'from-file' } }), 'x') });
    assert(good.ok && memory.settings.audio.boost === 6 && memory.settings.summary.apiKey === 'fake-test-key', 'Import failed or replaced the local key');
    assert((await ask('backup.list')).result.some((b) => b.kind === 'beforeImport'), 'No backup before import');
    await ask('settings.reset');
    assert(memory.settings.audio.boost === 1 && (await ask('backup.list')).result.some((b) => b.kind === 'beforeReset'), 'Reset without backup');
    const restored = await ask('backup.restore', { kind: 'beforeReset' });
    assert(restored.ok && memory.settings.audio.boost === 6, 'Restore after reset failed');
    await ask('backup.restore', { kind: 'beforeImport' });
    assert(memory.settings.audio.boost === 3, 'Restore before import failed');
    assert(!(await ask('backup.restore', { kind: 'nope' })).ok, 'Unknown backup restored something');
  });

  await frameTest('Native player never carries an old position into a navigated video', async (w, load) => {
    await load('content/modules/nativeplayer.js');
    const holder = w.document.createElement('div'); holder.id = 'movie_player'; w.document.body.appendChild(holder);
    const original = w.makeVideo(holder); original.currentTime = 24; original.play();
    await w.patch({ playback: { nativePlayer: true } });
    w.ctx.toPage = async () => [{ url: 'data:video/mp4;base64,', mimeType: 'video/mp4', height: 360 }];
    await w.mod('nativePlayer').apply(w.settings, w.ctx);
    const native = w.document.getElementById('costum-native');
    assert(native && original.paused && original.muted, 'YouTube player was not parked');
    // Watching on: the native player is playing at 40 when the next video loads
    // into the very same YouTube <video> element.
    native.currentTime = 40; Object.defineProperty(native, 'paused', { get: () => false });
    w.history.replaceState({}, '', '/watch?v=B'); original.currentTime = 0;
    w.mod('nativePlayer').onNavigate(w.ctx);
    assert(!w.document.getElementById('costum-native'), 'Native player survived navigation');
    assert(original.currentTime === 0 && !original.muted, 'Old position or mute leaked into the new video: ' + original.currentTime);
    // A stream that refuses to play hands back to YouTube — playing, as it
    // was before the attempt — with an explanation.
    original.currentTime = 5; original.play();
    await w.mod('nativePlayer').apply(w.settings, w.ctx);
    const again = w.document.getElementById('costum-native');
    assert(again && original.paused && original.muted, 'Second mount did not park the player');
    again.dispatchEvent(new w.Event('error'));
    assert(!w.document.getElementById('costum-native') && !original.muted && !original.paused && original.currentTime === 5, 'Failed stream left the page unusable');
    assert(/would not play/.test(w.toasts.at(-1)), 'No explanation for the failed stream: ' + w.toasts.at(-1));
  });

  await frameTest('Audio stays audible after processing is switched off, and skips cross-origin streams', async (w, load) => {
    await load('content/modules/audio.js');
    const video = w.makeVideo();
    await w.patch({ audio: { boost: 2, normalize: true } });
    w.mod('audio').onVideo(video, w.settings);
    const ctxAudio = w.FakeAudioContext.last;
    assert(ctxAudio.sources === 1 && ctxAudio.audible(ctxAudio.sourceNode) === 2, 'Boosted graph not built');
    // Disabling must leave a unity-gain path to the speakers.
    w.FakeAudioContext.resumable = false; ctxAudio.state = 'suspended';
    w.mod('audio').disable();
    assert(ctxAudio.audible(ctxAudio.sourceNode) === 1 && ctxAudio.resumes >= 1, 'Disable left the graph boosted or unresumed');
    // Safari refused the resume: the next touch must try again.
    w.FakeAudioContext.resumable = true;
    w.dispatchEvent(new w.Event('pointerdown'));
    await delay(5);
    assert(ctxAudio.state === 'running', 'Gesture retry did not resume the context');
    // And a direct googlevideo stream is never routed, since that would be silence.
    const foreign = w.document.createElement('video'); foreign.id = 'costum-native'; foreign.src = 'https://rr1---sn.googlevideo.com/videoplayback?x=1'; w.document.body.appendChild(foreign);
    await w.patch({ enabled: true, audio: { boost: 3 } });
    w.mod('audio').onVideo(foreign, w.settings);
    assert(ctxAudio.sources === 1 && w.CostumAudioInternals.canProcess(foreign) === false, 'Cross-origin stream was routed through Web Audio');
    assert(w.CostumAudioInternals.canProcess(video) === true, 'Same-origin video refused');
  });

  await frameTest('Focus gates expire on their own and settle on resume', async (w, load) => {
    await load('content/modules/focus.js');
    // The frame is off-screen; the resume path must see a visible document.
    Object.defineProperty(w.document, 'hidden', { get: () => false, configurable: true });
    const video = w.makeVideo();
    const focus = w.mod('focus');
    await w.patch({ focus: { sessionMinutes: 15, sessionEndsAt: Date.now() + 300 } });
    focus.apply(w.settings, w.ctx);
    assert(!focusVeil(w), 'Veil shown while the session still runs');
    await delay(1700);
    assert(focusVeil(w), 'Session expiry did not raise the veil without a navigation');
    // A block that lifts while the tab is asleep: coming back must clear it.
    await w.patch({ focus: { sessionMinutes: 0, sessionEndsAt: 0, blockUntil: Date.now() + 200 } });
    focus.apply(w.settings, w.ctx);
    assert(focusVeil(w), 'Block veil missing');
    await delay(250);
    w.document.dispatchEvent(new w.Event('visibilitychange'));
    assert(!focusVeil(w), 'Expired block stayed up after resume');
    // The open-delay countdown runs against the clock, not against ticks.
    await w.patch({ focus: { blockUntil: 0, openDelay: 5 } });
    const realNow = w.Date.now; let offset = 0; w.Date.now = () => realNow() + offset;
    focus.apply(w.settings, w.ctx);
    assert(focusVeil(w) && focusVeil(w).shadowRoot.querySelector('.count').textContent === '5', 'Countdown not shown');
    offset = 6000; w.document.dispatchEvent(new w.Event('visibilitychange'));
    assert(!focusVeil(w) && !video.paused, 'Countdown did not finish on resume');
    w.Date.now = realNow;
    focus.disable();
  });

  await frameTest('Late replies after navigation or disable never act on the page', async (w, load) => {
    await load('content/modules/sponsors.js'); await load('content/modules/audio.js');
    const video = w.makeVideo();
    await w.patch({ sponsors: { enabled: true } });
    const reply = deferred();
    w.ctx.ask = () => reply.promise;
    w.mod('sponsors').onVideo(video, w.settings, w.ctx);
    w.history.replaceState({}, '', '/watch?v=B'); w.mod('sponsors').onNavigate(w.ctx);
    reply.resolve([{ start: 10, end: 20, category: 'sponsor' }]); await delay(5);
    video.currentTime = 12; video.dispatchEvent(new w.Event('timeupdate'));
    assert(video.currentTime === 12, 'Old video segments skipped the new video');
    // A volume reply arriving after the switch went off changes nothing.
    const volume = deferred(); video.volume = 0.5;
    w.ctx.toPage = () => volume.promise;
    const change = w.mod('audio').actions.volumeUp(w.ctx);
    await w.patch({ enabled: false });
    volume.resolve(null); await change;
    assert(video.volume === 0.5 && !w.toasts.some((t) => /%/.test(t)), 'Late volume reply applied while disabled');
  });

  await frameTest('Master switch off and on without a reload: no effects left, no duplicate handlers', async (w, load) => {
    const listeners = {};
    const video = w.makeVideo();
    const player = w.document.createElement('div'); player.id = 'movie_player'; w.document.body.appendChild(player); player.appendChild(video);
    player.getPlaybackQuality = () => 'hd720'; player.getAvailableQualityLevels = () => ['hd720']; player.getVideoData = () => ({ video_id: 'A', title: 'A' });
    const card = w.document.createElement('ytd-video-renderer'); const title = w.document.createElement('a'); title.id = 'video-title'; title.textContent = 'Big spoiler'; card.appendChild(title); w.document.body.appendChild(card);
    const add = video.addEventListener.bind(video), remove = video.removeEventListener.bind(video);
    video.addEventListener = (type, fn, opts) => { listeners[type] = (listeners[type] || 0) + 1; add(type, fn, opts); };
    video.removeEventListener = (type, fn, opts) => { listeners[type] = (listeners[type] || 0) - 1; remove(type, fn, opts); };
    const { set, ctx } = await runtime(w, load, {
      picture: { brightness: 80 }, audio: { boost: 2 }, layout: { cinema: true }, block: { keywords: ['spoiler'] },
      playback: { forceQuality: 'hd720', defaultSpeed: 1.5, loop: { enabled: true, videoId: 'A', start: 10, end: 20 } },
      focus: { blockUntil: Date.now() + 600000 }
    });
    await delay(150);
    const html = w.document.documentElement;
    const quality = async () => (await ctx.toPage('qualityState')).wanted;
    assert(video.style.filter.includes('brightness') && html.hasAttribute('costum-cinema') && card.hasAttribute('costum-blocked'), 'Effects not applied');
    assert(video.playbackRate === 1.5 && focusVeil(w) && (await quality()) === 'hd720', 'Speed, focus or bridge config not applied');
    assert(w.FakeAudioContext.last.audible(firstSource(w)) === 2, 'Boost not audible');
    const baseline = Object.assign({}, listeners);
    const shortcut = () => w.dispatchEvent(new w.KeyboardEvent('keydown', { code: 'Period', shiftKey: true, bubbles: true }));

    await set({ enabled: false }); await delay(50);
    assert(video.style.filter === '' && !html.hasAttribute('costum-cinema') && !card.hasAttribute('costum-blocked') && !focusVeil(w), 'Effects left behind: ' + video.style.filter + ' ' + html.outerHTML.slice(0, 80));
    assert(video.playbackRate === 1 && (await quality()) === 'auto', 'Speed or bridge config left behind');
    assert(w.FakeAudioContext.last.audible(firstSource(w)) === 1, 'Audio not audible after disable');
    assert(panelRoot(w).querySelector('.fab').style.display === 'none', 'Panel button still on the page');
    video.currentTime = 25; video.dispatchEvent(new w.Event('timeupdate'));
    shortcut(); await delay(5);
    assert(video.currentTime === 25 && video.playbackRate === 1, 'Loop or shortcut still active while off');
    assert(html.querySelector('#costum-declutter').textContent === '' && html.querySelector('#costum-layout').textContent === '', 'Stylesheets not cleared');

    await set({ enabled: true }); await delay(80);
    assert(video.style.filter.includes('brightness') && html.hasAttribute('costum-cinema') && card.hasAttribute('costum-blocked') && focusVeil(w), 'Effects did not return');
    assert(video.playbackRate === 1.5 && (await quality()) === 'hd720' && w.FakeAudioContext.last.audible(firstSource(w)) === 2, 'Speed, quality or boost did not return');
    assert(panelRoot(w).querySelector('.fab').style.display === '', 'Panel button did not return');
    video.currentTime = 25; video.dispatchEvent(new w.Event('timeupdate'));
    assert(video.currentTime === 10, 'Loop did not resume');
    await set({ picture: { contrast: 110 } }); await set({ enabled: false }); await set({ enabled: true }); await delay(80);
    assert(JSON.stringify(listeners) === JSON.stringify(baseline), 'Listener count drifted: ' + JSON.stringify(listeners) + ' vs ' + JSON.stringify(baseline));
    shortcut(); await delay(5);
    assert(Math.abs(video.playbackRate - 1.55) < 0.001, 'Shortcut did not work after re-enable: ' + video.playbackRate);
  });

  await frameTest('Rapid navigation and player replacement attach to the newest video only', async (w, load) => {
    const one = w.makeVideo();
    const { set, ctx } = await runtime(w, load, { playback: { defaultSpeed: 2 } });
    const probe = { applies: 0, navigations: 0, videos: [] };
    w.Costum.register({ name: 'probe', apply() { probe.applies++; }, onNavigate() { probe.navigations++; }, onVideo(v) { probe.videos.push(v); } });
    await delay(150);
    const before = probe.applies;
    one.remove(); const two = w.makeVideo();
    w.history.replaceState({}, '', '/watch?v=B'); w.document.dispatchEvent(new w.Event('yt-navigate-finish'));
    two.remove(); const three = w.makeVideo();
    w.history.replaceState({}, '', '/watch?v=C'); w.document.dispatchEvent(new w.Event('yt-navigate-finish'));
    await delay(250);
    assert(probe.navigations === 2 && probe.applies === before + 1, 'Navigation burst ran apply ' + (probe.applies - before) + ' times');
    assert(probe.videos.at(-1) === three && three.playbackRate === 2, 'Newest video not attached');
    assert(!probe.videos.includes(two), 'A replaced player was attached');
    // A loop marked on C follows C, and the detached players stay inert.
    await set({ playback: { loop: { enabled: true, videoId: 'C', start: 10, end: 20 } } }); await delay(50);
    three.currentTime = 25; three.dispatchEvent(new w.Event('timeupdate'));
    one.currentTime = 25; one.dispatchEvent(new w.Event('timeupdate'));
    assert(three.currentTime === 10 && one.currentTime === 25, 'Loop attached to the wrong player');
    void ctx;
  });

  await frameTest('Popup and panel writes land together and reach the page', async (w, load) => {
    w.makeVideo();
    const { memory, ctx } = await runtime(w, load);
    await load('common/store.js');
    await Promise.all([w.CostumStore.write({ audio: { boost: 3 } }), ctx.patch({ picture: { contrast: 120 } }), w.CostumStore.write({ layout: { cinema: true } })]);
    await delay(60);
    assert(memory.settings.audio.boost === 3 && memory.settings.picture.contrast === 120 && memory.settings.layout.cinema, 'A concurrent write was lost');
    assert(w.CostumSettings.audio.boost === 3 && w.CostumSettings.picture.contrast === 120, 'Page did not receive the merged settings');
    assert(w.document.documentElement.hasAttribute('costum-cinema'), 'Page effect did not follow the popup write');
    const boost = panelRoot(w).querySelector('[data-control-id="slider:audio.boost"]');
    assert(boost && Number(boost.value) === 3, 'Panel did not re-render from the popup write');
  });


  await frameTest('Channel speed outranks global preferences, a nudge outranks the channel, nothing leaks between videos', async (w, load) => {
    const owner = w.document.createElement('ytd-video-owner-renderer');
    const link = w.document.createElement('a'); link.href = '/channel/UCaaaaaaaaaaaaaaaaaaaaaa'; link.textContent = 'Lectures'; owner.appendChild(link);
    const nameEl = w.document.createElement('ytd-channel-name'); const text = w.document.createElement('div'); text.id = 'text'; text.textContent = 'Lectures'; nameEl.appendChild(text); owner.appendChild(nameEl);
    w.document.body.appendChild(owner);
    const video = w.makeVideo();
    // rememberSpeed off, so "global preferences" below means the default speed
    // and not the last nudge — that carrying over is its own, separate setting.
    const { memory, ctx } = await runtime(w, load, { playback: { rememberSpeed: false }, channelPrefs: { UCaaaaaaaaaaaaaaaaaaaaaa: { name: 'Lectures', speed: 1.5 } } });
    await delay(150);
    assert(ctx.channel().id === 'UCaaaaaaaaaaaaaaaaaaaaaa' && ctx.channel().name === 'Lectures', 'Channel not identified: ' + JSON.stringify(ctx.channel()));
    assert(video.playbackRate === 1.5 && memory.settings.playback.defaultSpeed === 1, 'Channel speed not applied, or written to the global setting');
    // A nudge on this video wins over the channel, and survives a source swap.
    w.dispatchEvent(new w.KeyboardEvent('keydown', { code: 'Period', shiftKey: true, bubbles: true })); await delay(5);
    video.dispatchEvent(new w.Event('loadeddata'));
    assert(Math.abs(video.playbackRate - 1.55) < 0.001, 'Nudge lost to the channel speed: ' + video.playbackRate);
    // Another video on the same channel: the channel speed, not the nudge.
    video.remove(); const second = w.makeVideo();
    w.history.replaceState({}, '', '/watch?v=B'); w.document.dispatchEvent(new w.Event('yt-navigate-finish'));
    await delay(250);
    assert(second.playbackRate === 1.5, 'Channel speed did not return on the next video: ' + second.playbackRate);
    // A video on another channel: global preferences, and the panel says so.
    link.href = '/@othercreator'; text.textContent = 'Other';
    second.remove(); const third = w.makeVideo();
    w.history.replaceState({}, '', '/watch?v=C'); w.document.dispatchEvent(new w.Event('yt-navigate-finish'));
    await delay(250);
    assert(ctx.channel().id === '@othercreator' && third.playbackRate === 1, 'Other channel inherited the override: ' + third.playbackRate);
    // Keeping the speed here writes it under the stable id, never the name.
    third.playbackRate = 2;
    w.CostumPanel.toggleOpen(true);   // opening re-renders, so the chip reads the live rate
    const keep = panelRoot(w).querySelector('[data-control-id="chip:channel-speed"]');
    assert(keep && /2×/.test(keep.textContent), 'Keep-speed chip missing or wrong: ' + (keep && keep.textContent));
    keep.click(); await delay(80);
    assert(memory.settings.channelPrefs['@othercreator'] && memory.settings.channelPrefs['@othercreator'].speed === 2 && !memory.settings.channelPrefs.Other, 'Channel speed not kept under its id');
    assert(memory.settings.playback.defaultSpeed === 1, 'Keeping a channel speed changed the global default');
    // Clutter kept for a channel shows in the stylesheet and a badge, not in storage.
    panelRoot(w).querySelector('[data-control-id="chip:channel-clutter"]').click(); await delay(80);
    await ctx.patch({ declutter: { watch: { comments: true } } }); await delay(50);
    assert(memory.settings.channelPrefs['@othercreator'].watch.comments === false, 'Channel clutter snapshot wrong');
    assert(!w.document.getElementById('costum-declutter').textContent.includes('comments'), 'Global comments rule painted despite channel override');
    assert(panelRoot(w).querySelector('[data-control-id="toggle:Hide comments"] .badge'), 'No channel badge on the overridden row');
    // Applying a built-in mode from the panel persists global values, never the channel's.
    panelRoot(w).querySelector('[data-control-id="segment:Study"]').click(); await delay(80);
    assert(memory.settings.profile === 'study' && memory.settings.playback.defaultSpeed === 1.5 && memory.settings.channelPrefs['@othercreator'].speed === 2, 'Mode apply leaked channel state');
  });

  await frameTest('The first open offers a starting mode once, and a pick applies it and never asks again', async (w, load) => {
    w.makeVideo();
    const { memory } = await runtime(w, load, {}, {});
    await delay(80);
    assert(panelRoot(w).querySelector('[data-control-id="welcome"]'), 'No welcome on the first open');
    assert(panelRoot(w).querySelectorAll('[data-control-id="segment:Study"]').length === 1, 'The welcome shares control ids with the Modes section');
    panelRoot(w).querySelector('[data-control-id="welcome:study"]').click(); await delay(80);
    assert(memory.settings.profile === 'study' && memory.welcomed === true, 'Picking did not apply the mode and remember it');
    assert(!panelRoot(w).querySelector('[data-control-id="welcome"]'), 'Welcome still shown after a pick');
  });

  await frameTest('A saved mode applies, previews, undoes and deletes without touching credentials or the lock', async (w, load) => {
    w.makeVideo();
    const { memory, ctx } = await runtime(w, load, { audio: { boost: 2 }, summary: { apiKey: 'device-key' }, focus: { openDelay: 3 } });
    await delay(150);
    panelRoot(w).querySelector('[data-control-id="chip:mode-save"]').click();
    const input = panelRoot(w).querySelector('[data-control-id="mode-name"]');
    input.value = 'Lectures';
    panelRoot(w).querySelector('[data-control-id="mode-save-go"]').click(); await delay(80);
    const mode = memory.settings.customModes[0];
    assert(mode && mode.name === 'Lectures' && mode.patch.audio.boost === 2 && !mode.patch.summary && !mode.patch.focus, 'Mode not saved cleanly: ' + JSON.stringify(memory.settings.customModes));
    assert(memory.settings.profile === 'custom:' + mode.id, 'Saved mode is not active');
    // The sheet says which mode is on and how far each section reaches; a
    // pressed segment alone says "selected", not what was selected for you.
    assert(panelRoot(w).querySelector('.mode-note').textContent.includes('Lectures'), 'Panel does not name the mode in force');
    assert(panelRoot(w).querySelectorAll('.sec-scope').length >= 4, 'Panel sections do not say how far they reach');
    await ctx.patch({ profile: 'default', audio: { boost: 5 }, picture: { brightness: 60 } }); await delay(50);
    const preview = w.CostumDefaults.modePreview(memory.settings, 'custom:' + mode.id);
    assert(preview.includes('audio.boost') && preview.includes('picture.brightness'), 'Preview incomplete: ' + preview);
    const segment = [...panelRoot(w).querySelectorAll('[data-control-id="segment:Lectures"]')][0];
    segment.click(); await delay(80);
    assert(memory.settings.audio.boost === 2 && memory.settings.picture.brightness === 100 && memory.settings.summary.apiKey === 'device-key' && memory.settings.focus.openDelay === 3, 'Mode apply wrong: ' + JSON.stringify([memory.settings.audio, memory.settings.picture.brightness]));
    assert(w.FakeAudioContext.last.audible(firstSource(w)) === 2, 'Boost from the mode not audible');
    panelRoot(w).querySelector('[data-control-id="segment:Lectures"]').click(); await delay(80);
    assert(memory.settings.audio.boost === 5 && memory.settings.picture.brightness === 60 && memory.settings.profile === 'default', 'Undo did not restore what the mode displaced');
    await ctx.ask('settings.replace', { settings: w.CostumDefaults.deleteCustomMode(memory.settings, mode.id) }); await delay(50);
    assert(memory.settings.customModes.length === 0 && !panelRoot(w).querySelector('[data-control-id="segment:Lectures"]'), 'Deleted mode still offered');
  });


  await frameTest('Exact channel rules match identity, text rules say so, and each card explains itself', async (w, load) => {
    await load('content/modules/contentblock.js');
    const doc = w.document;
    const card = (tag, title, channelName, href) => {
      const item = doc.createElement(tag);
      const t = doc.createElement('a'); t.id = 'video-title'; t.textContent = title; item.appendChild(t);
      const ch = doc.createElement('ytd-channel-name'); const a = doc.createElement('a'); a.textContent = channelName; if (href) a.setAttribute('href', href); ch.appendChild(a); item.appendChild(ch);
      doc.body.appendChild(item); return item;
    };
    const byId = card('ytd-video-renderer', 'Lecture 1', 'Physics Now', '/channel/UCphysicsphysics1234');
    const byHandle = card('ytd-video-renderer', 'Lecture 2', 'Physics Now', '/@physicsnow');
    const lookalike = card('ytd-video-renderer', 'Lecture 3', 'Physics Now Fans', '/@physicsnowfans');
    const byName = card('ytd-rich-item-renderer', 'Lecture 4', 'Chemistry Hour', null);
    const unrelated = card('ytd-compact-video-renderer', 'Cooking', 'Kitchen', '/@kitchen');
    await w.patch({ block: { exactChannels: ['UCphysicsphysics1234', '@PhysicsNow', 'Chemistry Hour'], channels: ['kitch'] } });
    w.mod('contentblock').apply(w.settings);
    assert(byId.hasAttribute('costum-blocked') && byHandle.hasAttribute('costum-blocked') && byName.hasAttribute('costum-blocked'), 'Exact rules missed a card');
    assert(!lookalike.hasAttribute('costum-blocked'), 'Exact rule matched a look-alike channel');
    assert(unrelated.hasAttribute('costum-blocked'), 'Text rule missed');
    w.ctx.panel.showList = (rows) => { w.rows = rows; };
    w.ctx.channel = () => ({ id: '', name: '' });
    w.mod('contentblock').actions.blockedList(w.ctx);
    const notes = w.rows.map((r) => r.note);
    assert(w.rows.length === 4 && notes.some((n) => n.startsWith('channel “UCphysicsphysics1234”')) && notes.some((n) => n.startsWith('channel name contains “kitch”')), 'Reasons unclear: ' + notes.join(' | '));
    w.rows.find((r) => r.title === 'cooking').act();
    assert(!unrelated.hasAttribute('costum-blocked'), 'Per-card reveal failed');
    w.mod('contentblock').onMutation([unrelated], w.settings);
    assert(!unrelated.hasAttribute('costum-blocked') && byId.hasAttribute('costum-blocked'), 'Reveal did not stick, or leaked');
    // Removing one rule restores only its cards.
    await w.patch({ block: { exactChannels: ['Chemistry Hour'] } });
    w.mod('contentblock').apply(w.settings);
    assert(!byId.hasAttribute('costum-blocked') && !byHandle.hasAttribute('costum-blocked') && byName.hasAttribute('costum-blocked'), 'Removing a rule did not restore its cards');
    // Blocking the channel being watched adds its id and whole name.
    w.ctx.channel = () => ({ id: 'UCwatchingwatching12', name: 'Watching Now' });
    await w.mod('contentblock').actions.blockChannel(w.ctx);
    assert(w.settings.block.exactChannels.includes('UCwatchingwatching12') && w.settings.block.exactChannels.includes('Watching Now'), 'Block-this-channel did not add identity');
  });

  await frameTest('Mobile cards are judged and a burst of cards is processed within a budget', async (w, load) => {
    await load('content/modules/contentblock.js');
    const doc = w.document;
    const mobile = doc.createElement('ytm-video-with-context-renderer');
    const h = doc.createElement('h3'); h.className = 'media-item-headline'; h.textContent = 'Spoiler filled recap'; mobile.appendChild(h);
    const byline = doc.createElement('ytm-badge-and-byline-renderer'); const name = doc.createElement('span'); name.className = 'yt-core-attributed-string'; name.textContent = 'Recap Channel'; byline.appendChild(name); mobile.appendChild(byline);
    doc.body.appendChild(mobile);
    await w.patch({ block: { keywords: ['spoiler'] } });
    w.mod('contentblock').apply(w.settings);
    assert(mobile.hasAttribute('costum-blocked'), 'Mobile card not judged');
    // A feed section with many cards lands in one batch: the first budget's
    // worth is judged now, the rest shortly after — and nothing rescans the
    // document to do it.
    const section = doc.createElement('ytd-item-section-renderer');
    for (let i = 0; i < 700; i++) { const c = doc.createElement('ytd-rich-item-renderer'); const t = doc.createElement('a'); t.id = 'video-title'; t.textContent = i % 2 ? 'spoiler ' + i : 'fine ' + i; c.appendChild(t); section.appendChild(c); }
    doc.body.appendChild(section);
    const qsa = doc.querySelectorAll.bind(doc); let documentScans = 0;
    doc.querySelectorAll = (sel) => { documentScans++; return qsa(sel); };
    w.mod('contentblock').onMutation([section, ...section.children], w.settings);
    const now = section.querySelectorAll('[costum-blocked]').length;
    assert(now > 0 && now <= w.CostumBlockInternals.BUDGET / 2 + 1, 'Budget not applied: ' + now);
    await delay(50);
    assert(section.querySelectorAll('[costum-blocked]').length === 350 && documentScans === 0, 'Backlog not drained, or the document was rescanned: ' + documentScans);
    // Unrelated settings changes do not rescan either.
    await w.patch({ picture: { brightness: 90 } });
    w.mod('contentblock').apply(w.settings);
    assert(documentScans === 0, 'A settings change rescanned the page');
    doc.querySelectorAll = qsa;
  });


  await frameTest('Bookmarks persist in their own store with limits, and never travel with settings', async (w, load) => {
    const { ask, memory } = await background(w, load, true);
    const added = await ask('bookmarks.add', { entry: { videoId: 'dQw4w9WgXcQ', at: 83.9, note: 'Good bit', title: 'Talk' } });
    assert(added.ok && added.result.at === 83 && memory.bookmarks.items.length === 1, 'Add failed: ' + JSON.stringify(added));
    assert(!(await ask('bookmarks.add', { entry: { at: 3 } })).ok, 'Invalid bookmark accepted');
    const listed = (await ask('bookmarks.list', { videoId: 'dQw4w9WgXcQ' })).result;
    assert(listed.items.length === 1 && listed.count === 1 && listed.limit === 500, 'List wrong: ' + JSON.stringify(listed));
    const updated = (await ask('bookmarks.update', { id: added.result.id, patch: { note: 'Better note' } })).result;
    assert(updated.note === 'Better note' && updated.updatedAt >= updated.createdAt, 'Update failed');
    // Settings export, reset and import never touch the library.
    await ask('settings.reset');
    await ask('settings.import', { payload: w.CostumDefaults.packageExport(w.CostumDefaults.withDefaults({})) });
    assert(memory.bookmarks.items.length === 1 && !JSON.stringify(memory.settings).includes('Better note'), 'Settings operations touched bookmarks');
    assert(!JSON.stringify(w.CostumDefaults.packageExport(memory.settings)).includes('Better note'), 'Settings export carried bookmarks');
    // The library is bounded, and says so.
    const items = Array.from({ length: 499 }, (_, i) => ({ videoId: 'v' + String(i).padStart(10, '0'), at: i }));
    const imported = (await ask('bookmarks.import', { payload: { format: 'costum-bookmarks', version: 1, items } })).result;
    assert(imported.added === 499 && imported.count === 500, 'Import short: ' + JSON.stringify(imported));
    const full = await ask('bookmarks.add', { entry: { videoId: 'zzzzzzzzzzz', at: 1 } });
    assert(!full.ok && full.error === 'bookmarks-full', 'Limit not enforced');
    assert(!(await ask('bookmarks.import', { payload: { format: 'costum-settings', version: 1, settings: {} } })).ok, 'Settings file accepted as bookmarks');
    // Deleted stays deleted, and export is its own envelope.
    assert((await ask('bookmarks.delete', { id: added.result.id })).result === 1 && memory.bookmarks.items.length === 499, 'Delete failed');
    const exported = (await ask('bookmarks.export')).result;
    assert(exported.format === 'costum-bookmarks' && exported.items.length === 499 && !exported.items.some((b) => b.id === added.result.id), 'Export wrong');
    await ask('bookmarks.clear');
    assert(memory.bookmarks.items.length === 0, 'Clear failed');
  });

  await frameTest('Panel bookmarks save the current moment, jump to it, delete it, and survive a restart', async (w, load) => {
    const video = w.makeVideo();
    video.currentTime = 125.4;
    const { memory, ctx, api } = await runtime(w, load);
    await delay(150);
    const root = panelRoot(w);
    w.CostumPanel.toggleOpen(true);
    root.querySelector('[data-control-id="chip:bookmark"]').click();
    const note = root.querySelector('[data-control-id="bookmark-note"]');
    assert(note && root.querySelector('[data-control-id="bookmark-save"]').textContent.includes('2:05'), 'Save form did not read the current time');
    note.value = 'The proof';
    root.querySelector('[data-control-id="bookmark-save"]').click();
    await delay(120);
    const saved = memory.bookmarks && memory.bookmarks.items[0];
    assert(saved, 'Nothing saved: ' + JSON.stringify(memory.bookmarks) + ' ' + w.toasts);
    assert(saved.at === 125 && saved.note === 'The proof' && saved.videoId === ctx.videoId(), 'Saved entry wrong: ' + JSON.stringify(saved));
    const jump = panelRoot(w).querySelector('[data-control-id="bookmark-jump:' + saved.id + '"]');
    assert(jump && jump.textContent === '2:05', 'Bookmark not listed for this video');
    video.currentTime = 0; jump.click(); await delay(5);   // actions run on a microtask
    assert(video.currentTime === 125, 'Jump did not seek');
    // A bookmark from another video navigates there with the time.
    // (location.href assignment cannot be intercepted here; the link shape is
    // asserted instead, and the seek path above is the same-video branch.)
    memory.bookmarks.items.push(w.CostumBookmarks.normalize({ videoId: 'otherVideo1', at: 7 }));
    assert(w.CostumBookmarks.link(memory.bookmarks.items[1]) === 'https://www.youtube.com/watch?v=otherVideo1&t=7s', 'Cross-video link wrong');
    // Restart: a fresh runtime over the same storage still lists it.
    memory.bookmarks.items.pop();
    const stored = structuredClone(memory.bookmarks);
    const again = (await api.runtime.sendMessage({ type: 'bookmarks.list', videoId: ctx.videoId() })).result;
    assert(again.items.length === 1 && JSON.stringify(stored.items[0]) === JSON.stringify(again.items[0]), 'Bookmark did not survive as stored');
    panelRoot(w).querySelector('[data-control-id="bookmark-delete:' + saved.id + '"]').click();
    await delay(120);
    assert(memory.bookmarks.items.length === 0 && !panelRoot(w).querySelector('[data-control-id^="bookmark-jump:"]'), 'Delete did not stick');
    // The shortcut saves without a note.
    video.currentTime = 30;
    await ctx.patch({ shortcuts: { bookmark: 'Shift+KeyB' } });
    w.dispatchEvent(new w.KeyboardEvent('keydown', { code: 'KeyB', shiftKey: true, bubbles: true })); await delay(120);
    assert(memory.bookmarks.items.length === 1 && memory.bookmarks.items[0].at === 30 && memory.bookmarks.items[0].note === '', 'Shortcut did not bookmark');
  });


  await frameTest('A long video says how many paid requests it needs and waits for a yes', async (w, load) => {
    await setupSummary(w, load);
    w.fetch = async () => ({ ok: true, json: async () => ({ events: Array.from({ length: 120 }, (_, i) => ({ tStartMs: i * 1000, segs: [{ utf8: 'word '.repeat(200) }] })) }) });
    let made = 0; let checks = 0;
    w.ctx.ask = async (type, p) => {
      if (type === 'summary.list') return [];
      if (type !== 'summary.make') return true;
      if (p.check) { checks++; assert(p.transcript.length > 30000, 'Check sent without the transcript'); return { cached: false, requests: 4 }; }
      made++; return { text: '[00:01] Done.', requests: 4 };
    };
    const run = w.mod('summary').actions.summarize(w.ctx);
    await delay(30);
    const asked = w.shown.at(-1);
    assert(asked.state === 'confirm' && asked.requests === 4 && /4 paid requests/.test(asked.notice) && made === 0, 'No confirmation before paying: ' + JSON.stringify(asked));
    assert(/Captions: English · partial, through|Captions: English · full/.test(asked.notice), 'Coverage missing from the notice: ' + asked.notice);
    w.mod('summary').actions.summaryCancel(w.ctx);
    await run;
    assert(made === 0 && w.shown.at(-1).state === 'idle', 'Cancel at the confirmation still paid');
    // Said yes: the run proceeds and progress reaches the panel.
    const again = w.mod('summary').actions.summarize(w.ctx);
    await delay(30);
    w.mod('summary').actions.summaryConfirm(w.ctx);
    await delay(5);
    const requestId = w.shown.find((s) => s.state === 'loading' && s.progress) && true;
    w.dispatchEvent(new w.CustomEvent('costum:summary-progress', { detail: { requestId: 'nope', step: 3, total: 4 } }));
    await again;
    assert(made === 1 && checks === 2 && w.shown.at(-1).state === 'done', 'Confirmed run did not complete');
    assert(requestId && !w.shown.some((s) => s.progress && s.progress.step === 3), 'Progress from another job was shown');
    // A saved copy needs no request and no confirmation.
    w.ctx.ask = async (type, p) => (type === 'summary.list' ? [] : p.check ? { cached: true, requests: 4 } : { text: 'Cached text', cached: true, requests: 0 });
    await w.mod('summary').actions.summarize(w.ctx, 'detailed');
    assert(w.shown.at(-1).state === 'done' && !w.shown.slice(-3).some((s) => s.state === 'confirm') && /Saved summary/.test(w.shown.at(-1).notice), 'Cached run asked or mislabeled');
  });

  await frameTest('The caption track and its coverage are named, auto-generated included', async (w, load) => {
    await load('content/modules/summary.js');
    const api = w.CostumSummaryInternals;
    const L = { captions: 'Captions: ', auto: 'auto-generated', full: 'full coverage', partialShort: 'partial, through ' };
    assert(api.coverage(L, { track: { lang: 'ar', kind: 'asr', name: 'Arabic' }, partial: false }) === 'Captions: Arabic (auto-generated) · full coverage', 'ASR track not labelled');
    assert(api.coverage(L, { track: { lang: 'en', kind: '', name: 'English' }, partial: true, lastSeconds: 754 }) === 'Captions: English · partial, through 12:34', 'Partial coverage not labelled');
  });

  await frameTest('Background reports cost on check, sends progress per request, and lists and deletes saved summaries', async (w, load) => {
    const { ask, api, memory } = await background(w, load);
    const sent = [];
    api.tabs = { sendMessage: async (tabId, msg) => { sent.push([tabId, msg]); } };
    let requests = 0;
    w.fetch = async () => { requests++; return { ok: true, json: async () => ({ content: [{ type: 'text', text: '[00:01] Note.' }] }) }; };
    const transcript = Array.from({ length: 60 }, () => '[00:01] ' + 'x'.repeat(990)).join('\n');
    const job = { requestId: 'long', videoId: 'A', title: 'Long talk', transcript, captionTrack: 'en||English' };
    const cost = (await ask('summary.make', { ...job, check: true })).result;
    assert(cost.cached === false && cost.requests === 3 && requests === 0, 'Check paid or miscounted: ' + JSON.stringify(cost));
    const made = (await ask('summary.make', job)).result;
    assert(made.requests === 3 && requests === 3, 'Run did not report its cost');
    assert(sent.length === 3 && sent.every(([tabId, m]) => tabId === 1 && m.type === 'summary.progress' && m.requestId === 'long' && m.total === 3) && sent.map(([, m]) => m.step).join() === '1,2,3', 'Progress not sent per request: ' + JSON.stringify(sent));
    assert((await ask('summary.make', { ...job, check: true })).result.cached === true, 'Check did not see the saved copy');
    const listed = (await ask('summary.list', { videoId: 'A' })).result;
    assert(listed.length === 1 && listed[0].title === 'Long talk' && listed[0].text && listed[0].key, 'Saved summary not listed: ' + JSON.stringify(listed));
    assert((await ask('summary.list', { videoId: 'B' })).result.length === 0, 'Listing leaked across videos');
    await ask('summary.delete', { key: listed[0].key });
    assert(memory.summaryCache.length === 0 && (await ask('summary.make', { ...job, check: true })).result.cached === false, 'Delete left the entry');
  });

  await frameTest('The panel offers a saved summary without a request, and copies it with the video link', async (w, load) => {
    w.makeVideo();
    const { memory, ctx } = await runtime(w, load, { summary: { enabled: true, apiKey: 'fake-test-key' } });
    memory.summaryCache = [{ key: 'k1', text: '[00:05] Saved point.', at: Date.now(), videoId: 'A', title: 'Kept talk', detail: 'brief', language: 'auto', model: 'claude-opus-5' }];
    // Saved copies are looked up once per video: arrive at it again.
    w.document.dispatchEvent(new w.Event('yt-navigate-finish')); await delay(250);
    w.CostumPanel.toggleOpen(true);
    const chip = panelRoot(w).querySelector('[data-control-id="chip:summary-saved"]');
    assert(chip, 'Saved-summary chip missing');
    let paid = 0; w.fetch = async () => { paid++; return { ok: true, json: async () => ({}) }; };
    chip.click(); await delay(20);
    const box = panelRoot(w).querySelector('.summary');
    assert(box.textContent.includes('Saved point') && box.querySelector('.summary-seek') && paid === 0, 'Saved summary not shown, or a request was made');
    let copied = '';
    w.navigator.clipboard.writeText = async (text) => { copied = text; };
    [...box.querySelectorAll('.summary-actions .chip')].find((b) => /Copy/.test(b.textContent)).click(); await delay(10);
    assert(copied.startsWith('Kept talk\nhttps://www.youtube.com/watch?v=A\n\n[00:05]'), 'Copy lacks title and link: ' + JSON.stringify(copied));
  });

  const failed = results.filter((r) => !r.passed).length;
  self.CostumFeatureTestResult = { passed: results.length - failed, failed, results };
  document.title = (failed ? 'FAIL' : 'PASS') + ': Costum feature tests';
  document.getElementById('report').textContent = JSON.stringify(self.CostumFeatureTestResult, null, 2);
})();
