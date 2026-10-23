(function () {
  'use strict';
  const Costum = self.Costum;
  let segments = [];
  let loadedFor = '';
  let segmentsFor = '';
  let generation = 0;
  let retryTimer = null;
  let attempts = 0;
  let attemptKey = '';
  let lastSkip = null;
  const exempt = new Set();

  function reset() {
    generation++;
    clearTimeout(retryTimer); retryTimer = null;
    segments = []; loadedFor = ''; segmentsFor = '';
    attempts = 0; attemptKey = ''; lastSkip = null; exempt.clear();
  }

  async function load(ctx) {
    const s = ctx.settings();
    if (!s.enabled || !s.sponsors.enabled || !location.pathname.startsWith('/watch')) { reset(); return; }
    const videoId = ctx.videoId();
    if (!videoId) return;
    const key = videoId + '|' + s.sponsors.categories.join(',');
    if (key === loadedFor) return;
    if (key !== attemptKey) { reset(); attemptKey = key; }
    if (attempts >= 3) return;
    const ticket = ++generation;
    attempts++;
    segments = []; segmentsFor = ''; loadedFor = key;
    try {
      const found = await ctx.ask('sponsors.get', { videoId, categories: s.sponsors.categories });
      if (ticket !== generation || ctx.videoId() !== videoId || !ctx.settings().enabled || !ctx.settings().sponsors.enabled) return;
      segments = (found || []).filter((seg) => Number.isFinite(seg.start) && Number.isFinite(seg.end) && seg.start >= 0 && seg.end > seg.start);
      segmentsFor = videoId;
    } catch (e) {
      if (ticket !== generation) return;
      if (attempts < 3) retryTimer = setTimeout(() => {
        retryTimer = null;
        loadedFor = '';
        load(ctx);
      }, attempts * 2000);
    }
  }

  function attach(video, ctx) {
    if (video.__costumSponsors) return;
    video.__costumSponsors = true;
    video.addEventListener('timeupdate', () => {
      const s = ctx.settings();
      if (!s.enabled || !s.sponsors.enabled || !segments.length || ctx.video() !== video) return;
      if (segmentsFor !== ctx.videoId()) return;
      const now = video.currentTime;
      const hit = segments.find((seg) => now >= seg.start && now < seg.end - 0.3 && !exempt.has(seg.start + ':' + seg.end));
      if (!hit) return;
      lastSkip = { videoId: segmentsFor, at: now, segment: hit };
      video.currentTime = hit.end;
      if (s.sponsors.showToast) ctx.toast((s.locale === 'ar' ? 'تم التخطي · ' : 'Skipped · ') + hit.category + ' · ' + Math.round(hit.end - hit.start) + 's');
    });
  }

  Costum.register({
    name: 'sponsors', disable: reset, onNavigate: reset,
    apply(s, ctx) { return load(ctx); },
    onVideo(video, s, ctx) { attach(video, ctx); return load(ctx); },
    actions: {
      sponsorUndo: (ctx) => {
        const video = ctx.video();
        if (!lastSkip || lastSkip.videoId !== ctx.videoId() || !video) return ctx.toast(ctx.settings().locale === 'ar' ? 'لا يوجد تخطٍ للتراجع عنه' : 'No sponsor skip to undo');
        exempt.add(lastSkip.segment.start + ':' + lastSkip.segment.end);
        video.currentTime = lastSkip.at;
        lastSkip = null;
      }
    }
  });
})();
