(function () {
  'use strict';
  const Costum = self.Costum;

  const WORDS = {
    en: {
      disabled: 'Turn on summaries from the Costum toolbar icon.', key: 'Add your Claude API key from the Costum toolbar icon.',
      'no-captions': 'This video has no captions to summarize.', 'empty-transcript': 'The caption track contains no readable text.',
      'bridge-unavailable': 'The player connection is unavailable. Reload YouTube and check Costum’s site access.',
      'captions-pending': 'Captions are not ready for this video. Wait a moment and retry.',
      'transcript-expired': 'The caption link expired. Reload the video and retry.',
      'transcript-invalid': 'YouTube returned an unreadable caption track.',
      'transcript-timeout': 'Captions took too long to load. Retry when your connection improves.',
      'invalid-key': 'The Claude API key was rejected. Update it in Costum’s settings.',
      'no-api-key': 'Add your Claude API key in Costum’s settings.',
      'access-denied': 'This API key cannot access the selected model.',
      'model-unavailable': 'The selected model is unavailable. Choose another model in settings.',
      'rate-limited': 'Claude’s rate limit was reached. Wait before retrying.',
      'summary-timeout': 'Claude took too long to respond. You can retry; the provider may still bill the previous request.',
      'service-unavailable': 'Claude is temporarily unavailable. Try again later.',
      'network-error': 'Could not connect. Check your connection and retry.',
      'request-invalid': 'Claude rejected the request. Check the model and your API account.',
      'output-truncated': 'Claude’s response was incomplete. Try the brief summary.',
      'empty-summary': 'Claude returned no summary. You can retry.',
      'summary-disabled': 'Summaries are turned off.',
      generic: 'Could not create the summary. Check your connection and settings, then retry.',
      budget: 'Long videos use up to 4 transcript requests and 1 combined summary request. Each request uses your API key.',
      partial: 'Partial coverage through ', cached: 'Saved summary', cancelled: 'Summary cancelled.',
      captions: 'Captions: ', auto: 'auto-generated', full: 'full coverage', partialShort: 'partial, through ',
      requests: (n) => 'This will use ' + n + ' paid request' + (n === 1 ? '' : 's') + ' on your API key.',
      requestsCached: 'A saved summary exists — no request needed.',
      progress: (step, total) => 'Request ' + step + ' of ' + total + '…', reading: 'Reading the captions…', confirmTitle: 'Long video'
    },
    ar: {
      disabled: 'فعّل الملخصات من أيقونة Costum في شريط الأدوات.', key: 'أضف مفتاح Claude API من أيقونة Costum.',
      'no-captions': 'لا توجد ترجمة نصية لهذا الفيديو.', 'empty-transcript': 'مسار الترجمة لا يحتوي على نص مقروء.',
      'bridge-unavailable': 'الاتصال بالمشغّل غير متاح. أعد تحميل يوتيوب وتحقق من إذن الموقع.',
      'captions-pending': 'الترجمة غير جاهزة لهذا الفيديو. انتظر قليلاً وأعد المحاولة.',
      'transcript-expired': 'انتهت صلاحية رابط الترجمة. أعد تحميل الفيديو.',
      'transcript-invalid': 'تعذّرت قراءة مسار الترجمة.', 'transcript-timeout': 'استغرق تحميل الترجمة وقتاً طويلاً. أعد المحاولة.',
      'invalid-key': 'تم رفض مفتاح Claude API. حدّثه في الإعدادات.', 'no-api-key': 'أضف مفتاح Claude API في الإعدادات.',
      'access-denied': 'المفتاح لا يتيح الوصول إلى النموذج المحدد.', 'model-unavailable': 'النموذج غير متاح. اختر نموذجاً آخر.',
      'rate-limited': 'تم بلوغ حد الطلبات. انتظر قبل إعادة المحاولة.',
      'summary-timeout': 'استغرق Claude وقتاً طويلاً. يمكنك إعادة المحاولة؛ قد تُحتسب تكلفة الطلب السابق.',
      'service-unavailable': 'Claude غير متاح مؤقتاً. حاول لاحقاً.', 'network-error': 'تعذّر الاتصال. تحقق من الشبكة.',
      'request-invalid': 'تم رفض الطلب. تحقق من النموذج وحساب API.', 'output-truncated': 'الرد غير مكتمل. جرّب الملخص الموجز.',
      'empty-summary': 'لم يُرجع Claude ملخصاً. أعد المحاولة.', 'summary-disabled': 'الملخصات متوقفة.',
      generic: 'تعذّر إنشاء الملخص. تحقق من الاتصال والإعدادات وأعد المحاولة.',
      budget: 'الفيديو الطويل يستخدم حتى 4 طلبات للنص وطلب لدمج الملخصات، باستخدام مفتاح API الخاص بك.',
      partial: 'تغطية جزئية حتى ', cached: 'ملخص محفوظ', cancelled: 'تم إلغاء الملخص.',
      captions: 'الترجمة: ', auto: 'تلقائية', full: 'تغطية كاملة', partialShort: 'جزئية، حتى ',
      requests: (n) => 'رح يستخدم ' + n + ' طلب مدفوع على مفتاح API.',
      requestsCached: 'في ملخص محفوظ — ما في حاجة لطلب.',
      progress: (step, total) => 'الطلب ' + step + ' من ' + total + '…', reading: 'عم أقرأ الترجمة…', confirmTitle: 'فيديو طويل'
    }
  };
  let active = null;
  let sequence = 0;
  let lastDetail = 'brief';
  let lastSettings = '';

  function words(ctx) {
    const locale = ctx.settings().locale;
    return WORDS[locale === 'ar' || (locale === 'auto' && navigator.language.startsWith('ar')) ? 'ar' : 'en'];
  }

  function clock(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
  }

  function pickTrack(tracks, language) {
    if (!tracks.length) return null;
    const candidates = language === 'auto' ? tracks : tracks.filter((track) => track.lang === language || track.lang.split('-')[0] === language);
    const pool = candidates.length ? candidates : tracks;
    return pool.find((track) => !track.kind) || pool[0];
  }

  function extractTranscript(data) {
    if (!data || !Array.isArray(data.events)) throw new Error('transcript-invalid');
    const lines = [];
    const timestamps = [];
    let used = 0;
    let chunkUsed = 0;
    let chunks = 1;
    let partial = false;
    let lastSeconds = 0;
    outer: for (const event of data.events) {
      if (!Array.isArray(event.segs)) continue;
      const text = event.segs.map((seg) => typeof seg.utf8 === 'string' ? seg.utf8 : '').join('').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      const at = Math.max(0, Number(event.tStartMs) || 0) / 1000;
      for (let offset = 0; offset < text.length; offset += 1000) {
        const line = '[' + clock(at) + '] ' + text.slice(offset, offset + 1000);
        const size = line.length + 1;
        if (chunkUsed + size > 29000) { chunks++; chunkUsed = 0; }
        if (chunks > 4 || used + size > 116000) { partial = true; break outer; }
        lines.push(line); timestamps.push(Math.floor(at));
        used += size; chunkUsed += size;
        lastSeconds = at;
      }
    }
    if (!lines.length) throw new Error('empty-transcript');
    return { text: lines.join('\n'), timestamps: [...new Set(timestamps)], partial, lastSeconds, chunks };
  }

  async function transcriptFor(meta, language, signal) {
    const track = pickTrack(meta.captionTracks || [], language);
    if (!track) throw new Error('no-captions');
    const url = new URL(track.baseUrl);
    if (url.protocol !== 'https:' || !(url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com'))) throw new Error('transcript-invalid');
    url.searchParams.set('fmt', 'json3');
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal.addEventListener('abort', cancel, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 15000);
    try {
      if (signal.aborted) throw new Error('cancelled');
      const res = await fetch(url.href, { credentials: 'include', signal: controller.signal });
      if (res.status === 403 || res.status === 410) throw new Error('transcript-expired');
      if (!res.ok) throw new Error('network-error');
      const result = extractTranscript(await res.json());
      result.captionTrack = [track.lang, track.kind, track.name].join('|');
      result.track = { lang: track.lang, kind: track.kind, name: track.name };
      return result;
    } catch (error) {
      if (signal.aborted) throw new Error('cancelled');
      if (timedOut) throw new Error('transcript-timeout');
      if (error instanceof SyntaxError) throw new Error('transcript-invalid');
      throw error;
    } finally { clearTimeout(timer); signal.removeEventListener('abort', cancel); }
  }

  function cancel(ctx, clear = true) {
    if (active) {
      active.controller.abort();
      const waiting = pendingConfirm.get(active.id);
      if (waiting) waiting(false);
      ctx.ask('summary.cancel', { requestId: active.id }).catch(() => {});
      active = null;
    }
    if (clear) ctx.panel.showSummary({ state: 'idle' });
  }

  function confirm(ctx) {
    const waiting = active && pendingConfirm.get(active.id);
    if (waiting) waiting(true);
  }

  /* What the reader is told before anything is paid for: which caption
     track, how much of the video it covers, and how many requests the run
     would make. A one-request video just starts; a long one asks first. */
  function coverage(L, transcript) {
    const track = transcript.track || {};
    const name = track.name || track.lang || '';
    const kind = track.kind === 'asr' ? ' (' + L.auto + ')' : '';
    const extent = transcript.partial ? L.partialShort + clock(transcript.lastSeconds) : L.full;
    return L.captions + name + kind + ' · ' + extent;
  }

  let saved = { videoId: '', entries: [] };
  async function loadSaved(ctx) {
    const videoId = ctx.videoId();
    if (!videoId || !ctx.settings().summary.enabled) { saved = { videoId: '', entries: [] }; return; }
    try {
      const entries = await ctx.ask('summary.list', { videoId });
      if (ctx.videoId() === videoId) saved = { videoId, entries: entries || [] };
    } catch (e) { if (ctx.videoId() === videoId) saved = { videoId, entries: [] }; }
    window.dispatchEvent(new CustomEvent('costum:summaries'));
  }

  function showSaved(ctx, entry) {
    const L = words(ctx);
    ctx.panel.showSummary({ state: 'done', videoId: entry.videoId, detail: entry.detail, title: entry.title, text: entry.text,
      timestamps: [...entry.text.matchAll(/\[(\d+):(\d{2})\]/g)].map((m) => Number(m[1]) * 60 + Number(m[2])),
      notice: L.cached + (entry.partial ? ' · ' + L.partial : '') });
  }

  const pendingConfirm = new Map();   // job id → resolve(go)

  async function run(ctx, detail = lastDetail) {
    const s = ctx.settings();
    const L = words(ctx);
    if (!s.enabled || !s.summary.enabled) return ctx.toast(L.disabled);
    if (!s.summary.apiKey) return ctx.toast(L.key);
    const videoId = ctx.videoId();
    if (!videoId || !location.pathname.startsWith('/watch')) return;
    detail = detail === 'detailed' ? 'detailed' : 'brief';
    if (active && active.videoId === videoId && active.detail === detail) return;
    cancel(ctx, false);
    lastDetail = detail;
    const job = { id: Date.now() + '-' + (++sequence), videoId, detail, controller: new AbortController() };
    active = job;
    const current = () => active === job && ctx.videoId() === videoId && ctx.settings().enabled && ctx.settings().summary.enabled;
    const state = { videoId, detail, title: '', notice: L.budget };
    ctx.panel.showSummary(Object.assign({}, state, { state: 'loading' }));
    try {
      const meta = await ctx.meta();
      if (!current()) return;
      if (meta.videoId !== videoId) throw new Error('video-changed');
      if (meta.captionsReady === false) throw new Error('captions-pending');
      if (!meta.captionVideoId && !(meta.captionTracks || []).length && ctx.bridge && !ctx.bridge().ready) throw new Error('bridge-unavailable');
      if (meta.captionVideoId && meta.captionVideoId !== videoId) throw new Error('captions-pending');
      state.title = meta.title;
      let transcript;
      try { transcript = await transcriptFor(meta, s.summary.language, job.controller.signal); }
      catch (error) {
        if (error.message !== 'transcript-expired' || !current()) throw error;
        const refreshed = await ctx.meta();
        if (!current() || refreshed.videoId !== videoId || refreshed.captionVideoId !== videoId) throw new Error('video-changed');
        transcript = await transcriptFor(refreshed, s.summary.language, job.controller.signal);
      }
      if (!current()) return;
      const payload = {
        requestId: job.id, videoId, detail, title: meta.title,
        transcript: transcript.text, captionTrack: transcript.captionTrack, partial: transcript.partial
      };
      state.coverage = coverage(L, transcript);
      // What it would cost, before it costs anything.
      const cost = await ctx.ask('summary.make', Object.assign({ check: true }, payload));
      if (!current()) return;
      const requests = cost && !cost.cached ? cost.requests : 0;
      state.notice = state.coverage + '. ' + (requests ? L.requests(requests) : L.requestsCached);
      if (requests > 1) {
        // A long video: several paid requests. Say so, and wait for a yes.
        const go = await new Promise((resolve) => {
          pendingConfirm.set(job.id, resolve);
          ctx.panel.showSummary(Object.assign({}, state, { state: 'confirm', requests }));
        });
        pendingConfirm.delete(job.id);
        if (!go || !current()) return;
      }
      ctx.panel.showSummary(Object.assign({}, state, { state: 'loading', progress: requests ? { step: 1, total: requests } : null }));
      const onProgress = (ev) => {
        if (!ev.detail || ev.detail.requestId !== job.id || !current()) return;
        ctx.panel.showSummary(Object.assign({}, state, { state: 'loading', progress: { step: ev.detail.step, total: ev.detail.total } }));
      };
      window.addEventListener('costum:summary-progress', onProgress);
      let result;
      try { result = await ctx.ask('summary.make', payload); }
      finally { window.removeEventListener('costum:summary-progress', onProgress); }
      if (!current()) return;
      ctx.panel.showSummary(Object.assign({}, state, {
        state: 'done', text: result.text, timestamps: transcript.timestamps,
        notice: state.coverage + (result.cached ? ' · ' + L.cached : '')
      }));
      loadSaved(ctx);
    } catch (error) {
      if (!current()) return;
      const code = String(error && error.message || error);
      if (code === 'cancelled') { ctx.panel.showSummary({ state: 'idle' }); return; }
      ctx.panel.showSummary(Object.assign({}, state, { state: 'error', text: L[code] || L.generic }));
    } finally { if (active === job) active = null; }
  }

  const BUTTON_ID = 'costum-summarize';

  const ACTION_BARS = [
    '#top-level-buttons-computed',
    'ytd-watch-metadata #actions #top-level-buttons-computed',
    '.slim-video-action-bar-actions',
    'ytm-slim-video-action-bar-renderer'
  ].join(',');

  /* A button where the other video actions live, for people who never open
     the panel. Same action, second doorway. */
  function mountButton(s, ctx) {
    const wanted = s.enabled && s.summary.enabled && s.summary.pageButton && location.pathname.startsWith('/watch');
    const existing = document.getElementById(BUTTON_ID);

    if (!wanted) {
      if (existing) existing.remove();
      return;
    }
    if (existing && existing.isConnected) {
      existing.textContent = words(ctx) === WORDS.ar ? 'تلخيص' : 'Summarize';
      return;
    }

    const bar = document.querySelector(ACTION_BARS);
    if (!bar) return;

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.textContent = (ctx.settings().locale === 'ar'
      || (ctx.settings().locale === 'auto' && navigator.language.startsWith('ar'))) ? 'تلخيص' : 'Summarize';
    button.style.cssText = [
      'appearance:none', 'border:1px solid rgba(128,128,128,.35)', 'background:transparent',
      'color:inherit', 'font:inherit', 'font-size:14px', 'font-weight:500',
      'border-radius:18px', 'padding:8px 14px', 'margin-inline-start:8px', 'cursor:pointer'
    ].join(';');
    button.addEventListener('click', () => run(ctx));

    bar.appendChild(button);
  }

  self.CostumSummaryInternals = { pickTrack, extractTranscript, coverage };
  Costum.register({
    name: 'summary',
    disable(ctx) { cancel(ctx); saved = { videoId: '', entries: [] }; const button = document.getElementById(BUTTON_ID); if (button) button.remove(); },
    onNavigate(ctx) { cancel(ctx); saved = { videoId: '', entries: [] }; },
    apply(s, ctx) {
      const signature = JSON.stringify(s.summary);
      if (lastSettings && signature !== lastSettings) cancel(ctx);
      lastSettings = signature;
      if (!s.summary.enabled) cancel(ctx);
      mountButton(s, ctx);
      if (s.summary.enabled && saved.videoId !== ctx.videoId()) loadSaved(ctx);
    },
    onMutation(nodes, s, ctx) { if (s.summary.pageButton) mountButton(s, ctx); },
    actions: {
      summarize: run,
      summaryConfirm: (ctx) => confirm(ctx),
      summaryCancel: (ctx) => cancel(ctx),
      summaryShowSaved: (ctx) => { const entry = saved.videoId === ctx.videoId() && saved.entries[0]; if (entry) showSaved(ctx, entry); },
      summaryClear: async (ctx) => { cancel(ctx); await ctx.ask('summary.clear'); loadSaved(ctx); }
    },
    saved: () => saved
  });
})();
