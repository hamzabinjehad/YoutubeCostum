(function () {
  'use strict';
  const Costum = self.Costum;

  // Off by default. This skips community-marked sponsor segments inside the
  // video, using the public SponsorBlock database. It is not an ad blocker.
  let segments = [];
  let loadedFor = '';     // videoId|categories — what has been asked for
  let segmentsFor = '';   // the video the segments in hand actually describe

  function keyFor(videoId, categories) {
    return videoId + '|' + categories.join(',');
  }

  async function load(ctx) {
    const s = ctx.settings();
    if (!s.sponsors.enabled || !location.pathname.startsWith('/watch')) {
      /* Clearing the segments without clearing what they were for left this
         inert after a toggle: turn skipping off and on again inside one video
         and the id still matched, so nothing ever fetched again. */
      segments = [];
      segmentsFor = '';
      loadedFor = '';
      return;
    }
    const meta = await ctx.meta();
    if (!meta.videoId) return;

    // The categories are part of what was asked for: changing them in settings
    // has to refetch, not sit on the answer to the previous question.
    const key = keyFor(meta.videoId, s.sponsors.categories);
    if (key === loadedFor) return;

    /* Drop the previous video's segments before the fetch rather than after
       it. Otherwise the round trip is a window in which the new video is being
       skipped against the old video's timings. */
    segments = [];
    segmentsFor = '';
    loadedFor = key;

    let found = [];
    try {
      found = await ctx.ask('sponsors.get', { videoId: meta.videoId, categories: s.sponsors.categories });
    } catch (e) {
      found = [];
    }
    // A faster navigation than this fetch wins; its answer is the current one.
    if (loadedFor !== key) return;
    segments = found || [];
    segmentsFor = meta.videoId;
  }

  function attach(video, ctx) {
    if (video.__costumSponsors) return;
    video.__costumSponsors = true;

    video.addEventListener('timeupdate', () => {
      const s = ctx.settings();
      if (!s.sponsors.enabled || !segments.length) return;
      /* Read straight off the URL: load() is asynchronous, so between a
         navigation and its answer the segments in hand still belong to the
         video before this one. Checking here closes that window whatever
         order the two land in. */
      if (segmentsFor !== ctx.videoId()) return;
      const now = video.currentTime;
      const hit = segments.find((seg) => now >= seg.start && now < seg.end - 0.3);
      if (!hit) return;
      video.currentTime = hit.end;
      if (s.sponsors.showToast) ctx.toast('Skipped ' + hit.category + ' · ' + Math.round(hit.end - hit.start) + 's');
    });
  }

  Costum.register({
    name: 'sponsors',
    apply(s, ctx) { load(ctx); },
    onVideo(video, s, ctx) { attach(video, ctx); load(ctx); }
  });
})();
