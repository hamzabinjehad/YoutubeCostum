(function () {
  'use strict';
  const Costum = self.Costum;

  /* Off by default.
   *
   * Three things happen here, in the order they help:
   *   1. the sound goes off the moment an ad starts, because that is the part
   *      people actually mind and it costs nothing to do instantly;
   *   2. the Skip button is pressed as soon as it exists;
   *   3. failing that, the ad is run out — at speed, and by seeking, because
   *      YouTube rejects one or the other depending on the ad.
   *
   * Everything it changes is put back. A muted video or a 16× playback rate
   * left behind after the ad is worse than the ad was. */

  const SKIP_BUTTONS = [
    '.ytp-skip-ad-button',
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-ad-skip-button-slot button',
    '.ytp-skip-ad-button__text',
    'button[class*="ytp-ad-skip"]',
    'button[class*="ytp-skip-ad"]'
  ].join(',');

  const CLOSE_BUTTONS = [
    '.ytp-ad-overlay-close-button',
    '.ytp-ad-overlay-close-container',
    '.ytp-suggested-action-badge-dismiss-button-icon',
    'button[class*="ytp-ad-overlay-close"]'
  ].join(',');

  /* YouTube's "ad blockers violate our Terms" modal. It pauses the video and
   * waits. Dismissing it and pressing play is the whole of the handling. */
  const NAG_DIALOG = 'ytd-enforcement-message-view-model, tp-yt-paper-dialog:has(ytd-enforcement-message-view-model)';
  const NAG_DISMISS = 'ytd-enforcement-message-view-model button, #dismiss-button button';

  const player = () => document.getElementById('movie_player');

  function adShowing() {
    const p = player();
    return !!(p && p.classList.contains('ad-showing'));
  }

  /* What we changed, so it can be handed back exactly as it was. */
  let held = null;

  function takeOver(video) {
    if (held) return;
    held = { video, muted: video.muted, rate: video.playbackRate };
    video.muted = true;
    // Some ads refuse the seek; speeding up gets through those.
    try { video.playbackRate = 16; } catch (e) { /* clamped by the browser */ }
  }

  function handBack(video) {
    if (!held) return;
    video = held.video || video;
    video.muted = held.muted;
    try { video.playbackRate = held.rate; } catch (e) {}
    held = null;
  }

  function clickIfVisible(selector) {
    const node = document.querySelector(selector);
    if (!node || node.offsetParent === null) return false;
    node.click();
    return true;
  }

  function dismissNag() {
    if (!document.querySelector(NAG_DIALOG)) return false;
    const dismissed = clickIfVisible(NAG_DISMISS);
    const video = document.querySelector('video.html5-main-video');
    if (video && video.paused) video.play().catch(() => {});
    return dismissed;
  }

  function sweep(ctx) {
    const s = ctx.settings();
    if (!s.enabled || !s.playback.skipAds) {
      const video = ctx.video();
      if (video) handBack(video);
      return;
    }

    dismissNag();

    const video = ctx.video();
    if (!adShowing()) {
      if (video) handBack(video);          // the ad is over; restore sound and speed
      clickIfVisible(CLOSE_BUTTONS);       // banner overlays outlive the ad break
      return;
    }

    if (video) takeOver(video);

    if (clickIfVisible(SKIP_BUTTONS)) return;
    clickIfVisible(CLOSE_BUTTONS);

    // No Skip button: run the ad out. Both routes, because either can be refused.
    if (video && video.duration && isFinite(video.duration) && video.currentTime < video.duration - 0.15) {
      try { video.currentTime = video.duration; } catch (e) { /* the rate still applies */ }
    }
  }

  /* Seven selector queries per call. On the timeupdate path that is fine — the
     browser already rate-limits it, and it is the path that has to be prompt.
     On the mutation path it ran on every batch, which on YouTube is several
     times a second for the whole session. A quarter second is still faster
     than a Skip button can be read. */
  let due = null;
  let ran = 0;

  function sweepSoon(ctx) {
    if (due) return;
    due = setTimeout(() => {
      due = null;
      ran = Date.now();
      sweep(ctx);
    }, Math.max(0, 250 - (Date.now() - ran)));
  }

  Costum.register({
    name: 'ads',
    disable() { clearTimeout(due); due = null; if (held) handBack(held.video); },
    onNavigate() { if (held) handBack(held.video); },

    apply(s, ctx) { sweep(ctx); },

    onMutation(nodes, s, ctx) { if (s.playback.skipAds) sweepSoon(ctx); },

    onVideo(video, s, ctx) {
      if (video.__costumAds) return;
      video.__costumAds = true;

      video.addEventListener('timeupdate', () => sweep(ctx));

      /* The class flips before the next timeupdate fires, and on the way out
       * there may be no timeupdate at all if the ad ended on a seek. Watching
       * the attribute is what makes the restore reliable rather than likely. */
      const p = player();
      if (p && !p.__costumAdWatch) {
        p.__costumAdWatch = true;
        new MutationObserver(() => sweep(ctx))
          .observe(p, { attributes: true, attributeFilter: ['class'] });
      }

      // A tab closed or navigated mid-ad must not leave the video muted.
      window.addEventListener('pagehide', () => handBack(video), { once: true });
    }
  });

  self.CostumAdsInternals = { takeOver, handBack, held: () => held };
})();
