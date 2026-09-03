(function () {
  'use strict';
  const Costum = self.Costum;

  const state = { lastSpeed: null, loopHandler: null };

  function effectiveSpeed(s, ctx) {
    if (s.playback.musicSpeed > 0 && ctx.isMusic()) return s.playback.musicSpeed;
    if (s.playback.rememberSpeed && state.lastSpeed) return state.lastSpeed;
    return s.playback.defaultSpeed;
  }

  function setSpeed(video, rate, remember) {
    const clamped = Math.max(0.07, Math.min(16, Math.round(rate * 1000) / 1000));
    video.playbackRate = clamped;
    if (remember) state.lastSpeed = clamped;
    return clamped;
  }

  function nudge(ctx, direction) {
    const s = ctx.settings();
    const video = ctx.video();
    if (!video) return;
    const step = s.playback.speedStep || 0.05;
    const next = setSpeed(video, video.playbackRate + direction * step, s.playback.rememberSpeed);
    ctx.toast(next.toFixed(2) + '×');
  }

  function attachWheel(ctx) {
    const container = document.querySelector('#movie_player');
    if (!container || container.__costumWheel) return;
    container.__costumWheel = true;

    container.addEventListener('wheel', (ev) => {
      const mode = ctx.settings().playback.wheelOnPlayer;
      if (mode === 'none') return;
      const video = ctx.video();
      if (!video) return;
      ev.preventDefault();
      const dir = ev.deltaY < 0 ? 1 : -1;

      if (mode === 'speed') {
        nudge(ctx, dir);
      } else {
        const player = document.getElementById('movie_player');
        if (!player || !player.getVolume) return;
        const next = Math.max(0, Math.min(100, player.getVolume() + dir * 5));
        player.setVolume(next);
        ctx.toast(Math.round(next) + '%');
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
    if (state.loopHandler) video.removeEventListener('timeupdate', state.loopHandler);
    state.loopHandler = () => {
      const target = self.CostumDefaults.loopTarget(
        ctx.settings().playback.loop, ctx.videoId(), video.currentTime);
      if (target !== null) video.currentTime = target;
    };
    video.addEventListener('timeupdate', state.loopHandler);
  }

  Costum.register({
    name: 'playback',

    apply(s, ctx) {
      ctx.toPage('config', {
        forceQuality: s.playback.forceQuality,
        blockHighFramerate: s.playback.blockHighFramerate,
        preferAvc: s.playback.preferAvc
      });
      attachWheel(ctx);
    },

    onVideo(video, s, ctx) {
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
          if (state.lastSpeed && ctx.settings().playback.rememberSpeed) state.lastSpeed = video.playbackRate;
        });
        video.addEventListener('loadeddata', () => {
          const want = effectiveSpeed(ctx.settings(), ctx);
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
        state.lastSpeed = null;
        ctx.toast(setSpeed(video, ctx.settings().playback.defaultSpeed, false).toFixed(2) + '×');
      },
      loopStart: (ctx) => mark(ctx, 'start'),
      loopEnd: (ctx) => mark(ctx, 'end')
    },

    setSpeed
  });
})();
