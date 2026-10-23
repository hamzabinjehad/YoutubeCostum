(function () {
  'use strict';
  const Costum = self.Costum;

  const state = { lastSpeed: null, adjustedFor: '', appliedRate: null, loopHandler: null, loopVideo: null };
  const originals = new Map();

  /* Which speed a video gets, highest precedence first:
   *   1. a speed the person set on this very video — a nudge, a preset in the
   *      panel — stays until they leave it;
   *   2. this channel's own speed, if they kept one;
   *   3. the music-channel speed, then the remembered last speed, then the
   *      default — the global preferences, however a mode set them.
   * `s` is the effective settings, so (2) is already folded into
   * defaultSpeed; ctx.channel() says whether that happened. */
  function effectiveSpeed(s, ctx) {
    if (state.adjustedFor && state.adjustedFor === ctx.videoId() && state.lastSpeed) return state.lastSpeed;
    const own = ctx.channel && ctx.channel().prefs;
    if (own && Number(own.speed) > 0) return Number(own.speed);
    if (s.playback.musicSpeed > 0 && ctx.isMusic()) return s.playback.musicSpeed;
    if (s.playback.rememberSpeed && state.lastSpeed) return state.lastSpeed;
    return s.playback.defaultSpeed;
  }

  const current = (ctx) => (ctx.effective ? ctx.effective() : ctx.settings());

  function setSpeed(video, rate, remember) {
    const clamped = Math.max(0.07, Math.min(16, Math.round(rate * 1000) / 1000));
    video.playbackRate = clamped;
    if (remember) state.lastSpeed = clamped;
    // What Costum itself set, so the ratechange it causes is not mistaken
    // for a choice the person made — a channel's 1.5× must not become the
    // "remembered" speed that follows them to every other channel.
    else state.appliedRate = clamped;
    return clamped;
  }

  function nudge(ctx, direction) {
    const s = ctx.settings();
    const video = ctx.video();
    if (!video) return;
    const step = s.playback.speedStep || 0.05;
    const next = setSpeed(video, video.playbackRate + direction * step, true);
    state.adjustedFor = ctx.videoId();
    ctx.toast(next.toFixed(2) + '×');
  }

  /* The panel's presets come through here rather than writing playbackRate
     themselves, so a chosen speed counts as this video's own — and outranks
     the channel's — the same way a nudge does. */
  function choose(ctx, rate) {
    const video = ctx.video();
    if (!video || !Number.isFinite(rate)) return;
    const next = setSpeed(video, rate, true);
    state.adjustedFor = ctx.videoId();
    ctx.toast(next.toFixed(2).replace(/\.?0+$/, '') + '×');
  }

  function attachWheel(ctx) {
    const container = document.querySelector('#movie_player');
    if (!container || container.__costumWheel) return;
    container.__costumWheel = true;

    container.addEventListener('wheel', (ev) => {
      if (!ctx.settings().enabled) return;
      const mode = ctx.settings().playback.wheelOnPlayer;
      if (mode === 'none') return;
      const video = ctx.video();
      if (!video) return;
      ev.preventDefault();
      const dir = ev.deltaY < 0 ? 1 : -1;

      if (mode === 'speed') {
        nudge(ctx, dir);
      } else {
        ctx.action(dir > 0 ? 'volumeUp' : 'volumeDown')(ctx);
      }
    }, { passive: false });
  }

  /* Marking A or B. Moving to another video starts a fresh loop rather than
     inheriting the other end from wherever you were before. */
  function mark(ctx, which) {
    const video = ctx.video();
    if (!video) return;
    const videoId = ctx.videoId();
    const stored = ctx.settings().playback.loop;
    const carry = stored.videoId === videoId;

    const loop = {
      enabled: true,
      videoId,
      start: which === 'start' ? video.currentTime : (carry ? stored.start : null),
      end: which === 'end' ? video.currentTime : (carry ? stored.end : null)
    };
    ctx.patch({ playback: { loop } });
    ctx.toast((which === 'start' ? 'A ' : 'B ') + ctx.clock(video.currentTime));
  }

  function attachLoop(ctx, video) {
    if (state.loopHandler && state.loopVideo) state.loopVideo.removeEventListener('timeupdate', state.loopHandler);
    state.loopVideo = video;
    state.loopHandler = () => {
      if (!ctx.settings().enabled) return;
      const target = self.CostumDefaults.loopTarget(
        ctx.settings().playback.loop, ctx.videoId(), video.currentTime);
      if (target !== null) video.currentTime = target;
    };
    video.addEventListener('timeupdate', state.loopHandler);
  }

  Costum.register({
    name: 'playback',
    disable() {
      if (state.loopVideo) state.loopVideo.removeEventListener('timeupdate', state.loopHandler);
      state.loopVideo = null; state.loopHandler = null;
      originals.forEach((rate, video) => { video.playbackRate = rate; });
      originals.clear();
    },
    // A speed chosen on one video does not follow you to the next; the
    // remembered speed (if that setting is on) does, by design.
    onNavigate() { state.adjustedFor = ''; },

    apply(s, ctx) {
      ctx.toPage('config', {
        forceQuality: s.playback.forceQuality,
        blockHighFramerate: s.playback.blockHighFramerate,
        preferAvc: s.playback.preferAvc
      });
      attachWheel(ctx);
    },

    onVideo(video, s, ctx) {
      if (!originals.has(video)) originals.set(video, video.playbackRate);
      for (const old of originals.keys()) if (!old.isConnected) originals.delete(old);
      setSpeed(video, effectiveSpeed(s, ctx), false);
      attachLoop(ctx, video);

      if (s.playback.autoplay === 'pause') {
        video.pause();
      } else if (s.playback.autoplay === 'play' && video.paused) {
        video.play().catch(() => {});
      }

      // YouTube resets the rate when it swaps sources; put ours back.
      if (!video.__costumRate) {
        video.__costumRate = true;
        video.addEventListener('ratechange', () => {
          if (!ctx.settings().enabled || !ctx.settings().playback.rememberSpeed) return;
          if (state.appliedRate !== null && Math.abs(video.playbackRate - state.appliedRate) < 0.001) return;
          if (state.lastSpeed) state.lastSpeed = video.playbackRate;
        });
        video.addEventListener('loadeddata', () => {
          if (!ctx.settings().enabled) return;
          const want = effectiveSpeed(current(ctx), ctx);
          if (Math.abs(video.playbackRate - want) > 0.001) setSpeed(video, want, false);
        });
      }
    },

    actions: {
      speedUp: (ctx) => nudge(ctx, 1),
      speedDown: (ctx) => nudge(ctx, -1),
      speedReset: (ctx) => {
        const video = ctx.video();
        if (!video) return;
        state.lastSpeed = null; state.adjustedFor = '';
        ctx.toast(setSpeed(video, effectiveSpeed(current(ctx), ctx), false).toFixed(2) + '×');
      },
      setSpeed: (ctx, rate) => choose(ctx, Number(rate)),
      loopStart: (ctx) => mark(ctx, 'start'),
      loopEnd: (ctx) => mark(ctx, 'end')
    },

    setSpeed
  });
})();
