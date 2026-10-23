(function () {
  'use strict';
  const Costum = self.Costum;

  /* Hands the video to Safari's own player. On iOS that buys real
   * Picture in Picture, AirPlay, background audio and the system scrubber.
   * The cost is real too: only YouTube's progressive streams carry a direct
   * URL, and those top out around 720p. The setting says so. */
  let mountedFor = '';
  let generation = 0;
  let pendingFor = '';
  let originalState = null;

  const WORDS = {
    en: {
      noStream: 'This video has no direct stream — keeping YouTube\'s player',
      noPlayer: 'Could not find the player',
      failed: 'The direct stream would not play — back to YouTube\'s player',
      mounted: 'Native player · '
    },
    ar: {
      noStream: 'ما في بث مباشر لهالفيديو — رح يضل مشغّل يوتيوب',
      noPlayer: 'ما لقينا المشغّل',
      failed: 'البث المباشر ما اشتغل — رجعنا لمشغّل يوتيوب',
      mounted: 'المشغّل الأصلي · '
    }
  };
  function words(ctx) {
    const locale = ctx.settings().locale;
    return WORDS[locale === 'ar' || (locale === 'auto' && navigator.language.startsWith('ar')) ? 'ar' : 'en'];
  }

  /* Three different exits, and they must not be confused.
   *
   * 'intent' — the setting was switched off, or the extension was, while the
   * person was watching: the position they reached and whether they had
   * paused are their latest intent, and YouTube's player takes both over. The
   * paused state recorded at mount time is *not* consulted — someone who
   * paused the native player expects to find the page paused, whatever it was
   * doing before.
   *
   * 'restore' — the direct stream failed before it ever played. The native
   * player holds no intent of its own then, so YouTube's player gets back
   * exactly what was taken from it: its mute, and whether it was playing.
   *
   * 'navigate' — YouTube reuses the very same <video> element for the next
   * video. Seeking it would drop the previous video's position into a video
   * that has nothing to do with it, and calling play() would fight YouTube's
   * own autoplay. Only the mute we imposed is given back. */
  function teardown(mode) {
    const host = document.getElementById('costum-native');
    if (originalState) {
      const { video, muted, paused } = originalState;
      if (video.isConnected) {
        if (mode === 'intent' && host) {
          if (Number.isFinite(host.currentTime) && host.currentTime > 0) video.currentTime = host.currentTime;
          video.muted = host.muted;
          if (host.paused) video.pause();
          else video.play().catch(() => {});
        } else {
          video.muted = muted;
          if (mode === 'restore' && !paused) video.play().catch(() => {});
        }
      }
      originalState = null;
    }
    if (host) { host.pause(); host.removeAttribute('src'); host.remove(); }
    document.documentElement.removeAttribute('costum-native');
    mountedFor = '';
  }

  function best(formats) {
    return (formats || [])
      .filter((f) => f.url && typeof f.mimeType === 'string' && f.mimeType.startsWith('video/'))
      .sort((a, b) => (b.height || 0) - (a.height || 0))[0] || null;
  }

  async function mount(ctx) {
    const videoId = ctx.videoId();
    if (!videoId || pendingFor === videoId || mountedFor === videoId) return;
    const ticket = ++generation;
    pendingFor = videoId;
    const L = words(ctx);
    try {
    const meta = await ctx.meta();
    if (meta.videoId !== videoId || ticket !== generation) return;

    const formats = await ctx.toPage('formats');
    if (ticket !== generation || ctx.videoId() !== videoId || !ctx.settings().enabled || !ctx.settings().playback.nativePlayer) return;
    const pick = best(formats);
    if (!pick) {
      // YouTube serves most videos as separate audio and video streams now.
      // Those cannot be handed to a plain <video> element, so this video keeps
      // YouTube's player and the setting stays on for ones that can.
      ctx.toast(L.noStream);
      return;
    }

    const container = document.querySelector([
      '#player-container-inner',
      '#movie_player',
      '#player-container-id',      // mobile web
      '.ytm-player',
      '#player'
    ].join(','));
    if (!container) {
      ctx.toast(L.noPlayer);
      return;
    }

    teardown('intent');
    mountedFor = meta.videoId;

    const video = document.createElement('video');
    video.id = 'costum-native';
    video.src = pick.url;
    video.controls = true;
    video.playsInline = true;
    video.autoplay = true;
    video.setAttribute('controlsList', 'nodownload');
    video.style.cssText = 'width:100%;height:100%;background:#000;display:block;';

    container.prepend(video);
    document.documentElement.setAttribute('costum-native', '');

    // Stop YouTube's own player so two soundtracks never play at once.
    const original = document.querySelector('video.html5-main-video');
    if (original) {
      originalState = { video: original, muted: original.muted, paused: original.paused };
      const resumeAt = original.currentTime;
      // Before metadata has loaded a seek is ignored by some engines; setting
      // it now covers the ones that honour it, and again once it is safe.
      video.currentTime = resumeAt;
      video.addEventListener('loadedmetadata', () => {
        if (mountedFor === videoId && video.isConnected && Math.abs(video.currentTime - resumeAt) > 0.5) video.currentTime = resumeAt;
      }, { once: true });
      video.playbackRate = original.playbackRate; video.volume = original.volume; video.muted = original.muted;
      video.autoplay = !original.paused;
      original.pause(); original.muted = true;
    }

    /* A direct URL can be refused — it is bound to the IP that fetched the
       page, and it expires. A black rectangle with no explanation is the
       worst outcome; YouTube's own player is still right there underneath. */
    video.addEventListener('error', () => {
      if (mountedFor !== videoId || document.getElementById('costum-native') !== video) return;
      teardown('restore');
      ctx.toast(L.failed);
    }, { once: true });

    ctx.toast(L.mounted + (pick.height ? pick.height + 'p' : 'direct'));
    } finally { if (ticket === generation) pendingFor = ''; }
  }

  Costum.register({
    name: 'nativePlayer',
    disable() { generation++; pendingFor = ''; teardown('intent'); },
    onNavigate() { generation++; pendingFor = ''; teardown('navigate'); },
    apply(s, ctx) {
      if (!s.playback.nativePlayer || !location.pathname.startsWith('/watch')) {
        generation++; pendingFor = '';
        // The setting went off mid-video: same video, so the position carries.
        // Off a watch page there is nothing to carry it to.
        if (mountedFor) teardown(mountedFor === ctx.videoId() ? 'intent' : 'navigate');
        return;
      }
      return mount(ctx);
    }
  });
})();
