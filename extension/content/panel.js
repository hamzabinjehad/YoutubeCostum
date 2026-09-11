/* Costum for YouTube — the in-page panel.
 *
 * Lives in a shadow root so YouTube's stylesheet cannot reach it and ours
 * cannot leak out. This is the control surface UnTrap does not have: the
 * controls sit on the page you are already looking at, one tap away, instead
 * of three taps up into the browser's extension menu.
 *
 * There is no account here, no sign-in, no upgrade prompt. Every row is a
 * control. */
(function () {
  'use strict';

  const STR = {
    en: {
      title: 'Costum',
      secPlayback: 'Playback', secSound: 'Sound', secPicture: 'Picture',
      secPage: 'Page', secDo: 'Do', secProfiles: 'Profiles',
      zen: 'Just the video', zenNote: 'Player only — no header, sidebar or comments',
      speed: 'Speed', quality: 'Quality', auto: 'Auto',
      boost: 'Volume boost', bass: 'Bass', normalize: 'Even out loudness',
      brightness: 'Brightness', contrast: 'Contrast', saturation: 'Saturation',
      cinema: 'Cinema', wide: 'Wide player', shorts: 'Hide Shorts',
      comments: 'Hide comments', related: 'Hide related', chat: 'Hide chat',
      endScreens: 'Hide end screens', feed: 'Hide feed', chips: 'Hide chip bar',
      mixes: 'Hide mixes', playlists: 'Hide playlists', suggest: 'Hide suggestions',
      infinite: 'Stop infinite scroll', ads: 'Hide banner ads', chShorts: 'Hide Shorts shelf',
      chCommunity: 'Hide Community tab', chLive: 'Hide Live tab',
      onWatch: 'Watch page', onHome: 'Home', onSearch: 'Search', onChannel: 'Channel', onAny: 'Everywhere',
      shot: 'Frame', pip: 'PiP', summarize: 'Summarize',
      loopA: 'Loop A', loopB: 'Loop B', loopOff: 'Clear loop',
      settings: 'All settings', reset: 'Reset to default',
      settingsWhere: 'Every setting lives in the Costum icon in the toolbar',
      recommended: 'Recommended', study: 'Study', music: 'Music', evening: 'Evening',
      skipAds: 'Skip ads', block30: 'Block 30 min', cover: 'Cover people',
      undoHint: 'Tap again to put your own settings back',
      thinking: 'Reading the transcript…', close: 'Close', open: 'Open Costum',
      diag: 'Diagnostics'
    },
    ar: {
      title: 'Costum',
      secPlayback: 'التشغيل', secSound: 'الصوت', secPicture: 'الصورة',
      secPage: 'الصفحة', secDo: 'إجراءات', secProfiles: 'البروفايلات',
      zen: 'الفيديو بس', zenNote: 'المشغّل لحاله — بلا رأس ولا شريط ولا تعليقات',
      speed: 'السرعة', quality: 'الجودة', auto: 'تلقائي',
      boost: 'تعزيز الصوت', bass: 'الباس', normalize: 'تسوية الصوت',
      brightness: 'السطوع', contrast: 'التباين', saturation: 'التشبّع',
      cinema: 'سينما', wide: 'مشغّل عريض', shorts: 'إخفاء Shorts',
      comments: 'إخفاء التعليقات', related: 'إخفاء المقترحات', chat: 'إخفاء الشات',
      endScreens: 'إخفاء شاشات النهاية', feed: 'إخفاء الخلاصة', chips: 'إخفاء شريط الفئات',
      mixes: 'إخفاء المكسات', playlists: 'إخفاء قوائم التشغيل', suggest: 'إخفاء الاقتراحات',
      infinite: 'إيقاف التمرير اللانهائي', ads: 'إخفاء البانرات', chShorts: 'إخفاء رف Shorts',
      chCommunity: 'إخفاء تبويب المنتدى', chLive: 'إخفاء تبويب البث',
      onWatch: 'صفحة المشاهدة', onHome: 'الرئيسية', onSearch: 'البحث', onChannel: 'القناة', onAny: 'بكل الصفحات',
      shot: 'لقطة', pip: 'PiP', summarize: 'تلخيص',
      loopA: 'حلقة أ', loopB: 'حلقة ب', loopOff: 'مسح الحلقة',
      settings: 'كل الإعدادات', reset: 'إرجاع للأصل',
      settingsWhere: 'كل الإعدادات موجودة بأيقونة Costum بشريط الأدوات',
      recommended: 'الموصى به', study: 'دراسة', music: 'موسيقى', evening: 'سهرة',
      skipAds: 'تخطي الإعلانات', block30: 'احظر ٣٠ دقيقة', cover: 'تغطية الصور',
      undoHint: 'اضغط مرة تانية لترجيع إعداداتك',
      thinking: 'عم أقرأ الترانسكربت…', close: 'إغلاق', open: 'افتح Costum',
      diag: 'تشخيص'
    }
  };

  /* The panel lives on YouTube's page, so it cannot borrow the shared
     stylesheet — these are the same Apple tokens as ui/shared/apple.css, dark
     only, inlined for the shadow root. Keep the two in step. */
  const CSS = `
  :host { all: initial; }
  *, *::before, *::after { box-sizing: border-box; }
  button, input, select { font: inherit; color: inherit; }

  :host {
    --ink: #F5F5F7;
    /* Apple's secondaryLabel alpha is .60, which holds on a dark page and
       falls to 4.09:1 once this sheet sits over YouTube's light theme and
       lightens. .72 clears AA against either backdrop. */
    --dim: rgba(235,235,245,.72);
    --line: rgba(255,255,255,.08);
    --line-strong: rgba(255,255,255,.14);
    --fill-1: rgba(118,118,128,.24);
    --fill-2: rgba(118,118,128,.36);
    --fill-3: rgba(118,118,128,.14);
    --switch-off: rgba(120,120,128,.32);
    --accent: #0A84FF;
    --accent-ink: #FFFFFF;
    /* Blue text on this sheet, not blue fill. System blue reaches only
       3.93:1 here; a dark surface wants the lighter tint. */
    --accent-text: #409CFF;
    /* A thick material, not a thin one. At .82 the sheet over a white page
       composites to a mid grey (#454547) that nothing reads well against;
       this stays dark whatever is behind it and still blurs. */
    --sheet: rgba(28,28,30,.94);
    --card: rgba(58,58,60,.42);
    --thumb-shadow: 0 3px 8px rgba(0,0,0,.5), 0 0 0 .5px rgba(0,0,0,.3);
    --ease: cubic-bezier(.32,.72,0,1);
    --dur: .3s;
    --dur-fast: .18s;
    --font: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
  }

  /* ---- the button ---- */
  .fab {
    position: fixed; z-index: 2147483000;
    width: 44px; height: 44px; border: .5px solid var(--line-strong);
    border-radius: 50%; background: var(--sheet); color: var(--ink);
    -webkit-backdrop-filter: blur(30px) saturate(1.8); backdrop-filter: blur(30px) saturate(1.8);
    display: grid; place-items: center; cursor: pointer; padding: 0;
    box-shadow: 0 6px 20px rgba(0,0,0,.35);
    transition: transform var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease);
  }
  .fab:hover { transform: scale(1.06); box-shadow: 0 8px 26px rgba(0,0,0,.42); }
  .fab:active { transform: scale(.92); }
  .fab svg { width: 19px; height: 19px; display: block; }
  .fab:focus-visible, .panel :focus-visible {
    outline: 3px solid color-mix(in srgb, var(--accent) 60%, transparent);
    outline-offset: 2px;
  }
  /* .card clips to round its corners, so a ring drawn outside a row is sliced
     down to a stray blue line. Draw it inside. */
  .card .row.tap:focus-visible { outline-offset: -3px; border-radius: 0; }

  /* ---- the sheet ---- */
  .panel {
    position: fixed; z-index: 2147483000;
    width: 320px; max-height: min(76vh, 620px);
    overflow-y: auto; overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    background: var(--sheet); color: var(--ink);
    -webkit-backdrop-filter: blur(30px) saturate(1.8);
    backdrop-filter: blur(30px) saturate(1.8);
    border: .5px solid var(--line-strong); border-radius: 16px;
    padding: 4px 0 12px;
    display: none; flex-direction: column;
    box-shadow: 0 24px 60px rgba(0,0,0,.55);
    font-family: var(--font); font-size: 13px; line-height: 1.45;
    -webkit-font-smoothing: antialiased;
  }
  /* Grows out of the button rather than appearing, which is what makes it read
     as the same object the button turned into. */
  .panel[open] { display: flex; animation: sheet-in var(--dur) var(--ease); }
  /* Focused only so the sheet announces itself; the ring belongs on whatever
     the reader tabs to next, not on the container. */
  .panel:focus { outline: none; }
  @keyframes sheet-in {
    from { opacity: 0; transform: translateY(8px) scale(.97); }
  }
  .panel::-webkit-scrollbar { width: 0; }
  .grabber { display: none; }

  /* ---- header ---- */
  header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 16px 10px; position: sticky; inset-block-start: 0; z-index: 2;
    background: var(--sheet);
    -webkit-backdrop-filter: blur(30px); backdrop-filter: blur(30px);
  }
  header b { font-size: 15px; font-weight: 590; letter-spacing: -.014em; }
  .x {
    background: var(--fill-1); border: 0; border-radius: 50%;
    width: 26px; height: 26px; color: var(--dim); cursor: pointer;
    display: grid; place-items: center; font-size: 15px; line-height: 1; padding: 0;
    transition: background var(--dur-fast) var(--ease);
  }
  .x:hover { background: var(--fill-2); color: var(--ink); }

  /* ---- sections ---- */
  section { display: flex; flex-direction: column; padding: 0 16px 14px; }
  .sec-label {
    font-size: 11px; font-weight: 600; letter-spacing: .05em;
    text-transform: uppercase; color: var(--dim);
    padding: 8px 2px 7px;
  }

  /* rows sit on one grouped card per section, the way native settings do */
  .card {
    background: var(--card); border-radius: 10px; overflow: hidden;
  }
  .row {
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; padding: 8px 12px; min-height: 42px; position: relative;
  }
  .row + .row::before {
    content: ""; position: absolute; inset-block-start: 0;
    inset-inline: 12px 0; height: .5px; background: var(--line);
  }
  .row > label, .row .row-name { color: var(--ink); flex: 1 1 auto; min-width: 0; }

  /* A mode that composes several settings has to say what it takes away. */
  .row-note {
    display: block; margin-top: 2px;
    font-size: 11.5px; line-height: 1.35;
    color: var(--label-2, rgba(235,235,245,.6));
  }
  .row-tall { align-items: flex-start; padding-top: 10px; padding-bottom: 10px; }
  .row-tall .switch { margin-top: 2px; flex: 0 0 auto; }
  .row.tap { cursor: pointer; transition: background var(--dur-fast) var(--ease); }
  .row.tap:hover { background: rgba(255,255,255,.05); }
  .row.tap:active { background: rgba(255,255,255,.09); }

  /* ---- switch ---- */
  .switch {
    flex: 0 0 auto; position: relative; display: block;
    width: 38px; height: 23px; border-radius: 980px;
    background: var(--switch-off);
    transition: background var(--dur-fast) var(--ease);
  }
  .switch::after {
    content: ""; position: absolute;
    inset-block-start: 1.5px; inset-inline-start: 1.5px;
    width: 20px; height: 20px; border-radius: 50%;
    background: #FFFFFF; box-shadow: var(--thumb-shadow);
    transition: transform var(--dur) var(--ease);
  }
  [aria-pressed="true"] > .switch { background: var(--accent); }
  [aria-pressed="true"] > .switch::after { transform: translateX(15px); }
  :host-context([dir="rtl"]) [aria-pressed="true"] > .switch::after,
  [dir="rtl"] [aria-pressed="true"] > .switch::after { transform: translateX(-15px); }

  /* ---- sliders ---- */
  .slider { display: flex; flex-direction: column; gap: 2px; padding: 8px 12px 10px; position: relative; }
  .slider + .slider::before, .row + .slider::before, .slider + .row::before {
    content: ""; position: absolute; inset-block-start: 0;
    inset-inline: 12px 0; height: .5px; background: var(--line);
  }
  .slider .top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .slider .name { color: var(--ink); }
  .val {
    background: none; border: 0; padding: 1px 0; cursor: default;
    font-variant-numeric: tabular-nums; font-size: 12.5px; color: var(--dim);
  }
  /* a changed value is also the way back: tap it to restore the default */
  .val[data-modified] {
    cursor: pointer; color: var(--accent-text);
    border-bottom: 1px dashed color-mix(in srgb, var(--accent-text) 55%, transparent);
  }
  input[type=range] {
    -webkit-appearance: none; appearance: none; width: 100%; height: 24px;
    background: none; margin: 0;
    /* On a phone nearly every touch lands on a control. Without this a vertical
       swipe drags the slider instead of scrolling; horizontal still sets value. */
    touch-action: pan-y;
  }
  input[type=range]::-webkit-slider-runnable-track {
    height: 4px; border-radius: 2px;
    background: linear-gradient(to right,
      var(--fill-2) var(--a, 0%), var(--accent) var(--a, 0%),
      var(--accent) var(--b, 50%), var(--fill-2) var(--b, 50%));
  }
  [dir="rtl"] input[type=range]::-webkit-slider-runnable-track {
    background: linear-gradient(to left,
      var(--fill-2) var(--a, 0%), var(--accent) var(--a, 0%),
      var(--accent) var(--b, 50%), var(--fill-2) var(--b, 50%));
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 18px; height: 18px; margin-top: -7px; border-radius: 50%;
    background: #FFFFFF; box-shadow: var(--thumb-shadow);
    transition: transform var(--dur-fast) var(--ease);
  }
  input[type=range]:active::-webkit-slider-thumb { transform: scale(1.12); }

  /* ---- segmented control ---- */
  .segmented {
    display: flex; gap: 2px; padding: 2px;
    background: var(--fill-1); border-radius: 9px;
    touch-action: pan-y;
  }
  .segmented.grid2 { display: grid; grid-template-columns: 1fr 1fr; }
  .segmented.wrap { display: grid; grid-template-columns: repeat(auto-fill, minmax(58px, 1fr)); }
  .segmented button {
    flex: 1 1 0; min-width: 0;
    border: 0; background: none; color: var(--ink);
    font-size: 12.5px; padding: 6px 6px; border-radius: 7px; cursor: pointer;
    font-variant-numeric: tabular-nums; white-space: nowrap;
    transition: background var(--dur-fast) var(--ease);
  }
  .segmented button:hover { background: var(--fill-3); }
  .segmented button[aria-pressed="true"] {
    background: var(--fill-2); font-weight: 590;
    box-shadow: 0 1px 3px rgba(0,0,0,.4), inset 0 .5px 0 rgba(255,255,255,.12);
  }

  /* ---- action buttons ---- */
  .chips { display: flex; flex-wrap: wrap; gap: 6px; touch-action: pan-y; }
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    border: .5px solid var(--line-strong); background: var(--fill-1); color: var(--ink);
    border-radius: 8px; padding: 7px 11px; font-size: 12.5px; cursor: pointer;
    white-space: nowrap;
    transition: background var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
  }
  .glyph { display: block; flex: 0 0 auto; opacity: .85; }
  .glyph svg { width: 14px; height: 14px; display: block; }
  .chip[aria-pressed="true"] .glyph { opacity: 1; }
  .chip:hover { background: var(--fill-2); }
  .chip:active { transform: scale(.96); }

  select {
    background: var(--fill-1); border: .5px solid var(--line-strong); color: var(--ink);
    border-radius: 7px; padding: 4px 8px; font-size: 12.5px; cursor: pointer;
  }

  /* ---- summary ---- */
  .summary {
    /* The panel is a flex column, so without this the box collapses to a
       single line and long text — a summary, a diagnostic — is unreadable. */
    flex: 0 0 auto;
    margin: 0 16px 14px; padding: 12px 13px;
    background: var(--card); border-radius: 10px;
    font-size: 12.5px; line-height: 1.7; white-space: pre-wrap;
    max-height: 320px; min-height: 120px; overflow-y: auto; color: var(--ink);
    -webkit-overflow-scrolling: touch; overscroll-behavior: contain;
    font-variant-numeric: tabular-nums;
  }

  .foot { padding: 0 16px; }
  .foot-note { display: block; font-size: 11px; color: var(--dim); line-height: 1.4; }
  .link {
    background: none; border: 0; color: var(--accent-text); cursor: pointer;
    font-size: 13px; padding: 8px 2px; text-align: start; width: 100%;
    border-radius: 6px;
  }
  .link:hover { text-decoration: underline; }

  /* ---- toast ---- */
  .toast {
    position: fixed; z-index: 2147483001;
    background: var(--sheet); color: var(--ink);
    -webkit-backdrop-filter: blur(30px) saturate(1.8); backdrop-filter: blur(30px) saturate(1.8);
    border: .5px solid var(--line-strong); border-radius: 980px;
    padding: 8px 16px; font-family: var(--font); font-size: 13px; font-weight: 500;
    font-variant-numeric: tabular-nums;
    opacity: 0; transform: translateY(6px) scale(.96);
    transition: opacity var(--dur-fast) var(--ease), transform var(--dur) var(--ease);
    pointer-events: none; box-shadow: 0 10px 30px rgba(0,0,0,.45);
  }
  .toast[show] { opacity: 1; transform: none; }

  /* ---- where the button sits ----
     Physical corners, not logical ones: which side of the screen a floating
     button should live on is about the hand reaching for it and about what it
     covers on the page, neither of which follows the text direction. The sheet
     hangs off the same corner, and swaps to the other side of the button when
     the button is at the top. */
  [data-corner$="right"] .fab,
  [data-corner$="right"] .panel,
  [data-corner$="right"] .toast { right: max(16px, env(safe-area-inset-right)); }
  /* And the guide rail owns the left, the same way the masthead owns the top —
     which nothing accounted for, so a button parked at top-left sat on top of
     YouTube's own navigation and covered its labels. --rail is measured at
     runtime because that rail is 72px collapsed, about 240px open, and absent
     on the mobile layout. */
  [data-corner$="left"] .fab,
  [data-corner$="left"] .panel,
  [data-corner$="left"] .toast {
    left: max(calc(var(--rail, 0px) + 16px), env(safe-area-inset-left));
  }

  [data-corner^="bottom"] .fab { bottom: calc(18px + env(safe-area-inset-bottom)); }
  [data-corner^="bottom"] .panel,
  [data-corner^="bottom"] .toast { bottom: calc(74px + env(safe-area-inset-bottom)); }

  /* YouTube's masthead owns the top of the page, so the top corners start
     below it rather than under it. */
  [data-corner^="top"] .fab { top: calc(70px + env(safe-area-inset-top)); }
  [data-corner^="top"] .panel,
  [data-corner^="top"] .toast { top: calc(126px + env(safe-area-inset-top)); }
  [data-corner^="top"] .panel { animation-name: sheet-in-top; }
  @keyframes sheet-in-top {
    from { opacity: 0; transform: translateY(-8px) scale(.97); }
  }

  /* ---- phone ----
     At phone width a floating card fights the thumb. The panel becomes a
     bottom sheet with a grabber at the top, which is where iOS puts this. */
  @media (max-width: 430px) {
    /* Selector weight matches the corner rules above so this still wins: on a
       phone the sheet belongs at the bottom edge whatever corner is chosen. */
    [data-corner] .panel {
      inset-inline: 0; left: 0; right: 0; width: auto;
      top: auto; bottom: 0;
      max-height: 82vh;
      border-radius: 14px 14px 0 0;
      border-inline: 0; border-block-end: 0;
      padding-block-end: calc(16px + env(safe-area-inset-bottom));
      animation: sheet-up var(--dur) var(--ease);
    }
    [data-corner] .toast { top: auto; bottom: calc(20px + env(safe-area-inset-bottom)); }
    @keyframes sheet-up { from { transform: translateY(100%); } }
    .grabber {
      /* The panel is a scrolling flex column, so an item with no content of
         its own gets shrunk to nothing — same reason .summary pins its size. */
      display: block; flex: 0 0 5px;
      width: 36px; height: 5px; border-radius: 3px;
      background: var(--fill-2); margin: 6px auto 0;
      position: sticky; inset-block-start: 6px; z-index: 3;
    }
    header { padding-block-start: 8px; }
    .chip { padding: 10px 13px; font-size: 13px; }
    .segmented button { padding: 9px 6px; font-size: 13px; }
    .toast { inset-block-end: calc(20px + env(safe-area-inset-bottom)); }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition-duration: .001ms !important; animation-duration: .001ms !important; }
    .fab:hover, .fab:active, .chip:active { transform: none; }
  }
  @media (prefers-reduced-transparency: reduce) {
    :host { --sheet: #1C1C1E; }
    .panel, .fab, .toast, header { -webkit-backdrop-filter: none; backdrop-filter: none; }
  }
  `;

  const GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">'
    + '<path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h8M16 17h4"/>'
    + '<circle cx="16" cy="7" r="2.2" fill="currentColor" stroke="none"/>'
    + '<circle cx="8" cy="12" r="2.2" fill="currentColor" stroke="none"/>'
    + '<circle cx="14" cy="17" r="2.2" fill="currentColor" stroke="none"/></svg>';

  let ctx = null;
  let shadow = null;
  let els = {};
  let toastTimer = null;
  let rendering = false;

  function lang() {
    const locale = (ctx && ctx.settings().locale) || 'auto';
    return locale === 'auto' ? (navigator.language.startsWith('ar') ? 'ar' : 'en') : locale;
  }
  function t() { return STR[lang()] || STR.en; }

  function el(tag, attrs, kids) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined) node.setAttribute(k, v);
    });
    (kids || []).forEach((kid) => kid && node.appendChild(kid));
    return node;
  }

  const DEFAULTS = () => self.CostumDefaults.DEFAULTS;
  const at = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const patchOf = (path, value) => path.split('.').reverse().reduce((acc, k) => ({ [k]: acc }), value);

  /* A slider that also knows its own default: the readout turns into a reset
     control as soon as the value differs, so there is always a way back. */
  function slider(name, path, min, max, step, format) {
    const settings = ctx.settings();
    const value = Number(at(settings, path));
    const fallback = Number(at(DEFAULTS(), path));

    const out = el('button', {
      class: 'val', type: 'button', text: format(value),
      title: value === fallback ? '' : t().reset
    });
    if (value !== fallback) out.setAttribute('data-modified', '');

    const input = el('input', { type: 'range', min, max, step, value });

    function show(v) {
      out.textContent = format(v);
      if (v === fallback) { out.removeAttribute('data-modified'); out.title = ''; }
      else { out.setAttribute('data-modified', ''); out.title = t().reset; }
    }

    // The track paints its filled portion from this, so the slider reads the
    // way a UISlider does instead of as a bare groove.
    const paint = () => {
      const span = max - min;
      const pct = span ? ((Number(input.value) - min) / span) * 100 : 0;
      // A range that straddles zero — bass, say — fills out from zero rather
      // than from the left end, so "no change" reads as an empty track instead
      // of as half full.
      const origin = (min < 0 && max > 0) ? (-min / span) * 100 : 0;
      input.style.setProperty('--a', Math.min(pct, origin).toFixed(2) + '%');
      input.style.setProperty('--b', Math.max(pct, origin).toFixed(2) + '%');
    };
    paint();

    input.addEventListener('input', () => { show(Number(input.value)); paint(); });
    input.addEventListener('change', () => ctx.patch(patchOf(path, Number(input.value))));
    out.addEventListener('click', () => {
      if (Number(input.value) === fallback) return;
      input.value = fallback;
      show(fallback);
      paint();
      ctx.patch(patchOf(path, fallback));
    });

    return el('div', { class: 'slider' }, [
      el('div', { class: 'top' }, [el('span', { class: 'name', text: name }), out]),
      input
    ]);
  }

  /* A switch on a list row, not a pressed button. Two-state settings all look
     the same this way, and the state survives being read at a glance — a
     tinted button only says "on" once you know that tinted means on. */
  /* `note` is for the rows that compose several settings at once. A switch
     called "Just the video" has to say what it takes away, or the only way to
     find out is to lose your comments and wonder why. */
  function toggle(label, on, onClick, note) {
    const name = note
      ? el('span', { class: 'row-name' }, [
          el('span', { text: label }),
          el('small', { class: 'row-note', text: note })
        ])
      : el('span', { class: 'row-name', text: label });

    return el('div', {
      class: 'row tap' + (note ? ' row-tall' : ''), role: 'button', tabindex: '0',
      'aria-pressed': String(!!on),
      onclick: onClick,
      onkeydown: (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onClick(ev); }
      }
    }, [
      name,
      el('span', { class: 'switch', 'aria-hidden': 'true' })
    ]);
  }

  /* One segment of a segmented control, for a set of exclusive choices.
     Pressing the selected one again is the way back out. */
  function segment(label, pressed, onClick, hint) {
    return el('button', {
      class: 'segment', type: 'button', text: label,
      'aria-pressed': String(!!pressed),
      title: pressed && hint ? hint : null,
      onclick: onClick
    });
  }

  /* SF-Symbols-shaped glyphs for the actions. A row of bare text pills is the
     least Apple thing left in the panel: on this platform an action carries a
     symbol, and the symbol is what you actually aim at once you know the row. */
  const GLYPH = {
    frame: '<path d="M4 7.5h3l1.2-2h5.6L15 7.5h3a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 18 18.5H6A1.5 1.5 0 0 1 4.5 17V9A1.5 1.5 0 0 1 6 7.5z"/><circle cx="12" cy="12.6" r="3"/>',
    pip: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><rect x="12" y="11.5" width="7" height="6" rx="1.4" fill="currentColor" stroke="none"/>',
    sparkle: '<path d="M11 4.5l1.5 4L17 10l-4.5 1.5L11 16l-1.5-4.5L5 10l4.5-1.5z"/><path d="M17.5 15l.7 1.9 1.8.7-1.8.7-.7 1.9-.7-1.9-1.8-.7 1.8-.7z"/>',
    loop: '<path d="M6.5 9h11M14.9 6.4L17.5 9l-2.6 2.6"/><path d="M17.5 15h-11M9.1 12.4L6.5 15l2.6 2.6"/>',
    loopOff: '<path d="M6.5 9h11M14.9 6.4L17.5 9l-2.6 2.6"/><path d="M17.5 15h-11M9.1 12.4L6.5 15l2.6 2.6"/><path d="M4.5 19.5l15-15"/>',
    moon: '<path d="M19.4 14.6A7.6 7.6 0 0 1 9.4 4.6a7.6 7.6 0 1 0 10 10z"/>',
    pulse: '<path d="M3 12h3.5l2-5.5 3.5 11 2.5-5.5H21"/>'
  };

  function glyph(name) {
    if (!GLYPH[name]) return null;
    return el('span', {
      class: 'glyph', 'aria-hidden': 'true',
      html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
        + 'stroke-linecap="round" stroke-linejoin="round">' + GLYPH[name] + '</svg>'
    });
  }

  function chip(label, pressed, onClick, icon) {
    const mark = icon ? glyph(icon) : null;
    return el('button', {
      class: 'chip', type: 'button',
      'aria-pressed': pressed === undefined ? null : String(!!pressed),
      onclick: onClick
    }, [mark, el('span', { text: label })]);
  }

  function section(label, body) {
    return el('section', {}, [el('div', { class: 'sec-label', text: label }), body]);
  }


  /* The clutter worth hiding depends on the page you are on. Showing the watch
     page's controls while you are on the home feed is how a settings list grows
     to forty checkboxes nobody reads. */
  function currentGroups() {
    return self.CostumCss.currentPages(location.pathname);
  }

  function pageName(L) {
    const path = location.pathname;
    if (path.startsWith('/watch')) return L.onWatch;
    if (path.startsWith('/results')) return L.onSearch;
    if (/^\/(@|channel\/|c\/|user\/)/.test(path)) return L.onChannel;
    if (path === '/' || path === '') return L.onHome;
    return L.onAny;
  }

  function pageToggles(s, L, patch) {
    const d = s.declutter;
    const groups = currentGroups();
    const out = [];

    /* On a watch page this leads, because it is the one control that does what
       the six under it do together. Off a watch page it would promise something
       it cannot deliver, so it is simply absent. */
    if (groups.includes('watch')) {
      out.push(toggle(L.zen, s.layout.zen, () => patch({ layout: { zen: !s.layout.zen } }), L.zenNote));
    }

    out.push(
      toggle(L.cinema, s.layout.cinema, () => patch({ layout: { cinema: !s.layout.cinema } })),
      toggle(L.wide, s.layout.widePlayer, () => patch({ layout: { widePlayer: !s.layout.widePlayer } })),
      toggle(L.shorts, d.shorts === 'hide', () => patch({ declutter: { shorts: d.shorts === 'hide' ? 'show' : 'hide' } }))
    );

    if (groups.includes('watch')) {
      out.push(
        toggle(L.comments, d.watch.comments, () => patch({ declutter: { watch: { comments: !d.watch.comments } } })),
        toggle(L.related, d.watch.related, () => patch({ declutter: { watch: { related: !d.watch.related } } })),
        toggle(L.chat, d.watch.liveChat, () => patch({ declutter: { watch: { liveChat: !d.watch.liveChat } } })),
        toggle(L.endScreens, d.watch.endScreens, () => patch({ declutter: { watch: { endScreens: !d.watch.endScreens } } }))
      );
    }

    if (groups.includes('home') && location.pathname !== '/watch') {
      out.push(
        toggle(L.feed, d.home.feed, () => patch({ declutter: { home: { feed: !d.home.feed } } })),
        toggle(L.chips, d.home.chips, () => patch({ declutter: { home: { chips: !d.home.chips } } })),
        toggle(L.mixes, d.home.mixes, () => patch({ declutter: { home: { mixes: !d.home.mixes } } }))
      );
    }

    if (groups.includes('search')) {
      out.push(toggle(L.suggest, d.search.suggestions, () => patch({ declutter: { search: { suggestions: !d.search.suggestions } } })));
    }

    if (groups.includes('channel')) {
      out.push(
        toggle(L.chShorts, d.channel.shortsSection, () => patch({ declutter: { channel: { shortsSection: !d.channel.shortsSection } } })),
        toggle(L.chCommunity, d.channel.community, () => patch({ declutter: { channel: { community: !d.channel.community } } })),
        toggle(L.chLive, d.channel.live, () => patch({ declutter: { channel: { live: !d.channel.live } } }))
      );
    }

    /* One switch for the whole modesty filter. Someone who wants this wants it
       reachable on the page, not four levels into settings. */
    const covering = s.modesty.images !== 'off';
    out.push(
      toggle(L.cover, covering, () => patch({
        modesty: { images: covering ? 'off' : 'blur', video: covering ? 'off' : 'blur' }
      })),
      toggle(L.infinite, d.global.infiniteScroll, () => patch({ declutter: { global: { infiniteScroll: !d.global.infiniteScroll } } })),
      toggle(L.ads, d.global.bannerAds, () => patch({ declutter: { global: { bannerAds: !d.global.bannerAds } } }))
    );

    return out;
  }

  function build() {
    const s = ctx.settings();
    const L = t();
    const patch = (p) => ctx.patch(p);
    const video = ctx.video();
    const rate = video ? video.playbackRate : s.playback.defaultSpeed;

    // speedPresets is the reader's list and can hold any number of values, so
    // the control wraps into as many rows as it needs instead of crushing
    // eight labels into one.
    const speeds = el('div', { class: 'segmented wrap' },
      s.playback.speedPresets.map((v) => segment(v + '×', Math.abs(rate - v) < 0.001, () => {
        const target = ctx.video();
        if (target) target.playbackRate = v;
        ctx.toast(v + '×');
        render();
      })));

    const quality = el('select', { onchange: (ev) => patch({ playback: { forceQuality: ev.target.value } }) });
    [['auto', L.auto], ['highres', '4K+'], ['hd2160', '2160p'], ['hd1440', '1440p'],
     ['hd1080', '1080p'], ['hd720', '720p'], ['large', '480p'], ['medium', '360p']]
      .forEach(([value, label]) => {
        const option = el('option', { value, text: label });
        if (s.playback.forceQuality === value) option.selected = true;
        quality.appendChild(option);
      });

    // A loop belongs to one video; on any other page its marks mean nothing.
    const loop = s.playback.loop;
    const loopHere = loop.enabled && (!loop.videoId || loop.videoId === ctx.videoId());

    const summaryBox = el('div', { class: 'summary' });
    summaryBox.style.display = 'none';

    const panel = el('div', { class: 'panel', role: 'dialog', 'aria-label': 'Costum', tabindex: '-1' }, [
      el('div', { class: 'grabber', 'aria-hidden': 'true' }),
      el('header', {}, [
        el('b', { text: L.title }),
        el('button', { class: 'x', type: 'button', 'aria-label': L.close, text: '×', onclick: () => toggleOpen(false, true) })
      ]),

      section(L.secPlayback, el('div', {}, [
        speeds,
        el('div', { class: 'card', style: 'margin-top:8px' }, [
          el('div', { class: 'row' }, [el('label', { text: L.quality }), quality]),
          toggle(L.skipAds, s.playback.skipAds, () => patch({ playback: { skipAds: !s.playback.skipAds } }))
        ])
      ])),

      section(L.secSound, el('div', { class: 'card' }, [
        slider(L.boost, 'audio.boost', 1, 10, 0.1, (v) => v.toFixed(1) + '×'),
        slider(L.bass, 'audio.bass', -12, 12, 1, (v) => (v > 0 ? '+' : '') + v + ' dB'),
        toggle(L.normalize, s.audio.normalize, () => patch({ audio: { normalize: !s.audio.normalize } }))
      ])),

      section(L.secPicture, el('div', { class: 'card' }, [
        slider(L.brightness, 'picture.brightness', 30, 200, 1, (v) => v + '%'),
        slider(L.contrast, 'picture.contrast', 30, 200, 1, (v) => v + '%'),
        slider(L.saturation, 'picture.saturation', 0, 200, 1, (v) => v + '%')
      ])),

      section(L.secPage + ' · ' + pageName(L), el('div', { class: 'card' }, pageToggles(s, L, patch))),

      section(L.secDo, el('div', { class: 'chips' }, [
        chip(L.shot, undefined, () => ctx.action('screenshot')(ctx), 'frame'),
        chip(L.pip, undefined, () => ctx.action('pip')(ctx), 'pip'),
        chip(L.summarize, undefined, () => ctx.action('summarize')(ctx), 'sparkle'),
        // The marks read back the time they hold, so the loop is legible
        // without scrubbing to find out where it starts.
        chip(loopHere && loop.start !== null ? 'A ' + ctx.clock(loop.start) : L.loopA,
          loopHere && loop.start !== null, () => ctx.action('loopStart')(ctx), 'loop'),
        chip(loopHere && loop.end !== null ? 'B ' + ctx.clock(loop.end) : L.loopB,
          loopHere && loop.end !== null, () => ctx.action('loopEnd')(ctx), 'loop'),
        // Nothing to clear, nothing to show.
        (loopHere && (loop.start !== null || loop.end !== null))
          ? chip(L.loopOff, undefined, () => patch({ playback: { loop: { enabled: false, start: null, end: null, videoId: '' } } }), 'loopOff')
          : null,
        chip(L.block30, undefined, () => ctx.action('blockFor')(ctx, 30), 'moon'),
        chip(L.diag, undefined, () => ctx.action('diagnose')(ctx), 'pulse')
      ])),

      summaryBox,

      section(L.secProfiles, el('div', { class: 'segmented grid2' }, [
        segment(L.recommended, s.profile === 'recommended', () => applyProfile('recommended'), L.undoHint),
        segment(L.study, s.profile === 'study', () => applyProfile('study'), L.undoHint),
        segment(L.music, s.profile === 'music', () => applyProfile('music'), L.undoHint),
        segment(L.evening, s.profile === 'evening', () => applyProfile('evening'), L.undoHint)
      ])),

      /* There is no separate settings page to open any more: everything lives
         in the popover behind the toolbar icon, and an extension cannot open
         its own popover from inside the page. So this says where to go rather
         than pretending it can take you there. */
      el('div', { class: 'foot' }, [
        el('span', { class: 'foot-note', text: L.settingsWhere })
      ])
    ]);

    els.panel = panel;
    els.summaryBox = summaryBox;
    return panel;
  }

  async function applyProfile(name) {
    const s = ctx.settings();
    const next = self.CostumDefaults.applyProfile(s, s.profile === name ? 'default' : name);
    await ctx.ask('settings.replace', { settings: next });
  }

  /* `restoreFocus` says whether closing should hand focus back to the button.
     Escape and the close button should; a click somewhere else on the page
     must not, because the reader is already on their way to whatever they
     clicked and pulling focus back would strand them — or, on a text field,
     stop them typing. It only works today because the browser's own focus
     handling happens to run after this; that is luck, not a design. */
  function toggleOpen(open, restoreFocus) {
    if (!els.panel) return;
    const was = els.panel.hasAttribute('open');
    const want = open === undefined ? !was : open;
    if (want && !rendering) render();
    els.panel.toggleAttribute('open', want);
    if (want === was) return;

    if (want) {
      // The sheet itself, not the first control in it: a reader hears the
      // dialog's name and then tabs forward through it, instead of landing on
      // the close button with no idea what just opened.
      els.panel.focus();
    } else if (restoreFocus && els.fab && shadow && shadow.contains(shadow.activeElement)) {
      els.fab.focus();
    }
  }

  function isOpen() { return !!els.panel && els.panel.hasAttribute('open'); }

  /* A sheet closes by pressing Escape or by clicking off it. Without these the
     × is the only way out, which is the one thing every native sheet lets you
     skip. The click listener sits on the document rather than inside the shadow
     root, because a click on the page never reaches the shadow root at all. */
  function watchForDismiss() {
    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Escape' || !isOpen()) return;
      // A key handler on YouTube's page would otherwise also see this and, for
      // example, leave fullscreen at the same time.
      ev.stopPropagation();
      toggleOpen(false, true);
    }, true);

    document.addEventListener('pointerdown', (ev) => {
      if (!isOpen()) return;
      // Inside the shadow root, composedPath() is the only way to tell whether
      // the click landed on the panel or on the page behind it.
      const path = ev.composedPath ? ev.composedPath() : [];
      if (path.includes(els.panel) || path.includes(els.fab)) return;
      toggleOpen(false);
    }, true);
  }

  /* The page switches are rows, not buttons — leaving [tabindex] out of this
     list meant the controls most likely to be in use were exactly the ones
     whose focus was dropped on rebuild. */
  /* The parts of the panel that live outside the sheet itself: which corner it
     occupies, and whether the button shows at all. Both are settings, so both
     have to follow a settings change rather than waiting for a page reload —
     turning the button off used to do nothing until you reloaded YouTube. */
  const CORNERS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];

  function applyChrome() {
    if (!els.root) return;
    const panelSettings = ctx.settings().panel;
    const corner = CORNERS.indexOf(panelSettings.corner) === -1 ? 'bottom-right' : panelSettings.corner;
    els.root.setAttribute('data-corner', corner);
    if (els.fab) els.fab.style.display = panelSettings.showButton ? '' : 'none';
  }

  const FOCUSABLE = 'button, input, select, [tabindex]';

  function render() {
    if (!els.panel || rendering) return;
    rendering = true;
    try {
      const previous = els.panel;
      const wasOpen = previous.hasAttribute('open');
      const carried = els.summaryBox && els.summaryBox.style.display !== 'none'
        ? els.summaryBox.textContent
        : null;

      // Every settings change rebuilds the whole sheet, which throws away
      // whatever had focus — so flipping one switch from the keyboard would
      // drop you back to the top of the page. build() is deterministic for a
      // given set of settings, so the control's position is enough to find it
      // again.
      const controls = [...previous.querySelectorAll(FOCUSABLE)];
      const focusedAt = controls.indexOf(shadow.activeElement);
      const scrolled = previous.scrollTop;

      const fresh = build();          // build() re-points els.panel and els.summaryBox
      previous.replaceWith(fresh);
      if (wasOpen) fresh.setAttribute('open', '');
      if (carried !== null) showSummary({ state: 'done', text: carried });

      applyChrome();
      fresh.scrollTop = scrolled;
      if (focusedAt !== -1) {
        const again = fresh.querySelectorAll(FOCUSABLE)[focusedAt];
        if (again) again.focus();
      }
    } finally {
      rendering = false;
    }
  }

  function showSummary({ state, text }) {
    if (!els.summaryBox) return;
    els.summaryBox.style.display = 'block';
    els.summaryBox.textContent = state === 'loading' ? t().thinking : text || '';
    if (els.panel) els.panel.setAttribute('open', '');   // never re-enter render()
  }

  function toast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.setAttribute('show', '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.removeAttribute('show'), 1400);
  }

  /* How much of the left edge YouTube's own navigation is using right now. */
  /* Only a rail actually pinned to the left edge counts. An overlay drawer that
     has slid away still has a box, but a negative left — treating that as space
     to avoid would push the button into the middle of the page. Pure, so the
     rule can be checked without a layout. */
  function railWidth(box) {
    if (!box || !box.width) return 0;
    if (box.left > 1 || box.right <= 0) return 0;
    return Math.round(box.right);
  }

  function measureRail() {
    if (!host) return;
    const rail = document.querySelector('tp-yt-app-drawer#guide[opened], ytd-mini-guide-renderer');
    host.style.setProperty('--rail', railWidth(rail && rail.getBoundingClientRect()) + 'px');
  }

  function init(context) {
    if (shadow) return;
    ctx = context;

    const host = document.createElement('div');
    host.id = 'costum-host';
    shadow = host.attachShadow({ mode: 'open' });
    shadow.appendChild(el('style', { text: CSS }));

    const dir = lang() === 'ar' ? 'rtl' : 'ltr';
    const L = t();

    els.toast = el('div', { class: 'toast', role: 'status' });
    const fab = el('button', { class: 'fab', type: 'button', 'aria-label': L.open, html: GEAR, onclick: () => toggleOpen() });
    els.fab = fab;

    els.root = el('div', { dir }, [fab, build(), els.toast]);
    shadow.appendChild(els.root);
    document.documentElement.appendChild(host);
    watchForDismiss();
    applyChrome();
    measureRail();
    window.addEventListener('resize', measureRail);
    window.addEventListener('costum:navigate', measureRail);
    window.addEventListener('costum:settings', () => render());
    window.addEventListener('costum:navigate', () => render());
  }

  self.CostumPanel = { init, toast, showSummary, toggleOpen };
  self.CostumPanelInternals = { railWidth };
  self.Costum.register({
    name: 'panel',
    apply() { measureRail(); },
    onMutation() { measureRail(); },
    actions: { togglePanel: () => toggleOpen() } });
})();
