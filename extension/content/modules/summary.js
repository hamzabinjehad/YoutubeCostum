(function () {
  'use strict';
  const Costum = self.Costum;

  function clock(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const sec = String(total % 60).padStart(2, '0');
    return m + ':' + sec;
  }

  function pickTrack(tracks, language) {
    if (!tracks.length) return null;
    if (language !== 'auto') {
      const match = tracks.find((t) => t.lang === language);
      if (match) return match;
    }
    return tracks.find((t) => !t.kind) || tracks[0];
  }

  async function transcriptFor(meta, language) {
    const track = pickTrack(meta.captionTracks || [], language);
    if (!track) throw new Error('no-captions');

    const res = await fetch(track.baseUrl + '&fmt=json3', { credentials: 'include' });
    if (!res.ok) throw new Error('transcript HTTP ' + res.status);
    const data = await res.json();

    return (data.events || [])
      .filter((e) => e.segs)
      .map((e) => '[' + clock((e.tStartMs || 0) / 1000) + '] ' + e.segs.map((sg) => sg.utf8).join('').replace(/\n/g, ' ').trim())
      .filter((line) => line.length > 8)
      .join('\n')
      .slice(0, 120000);
  }

  async function run(ctx) {
    const s = ctx.settings();
    if (!s.summary.enabled) return ctx.toast('Turn on summaries from the Costum icon in the toolbar');
    if (!s.summary.apiKey) {
      // Nowhere to send them programmatically now that the popover is the only
      // surface, so the message carries the direction instead of a dead jump.
      return ctx.toast('Add your Claude API key from the Costum icon in the toolbar');
    }

    ctx.panel.showSummary({ state: 'loading' });
    try {
      const meta = await ctx.meta();
      const transcript = await transcriptFor(meta, s.summary.language);
      const text = await ctx.ask('summary.make', {
        apiKey: s.summary.apiKey,
        model: s.summary.model,
        language: s.summary.language,
        title: meta.title,
        transcript
      });
      ctx.panel.showSummary({ state: 'done', text, title: meta.title });
    } catch (err) {
      const message = String(err && err.message ? err.message : err);
      ctx.panel.showSummary({
        state: 'error',
        text: message === 'no-captions'
          ? 'This video has no transcript, so there is nothing to summarize.'
          : message
      });
    }
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
    const wanted = s.summary.enabled && s.summary.pageButton && location.pathname.startsWith('/watch');
    const existing = document.getElementById(BUTTON_ID);

    if (!wanted) {
      if (existing) existing.remove();
      return;
    }
    if (existing && existing.isConnected) return;

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

  Costum.register({
    name: 'summary',
    apply(s, ctx) { mountButton(s, ctx); },
    onMutation(nodes, s, ctx) { if (s.summary.pageButton) mountButton(s, ctx); },
    actions: { summarize: run }
  });
})();
