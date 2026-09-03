(function () {
  'use strict';
  const Costum = self.Costum;

  /* Hands the video to Safari's own player. On iOS that buys real
   * Picture in Picture, AirPlay, background audio and the system scrubber.
   * The cost is real too: only YouTube's progressive streams carry a direct
   * URL, and those top out around 720p. The setting says so. */
  let mountedFor = '';

  function teardown() {
    const host = document.getElementById('costum-native');
    if (host) host.remove();
    document.documentElement.removeAttribute('costum-native');
    mountedFor = '';
  }

  function best(formats) {
    return (formats || [])
      .filter((f) => f.url && typeof f.mimeType === 'string' && f.mimeType.startsWith('video/'))
      .sort((a, b) => (b.height || 0) - (a.height || 0))[0] || null;
  }

  async function mount(ctx) {
    const meta = await ctx.meta();
    if (!meta.videoId || meta.videoId === mountedFor) return;

    const formats = await ctx.toPage('formats');
    const pick = best(formats);
    if (!pick) {
      // YouTube serves most videos as separate audio and video streams now.
      // Those cannot be handed to a plain <video> element, so this video keeps
      // YouTube's player and the setting stays on for ones that can.
      ctx.toast('This video has no direct stream — keeping YouTube\'s player');
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
      ctx.toast('Could not find the player');
      return;
    }

    teardown();
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
    if (original) { original.pause(); original.muted = true; }

    ctx.toast('Native player · ' + (pick.height ? pick.height + 'p' : 'direct'));
  }

  Costum.register({
    name: 'nativePlayer',
    apply(s, ctx) {
      if (!s.playback.nativePlayer || !location.pathname.startsWith('/watch')) {
        if (mountedFor) teardown();
        return;
      }
      mount(ctx);
    }
  });
})();
