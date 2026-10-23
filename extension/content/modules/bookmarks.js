(function () {
  'use strict';
  const Costum = self.Costum;
  const B = self.CostumBookmarks;

  const WORDS = {
    en: { saved: 'Bookmarked ', full: 'Bookmark library is full (', ofLimit: '). Delete some from the Costum icon.', failed: 'Could not save the bookmark', noVideo: 'No video to bookmark', deleted: 'Bookmark deleted' },
    ar: { saved: 'انعلّم ', full: 'مكتبة العلامات ممتلية (', ofLimit: '). احذف شوي من أيقونة Costum.', failed: 'ما قدرنا نحفظ العلامة', noVideo: 'ما في فيديو لتعليمه', deleted: 'انحذفت العلامة' }
  };
  function words(ctx) {
    const locale = ctx.settings().locale;
    return WORDS[locale === 'ar' || (locale === 'auto' && navigator.language.startsWith('ar')) ? 'ar' : 'en'];
  }

  /* The list for the video on screen, kept by the module and handed to the
     panel — the panel renders, this decides. Fetched when the video changes
     and after every write; never on a timer. */
  let current = { videoId: '', items: [] };
  let generation = 0;

  async function refresh(ctx) {
    const videoId = ctx.videoId();
    const ticket = ++generation;
    if (!videoId || !location.pathname.startsWith('/watch')) { current = { videoId: '', items: [] }; announce(); return; }
    try {
      const reply = await ctx.ask('bookmarks.list', { videoId });
      if (ticket !== generation || ctx.videoId() !== videoId) return;   // a later video asked since
      current = { videoId, items: reply.items || [] };
    } catch (e) {
      if (ticket !== generation) return;
      current = { videoId, items: [] };
    }
    announce();
  }

  function announce() {
    window.dispatchEvent(new CustomEvent('costum:bookmarks', { detail: current }));
  }

  async function save(ctx, note) {
    const L = words(ctx);
    const video = ctx.video();
    const videoId = ctx.videoId();
    if (!video || !videoId || !location.pathname.startsWith('/watch')) return ctx.toast(L.noVideo);
    const at = Math.floor(video.currentTime || 0);
    const meta = await ctx.meta().catch(() => ({}));
    if (ctx.videoId() !== videoId) return;
    const here = ctx.channel ? ctx.channel() : null;
    try {
      const entry = await ctx.ask('bookmarks.add', { entry: {
        videoId, at, note: note || '',
        title: (meta && meta.title) || document.title.replace(/ - YouTube$/, ''),
        channel: (here && here.name) || ''
      } });
      ctx.toast(L.saved + B.clock(entry.at));
      await refresh(ctx);
    } catch (e) {
      const code = String(e && e.message || e);
      if (code === 'bookmarks-full') ctx.toast(L.full + B.LIMITS.items + L.ofLimit);
      else ctx.toast(L.failed);
    }
  }

  async function remove(ctx, id) {
    try { await ctx.ask('bookmarks.delete', { id }); ctx.toast(words(ctx).deleted); }
    catch (e) { ctx.toast(words(ctx).failed); }
    await refresh(ctx);
  }

  /* Jumping to a saved moment: on the same video a seek, on another video a
     navigation with the time in the URL — YouTube honours &t= on load. */
  function open(ctx, item) {
    const video = ctx.video();
    if (item.videoId === ctx.videoId() && video && Number.isFinite(video.duration) && item.at <= video.duration) {
      video.currentTime = item.at;
      return;
    }
    location.href = B.link(item);
  }

  Costum.register({
    name: 'bookmarks',
    disable() { generation++; current = { videoId: '', items: [] }; announce(); },
    onNavigate() { generation++; current = { videoId: '', items: [] }; },
    onVideo(video, s, ctx) { if (current.videoId !== ctx.videoId()) refresh(ctx); },
    apply(s, ctx) { if (current.videoId !== ctx.videoId()) refresh(ctx); },
    actions: {
      bookmark: (ctx, note) => save(ctx, typeof note === 'string' ? note : ''),
      bookmarkDelete: (ctx, id) => remove(ctx, id),
      bookmarkOpen: (ctx, item) => open(ctx, item)
    },
    bookmarks: () => current
  });
})();
