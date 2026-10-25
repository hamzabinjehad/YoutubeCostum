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
      secNow: 'Now playing', secPreferences: 'Playback preferences',
      secWatch: 'Page preferences', secTune: 'Tune audio & picture',
      secModes: 'Modes & focus', secMore: 'More',
      healthNote: (n) => (n === 1 ? 'One switch on this page is finding nothing. YouTube may have changed it.'
        : n + ' switches on this page are finding nothing. YouTube may have changed them.'),
      healthDetails: 'Details',
      welcomeTitle: 'Pick a starting point',
      welcomeBody: 'One tap sets YouTube up for how you watch. Change anything later, or tap the mode again to undo it.',
      welcomeSkip: 'Not now',
      /* How far each section reaches. The speed row changes the video in
         front of you; the quality row changes every video; the page rows
         change every page of this kind; a mode changes all of YouTube. */
      scopeVideo: 'This video', scopeEvery: 'Every video', scopeSite: 'All of YouTube', scopeChannel: 'Only this channel',
      scopeOf: { watch: 'Every watch page', home: 'Every home page', search: 'Every search page', channel: 'Every channel page', any: 'Every page' },
      profileWhat: {
        recommended: 'Hides Shorts, suggestions and end screens, stops the endless feed',
        study: 'All of that, plus comments and the home feed — and plays at 1.5×',
        music: 'Keeps comments and suggestions, evens out the volume',
        evening: 'Dims the picture, cinema mode, hides Shorts'
      },
      modeOn: (name) => name + ' is on', modeNone: 'Tap a mode to apply it; tap it again to undo',
      zen: 'Just the video', zenNote: 'Player only — no header, sidebar or comments',
      speed: 'Speed', quality: 'Preferred quality', auto: 'Auto',
      boost: 'Volume boost', bass: 'Bass', normalize: 'Even out loudness',
      brightness: 'Brightness', contrast: 'Contrast', saturation: 'Saturation',
      cinema: 'Cinema', wide: 'Wide player', shorts: 'Hide Shorts',
      comments: 'Hide comments', related: 'Hide related', chat: 'Hide chat',
      endScreens: 'Hide end screens', feed: 'Hide feed', chips: 'Hide chip bar',
      mixes: 'Hide mixes', playlists: 'Hide playlists', suggest: 'Hide suggestions',
      infinite: 'Stop infinite scroll', ads: 'Hide banner ads', chShorts: 'Hide Shorts shelf',
      chCommunity: 'Hide Community tab', chLive: 'Hide Live tab',
      shot: 'Frame', pip: 'PiP', summarize: 'Summarize',
      loopA: 'Loop A', loopB: 'Loop B', loopOff: 'Clear loop',
      settings: 'All settings', reset: 'Reset to default',
      settingsWhere: 'Every setting lives in the Costum icon in the toolbar',
      recommended: 'Recommended', study: 'Study', music: 'Music', evening: 'Evening',
      skipAds: 'Skip video ads', block30: 'Block 30 min', cover: 'Cover people',
      undoHint: 'Tap again to put your own settings back',
      thinking: 'Reading the transcript…', close: 'Close', open: 'Open Costum',
      diag: 'Diagnostics',
      cancel: 'Cancel', retry: 'Retry', copy: 'Copy summary', copied: 'Summary copied', copyFailed: 'Could not copy summary',
      brief: 'Brief', detailed: 'Detailed', clearSummaries: 'Clear saved summaries', undoSkip: 'Undo sponsor skip', revealBlocked: 'Reveal blocked videos',
      summaryBudget: 'Uses your Claude API key. Long videos can use up to 5 requests.',
      secChannel: 'This channel', channelUnknown: 'Channel not identified yet',
      keepSpeed: 'Keep speed here', speedHere: 'Speed here', keepAudio: 'Keep sound here', audioHere: 'Sound kept',
      keepClutter: 'Keep clutter choices here', clutterHere: 'Clutter kept', forgetChannel: 'Forget channel',
      channelSaved: 'Kept for this channel', channelCleared: 'Back to your global preferences', channelBadge: 'channel',
      saveMode: 'Save as mode', modeName: 'Mode name', save: 'Save', modeSaved: 'Mode saved', yourModes: 'Your modes',
      blockedHere: 'Blocked here', blockedNone: 'Nothing is hidden on this page', show: 'Show', showAll: 'Show all',
      blockChannel: 'Block this channel',
      secBookmarks: 'Bookmarks', bookmark: 'Bookmark', bookmarkNote: 'Note (optional)', bookmarkSave: 'Save at ',
      bookmarkDelete: 'Delete bookmark', bookmarkJump: 'Jump to ', bookmarksWhere: 'Every bookmark, searchable: Costum icon → Customize → Bookmarks',
      continueRun: 'Continue', savedSummary: 'Saved summary', copiedLink: 'Copied with the video link'
    },
    ar: {
      title: 'Costum',
      secNow: 'قيد المشاهدة', secPreferences: 'تفضيلات التشغيل',
      secWatch: 'تفضيلات الصفحة', secTune: 'ضبط الصوت والصورة',
      secModes: 'الأوضاع والتركيز', secMore: 'المزيد',
      healthNote: (n) => (n === 1 ? 'في مفتاح بهالصفحة ما عم يلاقي شي. يمكن يوتيوب غيّره.'
        : n === 2 ? 'في مفتاحين بهالصفحة ما عم يلاقوا شي. يمكن يوتيوب غيّرهن.'
          : n + (n <= 10 ? ' مفاتيح' : ' مفتاح') + ' بهالصفحة ما عم تلاقي شي. يمكن يوتيوب غيّرها.'),
      healthDetails: 'التفاصيل',
      welcomeTitle: 'اختار نقطة بداية',
      welcomeBody: 'ضغطة وحدة بتضبط يوتيوب على طريقتك. فيك تغيّر أي شي بعدين، أو تضغط الوضع مرة تانية لتلغيه.',
      welcomeSkip: 'مش هلق',
      scopeVideo: 'هالفيديو', scopeEvery: 'كل فيديو', scopeSite: 'كل يوتيوب', scopeChannel: 'هالقناة بس',
      scopeOf: { watch: 'كل صفحات المشاهدة', home: 'كل صفحات الرئيسية', search: 'كل صفحات البحث', channel: 'كل صفحات القنوات', any: 'كل الصفحات' },
      profileWhat: {
        recommended: 'بيخفي Shorts والمقترحات وشاشات النهاية، وبيوقف الخلاصة اللانهائية',
        study: 'هاد كله، زائد التعليقات وخلاصة الرئيسية — وبيشغّل على ١.٥×',
        music: 'بيخلّي التعليقات والمقترحات، وبيوحّد مستوى الصوت',
        evening: 'بيخفّف السطوع، وضع السينما، وبيخفي Shorts'
      },
      modeOn: (name) => name + ' شغّال', modeNone: 'اضغط وضع لتطبيقه، واضغطه مرة تانية للتراجع',
      zen: 'الفيديو بس', zenNote: 'المشغّل لحاله — بلا رأس ولا شريط ولا تعليقات',
      speed: 'السرعة', quality: 'الجودة المفضلة', auto: 'تلقائي',
      boost: 'تعزيز الصوت', bass: 'الباس', normalize: 'تسوية الصوت',
      brightness: 'السطوع', contrast: 'التباين', saturation: 'التشبّع',
      cinema: 'سينما', wide: 'مشغّل عريض', shorts: 'إخفاء Shorts',
      comments: 'إخفاء التعليقات', related: 'إخفاء المقترحات', chat: 'إخفاء الشات',
      endScreens: 'إخفاء شاشات النهاية', feed: 'إخفاء الخلاصة', chips: 'إخفاء شريط الفئات',
      mixes: 'إخفاء المكسات', playlists: 'إخفاء قوائم التشغيل', suggest: 'إخفاء الاقتراحات',
      infinite: 'إيقاف التمرير اللانهائي', ads: 'إخفاء البانرات', chShorts: 'إخفاء رف Shorts',
      chCommunity: 'إخفاء تبويب المنتدى', chLive: 'إخفاء تبويب البث',
      shot: 'لقطة', pip: 'PiP', summarize: 'تلخيص',
      loopA: 'حلقة أ', loopB: 'حلقة ب', loopOff: 'مسح الحلقة',
      settings: 'كل الإعدادات', reset: 'إرجاع للأصل',
      settingsWhere: 'كل الإعدادات موجودة بأيقونة Costum بشريط الأدوات',
      recommended: 'الموصى به', study: 'دراسة', music: 'موسيقى', evening: 'سهرة',
      skipAds: 'تخطي إعلانات الفيديو', block30: 'احظر ٣٠ دقيقة', cover: 'تغطية الصور',
      undoHint: 'اضغط مرة تانية لترجيع إعداداتك',
      thinking: 'عم أقرأ الترانسكربت…', close: 'إغلاق', open: 'افتح Costum',
      diag: 'تشخيص',
      cancel: 'إلغاء', retry: 'إعادة المحاولة', copy: 'نسخ الملخص', copied: 'تم نسخ الملخص', copyFailed: 'تعذّر نسخ الملخص',
      brief: 'موجز', detailed: 'مفصّل', clearSummaries: 'مسح الملخصات المحفوظة', undoSkip: 'تراجع عن تخطي الراعي', revealBlocked: 'إظهار الفيديوهات المحظورة',
      summaryBudget: 'يستخدم مفتاح Claude API الخاص بك. قد يستخدم الفيديو الطويل حتى 5 طلبات.',
      secChannel: 'هالقناة', channelUnknown: 'لسه ما تعرّفنا على القناة',
      keepSpeed: 'خلّي السرعة هون', speedHere: 'السرعة هون', keepAudio: 'خلّي الصوت هون', audioHere: 'الصوت محفوظ',
      keepClutter: 'خلّي خيارات الترتيب هون', clutterHere: 'الترتيب محفوظ', forgetChannel: 'انسى القناة',
      channelSaved: 'انحفظ لهالقناة', channelCleared: 'رجعت تفضيلاتك العامة', channelBadge: 'قناة',
      saveMode: 'حفظ كوضع', modeName: 'اسم الوضع', save: 'حفظ', modeSaved: 'انحفظ الوضع', yourModes: 'أوضاعك',
      blockedHere: 'المحظور هون', blockedNone: 'ما في شي مخفي بهالصفحة', show: 'إظهار', showAll: 'إظهار الكل',
      blockChannel: 'احظر هالقناة',
      secBookmarks: 'العلامات', bookmark: 'علامة', bookmarkNote: 'ملاحظة (اختياري)', bookmarkSave: 'احفظ عند ',
      bookmarkDelete: 'حذف العلامة', bookmarkJump: 'انتقل إلى ', bookmarksWhere: 'كل العلامات مع بحث: أيقونة Costum ← تخصيص ← العلامات',
      continueRun: 'متابعة', savedSummary: 'ملخص محفوظ', copiedLink: 'انتسخ مع رابط الفيديو'
    }
  };

  /* The panel lives on YouTube's page, so it cannot borrow the shared
     stylesheet — these are the same Apple tokens as ui/shared/apple.css, dark
     only, inlined for the shadow root. Keep the two in step. */
  const CSS = `
  /* all:initial resets font-family to the browser's default serif, and the face
     was set on .panel only — so the floating button, which is not inside it,
     was drawing in Times. Nothing there has text today; the next thing added
     would have. (No backticks in here: this is inside a template literal.) */
  :host {
    all: initial;
    font-family: var(--font);
    font-size: var(--t-body);
    letter-spacing: var(--track-body);
  }
  *, *::before, *::after { box-sizing: border-box; }
  button, input, select, textarea {
    font: inherit; color: inherit; letter-spacing: inherit;
  }

  :host {
    /* The popup's "Studio" dark ramp: warm graphite, one teal signal. */
    --ink: #EDECE8;
    /* Translucent so it holds over either YouTube theme: .72 clears AA on the
       sheet whether the page behind it is dark or light. */
    --dim: rgba(237,236,232,.72);
    --line: rgba(255,255,255,.08);
    --line-strong: rgba(255,255,255,.13);
    --fill-1: rgba(255,255,255,.08);
    --fill-2: rgba(255,255,255,.12);
    --fill-3: rgba(255,255,255,.05);
    --switch-off: rgba(255,255,255,.16);
    --accent: #2DBFA9;
    --accent-ink: #FFFFFF;
    /* White on the control teal is under AA; anything filled that carries a
       word uses the deeper fill (5.47:1). */
    --accent-fill: #0F766E;
    --accent-text: #4FD1BD;
    --accent-soft: rgba(45,191,169,.16);
    /* A thick material: dark whatever is behind it, and still blurred. */
    --sheet: rgba(20,20,22,.95);
    --card: rgba(255,255,255,.045);
    --thumb-shadow: 0 1px 2px rgba(0,0,0,.5);
    --ease: cubic-bezier(.2,.8,.2,1);
    --dur: .22s;
    --dur-fast: .16s;
    --font: ui-rounded, "SF Pro Rounded", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;

    /* The same four steps and the same tracking as the popover. This surface
       had its own five sizes between 11px and 16px, which is how one product
       ends up looking like two. SF is tracked by size: small opened up, large
       tightened. */
    --t-caption: 11px;
    --t-body: 13px;
    --t-title: 15px;
    --track-caption: .01em;
    --track-body: -.004em;
    --track-title: -.012em;
    --track-eyebrow: .07em;
  }

  /* ---- the button ---- */
  .fab {
    position: fixed; z-index: 2147483000;
    width: 44px; height: 44px; border: 1px solid var(--line-strong);
    border-radius: 14px; background: var(--sheet); color: var(--ink);
    -webkit-backdrop-filter: blur(30px) saturate(1.8); backdrop-filter: blur(30px) saturate(1.8);
    display: grid; place-items: center; cursor: pointer; padding: 0;
    box-shadow: 0 6px 20px rgba(0,0,0,.35);
    transition: transform var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease);
  }
  .fab:hover { transform: scale(1.06); box-shadow: 0 8px 26px rgba(0,0,0,.42); }
  .fab:active { transform: scale(.92); }
  .fab svg { width: 19px; height: 19px; display: block; }
  .fab:focus-visible, .panel :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  /* .card clips to round its corners, so a ring drawn outside a row is sliced
     down to a stray blue line. Draw it inside. */
  .card .row.tap:focus-visible { outline-offset: -2px; border-radius: 0; }

  /* ---- the sheet ---- */
  .panel {
    position: fixed; z-index: 2147483000;
    width: 320px; max-height: min(76vh, 620px);
    overflow-y: auto; overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    background: var(--sheet); color: var(--ink);
    -webkit-backdrop-filter: blur(30px) saturate(1.8);
    backdrop-filter: blur(30px) saturate(1.8);
    border: 1px solid var(--line-strong); border-radius: 16px;
    padding: 4px 0 12px;
    display: none; flex-direction: column;
    box-shadow: 0 24px 60px rgba(0,0,0,.55);
    font-family: var(--font); font-size: var(--t-body); letter-spacing: var(--track-body); line-height: 1.45;
    -webkit-font-smoothing: antialiased;
  }
  /* Grows out of the button rather than appearing, which is what makes it read
     as the same object the button turned into. */
  .panel[open] { display: flex; animation: sheet-in var(--dur) var(--ease); }
  /* Every settings change rebuilds the sheet. The entrance belongs to opening
     it, not to every switch flipped inside it, so a rebuilt sheet arrives
     settled. */
  .panel[open].settled { animation: none; }
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
  header b { font-size: var(--t-title); letter-spacing: var(--track-title); font-weight: 700; }
  /* The popover's mark at sheet size, so the panel is recognisably the same
     product as the toolbar icon that opens its settings. */
  .brand { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .brand-mark {
    flex: 0 0 auto; width: 24px; height: 24px; border-radius: 7px;
    background: linear-gradient(180deg, #FF4B4B 0%, #D6202B 100%);
    box-shadow: inset 0 .5px 0 rgba(255, 255, 255, .35);
    display: grid; place-items: center; color: #FFFFFF;
  }
  .brand-mark svg { width: 15px; height: 15px; display: block; }
  .x {
    background: var(--fill-1); border: 0; border-radius: 8px;
    width: 28px; height: 28px; color: var(--dim); cursor: pointer;
    display: grid; place-items: center; font-size: var(--t-title); letter-spacing: var(--track-title); line-height: 1; padding: 0;
    transition: background var(--dur-fast) var(--ease);
  }
  .x:hover { background: var(--fill-2); color: var(--ink); }

  /* ---- sections ---- */
  section { display: flex; flex-direction: column; padding: 0 16px 14px; }
  /* Named the popup's way: small tracked capitals above the card. */
  .sec-label {
    display: flex; align-items: baseline; gap: 8px;
    font-size: var(--t-caption); letter-spacing: var(--track-eyebrow); font-weight: 650;
    text-transform: uppercase;
    color: var(--dim);
    padding: 8px 2px 7px;
  }
  :host-context([dir="rtl"]) .sec-label { letter-spacing: 0; }
  .sec-label > span:first-child { flex: 1 1 auto; min-width: 0; }
  /* How far the section reaches, in regular weight and without the heading's
     tracking, so it reads as a qualifier rather than a second heading. */
  .sec-scope { flex: 0 0 auto; font-weight: 500; letter-spacing: var(--track-caption); text-transform: none; }
  .panel-disclosure .sec-scope { color: var(--dim); font-size: var(--t-caption); margin-inline-start: auto; margin-inline-end: 10px; }
  /* What the mode in force does, or how modes work, under the grid. */
  .mode-note { display: block; font-size: var(--t-caption); letter-spacing: var(--track-caption); color: var(--dim); line-height: 1.4; padding: 0 2px; }

  .panel-disclosure { margin: 0 16px 14px; }
  .panel-disclosure > summary {
    list-style: none; display: flex; align-items: center; justify-content: space-between;
    min-height: 44px; padding: 8px 12px; border-radius: 12px;
    background: var(--card); box-shadow: inset 0 0 0 1px var(--line); color: var(--ink); cursor: pointer;
  }
  .panel-disclosure > summary::-webkit-details-marker { display: none; }
  .panel-disclosure[open] > summary { border-radius: 12px 12px 0 0; }
  .panel-disclosure .card { border-radius: 0 0 12px 12px; }
  .disclosure-chevron {
    width: 7px; height: 7px; flex: 0 0 auto;
    border-right: 1.7px solid var(--dim); border-bottom: 1.7px solid var(--dim);
    transform: rotate(45deg); transition: transform var(--dur-fast) var(--ease);
  }
  .panel-disclosure[open] .disclosure-chevron { transform: rotate(225deg); }
  .panel-disclosure > summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  /* rows sit on one grouped card per section, the way native settings do */
  .card {
    background: var(--card); border-radius: 12px; overflow: hidden;
    box-shadow: inset 0 0 0 1px var(--line);
  }
  .row {
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; padding: 8px 12px; min-height: 42px; position: relative;
  }
  .row + .row::before {
    content: ""; position: absolute; inset-block-start: 0;
    inset-inline: 12px 0; height: 1px; background: var(--line);
  }
  .row > label, .row .row-name { color: var(--ink); flex: 1 1 auto; min-width: 0; }

  /* A mode that composes several settings has to say what it takes away. */
  .row-note {
    display: block; margin-top: 2px;
    font-size: var(--t-caption); letter-spacing: var(--track-caption); line-height: 1.35;
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
    width: 40px; height: 24px; border-radius: 8px;
    background: var(--switch-off);
    transition: background var(--dur-fast) var(--ease);
  }
  .switch::after {
    content: ""; position: absolute;
    inset-block-start: 3px; inset-inline-start: 3px;
    width: 18px; height: 18px; border-radius: 5.5px;
    background: #FFFFFF; box-shadow: var(--thumb-shadow);
    transition: transform var(--dur) var(--ease);
  }
  [aria-pressed="true"] > .switch { background: var(--accent); }
  [aria-pressed="true"] > .switch::after { transform: translateX(16px); }
  :host-context([dir="rtl"]) [aria-pressed="true"] > .switch::after,
  [dir="rtl"] [aria-pressed="true"] > .switch::after { transform: translateX(-16px); }

  /* ---- sliders ---- */
  .slider { display: flex; flex-direction: column; gap: 2px; padding: 8px 12px 10px; position: relative; }
  .slider + .slider::before, .row + .slider::before, .slider + .row::before {
    content: ""; position: absolute; inset-block-start: 0;
    inset-inline: 12px 0; height: 1px; background: var(--line);
  }
  .slider .top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .slider .name { color: var(--ink); }
  .val {
    background: none; border: 0; padding: 1px 0; cursor: default;
    font-variant-numeric: tabular-nums; font-size: var(--t-body); letter-spacing: var(--track-body); color: var(--dim);
    unicode-bidi: plaintext;
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
    width: 18px; height: 18px; margin-top: -7px; border-radius: 6px;
    background: #FFFFFF; box-shadow: var(--thumb-shadow);
    transition: transform var(--dur-fast) var(--ease);
  }
  input[type=range]:active::-webkit-slider-thumb { transform: scale(1.12); }

  /* ---- segmented control ---- */
  .segmented {
    display: flex; gap: 2px; padding: 3px;
    background: var(--fill-1); border-radius: 10px;
    touch-action: pan-y;
  }
  .segmented.grid2 { display: grid; grid-template-columns: 1fr 1fr; }
  .segmented.wrap { display: grid; grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr)); }
  .segmented button {
    flex: 1 1 0; min-width: 0;
    border: 0; background: none; color: var(--ink);
    font-size: var(--t-body); letter-spacing: var(--track-body); padding: 6px 6px; border-radius: 7.5px; cursor: pointer;
    font-variant-numeric: tabular-nums; white-space: nowrap;
    /* "2×" keeps its order in an Arabic sheet; an Arabic word keeps its own. */
    unicode-bidi: plaintext;
    transition: background var(--dur-fast) var(--ease);
  }
  .segmented button:hover { background: var(--fill-3); }
  .segmented button[aria-pressed="true"] {
    background: var(--accent-fill); color: var(--accent-ink); font-weight: 650;
  }

  /* ---- action buttons ---- */
  .now-controls { display: flex; flex-direction: column; gap: 8px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; touch-action: pan-y; }
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    border: 1px solid var(--line-strong); background: var(--fill-3); color: var(--ink);
    border-radius: 10px; padding: 7px 11px; font-size: var(--t-body); letter-spacing: var(--track-body); font-weight: 560; cursor: pointer;
    white-space: nowrap;
    transition: background var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
  }
  .glyph { display: block; flex: 0 0 auto; opacity: .85; }
  .glyph svg { width: 14px; height: 14px; display: block; }
  .chip[aria-pressed="true"] .glyph { opacity: 1; }
  .chip[aria-pressed="true"] { background: var(--accent-soft); border-color: color-mix(in srgb, var(--accent) 45%, transparent); color: var(--accent-text); }
  .chip:hover { background: var(--fill-2); }
  .chip:active { transform: scale(.96); }
  /* Each row of actions fills the sheet's width, so a wrapped row does not
     end in a ragged gap. */
  .chips > .chip { flex: 1 1 auto; justify-content: center; }

  select {
    background: var(--fill-1); border: 1px solid var(--line-strong); color: var(--ink);
    border-radius: 8px; padding: 4px 8px; font-size: var(--t-body); letter-spacing: var(--track-body); cursor: pointer;
  }

  /* ---- summary ---- */
  .summary {
    /* The panel is a flex column, so without this the box collapses to a
       single line and long text — a summary, a diagnostic — is unreadable. */
    flex: 0 0 auto;
    margin: 0 16px 14px; padding: 12px 13px;
    background: var(--card); border-radius: 12px; box-shadow: inset 0 0 0 1px var(--line);
    font-size: var(--t-body); letter-spacing: var(--track-body); line-height: 1.7; white-space: pre-wrap;
    max-height: 320px; min-height: 120px; overflow-y: auto; color: var(--ink);
    -webkit-overflow-scrolling: touch; overscroll-behavior: contain;
    font-variant-numeric: tabular-nums;
  }

  .summary-body { white-space: pre-wrap; }
  .summary-list { list-style: none; margin: 0; padding: 0; white-space: normal; }
  .summary-list li {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 8px 0; border-top: 1px solid var(--line);
  }
  .summary-list li:first-child { border-top: 0; }
  .summary-list .item-text { flex: 1 1 auto; min-width: 0; line-height: 1.35; }
  .summary-list .item-text b { display: block; font-weight: 590; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .summary-list .item-text small { color: var(--dim); font-size: var(--t-caption); letter-spacing: var(--track-caption); }
  .summary-notice { color: var(--dim); white-space: normal; margin-block: 8px; }
  .summary-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; white-space: normal; }
  .summary-seek { background: none; color: var(--accent-text); border: 0; cursor: pointer; text-decoration: underline; min-height: 44px; padding-inline: 4px; }
  .summary-seek:focus-visible { outline: 2px solid var(--accent-text); outline-offset: 2px; }

  /* A row whose value this channel overrides says so, beside the name. */
  .badge {
    display: inline-block; margin-inline-start: 6px; padding: 1px 6px; border-radius: 6px;
    background: var(--fill-1); color: var(--dim);
    font-size: var(--t-caption); letter-spacing: var(--track-caption); vertical-align: 1px;
  }
  .marks { display: flex; flex-direction: column; }
  .mark {
    display: flex; align-items: center; gap: 8px; padding: 6px 12px; min-height: 40px; position: relative;
  }
  .mark + .mark::before {
    content: ""; position: absolute; inset-block-start: 0; inset-inline: 12px 0; height: 1px; background: var(--line);
  }
  .mark .when {
    background: none; border: 0; color: var(--accent-text); cursor: pointer; padding: 6px 4px; min-height: 36px;
    font-variant-numeric: tabular-nums; flex: 0 0 auto;
  }
  .mark .what { flex: 1 1 auto; min-width: 0; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mark .what:empty::before { content: "—"; color: var(--dim); }
  .mark .x { flex: 0 0 auto; }
  .inline-form { display: flex; gap: 8px; align-items: center; }
  .inline-form input[type=text] {
    flex: 1 1 auto; min-width: 0; min-height: 36px; padding: 6px 10px;
    background: var(--fill-1); border: 1px solid var(--line-strong); border-radius: 8px; color: var(--ink);
  }
  .inline-form input[type=text]::placeholder { color: var(--dim); }

  .foot { padding: 0 16px; }
  .welcome {
    display: flex; flex-direction: column; gap: 8px;
    margin: 0 16px 14px; padding: 12px; border-radius: 12px;
    background: var(--accent-soft); border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
  }
  .welcome b { font-size: var(--t-title); letter-spacing: var(--track-title); font-weight: 700; }
  .welcome .link {
    align-self: flex-start; width: auto; background: none; border: 0; padding: 4px 0; cursor: pointer;
    color: var(--accent-text); font: inherit; font-size: var(--t-body); letter-spacing: var(--track-body);
  }

  /* The one warning in the sheet: orange, like the popover's not-allowed state. */
  .health {
    display: flex; align-items: flex-start; gap: 8px;
    margin: 0 16px 12px; padding: 10px 12px; border-radius: 12px;
    background: rgba(251, 191, 36, .14); color: var(--ink);
    font-size: var(--t-body); letter-spacing: var(--track-body); line-height: 1.4;
  }
  .health .glyph { margin-top: 2px; color: #FBBF24; opacity: 1; }
  .health span:not(.glyph) { flex: 1 1 auto; min-width: 0; }
  .health .link {
    flex: 0 0 auto; width: auto; background: none; border: 0; padding: 0; cursor: pointer;
    color: var(--accent-text); font: inherit; font-weight: 650;
  }
  .foot-note { display: block; font-size: var(--t-caption); letter-spacing: var(--track-caption); color: var(--dim); line-height: 1.4; }
  .link {
    background: none; border: 0; color: var(--accent-text); cursor: pointer;
    font-size: var(--t-body); letter-spacing: var(--track-body); padding: 8px 2px; text-align: start; width: 100%;
    border-radius: 6px;
  }
  .link:hover { text-decoration: underline; }

  /* ---- toast ---- */
  .toast {
    position: fixed; z-index: 2147483001;
    background: var(--sheet); color: var(--ink);
    -webkit-backdrop-filter: blur(30px) saturate(1.8); backdrop-filter: blur(30px) saturate(1.8);
    border: 1px solid var(--line-strong); border-radius: 12px;
    padding: 9px 16px; font-family: var(--font); font-size: var(--t-body); letter-spacing: var(--track-body); font-weight: 500;
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
      border-radius: 16px 16px 0 0;
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
    .toast { inset-block-end: calc(20px + env(safe-area-inset-bottom)); }
  }

  /* ---- touch ----
     Finger-sized targets follow the pointer, not the width. They used to live
     in the phone block above, so an iPad — too wide for the bottom sheet, but
     still a finger — got the mouse sizes: speed segments 30px tall and a 26px
     close button, under the platform's 44pt floor. */
  @media (pointer: coarse) {
    header .x { width: 36px; height: 36px; }
    .chip { padding: 10px 13px; min-height: 44px; }
    .segmented button { padding: 9px 6px; min-height: 44px; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition-duration: .001ms !important; animation-duration: .001ms !important; }
    .fab:hover, .fab:active, .chip:active { transform: none; }
  }
  @media (prefers-reduced-transparency: reduce) {
    :host { --sheet: #141416; }
    .panel, .fab, .toast, header { -webkit-backdrop-filter: none; backdrop-filter: none; }
  }
  `;

  /* The brand mark's sliders: rows at 7, 12 and 17, knobs at 71%, 37% and
     59% across, the same drawing as the app icon, the popover's mark and the
     Panel tile. The button used to have its own, slightly different set. */
  const SLIDERS = '<path d="M5 7h14M5 12h14M5 17h14"/>'
    + '<circle cx="17" cy="7" r="2.4" fill="currentColor" stroke="none"/>'
    + '<circle cx="9" cy="12" r="2.4" fill="currentColor" stroke="none"/>'
    + '<circle cx="14" cy="17" r="2.4" fill="currentColor" stroke="none"/>';
  const GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">'
    + SLIDERS + '</svg>';

  let ctx = null;
  let shadow = null;
  let host = null;
  let els = {};
  /* Whether the one-time welcome has been seen. Assumed yes until storage says
     otherwise, so it never flashes up for someone who dismissed it. */
  let welcomed = true;
  let toastTimer = null;
  let rendering = false;
  let summaryState = { state: 'idle' };

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
      title: value === fallback ? '' : t().reset,
      'data-control-id': 'slider-reset:' + path
    });
    if (value !== fallback) out.setAttribute('data-modified', '');

    const input = el('input', {
      type: 'range', min, max, step, value, 'aria-label': name,
      'data-control-id': 'slider:' + path
    });

    function show(v) {
      out.textContent = format(v);
      // The slider speaks "+3 dB", not "3".
      input.setAttribute('aria-valuetext', format(v));
      if (v === fallback) { out.removeAttribute('data-modified'); out.title = ''; out.setAttribute('aria-hidden', 'true'); }
      else { out.setAttribute('data-modified', ''); out.title = t().reset; out.setAttribute('aria-hidden', 'false'); out.setAttribute('aria-label', t().reset); }
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
    show(value);

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
  function toggle(label, on, onClick, note, badge) {
    const name = note
      ? el('span', { class: 'row-name' }, [
          el('span', { text: label }),
          el('small', { class: 'row-note', text: note })
        ])
      : el('span', { class: 'row-name' }, [el('span', { text: label })]);
    if (badge) name.appendChild(el('span', { class: 'badge', text: badge }));

    return el('div', {
      class: 'row tap' + (note ? ' row-tall' : ''), role: 'button', tabindex: '0',
      'aria-pressed': String(!!on),
      'data-control-id': 'toggle:' + label,
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
      'data-control-id': 'segment:' + label,
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
    // A loop is the repeat symbol. It used to be two opposed arrows, which
    // is "swap", not "go round again".
    loop: '<path d="M16.5 3.5l3 3-3 3"/><path d="M4.5 11.5v-1a4 4 0 0 1 4-4h11"/><path d="M7.5 20.5l-3-3 3-3"/><path d="M19.5 12.5v1a4 4 0 0 1-4 4h-11"/>',
    loopOff: '<path d="M16.5 3.5l3 3-3 3"/><path d="M4.5 11.5v-1a4 4 0 0 1 4-4h11"/><path d="M7.5 20.5l-3-3 3-3"/><path d="M19.5 12.5v1a4 4 0 0 1-4 4h-11"/><path d="M3.5 3.5l17 17"/>',
    bookmark: '<path d="M7 3.5h10a1 1 0 0 1 1 1v16l-6-4.2-6 4.2v-16a1 1 0 0 1 1-1z"/>',
    doc: '<path d="M7 3.5h7l4 4v13H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z"/><path d="M9.5 12h5M9.5 15.5h5"/>',
    plus: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8.2v7.6M8.2 12h7.6"/>',
    nosign: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',
    eye: '<path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.8"/>',
    eyeSlash: '<path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6z"/><path d="M4.5 19.5l15-15"/>',
    undo: '<path d="M9 14.5L4.5 10 9 5.5"/><path d="M4.5 10h10a5 5 0 0 1 0 10h-3"/>',
    trash: '<path d="M4.5 6.5h15M9.5 6.5v-2h5v2M6.5 6.5l1 13.5h9l1-13.5"/>',
    gauge: '<path d="M4.6 17.5a8.5 8.5 0 1 1 14.8 0"/><path d="M12 13.5l3.8-4.3"/><circle cx="12" cy="13.5" r="1.3" fill="currentColor" stroke="none"/>',
    speaker: '<path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11"/>',
    xmark: '<circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6M15 9l-6 6"/>',
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

  function chip(label, pressed, onClick, icon, controlId) {
    const mark = icon ? glyph(icon) : null;
    return el('button', {
      class: 'chip', type: 'button',
      'aria-pressed': pressed === undefined ? null : String(!!pressed),
      'data-control-id': 'chip:' + (controlId || icon || label),
      onclick: onClick
    }, [mark, el('span', { text: label })]);
  }

  /* `scope` is how far the section's controls reach, on the trailing edge of
     the heading: this video, every video, every page of this kind, all of
     YouTube. Without it "Now playing" and "Playback preferences" looked like
     two lists of the same kind of switch. */
  function section(label, body, scope) {
    return el('section', {}, [
      el('div', { class: 'sec-label' }, [
        el('span', { text: label }),
        scope ? el('span', { class: 'sec-scope', text: scope }) : null
      ]),
      body
    ]);
  }

  /* A switch that is on here and finding nothing (see deadSwitches in css.js).
     Said at the top, because a switch that silently stopped working is the one
     thing in this sheet that is lying. Details names them. */
  function healthNote(L) {
    const health = self.CostumHealth;
    const dead = health && health.path === location.pathname ? health.dead : [];
    if (!dead.length) return null;
    return el('div', { class: 'health', role: 'status', 'data-control-id': 'health-note' }, [
      glyph('pulse'),
      el('span', { text: L.healthNote(dead.length) }),
      el('button', { class: 'link', type: 'button', text: L.healthDetails, 'data-control-id': 'health-details',
        onclick: () => ctx.action('diagnose')(ctx) })
    ]);
  }

  /* ---- the first minute ----
     After setup the reader lands on YouTube with a round button that opens a
     long sheet. A mode is the fastest way to feel the difference, so the
     first time the sheet opens it leads with the four, one tap each and
     undoable. Shown once; gone for good when a mode is picked or it is
     dismissed, and never to someone who already has a mode on. */
  function markWelcomed() {
    welcomed = true;
    try { (self.browser || self.chrome).storage.local.set({ welcomed: true }); } catch (e) { /* storage unavailable */ }
    render();
  }

  function welcomeCard(L, s) {
    if (welcomed || s.profile !== 'default') return null;
    const pick = (name) => () => { markWelcomed(); applyProfile(name); };
    /* Their own control ids: the Modes section further down has segments with
       the same labels, and a shared id sent focus-restore (and anything else
       looking a control up by id) to the wrong one. */
    const choice = (label, name) => {
      const node = segment(label, false, pick(name));
      node.setAttribute('data-control-id', 'welcome:' + name);
      return node;
    };
    return el('section', { class: 'welcome', 'aria-label': L.welcomeTitle, 'data-control-id': 'welcome' }, [
      el('b', { text: L.welcomeTitle }),
      el('span', { class: 'foot-note', text: L.welcomeBody }),
      el('div', { class: 'segmented grid2' }, [
        choice(L.recommended, 'recommended'),
        choice(L.study, 'study'),
        choice(L.music, 'music'),
        choice(L.evening, 'evening')
      ]),
      el('button', { class: 'link', type: 'button', text: L.welcomeSkip, 'data-control-id': 'welcome-skip', onclick: markWelcomed })
    ]);
  }

  function pageScope(L) {
    const path = location.pathname;
    if (path.startsWith('/watch')) return L.scopeOf.watch;
    if (path.startsWith('/results')) return L.scopeOf.search;
    if (/^\/(@|channel\/|c\/|user\/)/.test(path)) return L.scopeOf.channel;
    if (path === '/' || path === '') return L.scopeOf.home;
    return L.scopeOf.any;
  }


  /* The clutter worth hiding depends on the page you are on. Showing the watch
     page's controls while you are on the home feed is how a settings list grows
     to forty checkboxes nobody reads. */
  function currentGroups() {
    return self.CostumCss.currentPages(location.pathname);
  }

  function pageToggles(s, L, patch) {
    const d = s.declutter;
    const groups = currentGroups();
    const out = [];
    /* m.youtube.com is what an iPhone gets, and a switch written against the
       desktop page does nothing there. It is left out rather than offered. */
    const mobile = self.CostumCss.isMobileHost(location.hostname);
    const offer = (path, node) => (self.CostumCss.worksOn(path, mobile) ? node : null);

    /* On a watch page this leads, because it is the one control that does what
       the six under it do together. Off a watch page it would promise something
       it cannot deliver, so it is simply absent. */
    if (groups.includes('watch')) {
      out.push(offer('layout.zen', toggle(L.zen, s.layout.zen, () => patch({ layout: { zen: !s.layout.zen } }), L.zenNote)));
    }

    if (groups.includes('watch')) {
      /* These four can be kept per channel. The switch still writes the global
         preference; the badge says the channel's own choice is what shows. */
      const own = (ctx.channel && ctx.channel().prefs) || null;
      const kept = (key) => (own && own.watch && key in own.watch ? L.channelBadge : '');
      out.push(
        offer('layout.cinema', toggle(L.cinema, s.layout.cinema, () => patch({ layout: { cinema: !s.layout.cinema } }))),
        offer('layout.widePlayer', toggle(L.wide, s.layout.widePlayer, () => patch({ layout: { widePlayer: !s.layout.widePlayer } }))),
        offer('declutter.watch.comments', toggle(L.comments, d.watch.comments, () => patch({ declutter: { watch: { comments: !d.watch.comments } } }), '', kept('comments'))),
        offer('declutter.watch.related', toggle(L.related, d.watch.related, () => patch({ declutter: { watch: { related: !d.watch.related } } }), '', kept('related'))),
        offer('declutter.watch.liveChat', toggle(L.chat, d.watch.liveChat, () => patch({ declutter: { watch: { liveChat: !d.watch.liveChat } } }), '', kept('liveChat'))),
        offer('declutter.watch.endScreens', toggle(L.endScreens, d.watch.endScreens, () => patch({ declutter: { watch: { endScreens: !d.watch.endScreens } } }), '', kept('endScreens')))
      );
    }

    if (groups.includes('home') && location.pathname !== '/watch') {
      out.push(
        offer('declutter.home.feed', toggle(L.feed, d.home.feed, () => patch({ declutter: { home: { feed: !d.home.feed } } }))),
        offer('declutter.home.chips', toggle(L.chips, d.home.chips, () => patch({ declutter: { home: { chips: !d.home.chips } } }))),
        offer('declutter.home.mixes', toggle(L.mixes, d.home.mixes, () => patch({ declutter: { home: { mixes: !d.home.mixes } } })))
      );
    }

    if (groups.includes('search')) {
      out.push(offer('declutter.search.suggestions', toggle(L.suggest, d.search.suggestions, () => patch({ declutter: { search: { suggestions: !d.search.suggestions } } }))));
    }

    if (groups.includes('channel')) {
      out.push(
        offer('declutter.channel.shortsSection', toggle(L.chShorts, d.channel.shortsSection, () => patch({ declutter: { channel: { shortsSection: !d.channel.shortsSection } } }))),
        offer('declutter.channel.community', toggle(L.chCommunity, d.channel.community, () => patch({ declutter: { channel: { community: !d.channel.community } } }))),
        offer('declutter.channel.live', toggle(L.chLive, d.channel.live, () => patch({ declutter: { channel: { live: !d.channel.live } } })))
      );
    }

    return out.filter(Boolean);
  }

  function build() {
    const s = ctx.settings();
    const L = t();
    const patch = (p) => ctx.patch(p);
    const video = ctx.video();
    const rate = video ? video.playbackRate : s.playback.defaultSpeed;

    // speedPresets is the reader's list and can hold any number of values, so
    // the control wraps into as many rows as it needs instead of crushing
    // eight labels into one. Rows are balanced — eight is two rows of four,
    // not five and a ragged three — and six or fewer stay on one line.
    const presets = s.playback.speedPresets.length;
    const speedRows = Math.max(1, Math.ceil(presets / 6));
    const speeds = el('div', { class: 'segmented wrap' },
      s.playback.speedPresets.map((v) => segment(v + '×', Math.abs(rate - v) < 0.001, async () => {
        // Through the playback module, so the choice counts as this video's
        // own and outranks a channel speed until the next video.
        await ctx.action('setSpeed')(ctx, v);
        render();
      })));
    // Through the CSSOM rather than a style attribute, which a page's CSP can refuse.
    speeds.style.setProperty('--cols', String(Math.ceil(presets / speedRows)));

    const quality = el('select', {
      id: 'preferred-quality', 'aria-label': L.quality, 'data-control-id': 'preferred-quality',
      onchange: (ev) => patch({ playback: { forceQuality: ev.target.value } })
    });
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

    const summaryBox = el('section', { class: 'summary', 'aria-label': t().summarize });
    summaryBox.style.display = 'none';

    const videoActions = [];
    if (video) {
      videoActions.push(
        chip(L.shot, undefined, () => ctx.action('screenshot')(ctx), 'frame'),
        chip(L.pip, undefined, () => ctx.action('pip')(ctx), 'pip'),
        chip(L.summarize, undefined, () => ctx.action('summarize')(ctx), 'sparkle'),
        (() => {
          const mod = self.Costum.modules.find((m) => m.name === 'summary');
          const kept = mod && mod.saved && mod.saved();
          return kept && kept.videoId === ctx.videoId() && kept.entries.length
            ? chip(L.savedSummary, undefined, () => ctx.action('summaryShowSaved')(ctx), 'doc', 'summary-saved') : null;
        })(),
        // The marks read back the time they hold, so the loop is legible
        // without scrubbing to find out where it starts.
        chip(loopHere && loop.start !== null ? 'A ' + ctx.clock(loop.start) : L.loopA,
          loopHere && loop.start !== null, () => ctx.action('loopStart')(ctx), 'loop', 'loop-start'),
        chip(loopHere && loop.end !== null ? 'B ' + ctx.clock(loop.end) : L.loopB,
          loopHere && loop.end !== null, () => ctx.action('loopEnd')(ctx), 'loop', 'loop-end')
      );
      if (loopHere && (loop.start !== null || loop.end !== null)) {
        videoActions.push(chip(L.loopOff, undefined,
          () => patch({ playback: { loop: { enabled: false, start: null, end: null, videoId: '' } } }),
          'loopOff'));
      }
    }

    const tune = el('details', { class: 'panel-disclosure' });
    const defaults = DEFAULTS();
    tune.open = ['audio.boost', 'audio.bass', 'audio.normalize', 'picture.brightness',
      'picture.contrast', 'picture.saturation'].some((path) => at(s, path) !== at(defaults, path));
    tune.append(
      el('summary', { 'data-control-id': 'tune-summary' }, [
        el('span', { text: L.secTune }),
        el('span', { class: 'sec-scope', text: L.scopeEvery }),
        el('span', { class: 'disclosure-chevron', 'aria-hidden': 'true' })
      ]),
      el('div', { class: 'card' }, [
        slider(L.boost, 'audio.boost', 1, 10, 0.1, (v) => v.toFixed(1) + '×'),
        slider(L.bass, 'audio.bass', -12, 12, 1, (v) => (v > 0 ? '+' : '') + v + ' dB'),
        toggle(L.normalize, s.audio.normalize, () => patch({ audio: { normalize: !s.audio.normalize } })),
        slider(L.brightness, 'picture.brightness', 30, 200, 1, (v) => v + '%'),
        slider(L.contrast, 'picture.contrast', 30, 200, 1, (v) => v + '%'),
        slider(L.saturation, 'picture.saturation', 0, 200, 1, (v) => v + '%')
      ])
    );

    const pageControls = pageToggles(s, L, patch);
    const blockedCount = document.querySelectorAll('[costum-blocked]').length;

    /* ---- this channel ----
       Three things a channel can keep: a speed, the sound settings, the
       watch-page clutter choices. Each chip reads the current value, so
       "keep speed here" keeps the speed you are hearing right now. */
    let channelSection = null;
    const here = ctx.channel ? ctx.channel() : null;
    if (video && location.pathname.startsWith('/watch') && here) {
      const D = self.CostumDefaults;
      const own = here.prefs || {};
      const keep = (patchFor, said) => async () => {
        if (!here.id) return;
        const next = D.setChannelPrefs(ctx.settings(), here.id, here.name, patchFor());
        await ctx.ask('settings.replace', { settings: next });
        ctx.toast(said);
      };
      const chips = [];
      if (!here.id) {
        chips.push(el('span', { class: 'foot-note', text: L.channelUnknown }));
      } else {
        const speedNow = () => Math.round((ctx.video() || video).playbackRate * 100) / 100;
        chips.push(chip(own.speed ? L.speedHere + ' ' + own.speed + '×' : L.keepSpeed + ' ' + speedNow() + '×', !!own.speed,
          keep(() => ({ speed: own.speed ? 0 : speedNow() }), own.speed ? L.channelCleared : L.channelSaved), 'gauge', 'channel-speed'));
        chips.push(chip(own.audio ? L.audioHere : L.keepAudio, !!own.audio,
          keep(() => ({ audio: own.audio ? null : D.pluck(s.audio, D.CHANNEL_AUDIO_KEYS) }), own.audio ? L.channelCleared : L.channelSaved), 'speaker', 'channel-audio'));
        chips.push(chip(own.watch ? L.clutterHere : L.keepClutter, !!own.watch,
          keep(() => ({ watch: own.watch ? null : D.pluck(s.declutter.watch, D.CHANNEL_WATCH_KEYS) }), own.watch ? L.channelCleared : L.channelSaved), 'eyeSlash', 'channel-clutter'));
        if (own.speed || own.audio || own.watch) {
          chips.push(chip(L.forgetChannel, undefined, keep(() => ({ speed: 0, audio: null, watch: null }), L.channelCleared), 'xmark', 'channel-forget'));
        }
        chips.push(chip(L.blockChannel, undefined, () => ctx.action('blockChannel')(ctx), 'nosign', 'channel-block'));
      }
      channelSection = section(L.secChannel + (here.name ? ' · ' + here.name : ''), el('div', { class: 'chips' }, chips), L.scopeChannel);
    }

    /* ---- bookmarks for this video ----
       Saving asks for a note in place; the list underneath jumps and deletes.
       The whole library, with search, lives in the popover. */
    let bookmarkSection = null;
    const marksModule = self.Costum.modules.find((m) => m.name === 'bookmarks');
    if (video && location.pathname.startsWith('/watch') && marksModule) {
      const B = self.CostumBookmarks;
      const marks = marksModule.bookmarks();
      const items = marks.videoId === ctx.videoId() ? marks.items : [];
      const form = el('div', { class: 'inline-form' });
      form.style.display = 'none';
      const note = el('input', { type: 'text', 'aria-label': L.bookmarkNote, placeholder: L.bookmarkNote, maxlength: String(B.LIMITS.note), 'data-control-id': 'bookmark-note' });
      const go = el('button', { class: 'chip', type: 'button', 'data-control-id': 'bookmark-save', onclick: async () => {
        await ctx.action('bookmark')(ctx, note.value.trim());
        note.value = '';
        form.style.display = 'none';
      } });
      note.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); go.click(); } });
      form.append(note, go);
      const add = chip(L.bookmark, undefined, () => {
        const opening = form.style.display === 'none';
        form.style.display = opening ? '' : 'none';
        if (opening) { go.textContent = L.bookmarkSave + ctx.clock((ctx.video() || video).currentTime); note.focus(); }
      }, 'bookmark', 'bookmark');
      const list = el('div', { class: 'card marks' }, items.map((item) => el('div', { class: 'mark' }, [
        el('button', { class: 'when', type: 'button', text: ctx.clock(item.at), 'aria-label': L.bookmarkJump + ctx.clock(item.at),
          'data-control-id': 'bookmark-jump:' + item.id, onclick: () => ctx.action('bookmarkOpen')(ctx, item) }),
        el('span', { class: 'what', text: item.note, title: item.note }),
        el('button', { class: 'x', type: 'button', text: '×', 'aria-label': L.bookmarkDelete + ' ' + ctx.clock(item.at),
          'data-control-id': 'bookmark-delete:' + item.id, onclick: () => ctx.action('bookmarkDelete')(ctx, item.id) })
      ])));
      bookmarkSection = section(L.secBookmarks + (items.length ? ' · ' + items.length : ''), el('div', { class: 'now-controls' }, [
        el('div', { class: 'chips' }, [add]),
        form,
        items.length ? list : null,
        items.length ? el('span', { class: 'foot-note', text: L.bookmarksWhere }) : null
      ]), L.scopeVideo);
    }

    /* ---- modes: the four built in, then yours ---- */
    const modeSegments = [
      segment(L.recommended, s.profile === 'recommended', () => applyProfile('recommended'), L.undoHint),
      segment(L.study, s.profile === 'study', () => applyProfile('study'), L.undoHint),
      segment(L.music, s.profile === 'music', () => applyProfile('music'), L.undoHint),
      segment(L.evening, s.profile === 'evening', () => applyProfile('evening'), L.undoHint)
    ];
    const ownModes = (s.customModes || []).map((mode) =>
      segment(mode.name, s.profile === self.CostumDefaults.CUSTOM_PREFIX + mode.id,
        () => applyProfile(self.CostumDefaults.CUSTOM_PREFIX + mode.id), L.undoHint));

    const activeCustom = self.CostumDefaults.customMode(s, s.profile);
    const activeName = activeCustom ? activeCustom.name
      : ({ recommended: L.recommended, study: L.study, music: L.music, evening: L.evening }[s.profile] || '');
    const modeNote = !activeName ? L.modeNone
      : L.modeOn(activeName) + (L.profileWhat[s.profile] ? ' — ' + L.profileWhat[s.profile] : '') + '. ' + L.undoHint;

    // "Save as mode" opens a one-line form in place; the name is all it asks.
    const saveForm = el('div', { class: 'inline-form' });
    saveForm.style.display = 'none';
    const saveInput = el('input', { type: 'text', 'aria-label': L.modeName, placeholder: L.modeName, maxlength: '40', 'data-control-id': 'mode-name' });
    const saveGo = el('button', { class: 'chip', type: 'button', text: L.save, 'data-control-id': 'mode-save-go', onclick: async () => {
      const name = saveInput.value.trim();
      if (!name) { saveInput.focus(); return; }
      await ctx.ask('settings.replace', { settings: self.CostumDefaults.saveCustomMode(ctx.settings(), name) });
      ctx.toast(L.modeSaved);
    } });
    saveInput.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); saveGo.click(); } });
    saveForm.append(saveInput, saveGo);
    const saveChip = chip(L.saveMode, undefined, () => {
      const open = saveForm.style.display === 'none';
      saveForm.style.display = open ? '' : 'none';
      if (open) saveInput.focus();
    }, 'plus', 'mode-save');

    const panel = el('div', { class: 'panel', role: 'dialog', 'aria-label': 'Costum', tabindex: '-1' }, [
      el('div', { class: 'grabber', 'aria-hidden': 'true' }),
      el('header', {}, [
        el('div', { class: 'brand' }, [
          el('span', { class: 'brand-mark', 'aria-hidden': 'true',
            html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' + SLIDERS + '</svg>' }),
          el('b', { text: L.title })
        ]),
        el('button', { class: 'x', type: 'button', 'aria-label': L.close, text: '×',
          'data-control-id': 'panel-close', onclick: () => toggleOpen(false, true) })
      ]),

      healthNote(L),

      welcomeCard(L, s),

      video ? section(L.secNow, el('div', { class: 'now-controls' }, [
        speeds,
        videoActions.length ? el('div', { class: 'chips' }, videoActions) : null
      ]), L.scopeVideo) : null,

      summaryBox,

      section(L.secPreferences, el('div', { class: 'card' }, [
        el('div', { class: 'row' }, [el('label', { for: 'preferred-quality', text: L.quality }), quality]),
        toggle(L.skipAds, s.playback.skipAds, () => patch({ playback: { skipAds: !s.playback.skipAds } }))
      ]), L.scopeEvery),

      pageControls.length
        ? section(L.secWatch, el('div', { class: 'card' }, pageControls), pageScope(L))
        : null,

      channelSection,

      bookmarkSection,

      tune,

      section(L.secModes, el('div', { class: 'now-controls' }, [
        el('div', { class: 'segmented grid2' }, modeSegments),
        ownModes.length ? el('div', { class: 'segmented grid2', 'aria-label': L.yourModes }, ownModes) : null,
        // What the mode in force does, or how the grid works: a pressed
        // segment on its own says "selected", not what was selected for you.
        el('span', { class: 'mode-note', role: 'status', text: modeNote }),
        el('div', { class: 'chips' }, [
          saveChip,
          chip(L.block30, undefined, () => ctx.action('blockFor')(ctx, 30), 'moon')
        ]),
        saveForm
      ]), L.scopeSite),

      section(L.secMore, el('div', { class: 'chips' }, [
        chip(L.blockedHere + (blockedCount ? ' · ' + blockedCount : ''), undefined, () => ctx.action('blockedList')(ctx), 'nosign', 'blocked-list'),
        blockedCount ? chip(L.showAll, undefined, () => ctx.action('revealBlocked')(ctx), 'eye', 'reveal-blocked') : null,
        s.sponsors.enabled ? chip(L.undoSkip, undefined, () => ctx.action('sponsorUndo')(ctx), 'undo', 'sponsor-undo') : null,
        s.summary.enabled ? chip(L.clearSummaries, undefined, () => ctx.action('summaryClear')(ctx), 'trash', 'summary-clear') : null,
        chip(L.diag, undefined, () => ctx.action('diagnose')(ctx), 'pulse')
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
    // A fresh opening plays the entrance; see .settled.
    if (want && !was) els.panel.classList.remove('settled');
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
    const s = ctx.settings();
    const panelSettings = s.panel;
    const corner = CORNERS.indexOf(panelSettings.corner) === -1 ? 'bottom-right' : panelSettings.corner;
    els.root.setAttribute('data-corner', corner);
    /* With Costum off, its button is the one effect left on the page — and
       the popover behind the toolbar icon is where it is switched back on. */
    if (els.fab) els.fab.style.display = s.enabled && panelSettings.showButton ? '' : 'none';
    if (!s.enabled && els.panel) els.panel.removeAttribute('open');
  }

  const FOCUSABLE = 'button, input, select, summary, [tabindex]';

  function render() {
    if (!els.panel || rendering) return;
    rendering = true;
    try {
      const previous = els.panel;
      const wasOpen = previous.hasAttribute('open');
      const tuneWasOpen = previous.querySelector('.panel-disclosure').open;


      // Every settings change rebuilds the whole sheet, which throws away
      // whatever had focus. A stable control id survives an action appearing,
      // disappearing, or moving between sections; ordinal tab positions do
      // not (Loop Clear is the obvious example).
      const controls = [...previous.querySelectorAll(FOCUSABLE)];
      const focused = shadow.activeElement;
      const focusId = focused && focused.getAttribute('data-control-id');
      const focusedAt = controls.indexOf(focused);
      const scrolled = previous.scrollTop;

      const fresh = build();          // build() re-points els.panel and els.summaryBox
      previous.replaceWith(fresh);
      // The language is a setting too, so the direction follows a change to it
      // rather than waiting for the next page load.
      els.root.dir = lang() === 'ar' ? 'rtl' : 'ltr';
      fresh.querySelector('.panel-disclosure').open = tuneWasOpen;
      if (wasOpen) { fresh.setAttribute('open', ''); fresh.classList.add('settled'); }
      renderSummary();

      applyChrome();
      fresh.scrollTop = scrolled;
      if (focusedAt !== -1) {
        const again = focusId
          ? [...fresh.querySelectorAll('[data-control-id]')]
            .find((node) => node.getAttribute('data-control-id') === focusId)
          : fresh.querySelectorAll(FOCUSABLE)[focusedAt];
        if (again) again.focus();
      }
    } finally {
      rendering = false;
    }
  }

  function renderSummary() {
    const box = els.summaryBox;
    if (!box) return;
    const state = summaryState;
    box.replaceChildren();
    box.style.display = state.state === 'idle' ? 'none' : 'block';
    if (state.state === 'idle') return;
    box.setAttribute('aria-busy', String(state.state === 'loading'));
    if (state.state === 'confirm') {
      // A long video: the count is on screen and nothing is paid for until
      // Continue. Cancel leaves the panel as it was.
      box.appendChild(el('strong', { text: state.title || t().summarize }));
      box.appendChild(el('p', { class: 'summary-notice', text: state.notice }));
      box.appendChild(el('div', { class: 'summary-actions' }, [
        el('button', { class: 'chip', type: 'button', text: t().continueRun, 'data-control-id': 'summary-continue', onclick: () => ctx.action('summaryConfirm')(ctx) }),
        el('button', { class: 'chip', type: 'button', text: t().cancel, 'data-control-id': 'summary-cancel', onclick: () => ctx.action('summaryCancel')(ctx) })
      ]));
      return;
    }
    if (state.title) box.appendChild(el('strong', { text: state.title }));
    if (state.notice) box.appendChild(el('p', { class: 'summary-notice', text: state.notice }));
    const body = el('div', { class: 'summary-body', role: 'status', 'aria-live': 'polite' });
    if (state.state === 'list') {
      /* Rows with one action each — the blocked-cards list. Acting on a row
         removes it, so the list always shows what is still hidden. */
      const items = state.items || [];
      if (!items.length) body.textContent = t().blockedNone;
      else {
        const list = el('ul', { class: 'summary-list' });
        items.forEach((item) => {
          const row = el('li', {}, [
            el('span', { class: 'item-text' }, [el('b', { text: item.title }), el('small', { text: item.note })]),
            el('button', { class: 'chip', type: 'button', text: t().show, onclick: () => {
              item.act();
              summaryState = Object.assign({}, state, { items: items.filter((other) => other !== item) });
              renderSummary();
            } })
          ]);
          list.appendChild(row);
        });
        body.appendChild(list);
      }
      box.appendChild(body);
      return;
    }
    if (state.state === 'loading') {
      body.textContent = state.progress && state.progress.total
        ? t().thinking + ' ' + state.progress.step + ' / ' + state.progress.total
        : t().thinking;
    } else {
      const text = state.text || '';
      const allowed = new Set(state.timestamps || []);
      let end = 0;
      for (const match of text.matchAll(/\[(\d+):(\d{2})(?::(\d{2}))?\]/g)) {
        const seconds = match[3] === undefined ? Number(match[1]) * 60 + Number(match[2])
          : Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
        body.appendChild(document.createTextNode(text.slice(end, match.index)));
        if (allowed.has(seconds) && state.videoId) {
          body.appendChild(el('button', { class: 'summary-seek', type: 'button', text: match[0], onclick: () => {
            const video = ctx.video();
            if (!ctx.settings().enabled || ctx.videoId() !== state.videoId || !video || !Number.isFinite(video.duration) || seconds > video.duration) return;
            video.currentTime = seconds;
          } }));
        } else body.appendChild(document.createTextNode(match[0]));
        end = match.index + match[0].length;
      }
      body.appendChild(document.createTextNode(text.slice(end)));
    }
    box.appendChild(body);
    // Diagnostics also use this box; summary actions belong only to video jobs.
    if (!state.videoId) return;
    const actions = el('div', { class: 'summary-actions' });
    const button = (label, action) => el('button', { class: 'chip', type: 'button', text: label, onclick: action });
    if (state.state === 'loading') actions.appendChild(button(t().cancel, () => ctx.action('summaryCancel')(ctx)));
    else {
      if (state.state === 'error') actions.appendChild(button(t().retry, () => ctx.action('summarize')(ctx, state.detail)));
      if (state.state === 'done') actions.appendChild(button(t().copy, async () => {
        // Title, link, then the text: pasted somewhere else it still says
        // which video it is about.
        const link = 'https://www.youtube.com/watch?v=' + encodeURIComponent(state.videoId);
        try { await navigator.clipboard.writeText((state.title ? state.title + '\n' : '') + link + '\n\n' + state.text); toast(t().copiedLink); }
        catch (e) { toast(t().copyFailed); }
      }));
      actions.appendChild(button(state.detail === 'detailed' ? t().brief : t().detailed,
        () => ctx.action('summarize')(ctx, state.detail === 'detailed' ? 'brief' : 'detailed')));
      actions.appendChild(button(t().clearSummaries, () => ctx.action('summaryClear')(ctx)));
    }
    box.appendChild(actions);
  }

  function showSummary(state) {
    summaryState = state;
    renderSummary();
    if (state.state !== 'idle' && els.panel) els.panel.setAttribute('open', '');
  }

  function showList(items) {
    showSummary({ state: 'list', title: t().blockedHere, items });
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

    host = document.createElement('div');
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
    window.addEventListener('costum:channel', () => render());
    window.addEventListener('costum:bookmarks', () => render());
    window.addEventListener('costum:summaries', () => render());
    window.addEventListener('costum:health', () => render());

    try {
      Promise.resolve((self.browser || self.chrome).storage.local.get('welcomed')).then((bag) => {
        welcomed = !!(bag && bag.welcomed);
        if (!welcomed) render();
      }).catch(() => {});
    } catch (e) { /* storage unavailable: skip the welcome rather than nag */ }
  }

  self.CostumPanel = { init, toast, showSummary, showList, toggleOpen };
  self.CostumPanelInternals = { railWidth };
  self.Costum.register({
    name: 'panel',
    apply() { measureRail(); applyChrome(); },
    disable() { applyChrome(); toggleOpen(false); },
    onMutation() { measureRail(); },
    actions: { togglePanel: () => toggleOpen() } });
})();
