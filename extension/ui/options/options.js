/* Costum for YouTube — settings, generated from one field spec so adding a
 * feature means adding a line here, not a new chunk of markup. */
(function () {
  'use strict';
  const api = self.browser || self.chrome;
  const { read, write, replace } = self.CostumStore;
  const { DEFAULTS } = self.CostumDefaults;
  const Lock = self.CostumLock;

  const STR = {
    en: {
      title: 'Costum for YouTube', lede: 'One purchase. Every feature. No subscription.',
      enabled: 'Enabled', export: 'Export settings', import: 'Import settings', reset: 'Reset all',
      saved: 'Saved', auto: 'Default', rule: 'rule applied', rules: 'rules applied', badCss: 'nothing here parsed as CSS', search: 'Search every setting', noHits: 'No results',
      noHitsFor: 'Nothing in any section matches \u201C%s\u201D.',
      allOn: 'Turn all on', allOff: 'Turn all off',
      locked: 'Settings are locked', unlock: 'Unlock',
      wrong: 'That password does not match.', enterPw: 'Password',
      setPw: 'Set a password', newPw: 'New password', confirmPw: 'Repeat it',
      removePw: 'Remove password', currentPw: 'Current password',
      mismatch: 'The two entries do not match.', tooShort: 'Use at least 4 characters.',
      cancel: 'Cancel', save: 'Save', pwOn: 'Password set', pwOff: 'No password',
      resetTitle: 'Reset every setting?', resetGo: 'Reset',
      resetBody: 'Every switch, slider and list goes back to the way it shipped. This cannot be undone.',
      badFile: 'That file could not be read', ok: 'OK',
      badFileBody: 'It does not look like a settings file exported from Costum.',
      hit: 'result', hits: 'results', revert: 'Back to the default',
      noKey: 'Not set', pressKeys: 'Press keys\u2026', recordHint: 'Click to record a new shortcut.',
      clash: 'Another shortcut already uses this combination.',
      changedHere: 'You have changed something in this section.',
      clear: 'Clear search', imported: 'Settings imported', wasReset: 'Everything reset',
      blockNow: 'Block now for', blockedUntil: 'Blocked until ', unblock: 'Lift the block',
      min: 'min', hour: '1 h', hours2: '2 h',
      blurbs: {
        player: 'Speed, quality, sound and picture — everything about how a video plays.',
        watch: 'What to hide while a video is playing.',
        home: 'The front page, and how much of it loads.',
        search: 'Results, suggestions and the filters above them.',
        subscriptions: 'What shows up in your subscriptions feed.',
        cards: 'The pieces of every video thumbnail, wherever it appears.',
        shorts: 'Shorts in the feed, and the Shorts player itself.',
        header: 'The bar across the top of every page.',
        sidebar: 'The navigation rail down the left.',
        library: 'Your history, playlists and saved videos.',
        channel: 'Channel pages: the banner, the tabs and the shelves.',
        everywhere: 'Rules that apply on every YouTube page at once.',
        layout: 'The size and placement of the player and the grid.',
        block: 'Hide videos by keyword, channel or pattern — and skip sponsor segments.',
        focus: 'Schedules, self-imposed blocks, and a lock for these settings.',
        modesty: 'Cover imagery of people so it does not catch the eye. Everything here is applied on this device only.',
        summary: 'Timestamped summaries read from the transcript, on your own API key.',
        panel: 'The button and control sheet Costum puts on the page.',
        keys: 'Click a shortcut, then press the combination you want.'
      },
      tabs: { shorts: 'Shorts', cards: 'Video cards', subscriptions: 'Subscriptions', header: 'Header', player: 'Player', layout: 'Layout', everywhere: 'Everywhere', watch: 'Watch page', home: 'Home', search: 'Search', sidebar: 'Sidebar', library: 'Library', channel: 'Channel', block: 'Blocking', summary: 'Summary', focus: 'Focus', modesty: 'Modesty', panel: 'Panel', keys: 'Shortcuts' }
    },
    ar: {
      title: 'Costum ليوتيوب', lede: 'شراء واحد. كل الميزات. بدون اشتراك.',
      enabled: 'مفعّل', export: 'تصدير الإعدادات', import: 'استيراد الإعدادات', reset: 'إرجاع الكل',
      saved: 'انحفظ', auto: 'تلقائي', rule: 'قاعدة مطبَّقة', rules: 'قواعد مطبَّقة', badCss: 'ما انقرأ شي كـCSS', search: 'دوّر بكل الإعدادات', noHits: 'ما في نتائج',
      noHitsFor: 'ما في شي بأي قسم بيطابق \u201C%s\u201D.',
      allOn: 'شغّل الكل', allOff: 'طفّي الكل',
      locked: 'الإعدادات مقفولة', unlock: 'فتح',
      wrong: 'كلمة السر غلط.', enterPw: 'كلمة السر',
      setPw: 'تعيين كلمة سر', newPw: 'كلمة السر الجديدة', confirmPw: 'أعدها',
      removePw: 'إزالة كلمة السر', currentPw: 'كلمة السر الحالية',
      mismatch: 'الكلمتان مش متطابقتين.', tooShort: 'استخدم ٤ خانات على الأقل.',
      cancel: 'إلغاء', save: 'حفظ', pwOn: 'مضبوطة', pwOff: 'ما في',
      resetTitle: 'إرجاع كل الإعدادات؟', resetGo: 'إرجاع',
      resetBody: 'كل مفتاح وسلايدر وقائمة بترجع مثل ما إجت. ما في تراجع عن هالخطوة.',
      badFile: 'ما قدرنا نقرأ الملف', ok: 'تمام',
      badFileBody: 'ما بيبيّن إنه ملف إعدادات مصدّر من Costum.',
      hit: 'نتيجة', hits: 'نتيجة', revert: 'رجّع للأصل',
      noKey: 'ما في', pressKeys: 'اضغط الأزرار\u2026', recordHint: 'اضغط لتسجيل اختصار جديد.',
      clash: 'في اختصار تاني مستخدم نفس التركيبة.',
      changedHere: 'غيّرت شي بهالقسم.',
      clear: 'مسح البحث', imported: 'انستوردت الإعدادات', wasReset: 'رجع كل شي للأصل',
      blockNow: 'احظر هلأ لمدة', blockedUntil: 'محظور لحد ', unblock: 'رفع الحظر',
      min: 'دقيقة', hour: 'ساعة', hours2: 'ساعتين',
      blurbs: {
        player: 'السرعة والجودة والصوت والصورة — كل شي عن طريقة تشغيل الفيديو.',
        watch: 'شو بينخفي وقت ما الفيديو شغّال.',
        home: 'الصفحة الرئيسية، وقدّيش بتحمّل منها.',
        search: 'النتائج والاقتراحات والفلاتر فوقها.',
        subscriptions: 'شو بيطلع بخلاصة الاشتراكات.',
        cards: 'أجزاء كرت الفيديو، بأي مكان بيظهر فيه.',
        shorts: 'Shorts بالخلاصة، ومشغّل Shorts نفسه.',
        header: 'الشريط اللي فوق بكل صفحة.',
        sidebar: 'شريط التنقّل على الجنب.',
        library: 'السجل وقوائم التشغيل والفيديوهات المحفوظة.',
        channel: 'صفحات القنوات: البانر والتبويبات والرفوف.',
        everywhere: 'قواعد بتنطبق على كل صفحات يوتيوب سوا.',
        layout: 'حجم ومكان المشغّل والشبكة.',
        block: 'إخفاء الفيديوهات بكلمة أو قناة أو نمط — وتخطي مقاطع الرعاية.',
        focus: 'جداول وحظر بترتّبه لحالك، وقفل لهالإعدادات.',
        modesty: 'تغطية صور الأشخاص حتى ما تشد النظر. كل شي هون بينطبق على هالجهاز بس.',
        summary: 'ملخصات بتوقيتات من الترانسكربت، على مفتاحك أنت.',
        panel: 'الزر ولوحة التحكّم اللي بيحطها Costum على الصفحة.',
        keys: 'اضغط على الاختصار، بعدين اضغط التركيبة اللي بدك ياها.'
      },
      tabs: { shorts: 'Shorts', cards: 'كروت الفيديو', subscriptions: 'الاشتراكات', header: 'رأس الصفحة', player: 'المشغّل', layout: 'التخطيط', everywhere: 'بكل الصفحات', watch: 'المشاهدة', home: 'الرئيسية', search: 'البحث', sidebar: 'الشريط الجانبي', library: 'المكتبة', channel: 'القناة', block: 'الحظر', summary: 'الملخص', focus: 'التركيز', modesty: 'الحشمة', panel: 'اللوحة', keys: 'الاختصارات' }
    }
  };

  /* One tinted glyph per section, the way System Settings labels its sidebar.
     Colour carries most of the recognition, so the list can be scanned before
     it is read. The glyphs are drawn here rather than shipped as files so a
     new section is one line, not a new asset. */
  const TAB_ICONS = {
    player:        ['#0A84FF', '<circle cx="12" cy="12" r="8"/><path d="M10.4 8.6v6.8l5.4-3.4z" fill="currentColor" stroke="none"/>'],
    watch:         ['#5856D6', '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M10.4 9.6v4.8l4.4-2.4z" fill="currentColor" stroke="none"/>'],
    home:          ['#FF9500', '<path d="M4 10.6L12 4l8 6.6V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z"/>'],
    search:        ['#8E8E93', '<circle cx="11" cy="11" r="6"/><path d="M15.6 15.6L20 20"/>'],
    subscriptions: ['#FF3B30', '<rect x="3.5" y="8" width="17" height="11.5" rx="2.2"/><path d="M6 5.5h12M8 3h8"/>'],
    cards:         ['#34C759', '<rect x="3.5" y="5" width="17" height="9" rx="2" fill="currentColor" stroke="none"/><path d="M3.5 17.5h11M3.5 20.5h7"/>'],
    shorts:        ['#FF2D55', '<rect x="7.5" y="2.5" width="9" height="19" rx="3.2"/><path d="M11 9.6v4.8l3.6-2.4z" fill="currentColor" stroke="none"/>'],
    header:        ['#5AC8FA', '<path d="M5 4.5h14a2.5 2.5 0 0 1 2.5 2.5v2.5h-19V7A2.5 2.5 0 0 1 5 4.5z" fill="currentColor" stroke="none"/><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/>'],
    sidebar:       ['#A2845E', '<path d="M5 4.5h3.5v15H5A2.5 2.5 0 0 1 2.5 17V7A2.5 2.5 0 0 1 5 4.5z" fill="currentColor" stroke="none"/><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/>'],
    library:       ['#AF52DE', '<rect x="3.5" y="4.5" width="6" height="15" rx="1.6"/><rect x="11.5" y="4.5" width="4.5" height="15" rx="1.6"/><path d="M18.4 5.3l2.3 13"/>'],
    channel:       ['#FF9F0A', '<circle cx="12" cy="8.6" r="3.6"/><path d="M5 20c0-3.7 3.1-5.6 7-5.6s7 1.9 7 5.6"/>'],
    everywhere:    ['#30B0C7', '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.3 2.3 3.5 5 3.5 8s-1.2 5.7-3.5 8c-2.3-2.3-3.5-5-3.5-8s1.2-5.7 3.5-8z"/>'],
    layout:        ['#64D2FF', '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><rect x="5" y="7" width="9" height="6" rx="1.2" fill="currentColor" stroke="none"/><path d="M16.5 7.5h2.5M16.5 11h2.5M5 16.5h14"/>'],
    block:         ['#FF3B30', '<circle cx="12" cy="12" r="8"/><path d="M6.4 6.4l11.2 11.2"/>'],
    summary:       ['#BF5AF2', '<path d="M11 4l1.5 4.2L16.7 9.7l-4.2 1.5L11 15.4 9.5 11.2 5.3 9.7l4.2-1.5z"/><path d="M17.4 15.2l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8z"/>'],
    modesty:       ['#5AC8A8', '<path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6z"/><path d="M4.5 19.5l15-15"/>'],
    focus:         ['#5E5CE6', '<path d="M19.4 14.6A7.6 7.6 0 0 1 9.4 4.6a7.6 7.6 0 1 0 10 10z"/>'],
    panel:         ['#FF6482', '<rect x="4" y="3" width="16" height="18" rx="3.5"/><path d="M7 8.8h10M7 15.2h10"/><circle cx="14" cy="8.8" r="1.9" fill="currentColor" stroke="none"/><circle cx="10" cy="15.2" r="1.9" fill="currentColor" stroke="none"/>'],
    keys:          ['#8E8E93', '<rect x="2" y="7" width="20" height="10" rx="2.2"/><path d="M6 10.6h.01M9.5 10.6h.01M13 10.6h.01M16.5 10.6h.01M8 13.9h8"/>']
  };

  function tabIcon(key) {
    const [tint, inner] = TAB_ICONS[key] || ['#8E8E93', '<circle cx="12" cy="12" r="7"/>'];
    const tile = document.createElement('span');
    tile.className = 'tab-icon';
    tile.style.setProperty('--tint', tint);
    tile.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" '
      + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
    return tile;
  }

  const SPEC = {
    player: [
      { heading: true, en: 'Speed', ar: 'السرعة' },
      { path: 'playback.defaultSpeed', type: 'range', min: 0.25, max: 4, step: 0.05, fmt: (v) => v.toFixed(2) + '×',
        en: ['Default speed', 'Applied automatically when a video starts.'], ar: ['السرعة الافتراضية', 'بتنطبق تلقائياً مع بداية كل فيديو.'] },
      { path: 'playback.musicSpeed', type: 'range', min: 0, max: 2, step: 0.05, fmt: (v) => (v === 0 ? 'off' : v.toFixed(2) + '×'),
        en: ['Speed on music channels', 'Zero leaves music at normal speed.'], ar: ['السرعة على قنوات الموسيقى', 'صفر يعني تبقى الموسيقى بسرعتها الطبيعية.'] },
      { path: 'playback.speedStep', type: 'range', min: 0.01, max: 0.5, step: 0.01, fmt: (v) => '±' + v.toFixed(2),
        en: ['Speed step', 'How much each keypress or wheel notch moves.'], ar: ['خطوة السرعة', 'مقدار التغيير مع كل ضغطة أو حركة عجلة.'] },
      { path: 'playback.rememberSpeed', type: 'bool', en: ['Remember speed between videos', ''], ar: ['تذكّر السرعة بين الفيديوهات', ''] },
      { path: 'playback.speedPresets', type: 'numbers', min: 0.07, max: 16, placeholder: '0.5, 1, 1.5, 2',
        en: ['Speed buttons in the panel', 'The row of speeds the in-page panel offers. Sorted for you.'],
        ar: ['أزرار السرعة باللوحة', 'صف السرعات اللي بتظهر بلوحة الصفحة. بينترتب تلقائياً.'] },
      { path: 'playback.wheelOnPlayer', type: 'select', options: [['none', 'Off'], ['speed', 'Speed'], ['volume', 'Volume']],
        en: ['Mouse wheel over the player', ''], ar: ['عجلة الماوس فوق المشغّل', ''] },
      { heading: true, en: 'Quality and format', ar: 'الجودة والصيغة' },
      { path: 'playback.forceQuality', type: 'select',
        options: [['auto', 'Auto'], ['highres', '4K+'], ['hd2160', '2160p'], ['hd1440', '1440p'], ['hd1080', '1080p'], ['hd720', '720p'], ['large', '480p'], ['medium', '360p']],
        en: ['Force quality', 'Falls back to the best level the video actually offers.'], ar: ['فرض الجودة', 'بينزل لأعلى جودة متاحة فعلياً بالفيديو.'] },
      { path: 'playback.blockHighFramerate', type: 'bool',
        en: ['Block 48/60 fps formats', 'Cuts battery drain on laptops.'], ar: ['منع صيغ 48/60 إطار', 'بيقلل استهلاك البطارية على اللابتوب.'] },
      { path: 'playback.preferAvc', type: 'bool',
        en: ['Prefer H.264 over VP9/AV1', 'Uses the Mac hardware decoder.'], ar: ['تفضيل H.264 على VP9/AV1', 'بيستخدم فك التشفير العتادي بالماك.'] },
      { heading: true, en: 'Autoplay', ar: 'التشغيل التلقائي' },
      { path: 'playback.autoplay', type: 'select', options: [['default', 'Leave alone'], ['pause', 'Always pause'], ['play', 'Always play']],
        en: ['Autoplay', ''], ar: ['التشغيل التلقائي', ''] },
      { path: 'playback.pauseBackgroundTabs', type: 'bool', en: ['Pause when the tab is hidden', ''], ar: ['إيقاف مؤقت لما التبويب يختفي', ''] },
      { heading: true, en: 'Ads', ar: 'الإعلانات' },
      { path: 'playback.blockAdRequests', type: 'bool',
        en: ['Block ad requests', 'Stops ad and tracking requests before they load, instead of skipping afterwards. Playback requests are never touched.'],
        ar: ['حجب طلبات الإعلانات', 'بيوقف طلبات الإعلانات والتتبّع قبل ما تُحمّل، بدل تخطيها بعدين. طلبات التشغيل ما بتنمس أبداً.'] },
      { path: 'playback.skipAds', type: 'bool',
        en: ['Skip video ads', 'Presses Skip as soon as it appears, and runs out the clock on segments that have none.'],
        ar: ['تخطي إعلانات الفيديو', 'بيضغط Skip أول ما يظهر، وبيمرّق المقاطع اللي ما إلها زر تخطي.'] },
      { heading: true, en: 'Experimental', ar: 'تجريبي' },
      { path: 'playback.nativePlayer', type: 'bool',
        en: ['Use the native Safari player', 'Would give real Picture in Picture, AirPlay and background audio. It needs a single combined stream, and YouTube now serves audio and video separately for most videos — so on current YouTube this rarely engages and the page keeps YouTube\'s player. Left in because it costs nothing when it cannot run.'],
        ar: ['استخدام مشغّل سفاري الأصلي', 'المفروض يعطي صورة داخل صورة و AirPlay وصوت بالخلفية. بيحتاج بث واحد مدموج، ويوتيوب صار يفصل الصوت عن الصورة بمعظم الفيديوهات — فعملياً نادراً بيشتغل على يوتيوب الحالي وبتضل الصفحة بمشغّل يوتيوب. تركناه لأنه ما بيكلّف شي لما ما بيقدر يشتغل.'] },
      { heading: true, en: 'Sound', ar: 'الصوت' },
      { path: 'audio.boost', type: 'range', min: 1, max: 10, step: 0.1, fmt: (v) => v.toFixed(1) + '×',
        en: ['Volume boost', 'Above about 4× quiet sources start to clip.'], ar: ['تعزيز الصوت', 'فوق 4× تقريباً بتبلّش المصادر الهادية تتشوّه.'] },
      { path: 'audio.bass', type: 'range', min: -12, max: 12, step: 1, fmt: (v) => (v > 0 ? '+' : '') + v + ' dB',
        en: ['Bass', 'Low shelf at 160 Hz.'], ar: ['الباس', 'رفّ منخفض عند 160 هرتز.'] },
      { path: 'audio.monoDownmix', type: 'bool',
        en: ['Combine both channels into one', 'Puts the whole mix in both ears — useful with one earbud, or hearing in one ear.'],
        ar: ['دمج القناتين بقناة وحدة', 'بيحط كل الصوت بالأذنين — مفيد مع سماعة وحدة أو سمع بأذن وحدة.'] },
      { path: 'audio.normalize', type: 'bool',
        en: ['Even out loudness', 'Compressor that tames sudden loud moments.'], ar: ['تسوية مستوى الصوت', 'ضاغط بيهدّي القفزات المفاجئة بالصوت.'] },
      { heading: true, en: 'Picture', ar: 'الصورة' },
      { path: 'picture.brightness', type: 'range', min: 30, max: 200, step: 1, fmt: (v) => v + '%', en: ['Brightness', ''], ar: ['السطوع', ''] },
      { path: 'picture.contrast', type: 'range', min: 30, max: 200, step: 1, fmt: (v) => v + '%', en: ['Contrast', ''], ar: ['التباين', ''] },
      { path: 'picture.saturation', type: 'range', min: 0, max: 200, step: 1, fmt: (v) => v + '%', en: ['Saturation', ''], ar: ['التشبّع', ''] },
      { path: 'picture.sharpen', type: 'range', min: 0, max: 100, step: 1, fmt: (v) => String(v),
        en: ['Sharpen', 'Real edge sharpening. It runs on every frame, so leave it at zero unless you want it.'],
        ar: ['الحِدّة', 'تحديد حقيقي للحواف. بيشتغل على كل إطار، فخلّيه صفر إذا ما بدك ياه.'] },
      { path: 'picture.invert', type: 'bool', en: ['Invert colors', ''], ar: ['عكس الألوان', ''] }
    ],
    layout: [
      { heading: true, en: 'Modes', ar: 'الأوضاع' },
      { path: 'layout.zen', type: 'bool',
        en: ['Just the video', 'One switch for the whole watch page: no header, no sidebar, no related column, nothing below the player. Only applies while watching.'],
        ar: ['الفيديو بس', 'مفتاح واحد لصفحة المشاهدة كاملة: بلا رأس ولا شريط جانبي ولا مقترحات ولا أي شي تحت المشغّل. بينطبق وقت المشاهدة بس.'] },

      { heading: true, en: 'The player', ar: 'المشغّل' },
      { path: 'layout.cinema', type: 'bool', en: ['Cinema mode', 'Dims everything around the player.'], ar: ['وضع السينما', 'بيعتّم كل شي حوالين المشغّل.'] },
      { path: 'layout.cinemaDim', type: 'range', min: 20, max: 95, step: 5, fmt: (v) => v + '%', en: ['Cinema dimming', ''], ar: ['قوة التعتيم', ''] },
      { path: 'layout.widePlayer', type: 'bool', en: ['Wide player', ''], ar: ['مشغّل عريض', ''] },
      { path: 'layout.fitToWindow', type: 'bool', en: ['Fill the window in theater mode', ''], ar: ['ملء النافذة بوضع المسرح', ''] },
      { path: 'layout.autoTheater', type: 'bool', en: ['Open videos in theater mode', ''], ar: ['فتح الفيديوهات بوضع المسرح', ''] },
      { path: 'layout.miniOnScroll', type: 'bool', en: ['Mini player while scrolling comments', ''], ar: ['مشغّل مصغّر أثناء تصفّح التعليقات', ''] },
      { path: 'layout.hideScrollbar', type: 'bool', en: ['Hide the scrollbar', ''], ar: ['إخفاء شريط التمرير', ''] },
      { heading: true, en: 'Home grid', ar: 'شبكة الرئيسية' },
      { path: 'layout.homeColumns', type: 'ticks', min: 0, max: 6,
        en: ['Columns on the home page', 'Fewer, larger cards instead of a dense wall.'],
        ar: ['أعمدة الصفحة الرئيسية', 'كروت أقل وأكبر بدل جدار كثيف.'] },
      { path: 'layout.homeRows', type: 'ticks', min: 0, max: 8,
        en: ['Rows on the home page', 'The feed stops after this many rows.'],
        ar: ['صفوف الصفحة الرئيسية', 'الخلاصة بتوقف بعد هالعدد من الصفوف.'] }
    ],
    declutter: [
      { heading: true, surface: 'everywhere', en: 'Everywhere', ar: 'بكل الصفحات' },
      { heading: true, en: 'Advanced', ar: 'متقدّم' },
      { path: 'declutter.customCss', type: 'css',
        placeholder: 'ytd-watch-metadata { display: none; }',
        en: ['Your own CSS', 'Applied after everything above, so it wins. Anything the switches missed goes here.'],
        ar: ['CSS خاص فيك', 'بينطبق بعد كل اللي فوق، فهو اللي بيغلب. أي شي ما غطّته المفاتيح بينحط هون.'] },

      { heading: true, en: 'Appearance', ar: 'المظهر' },
      { path: 'declutter.titleCount', type: 'bool',
        en: ['Strip the unread count from the tab title', 'The "(3)" YouTube puts in front of the page title.'],
        ar: ['شيل عدد الإشعارات من عنوان التبويب', 'الـ«(3)» اللي بيحطها يوتيوب قبل عنوان الصفحة.'] },
      { path: 'declutter.font', type: 'select',
        options: [['', 'YouTube default'], ['system-ui, sans-serif', 'System'],
                  ['Georgia, serif', 'Serif'], ['ui-monospace, Menlo, monospace', 'Monospace'],
                  ['"Comic Sans MS", cursive', 'Comic Sans']],
        en: ['Font', 'Applies across every YouTube page.'],
        ar: ['الخط', 'بينطبق على كل صفحات يوتيوب.'] },
      { path: 'declutter.thumbnails', type: 'select', options: [['normal', 'Normal'], ['grayscale', 'Grayscale'], ['blur', 'Blur until hover'], ['hide', 'Hide']],
        en: ['Thumbnails', ''], ar: ['الصور المصغّرة', ''] },
      { path: 'declutter.global.infiniteScroll', type: 'bool',
        en: ['Stop infinite scrolling', 'The feed ends instead of loading forever.'], ar: ['إيقاف التمرير اللانهائي', 'الخلاصة بتنتهي بدل ما تكمّل للأبد.'] },
      { path: 'declutter.global.popups', type: 'bool', en: ['Hide pop-ups and promos', ''], ar: ['إخفاء النوافذ المنبثقة والعروض', ''] },
      { path: 'declutter.global.bannerAds', type: 'bool', en: ['Hide banner ads', ''], ar: ['إخفاء بانرات الإعلانات', ''] },
      { path: 'declutter.global.merchShelf', type: 'bool', en: ['Hide merch, tickets and offers', ''], ar: ['إخفاء المنتجات والتذاكر والعروض', ''] },
      { path: 'declutter.global.notifications', type: 'bool', en: ['Hide the notification bell', ''], ar: ['إخفاء جرس الإشعارات', ''] },

      { heading: true, surface: 'watch', en: 'Watch page', ar: 'صفحة المشاهدة' },
      { path: 'declutter.watch.comments', type: 'bool', en: ['Hide comments', ''], ar: ['إخفاء التعليقات', ''] },
      { path: 'declutter.watch.related', type: 'bool', en: ['Hide related videos', ''], ar: ['إخفاء المقترحات', ''] },
      { path: 'declutter.watch.relatedCategories', type: 'bool', en: ['Hide categories of related videos', ''], ar: ['إخفاء فئات المقترحات', ''] },
      { path: 'declutter.watch.liveChat', type: 'bool', en: ['Hide live chat', ''], ar: ['إخفاء الشات المباشر', ''] },
      { path: 'declutter.watch.endScreens', type: 'bool', en: ['Hide suggestions at the video end', ''], ar: ['إخفاء الاقتراحات بنهاية الفيديو', ''] },
      { path: 'declutter.watch.infoCards', type: 'bool', en: ['Hide cards at the video end', ''], ar: ['إخفاء البطاقات بنهاية الفيديو', ''] },
      { path: 'declutter.watch.playNext', type: 'bool', en: ["Hide the ‘Play next’ button", ''], ar: ['إخفاء زر «التالي»', ''] },
      { path: 'declutter.watch.moreFromChannel', type: 'bool', en: ["Hide ‘More from this channel’", ''], ar: ['إخفاء «المزيد من هالقناة»', ''] },
      { path: 'declutter.watch.shortsInDescription', type: 'bool', en: ['Hide Shorts in the description', ''], ar: ['إخفاء Shorts بالوصف', ''] },
      { path: 'declutter.watch.fundraiser', type: 'bool', en: ['Hide fundraisers', ''], ar: ['إخفاء حملات التبرّع', ''] },
      { heading: true, en: 'Buttons under the player', ar: 'الأزرار تحت المشغّل' },
      { path: 'declutter.watch.actionBar', type: 'bool', en: ["Hide the buttons under the player", ''], ar: ['إخفاء الأزرار تحت المشغّل', ''] },
      { path: 'declutter.watch.subscribe', type: 'bool', en: ["Hide the ‘Subscribe’ button", ''], ar: ['إخفاء زر الاشتراك', ''] },
      { path: 'declutter.watch.join', type: 'bool', en: ["Hide the ‘Join’ button", ''], ar: ['إخفاء زر الانضمام', ''] },
      { path: 'declutter.watch.likeDislike', type: 'bool', en: ["Hide like and dislike", ''], ar: ['إخفاء الإعجاب وعدمه', ''] },
      { heading: true, en: 'Title and channel', ar: 'العنوان والقناة' },
      { path: 'declutter.watch.videoTitle', type: 'bool', en: ["Hide the video title", ''], ar: ['إخفاء عنوان الفيديو', ''] },
      { path: 'declutter.watch.channelInfo', type: 'bool', en: ["Hide the channel row", ''], ar: ['إخفاء صف القناة', ''] },
      { path: 'declutter.watch.subscriberCount', type: 'bool', en: ["Hide the subscriber count", ''], ar: ['إخفاء عدد المشتركين', ''] },
      { path: 'declutter.watch.viewsAndDate', type: 'bool', en: ["Hide views and upload date", ''], ar: ['إخفاء المشاهدات وتاريخ الرفع', ''] },
      { path: 'declutter.watch.description', type: 'bool', en: ["Hide the description", ''], ar: ['إخفاء الوصف', ''] },
      { heading: true, en: 'Comments', ar: 'التعليقات' },
      { path: 'declutter.watch.commentsCount', type: 'bool', en: ["Hide the comment count", ''], ar: ['إخفاء عدد التعليقات', ''] },
      { path: 'declutter.watch.commentsSort', type: 'bool', en: ["Hide the comment sort button", ''], ar: ['إخفاء زر فرز التعليقات', ''] },
      { path: 'declutter.watch.commentAvatar', type: 'bool', en: ["Hide commenter avatars", ''], ar: ['إخفاء صور المعلّقين', ''] },
      { path: 'declutter.watch.commentAuthor', type: 'bool', en: ["Hide commenter names", ''], ar: ['إخفاء أسماء المعلّقين', ''] },
      { path: 'declutter.watch.commentTime', type: 'bool', en: ["Hide comment timestamps", ''], ar: ['إخفاء أوقات التعليقات', ''] },
      { path: 'declutter.watch.commentVotes', type: 'bool', en: ["Hide comment like counts", ''], ar: ['إخفاء إعجابات التعليقات', ''] },
      { path: 'declutter.watch.commentReply', type: 'bool', en: ["Hide the ‘Reply’ button", ''], ar: ['إخفاء زر الرد', ''] },
      { path: 'declutter.watch.commentReplies', type: 'bool', en: ["Hide comment replies", ''], ar: ['إخفاء ردود التعليقات', ''] },
      { heading: true, en: 'Player controls', ar: 'تحكّمات المشغّل' },
      { path: 'declutter.watch.playButton', type: 'bool', en: ["Hide the ‘Play’ button", ''], ar: ['إخفاء زر التشغيل', ''] },
      { path: 'declutter.watch.volumeButton', type: 'bool', en: ["Hide the volume control", ''], ar: ['إخفاء تحكّم الصوت', ''] },
      { path: 'declutter.watch.captionsButton', type: 'bool', en: ["Hide the ‘Captions’ button", ''], ar: ['إخفاء زر الترجمة', ''] },
      { path: 'declutter.watch.settingsButton', type: 'bool', en: ["Hide the ‘Settings’ button", ''], ar: ['إخفاء زر الإعدادات', ''] },
      { path: 'declutter.watch.theaterButton', type: 'bool', en: ["Hide the ‘Theater’ button", ''], ar: ['إخفاء زر المسرح', ''] },
      { path: 'declutter.watch.fullscreenButton', type: 'bool', en: ["Hide the ‘Full screen’ button", ''], ar: ['إخفاء زر ملء الشاشة', ''] },
      { path: 'declutter.watch.autoplayToggle', type: 'bool', en: ["Hide the autoplay toggle", ''], ar: ['إخفاء مفتاح التشغيل التلقائي', ''] },
      { path: 'declutter.watch.chaptersButton', type: 'bool', en: ["Hide chapters on the bar", ''], ar: ['إخفاء الفصول من الشريط', ''] },
      { heading: true, en: 'On top of the video', ar: 'فوق الفيديو' },
      { path: 'declutter.watch.gradientBottom', type: 'bool', en: ["Hide the bottom shadow", ''], ar: ['إخفاء الظل السفلي', ''] },
      { path: 'declutter.watch.gradientTop', type: 'bool', en: ["Hide the top shadow", ''], ar: ['إخفاء الظل العلوي', ''] },
      { path: 'declutter.watch.videoTime', type: 'bool', en: ["Hide the time display", ''], ar: ['إخفاء عرض الوقت', ''] },
      { path: 'declutter.watch.heatmap', type: 'bool', en: ["Hide the most-replayed graph", ''], ar: ['إخفاء رسم الأكثر مشاهدة', ''] },
      { path: 'declutter.watch.paidPromotion', type: 'bool', en: ["Hide ‘Includes paid promotion’", ''], ar: ['إخفاء «يتضمن ترويجاً مدفوعاً»', ''] },

      { heading: true, surface: 'home', en: 'Home', ar: 'الصفحة الرئيسية' },
      { path: 'declutter.home.feed', type: 'bool', en: ['Hide the whole feed', ''], ar: ['إخفاء الخلاصة كاملة', ''] },
      { path: 'declutter.home.chips', type: 'bool', en: ["Hide ‘For you’, ‘Trending’ and the rest", ''], ar: ['إخفاء شريط الفئات', ''] },
      { path: 'declutter.home.mixes', type: 'bool', en: ['Hide mixes', ''], ar: ['إخفاء المكسات', ''] },
      { path: 'declutter.home.playlists', type: 'bool', en: ['Hide playlists', ''], ar: ['إخفاء قوائم التشغيل', ''] },
      { path: 'declutter.home.news', type: 'bool',
        en: ['Hide breaking news and trending shelves', 'Every editorial row YouTube slots into the feed.'],
        ar: ['إخفاء رفوف الأخبار العاجلة والرائج', 'كل صف تحريري بيحطه يوتيوب بالخلاصة.'] },
      { path: 'declutter.home.banners', type: 'bool',
        en: ['Hide banners — New to you, Premium, surveys', ''],
        ar: ['إخفاء البانرات — «جديد إلك» و Premium والاستبيانات', ''] },
      { path: 'declutter.redirectHome', type: 'text', placeholder: '/feed/subscriptions',
        en: ['Redirect the home page to', 'Leave empty to keep the normal home page.'], ar: ['إعادة توجيه الصفحة الرئيسية إلى', 'اتركه فاضي للإبقاء على الصفحة العادية.'] },

      { heading: true, surface: 'search', en: 'Search', ar: 'البحث' },
      { path: 'declutter.search.suggestions', type: 'bool', en: ['Hide search suggestions', ''], ar: ['إخفاء اقتراحات البحث', ''] },
      { path: 'declutter.search.previousSearches', type: 'bool', en: ['Hide previous searches', ''], ar: ['إخفاء عمليات البحث السابقة', ''] },
      { heading: true, en: 'Results', ar: 'النتائج' },
      { path: 'declutter.search.chips', type: 'bool', en: ["Hide ‘For you’, ‘Trending’ and the rest", ''], ar: ['إخفاء شريط الفئات', ''] },
      { path: 'declutter.search.filters', type: 'bool', en: ["Hide the ‘Filters’ button", ''], ar: ['إخفاء زر الفلاتر', ''] },
      { path: 'declutter.search.aboutResults', type: 'bool', en: ["Hide ‘About these results’", ''], ar: ['إخفاء «عن هالنتائج»', ''] },
      { path: 'declutter.search.peopleAlsoSearch', type: 'bool', en: ["Hide ‘People also search for’", ''], ar: ['إخفاء «الناس بتبحث كمان»', ''] },
      { path: 'declutter.search.promotedVideos', type: 'bool', en: ["Hide promoted videos", ''], ar: ['إخفاء الفيديوهات المموّلة', ''] },
      { path: 'declutter.search.promotedWebsites', type: 'bool', en: ["Hide promoted websites", ''], ar: ['إخفاء المواقع المموّلة', ''] },
      { path: 'declutter.search.shelves', type: 'bool', en: ["Hide shelves inside results", ''], ar: ['إخفاء الرفوف داخل النتائج', ''] },
      { path: 'declutter.search.channels', type: 'bool', en: ["Hide channel results", ''], ar: ['إخفاء نتائج القنوات', ''] },
      { path: 'declutter.search.playlists', type: 'bool', en: ["Hide playlists and mixes", ''], ar: ['إخفاء قوائم التشغيل والمكسات', ''] },
      { path: 'declutter.search.rightSidebar', type: 'bool', en: ["Hide the right sidebar", ''], ar: ['إخفاء الشريط الجانبي اليمين', ''] },
      { path: 'declutter.search.infiniteScroll', type: 'bool', en: ["Stop infinite results", ''], ar: ['إيقاف النتائج اللانهائية', ''] },

      { heading: true, surface: 'shorts', en: 'Shorts player', ar: 'مشغّل Shorts' },
      { heading: true, en: 'Access', ar: 'الوصول' },
      { path: 'declutter.shorts', type: 'select', options: [['show', 'Show'], ['hide', 'Hide'], ['asVideo', 'Open as normal videos']],
        en: ['Shorts', ''], ar: ['Shorts', ''] },
      { path: 'declutter.shortsScroll', type: 'bool', invert: true,
        en: ['Stop scrolling between Shorts', ''], ar: ['إيقاف التمرير بين الـ Shorts', ''] },
      { heading: true, en: 'The overlay', ar: 'الطبقة' },
      { path: 'declutter.shortsPlayer.overlay', type: 'bool', en: ["Hide the whole overlay", ''], ar: ['إخفاء الطبقة كاملة', ''] },
      { path: 'declutter.shortsPlayer.title', type: 'bool', en: ["Hide the title", ''], ar: ['إخفاء العنوان', ''] },
      { path: 'declutter.shortsPlayer.channelBar', type: 'bool', en: ["Hide the channel row", ''], ar: ['إخفاء صف القناة', ''] },
      { path: 'declutter.shortsPlayer.avatar', type: 'bool', en: ["Hide the channel avatar", ''], ar: ['إخفاء صورة القناة', ''] },
      { path: 'declutter.shortsPlayer.actions', type: 'bool', en: ["Hide like, comment and share", ''], ar: ['إخفاء الإعجاب والتعليق والمشاركة', ''] },
      { path: 'declutter.shortsPlayer.navButtons', type: 'bool', en: ["Hide the next / previous arrows", ''], ar: ['إخفاء أسهم التالي والسابق', ''] },
      { path: 'declutter.shortsPlayer.subscribe', type: 'bool', en: ["Hide the ‘Subscribe’ button", ''], ar: ['إخفاء زر الاشتراك', ''] },
      { path: 'declutter.shortsPlayer.description', type: 'bool', en: ["Hide the description", ''], ar: ['إخفاء الوصف', ''] },
      { path: 'declutter.shortsPlayer.menu', type: 'bool', en: ["Hide the ‘⋮’ menu", ''], ar: ['إخفاء قائمة النقاط', ''] },

      { heading: true, surface: 'cards', en: 'Video cards', ar: 'كروت الفيديو' },
      { heading: true, en: 'What each card shows', ar: 'شو بيعرض كل كرت' },
      { path: 'declutter.cards.title', type: 'bool', en: ["Hide video titles", ''], ar: ['إخفاء عناوين الفيديوهات', ''] },
      { path: 'declutter.cards.channelAvatar', type: 'bool', en: ["Hide channel avatars", ''], ar: ['إخفاء صور القنوات', ''] },
      { path: 'declutter.cards.channelName', type: 'bool', en: ["Hide channel names", ''], ar: ['إخفاء أسماء القنوات', ''] },
      { path: 'declutter.cards.meta', type: 'bool', en: ["Hide views and age", ''], ar: ['إخفاء المشاهدات والعمر', ''] },
      { path: 'declutter.cards.duration', type: 'bool', en: ["Hide the duration badge", ''], ar: ['إخفاء مدة الفيديو', ''] },
      { path: 'declutter.cards.menu', type: 'bool', en: ["Hide the ‘⋮’ menu", ''], ar: ['إخفاء قائمة النقاط', ''] },
      { path: 'declutter.cards.snippet', type: 'bool', en: ["Hide the description snippet", ''], ar: ['إخفاء مقتطف الوصف', ''] },
      { path: 'declutter.cards.badges', type: 'bool', en: ["Hide badges — new, 4K, CC", ''], ar: ['إخفاء الشارات — جديد و4K وCC', ''] },
      { path: 'declutter.cards.progress', type: 'bool', en: ["Hide the watched progress bar", ''], ar: ['إخفاء شريط التقدّم', ''] },
      { path: 'declutter.cards.hoverPlay', type: 'bool', en: ["Stop thumbnails playing on hover", ''], ar: ['إيقاف تشغيل المصغّرات بالمرور', ''] },
      { path: 'declutter.cards.cornerRadius', type: 'bool', en: ["Square off thumbnail corners", ''], ar: ['تربيع زوايا المصغّرات', ''] },
      { path: 'declutter.cards.grayscaleAvatar', type: 'bool', en: ["Grayscale channel avatars", ''], ar: ['تحويل صور القنوات لرمادي', ''] },

      { heading: true, surface: 'subscriptions', en: 'Subscriptions page', ar: 'صفحة الاشتراكات' },
      { heading: true, en: 'The feed', ar: 'الخلاصة' },
      { path: 'declutter.subscriptions.watched', type: 'bool', en: ["Hide videos already watched", ''], ar: ['إخفاء المتفرَّج عليها', ''] },
      { path: 'declutter.subscriptions.livePremiere', type: 'bool', en: ["Hide live and premieres", ''], ar: ['إخفاء البث والعروض الأولى', ''] },
      { path: 'declutter.subscriptions.upcoming', type: 'bool', en: ["Hide upcoming videos", ''], ar: ['إخفاء الفيديوهات القادمة', ''] },
      { path: 'declutter.subscriptions.shorts', type: 'bool', en: ["Hide the Shorts shelf", ''], ar: ['إخفاء رف Shorts', ''] },

      { heading: true, surface: 'header', en: 'Header', ar: 'رأس الصفحة' },
      { heading: true, en: 'The whole header', ar: 'الرأس كامل' },
      { path: 'declutter.header.hideAll', type: 'bool', en: ['Hide the header', ''], ar: ['إخفاء رأس الصفحة', ''] },
      { heading: true, en: 'Search', ar: 'البحث' },
      { path: 'declutter.header.searchBar', type: 'bool', en: ['Hide the search bar', ''], ar: ['إخفاء شريط البحث', ''] },
      { path: 'declutter.header.searchSuggestions', type: 'bool', en: ['Hide search suggestions', ''], ar: ['إخفاء اقتراحات البحث', ''] },
      { path: 'declutter.header.previousSearches', type: 'bool', en: ['Hide previous searches', ''], ar: ['إخفاء عمليات البحث السابقة', ''] },
      { path: 'declutter.header.voiceSearch', type: 'bool', en: ["Hide the ‘Voice search’ button", ''], ar: ['إخفاء زر البحث الصوتي', ''] },
      { heading: true, en: 'Logo', ar: 'الشعار' },
      { path: 'declutter.header.logo', type: 'bool', en: ['Hide the logo', ''], ar: ['إخفاء الشعار', ''] },
      { path: 'declutter.header.logoWord', type: 'bool',
        en: ['Hide the word in the logo', 'Leaves the play button on its own.'],
        ar: ['إخفاء الكلمة من الشعار', 'بيضل زر التشغيل لحاله.'] },
      { path: 'declutter.header.logoLink', type: 'bool',
        en: ['Disable the logo link', 'Clicking it no longer takes you to the feed.'],
        ar: ['تعطيل رابط الشعار', 'الضغط عليه ما بيوديك للخلاصة.'] },
      { path: 'declutter.header.countryCode', type: 'bool', en: ['Hide the country code', ''], ar: ['إخفاء رمز البلد', ''] },
      { heading: true, en: 'Buttons', ar: 'الأزرار' },
      { path: 'declutter.header.create', type: 'bool', en: ["Hide the ‘Create’ button", ''], ar: ['إخفاء زر «إنشاء»', ''] },
      { path: 'declutter.header.notifications', type: 'bool', en: ['Hide the notification bell', ''], ar: ['إخفاء جرس الإشعارات', ''] },
      { path: 'declutter.header.notificationsCount', type: 'bool', en: ['Hide the notification count', ''], ar: ['إخفاء عدد الإشعارات', ''] },
      { path: 'declutter.header.avatar', type: 'bool', en: ['Hide your avatar', ''], ar: ['إخفاء صورتك', ''] },
      { path: 'declutter.header.signIn', type: 'bool', en: ["Hide the ‘Sign in’ button", ''], ar: ['إخفاء زر تسجيل الدخول', ''] },

      { heading: true, surface: 'sidebar', en: 'Sidebar', ar: 'الشريط الجانبي' },
      { heading: true, en: 'The whole sidebar', ar: 'الشريط كامل' },
      { path: 'declutter.sidebar.hideAll', type: 'bool', en: ["Hide the sidebar entirely", ''], ar: ['إخفاء الشريط الجانبي كامل', ''] },
      { path: 'declutter.sidebar.burger', type: 'bool', en: ["Hide the ‘burger’ button", ''], ar: ['إخفاء زر القائمة', ''] },
      { path: 'declutter.sidebar.icons', type: 'bool', en: ["Hide the entry icons", ''], ar: ['إخفاء أيقونات المداخل', ''] },
      { heading: true, en: 'Navigation entries', ar: 'مداخل التنقّل' },
      { path: 'declutter.sidebar.home', type: 'bool', en: ["Hide ‘Home’", ''], ar: ['إخفاء «الرئيسية»', ''] },
      { path: 'declutter.sidebar.shortsButton', type: 'bool', en: ["Hide ‘Shorts’", ''], ar: ['إخفاء «Shorts»', ''] },
      { path: 'declutter.sidebar.subscriptionsButton', type: 'bool', en: ["Hide ‘Subscriptions’", ''], ar: ['إخفاء «الاشتراكات»', ''] },
      { path: 'declutter.sidebar.music', type: 'bool', en: ["Hide ‘YouTube Music’", ''], ar: ['إخفاء «YouTube Music»', ''] },
      { path: 'declutter.sidebar.kids', type: 'bool', en: ["Hide ‘Kids’", ''], ar: ['إخفاء «Kids»', ''] },
      { path: 'declutter.sidebar.you', type: 'bool', en: ["Hide ‘You’", ''], ar: ['إخفاء «أنت»', ''] },
      { path: 'declutter.sidebar.history', type: 'bool', en: ["Hide ‘History’", ''], ar: ['إخفاء «السجل»', ''] },
      { path: 'declutter.sidebar.playlists', type: 'bool', en: ["Hide ‘Playlists’", ''], ar: ['إخفاء «قوائم التشغيل»', ''] },
      { path: 'declutter.sidebar.yourVideos', type: 'bool', en: ["Hide ‘Your videos’", ''], ar: ['إخفاء «فيديوهاتك»', ''] },
      { path: 'declutter.sidebar.watchLater', type: 'bool', en: ["Hide ‘Watch later’", ''], ar: ['إخفاء «المشاهدة لاحقاً»', ''] },
      { path: 'declutter.sidebar.liked', type: 'bool', en: ["Hide ‘Liked videos’", ''], ar: ['إخفاء «اللي أعجبتك»', ''] },
      { path: 'declutter.sidebar.downloads', type: 'bool', en: ["Hide ‘Downloads’", ''], ar: ['إخفاء «التنزيلات»', ''] },
      { path: 'declutter.sidebar.clips', type: 'bool', en: ["Hide ‘Your clips’", ''], ar: ['إخفاء «مقاطعك»', ''] },
      { path: 'declutter.sidebar.trending', type: 'bool', en: ["Hide ‘Trending’", ''], ar: ['إخفاء «الرائج»', ''] },
      { path: 'declutter.sidebar.movies', type: 'bool', en: ["Hide ‘Movies’", ''], ar: ['إخفاء «الأفلام»', ''] },
      { path: 'declutter.sidebar.gaming', type: 'bool', en: ["Hide ‘Gaming’", ''], ar: ['إخفاء «الألعاب»', ''] },
      { path: 'declutter.sidebar.podcasts', type: 'bool', en: ["Hide ‘Podcasts’", ''], ar: ['إخفاء «البودكاست»', ''] },
      { path: 'declutter.sidebar.premium', type: 'bool', en: ["Hide ‘Premium’", ''], ar: ['إخفاء «Premium»', ''] },
      { path: 'declutter.sidebar.settingsEntry', type: 'bool', en: ["Hide ‘Settings’", ''], ar: ['إخفاء «الإعدادات»', ''] },
      { path: 'declutter.sidebar.reportHistory', type: 'bool', en: ["Hide ‘Report history’", ''], ar: ['إخفاء «سجل البلاغات»', ''] },
      { path: 'declutter.sidebar.help', type: 'bool', en: ["Hide ‘Help’", ''], ar: ['إخفاء «المساعدة»', ''] },
      { path: 'declutter.sidebar.feedback', type: 'bool', en: ["Hide ‘Send feedback’", ''], ar: ['إخفاء «إرسال ملاحظات»', ''] },
      { heading: true, en: 'Sections', ar: 'الأقسام' },
      { path: 'declutter.sidebar.explore', type: 'bool', en: ["Hide the ‘Explore’ section", ''], ar: ['إخفاء قسم «استكشاف»', ''] },
      { path: 'declutter.sidebar.subscriptions', type: 'bool', en: ["Hide the subscription list", ''], ar: ['إخفاء قائمة الاشتراكات', ''] },
      { path: 'declutter.sidebar.moreFromYouTube', type: 'bool', en: ["Hide ‘More from YouTube’", ''], ar: ['إخفاء «المزيد من يوتيوب»', ''] },
      { path: 'declutter.sidebar.signIn', type: 'bool', en: ["Hide the ‘Sign in’ block", ''], ar: ['إخفاء صندوق تسجيل الدخول', ''] },
      { path: 'declutter.sidebar.footer', type: 'bool', en: ["Hide the footer links", ''], ar: ['إخفاء روابط التذييل', ''] },
      { path: 'declutter.sidebar.subAvatars', type: 'bool', en: ["Hide subscription avatars", ''], ar: ['إخفاء صور الاشتراكات', ''] },
      { path: 'declutter.sidebar.subDots', type: 'bool', en: ["Hide new-video dots", ''], ar: ['إخفاء نقاط الجديد', ''] },
      { path: 'declutter.sidebar.showMore', type: 'bool', en: ["Hide ‘Show more / less’", ''], ar: ['إخفاء «عرض المزيد/أقل»', ''] },

      { heading: true, surface: 'library', en: 'Your library', ar: 'مكتبتك' },
      { path: 'declutter.library.avatar', type: 'bool', en: ['Hide your avatar', ''], ar: ['إخفاء صورتك', ''] },
      { path: 'declutter.library.history', type: 'bool', en: ["Hide the ‘History’ section", ''], ar: ['إخفاء قسم «السجل»', ''] },
      { path: 'declutter.library.watchLater', type: 'bool', en: ["Hide the ‘Watch later’ section", ''], ar: ['إخفاء قسم «المشاهدة لاحقاً»', ''] },
      { path: 'declutter.library.playlists', type: 'bool', en: ["Hide the ‘Playlists’ section", ''], ar: ['إخفاء قسم «قوائم التشغيل»', ''] },
      { path: 'declutter.library.likedVideos', type: 'bool', en: ["Hide the ‘Liked videos’ section", ''], ar: ['إخفاء قسم «الفيديوهات اللي أعجبتك»', ''] },
      { path: 'declutter.library.clips', type: 'bool', en: ["Hide the ‘Your clips’ section", ''], ar: ['إخفاء قسم «مقاطعك»', ''] },

      { heading: true, surface: 'channel', en: 'Channel pages', ar: 'صفحات القنوات' },
      { heading: true, en: 'Header', ar: 'الترويسة' },
      { path: 'declutter.channel.hideBanner', type: 'bool', en: ["Hide the banner", ''], ar: ['إخفاء البانر', ''] },
      { path: 'declutter.channel.grayscaleBanner', type: 'bool', en: ["Grayscale the banner", ''], ar: ['تحويل البانر لرمادي', ''] },
      { path: 'declutter.channel.avatar', type: 'bool', en: ["Hide the channel avatar", ''], ar: ['إخفاء صورة القناة', ''] },
      { path: 'declutter.channel.grayscaleAvatar', type: 'bool', en: ["Grayscale the avatar", ''], ar: ['تحويل الصورة لرمادي', ''] },
      { path: 'declutter.channel.name', type: 'bool', en: ["Hide the channel name", ''], ar: ['إخفاء اسم القناة', ''] },
      { path: 'declutter.channel.metadata', type: 'bool', en: ["Hide handle, subscribers and video count", ''], ar: ['إخفاء المعرّف والمشتركين وعدد الفيديوهات', ''] },
      { path: 'declutter.channel.tagline', type: 'bool', en: ["Hide the channel description", ''], ar: ['إخفاء وصف القناة', ''] },
      { path: 'declutter.channel.links', type: 'bool', en: ["Hide external links", ''], ar: ['إخفاء الروابط الخارجية', ''] },
      { path: 'declutter.channel.subscribe', type: 'bool', en: ["Hide the ‘Subscribe’ button", ''], ar: ['إخفاء زر الاشتراك', ''] },
      { path: 'declutter.channel.join', type: 'bool', en: ["Hide the ‘Join’ button", ''], ar: ['إخفاء زر الانضمام', ''] },
      { heading: true, en: 'Tabs', ar: 'التبويبات' },
      { path: 'declutter.channel.tabBar', type: 'bool', en: ["Hide the whole tab bar", ''], ar: ['إخفاء شريط التبويبات كامل', ''] },
      { path: 'declutter.channel.tabHome', type: 'bool', en: ["Hide ‘Home’", ''], ar: ['إخفاء «الرئيسية»', ''] },
      { path: 'declutter.channel.tabVideos', type: 'bool', en: ["Hide ‘Videos’", ''], ar: ['إخفاء «الفيديوهات»', ''] },
      { path: 'declutter.channel.shortsTab', type: 'bool', en: ["Hide ‘Shorts’", ''], ar: ['إخفاء «Shorts»', ''] },
      { path: 'declutter.channel.tabShows', type: 'bool', en: ["Hide ‘Shows’ / ‘Releases’", ''], ar: ['إخفاء «العروض»', ''] },
      { path: 'declutter.channel.community', type: 'bool', en: ["Hide ‘Posts’ / ‘Community’", ''], ar: ['إخفاء «المنشورات»', ''] },
      { path: 'declutter.channel.tabPlaylists', type: 'bool', en: ["Hide ‘Playlists’", ''], ar: ['إخفاء «قوائم التشغيل»', ''] },
      { path: 'declutter.channel.live', type: 'bool', en: ["Hide ‘Live’", ''], ar: ['إخفاء «البث المباشر»', ''] },
      { path: 'declutter.channel.podcasts', type: 'bool', en: ["Hide ‘Podcasts’", ''], ar: ['إخفاء «البودكاست»', ''] },
      { path: 'declutter.channel.store', type: 'bool', en: ["Hide ‘Store’", ''], ar: ['إخفاء «المتجر»', ''] },
      { heading: true, en: 'Sections', ar: 'الأقسام' },
      { path: 'declutter.channel.featured', type: 'bool', en: ["Hide the featured video", ''], ar: ['إخفاء الفيديو المميّز', ''] },
      { path: 'declutter.channel.shelves', type: 'bool', en: ["Hide the shelves", ''], ar: ['إخفاء الرفوف', ''] },
      { path: 'declutter.channel.shortsShelf', type: 'bool', en: ["Hide the Shorts shelf", ''], ar: ['إخفاء رف Shorts', ''] },
      { path: 'declutter.channel.liveSection', type: 'bool', en: ["Hide the ‘Live’ section", ''], ar: ['إخفاء قسم «البث المباشر»', ''] },
      { path: 'declutter.channel.shortsSection', type: 'bool', en: ["Hide the old Shorts section", ''], ar: ['إخفاء قسم Shorts القديم', ''] }
    ],
    block: [
      { heading: true, en: 'Content filter', ar: 'فلتر المحتوى' },
      { path: 'block.keywords', type: 'list', placeholder: 'reaction\ntier list',
        en: ['Blocked title keywords', 'One per line, matched anywhere in the title.'], ar: ['كلمات محظورة بالعنوان', 'كلمة بكل سطر، بتنطابق بأي مكان بالعنوان.'] },
      { path: 'block.channels', type: 'list', placeholder: 'Channel name',
        en: ['Blocked channels', 'One per line.'], ar: ['قنوات محظورة', 'قناة بكل سطر.'] },
      { path: 'block.regex', type: 'text', placeholder: '(clickbait|shocking)',
        en: ['Blocked by regular expression', 'An invalid pattern is ignored, never applied half-way.'], ar: ['حظر بتعبير نمطي', 'النمط الخاطئ بينتجاهل، وما بينطبق نص تطبيق.'] },
      { path: 'block.hideWatched', type: 'bool', en: ['Hide videos already watched', ''], ar: ['إخفاء الفيديوهات المتفرّجة', ''] },
      { heading: true, en: 'Sponsors', ar: 'الرعايات' },
      { path: 'sponsors.enabled', type: 'bool',
        en: ['Skip sponsor segments', 'Uses the public SponsorBlock database. Off by default.'], ar: ['تخطي مقاطع الرعاية', 'بيستخدم قاعدة SponsorBlock العامة. مطفي افتراضياً.'] },
      { path: 'sponsors.categories', type: 'checks',
        options: [['sponsor', 'Paid sponsor'], ['selfpromo', 'Self promotion'], ['interaction', 'Like and subscribe'],
                  ['intro', 'Intro animation'], ['outro', 'End cards'], ['preview', 'Recap or preview'],
                  ['music_offtopic', 'Non-music section'], ['filler', 'Tangents and filler']],
        en: ['Segments to skip', 'Only the kinds you pick here are skipped.'],
        ar: ['المقاطع اللي بتتخطى', 'بس الأنواع اللي بتختارها هون بتتخطى.'] },
      { path: 'sponsors.showToast', type: 'bool', en: ['Say when a segment was skipped', ''], ar: ['إظهار إشعار عند التخطي', ''] }
    ],
    modesty: [
      { heading: true, en: 'Cover imagery of people', ar: 'تغطية صور الأشخاص' },
      { path: 'modesty.images', type: 'select',
        options: [['off', 'Show normally'], ['blur', 'Blur'], ['hide', 'Hide']],
        en: ['Thumbnails, avatars and banners', 'Covers pictures of people across every page.'],
        ar: ['الصور المصغّرة والأفاتار والبانرات', 'بتغطي صور الأشخاص بكل الصفحات.'] },
      { path: 'modesty.video', type: 'select',
        options: [['off', 'Show normally'], ['blur', 'Blur'], ['audio', 'Sound only']],
        en: ['The video itself', 'Sound only blanks the picture completely; audio keeps playing.'],
        ar: ['الفيديو نفسه', '«الصوت فقط» بيطفي الصورة تماماً والصوت بيضل شغّال.'] },
      { path: 'modesty.strength', type: 'range', min: 4, max: 40, step: 1, fmt: (v) => v + ' px',
        en: ['How heavy the blur is', ''], ar: ['قوة التغطية', ''] },
      { path: 'modesty.reveal', type: 'select',
        options: [['hover', 'While pointed at'], ['never', 'Never']],
        en: ['Uncover an image', 'Only affects blurred images, never the video.'],
        ar: ['كشف الصورة', 'بينطبق على الصور المغطّاة بس، مش على الفيديو.'] }
    ],
    panel: [
      { heading: true, en: 'The in-page panel', ar: 'لوحة الصفحة' },
      { path: 'panel.showButton', type: 'bool',
        en: ['Show the button on YouTube', 'Without it, the panel opens only from its keyboard shortcut.'],
        ar: ['إظهار الزر على يوتيوب', 'بدونه، اللوحة بتنفتح بس من اختصار الكيبورد.'] },
      { path: 'panel.corner', type: 'select',
        options: [['bottom-right', 'Bottom right'], ['bottom-left', 'Bottom left'],
                  ['top-right', 'Top right'], ['top-left', 'Top left']],
        en: ['Where the button sits', 'Move it if it covers something you need.'],
        ar: ['مكان الزر', 'حرّكه إذا كان بيغطي شي بتحتاجه.'] }
    ],
    summary: [
      { heading: true, en: 'Video summaries', ar: 'ملخصات الفيديو' },
      { path: 'summary.enabled', type: 'bool', en: ['Enable video summaries', ''], ar: ['تفعيل ملخصات الفيديو', ''] },
      { path: 'summary.apiKey', type: 'password', placeholder: 'sk-ant-...',
        en: ['Your Claude API key', 'Stored on this device only and sent straight to Anthropic. We never see it.'],
        ar: ['مفتاح Claude API تبعك', 'بينحفظ على هالجهاز بس وبينبعت مباشرة لأنثروبيك. إحنا ما منشوفه.'] },
      { path: 'summary.pageButton', type: 'bool',
        en: ['Add a Summarize button to the video page', ''], ar: ['إضافة زر تلخيص لصفحة الفيديو', ''] },
      { path: 'summary.model', type: 'select', options: [['claude-opus-5', 'Opus 5'], ['claude-sonnet-5', 'Sonnet 5'], ['claude-haiku-4-5-20251001', 'Haiku 4.5']],
        en: ['Model', 'Haiku is the cheapest; Opus reads long videos best.'], ar: ['الموديل', 'Haiku الأرخص، و Opus الأفضل للفيديوهات الطويلة.'] },
      { path: 'summary.language', type: 'select', options: [['auto', 'Match the video'], ['ar', 'Arabic'], ['en', 'English']],
        en: ['Summary language', ''], ar: ['لغة الملخص', ''] }
    ],
    focus: [
      { heading: true, en: 'Before you enter', ar: 'قبل ما تفوت' },
      { path: 'focus.openDelay', type: 'range', min: 0, max: 30, step: 1, fmt: (v) => v + 's',
        en: ['Pause before YouTube becomes usable', 'A few seconds is usually enough to change your mind.'], ar: ['مهلة قبل ما يصير يوتيوب قابل للاستخدام', 'كم ثانية بتكفي عادة لتغيّر رأيك.'] },
      { path: 'focus.entryConfirmation', type: 'bool',
        en: ['Confirm before entering YouTube', 'Nothing loads until you say yes.'],
        ar: ['تأكيد قبل الدخول ليوتيوب', 'ما بيحمّل شي لحد ما توافق.'] },
      { path: 'focus.sessionMinutes', type: 'select',
        options: [['0', 'No limit'], ['5', '5 min'], ['10', '10 min'], ['15', '15 min'], ['30', '30 min'], ['60', '60 min']],
        numeric: true,
        en: ['Session length', 'Asked for at the door, then the session ends on its own.'],
        ar: ['طول الجلسة', 'بتنسأل عند الدخول، وبعدين الجلسة بتنتهي لحالها.'] },
      { heading: true, en: 'Blocking', ar: 'الحظر' },
      { path: 'focus.blockUntil', type: 'blockNow',
        en: ['Block YouTube temporarily', 'Starts right now, on every tab.'],
        ar: ['حظر يوتيوب مؤقتاً', 'بيبلّش هلأ، وعلى كل التبويبات.'] },
      { path: 'focus.scheduleEnabled', type: 'bool', en: ['Block during scheduled hours', ''], ar: ['حظر خلال ساعات محددة', ''] },
      { path: 'focus.scheduleFrom', type: 'time', en: ['From', ''], ar: ['من', ''] },
      { path: 'focus.scheduleTo', type: 'time', en: ['To', ''], ar: ['إلى', ''] },
      { heading: true, en: 'Lock', ar: 'القفل' },
      { path: 'focus.passwordHash', type: 'lock',
        en: ['Lock these settings', 'Asked for before this page opens. Stored as a salted hash, never as text.'],
        ar: ['قفل هالإعدادات', 'بتنطلب قبل ما تفتح هالصفحة. بتنحفظ كبصمة مملّحة، مش كنص.'] }
    ],
    /* Written out rather than generated from the key names: splitting camelCase
       gave "Pip" and "Loop Start", and the Arabic column fell back to the raw
       English identifier, so half this tab was untranslated. */
    keys: [{ heading: true, en: 'Keyboard shortcuts', ar: 'اختصارات الكيبورد' }].concat(
      Object.keys(DEFAULTS.shortcuts).map((name) => {
        const NAMES = {
          speedUp: ['Speed up', 'سرّع'],
          speedDown: ['Slow down', 'بطّئ'],
          speedReset: ['Reset speed', 'رجّع السرعة'],
          volumeUp: ['Volume up', 'ارفع الصوت'],
          volumeDown: ['Volume down', 'خفّض الصوت'],
          togglePanel: ['Open the panel', 'افتح اللوحة'],
          screenshot: ['Capture the frame', 'التقط لقطة'],
          cinema: ['Cinema mode', 'وضع السينما'],
          pip: ['Picture in Picture', 'صورة داخل صورة'],
          loopStart: ['Mark loop start (A)', 'بداية الحلقة (أ)'],
          loopEnd: ['Mark loop end (B)', 'نهاية الحلقة (ب)'],
          summarize: ['Summarize the video', 'لخّص الفيديو']
        };
        // A shortcut added later still gets a readable label rather than nothing.
        const fallback = name.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
        const pair = NAMES[name] || [fallback, fallback];
        return { path: 'shortcuts.' + name, type: 'key', en: [pair[0], ''], ar: [pair[1], ''] };
      }))
  };

  /* The declutter list is authored as one array with a heading per YouTube page.
     Those pages are surfaces in their own right — someone thinks "I want to fix
     the home page", not "I want the declutter category" — so the array is split
     into one tab per page, and each page's rows become its groups. */
  (function splitDeclutterIntoSurfaces() {
    /* Keyed on an explicit `surface` marker rather than the heading text: a
       sub-heading called "Search" inside the header surface once collided with
       the search page and carried twelve rows into the wrong tab. */
    const SUBGROUP = {
      /* These name the first group of a page. Two of them used to repeat the
         page's own title back at you — "Watch page › The watch page" — which
         reads as a mistake once the pane carries a heading of its own. They
         say what is in the group instead. */
      everywhere: { en: 'Appearance and interruptions', ar: 'المظهر والمقاطعات' },
      watch: { en: 'Around the video', ar: 'حوالين الفيديو' },
      home: { en: 'The feed', ar: 'الخلاصة' },
      search: { en: 'Results', ar: 'النتائج' },
      header: { en: 'The header', ar: 'رأس الصفحة' },
      sidebar: { en: 'Navigation entries', ar: 'مداخل التنقّل' },
      library: { en: 'Sections', ar: 'الأقسام' },
      channel: { en: 'Tabs and sections', ar: 'التبويبات والأقسام' }
    };

    let current = null;
    SPEC.declutter.forEach((field) => {
      if (field.heading && field.surface) {
        current = field.surface;
        SPEC[current] = [Object.assign({ heading: true }, SUBGROUP[current])];
        return;
      }
      // Any other heading is a sub-group inside the page we are already in.
      // A page that brings its own sub-groups does not want the synthetic one
      // wrapped around them — that leaves an empty duplicate at the top.
      if (!current) return;
      if (field.heading && SPEC[current].length === 1 && SPEC[current][0].heading) SPEC[current].length = 0;
      SPEC[current].push(field);
    });
    delete SPEC.declutter;
  })();

  let settings = null;
  let lang = 'en';

  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const patchOf = (path, value) => path.split('.').reverse().reduce((acc, k) => ({ [k]: acc }), value);

  let saveTimer = null;
  /* Confirmation that something landed. Every write says so the same way,
     including the big ones — importing a file and resetting used to change the
     whole page with no acknowledgement at all. */
  function confirmToast(message) {
    const saved = document.getElementById('saved');
    saved.textContent = message;
    saved.setAttribute('data-show', '');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saved.removeAttribute('data-show'); }, 1400);
  }

  async function save(path, value) {
    settings = await write(patchOf(path, value));
    confirmToast(STR[lang].saved);
    refreshTabDots();
  }

  function labelFor(field) {
    return field[lang] || field.en;
  }

  function control(field) {
    const value = get(settings, field.path);
    const wrap = document.createElement('div');
    wrap.className = 'control';

    if (field.type === 'bool') {
      // The knob is drawn on the span, not on the input — Safari renders no
      // pseudo-elements on form controls, so an input-drawn knob is invisible
      // there and the switch looks dead.
      const sw = document.createElement('label');
      sw.className = 'sw';
      const input = document.createElement('input');
      input.type = 'checkbox';
      // Some switches read better inverted: the stored value is "scrolling is
      // allowed", but the row asks whether to stop it.
      input.checked = field.invert ? !value : !!value;
      input.addEventListener('change', () => save(field.path, field.invert ? !input.checked : input.checked));
      const track = document.createElement('span');
      track.className = 'sw-track';
      track.setAttribute('aria-hidden', 'true');
      sw.append(input, track);
      wrap.appendChild(sw);

    } else if (field.type === 'ticks') {
      /* A dropdown for "how many columns" hides the range it lives in. A slider
         with a mark per stop shows the whole scale at once, and zero reads as
         "leave it alone" rather than as a number. Pattern from Minimal Theme
         for Twitter (MIT), which sizes its timeline the same way. */
      const out = document.createElement('span');
      out.className = 'readout';
      const label = (v) => (v === 0 ? STR[lang].auto : String(v));
      out.textContent = label(Number(value));

      const input = document.createElement('input');
      Object.assign(input, { type: 'range', min: field.min, max: field.max, step: 1, value: Number(value) });
      input.className = 'ticked';
      input.setAttribute('list', 'ticks-' + field.path.replace(/\W/g, '-'));

      const marks = document.createElement('datalist');
      marks.id = input.getAttribute('list');
      for (let v = field.min; v <= field.max; v++) {
        const option = document.createElement('option');
        option.value = String(v);
        marks.appendChild(option);
      }

      input.addEventListener('input', () => { out.textContent = label(Number(input.value)); });
      input.addEventListener('change', () => save(field.path, Number(input.value)));
      wrap.append(input, out, marks);

    } else if (field.type === 'range') {
      // A slider is the one control you cannot put back by hand — nudging it
      // to exactly 1.00× again is luck. So the readout doubles as the way
      // back, the same gesture the in-page panel already uses: when the value
      // differs from the default, tap it to restore.
      const fallback = Number(get(DEFAULTS, field.path));
      const out = document.createElement('button');
      out.type = 'button';
      out.className = 'readout';
      out.textContent = field.fmt(Number(value));
      const input = document.createElement('input');
      Object.assign(input, { type: 'range', min: field.min, max: field.max, step: field.step, value });
      // The track paints its filled portion from this, so the slider reads the
      // way a UISlider does instead of as a bare groove.
      const paint = () => {
        const span = field.max - field.min;
        const pct = span ? ((Number(input.value) - field.min) / span) * 100 : 0;
        // A range that straddles zero — bass, say — fills out from zero rather
        // than from the left end, so "no change" reads as an empty track
        // instead of as half full.
        const origin = (field.min < 0 && field.max > 0) ? (-field.min / span) * 100 : 0;
        input.style.setProperty('--a', Math.min(pct, origin).toFixed(2) + '%');
        input.style.setProperty('--b', Math.max(pct, origin).toFixed(2) + '%');
      };
      const mark = (v) => {
        out.textContent = field.fmt(v);
        const changed = Math.abs(v - fallback) > 1e-9;
        out.toggleAttribute('data-modified', changed);
        out.title = changed ? STR[lang].revert : '';
        out.setAttribute('aria-label', changed
          ? STR[lang].revert + ' — ' + field.fmt(fallback)
          : field.fmt(v));
      };
      paint();
      mark(Number(value));
      input.addEventListener('input', () => { mark(Number(input.value)); paint(); });
      input.addEventListener('change', () => save(field.path, Number(input.value)));
      out.addEventListener('click', () => {
        if (Math.abs(Number(input.value) - fallback) < 1e-9) return;
        input.value = fallback;
        mark(fallback);
        paint();
        save(field.path, fallback);
      });
      wrap.append(input, out);

    } else if (field.type === 'select') {
      const select = document.createElement('select');
      field.options.forEach(([v, label]) => {
        const opt = document.createElement('option');
        opt.value = v; opt.textContent = label;
        if (field.numeric ? Number(v) === Number(value) : v === value) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener('change', () => save(field.path, field.numeric ? Number(select.value) : select.value));
      wrap.appendChild(select);

    } else if (field.type === 'text' || field.type === 'password' || field.type === 'time') {
      const input = document.createElement('input');
      input.type = field.type;
      input.value = value || '';
      if (field.placeholder) input.placeholder = field.placeholder;
      input.addEventListener('change', () => save(field.path, input.value.trim()));
      wrap.appendChild(input);

    } else if (field.type === 'numbers') {
      // A row of numbers is easier to trust as one line you can read back than
      // as a column of separate boxes.
      const input = document.createElement('input');
      input.type = 'text';
      input.value = (value || []).join(', ');
      if (field.placeholder) input.placeholder = field.placeholder;
      input.addEventListener('change', () => {
        const parsed = input.value.split(/[,\s]+/)
          .map((piece) => Number(piece))
          .filter((n) => Number.isFinite(n) && n >= field.min && n <= field.max);
        // Sorted and de-duplicated, because these become buttons in a row and
        // "1, 1, 0.5" would draw a duplicate and an out-of-order one.
        const clean = [...new Set(parsed)].sort((a, b) => a - b);
        // Refusing to save an empty list keeps the panel from losing its speed
        // control entirely because of a typo.
        if (!clean.length) { input.value = (get(settings, field.path) || []).join(', '); return; }
        input.value = clean.join(', ');
        save(field.path, clean);
      });
      wrap.appendChild(input);

    } else if (field.type === 'checks') {
      // A set of independent choices stored as one array.
      const box = document.createElement('div');
      box.className = 'checks';
      const chosen = new Set(value || []);
      field.options.forEach(([key, label]) => {
        const item = document.createElement('label');
        item.className = 'check';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = chosen.has(key);
        input.addEventListener('change', () => {
          if (input.checked) chosen.add(key); else chosen.delete(key);
          // Keep the spec's order rather than click order, so the stored value
          // does not churn every time one is toggled.
          save(field.path, field.options.map(([k]) => k).filter((k) => chosen.has(k)));
        });
        const text = document.createElement('span');
        text.textContent = label;
        item.append(input, text);
        box.appendChild(item);
      });
      wrap.appendChild(box);

    } else if (field.type === 'css') {
      const area = document.createElement('textarea');
      area.className = 'code';
      area.spellcheck = false;
      area.value = value || '';
      if (field.placeholder) area.placeholder = field.placeholder;
      const status = document.createElement('span');
      status.className = 'readout';

      area.addEventListener('change', () => {
        const text = area.value;
        // A stylesheet that does not parse would be injected and silently
        // dropped, so it is checked here where there is somewhere to say so.
        const sheet = document.createElement('style');
        sheet.textContent = text;
        document.head.appendChild(sheet);
        const rules = sheet.sheet ? sheet.sheet.cssRules.length : 0;
        sheet.remove();
        status.textContent = text.trim()
          ? (rules
              ? rules + ' ' + (rules === 1 ? STR[lang].rule : STR[lang].rules)
              : STR[lang].badCss)
          : '';
        save(field.path, text);
      });

      wrap.appendChild(area);
      wrap.appendChild(status);

    } else if (field.type === 'list') {
      const area = document.createElement('textarea');
      area.value = (value || []).join('\n');
      if (field.placeholder) area.placeholder = field.placeholder;
      area.addEventListener('change', () => save(field.path, area.value.split('\n').map((s) => s.trim()).filter(Boolean)));
      wrap.appendChild(area);

    } else if (field.type === 'blockNow') {
      const strings = STR[lang];
      const active = Number(value) > Date.now();

      if (active) {
        const when = document.createElement('span');
        when.className = 'readout';
        when.textContent = strings.blockedUntil + new Date(Number(value)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const lift = document.createElement('button');
        lift.type = 'button';
        lift.className = 'btn';
        lift.textContent = strings.unblock;
        lift.addEventListener('click', async () => { await save(field.path, 0); settings = await read(); render(); });
        wrap.append(when, lift);
      } else {
        [[15, '15 ' + strings.min], [30, '30 ' + strings.min], [60, strings.hour], [120, strings.hours2]]
          .forEach(([span, label]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn';
            button.textContent = label;
            button.addEventListener('click', async () => {
              await save(field.path, Date.now() + span * 60000);
              settings = await read();
              render();
            });
            wrap.appendChild(button);
          });
      }

    } else if (field.type === 'lock') {
      const strings = STR[lang];
      const state = document.createElement('span');
      state.className = 'readout';
      state.textContent = value ? strings.pwOn : strings.pwOff;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn';
      button.textContent = value ? strings.removePw : strings.setPw;
      button.addEventListener('click', async () => {
        if (value) {
          const ok = await passwordDialog({ title: strings.removePw, fields: [strings.currentPw], verifyWith: value });
          if (ok === null) return;
          await save(field.path, '');
        } else {
          const chosen = await passwordDialog({ title: strings.setPw, fields: [strings.newPw, strings.confirmPw] });
          if (chosen === null) return;
          await save(field.path, await Lock.make(chosen));
        }
        settings = await read();
        render();
      });

      wrap.append(state, button);

    } else if (field.type === 'key') {
      /* A key cap, not a text box: the old control was a read-only input
         showing the raw KeyboardEvent code, so a shortcut appeared as
         "Shift+BracketLeft". Storage still keeps the code — that is what
         matching a keypress needs — but nobody has to read it. */
      const cap = document.createElement('button');
      cap.type = 'button';
      cap.className = 'keycap';

      const strings = () => STR[lang];
      const paint = (combo) => {
        const label = self.CostumDefaults.formatShortcut(combo);
        cap.textContent = label || strings().noKey;
        cap.classList.toggle('unset', !label);
        cap.setAttribute('aria-label', labelFor(field)[0] + ': '
          + (label ? label : strings().noKey) + '. ' + strings().recordHint);
      };
      paint(value);

      const stopRecording = () => {
        cap.removeAttribute('data-recording');
        paint(get(settings, field.path));
      };

      cap.addEventListener('click', () => {
        cap.setAttribute('data-recording', '');
        cap.textContent = strings().pressKeys;
        cap.focus();
      });
      cap.addEventListener('blur', stopRecording);

      /* save() writes through storage, so the new value is not readable until it
         resolves — repainting before that shows the combination you just
         replaced, and the conflict scan runs against the old set. */
      const commit = async (combo) => {
        await save(field.path, combo);
        cap.removeAttribute('data-recording');
        paint(combo);
        markShortcutConflicts();
        cap.blur();
      };

      cap.addEventListener('keydown', (ev) => {
        // Space and Enter are how a button is pressed; let them start recording.
        if (!cap.hasAttribute('data-recording')) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (ev.key === 'Escape') { commit(''); return; }
        // Wait for a real key: a lone modifier is the start of a combination,
        // not a combination.
        if (['Shift', 'Control', 'Alt', 'Meta'].includes(ev.key)) return;
        const parts = [];
        if (ev.ctrlKey) parts.push('Ctrl');
        if (ev.altKey) parts.push('Alt');
        if (ev.shiftKey) parts.push('Shift');
        if (ev.metaKey) parts.push('Meta');
        parts.push(ev.code);
        commit(parts.join('+'));
      });

      wrap.appendChild(cap);
    }

    return wrap;
  }

  let headingRefreshers = [];
  let activeTab = null;      // survives the rebuild that follows any save
  const openGroups = new Set();   // which disclosure was open, per surface
  let searching = false;          // while true, groups open freely and are not remembered

  function renderPane(key) {
    const pane = document.createElement('section');
    pane.className = 'pane';
    pane.dataset.key = key;

    const head = document.createElement('div');
    head.className = 'pane-head';

    const paneTitle = document.createElement('h2');
    paneTitle.className = 'pane-title';
    paneTitle.textContent = STR[lang].tabs[key];
    head.appendChild(paneTitle);

    // A section name alone says where you are, not what you can do here.
    const blurb = (STR[lang].blurbs || {})[key];
    if (blurb) {
      const note = document.createElement('p');
      note.className = 'pane-blurb';
      note.textContent = blurb;
      head.appendChild(note);
    }
    pane.appendChild(head);

    // Rows only exist inside groups now; anything authored before the first
    // heading would be orphaned, so the spec always opens with one.
    let card = document.createElement('div');
    card.className = 'rows orphan';
    pane.appendChild(card);

    SPEC[key].forEach((field) => {
      if (field.heading) {
        // Each heading becomes a collapsible group. `name` ties the group to its
        // surface, which is what makes the browser close the others when one
        // opens — the whole point of the two-level layout.
        const group = document.createElement('details');
        group.name = 'surface-' + key;
        group.className = 'group';

        const summary = document.createElement('summary');
        const title = document.createElement('span');
        title.className = 'group-name';
        title.textContent = field[lang] || field.en;

        const right = document.createElement('span');
        right.className = 'summary-right';
        const count = document.createElement('span');
        count.className = 'group-count';
        const bulk = document.createElement('button');
        bulk.type = 'button';
        bulk.className = 'bulk';
        const chev = document.createElement('span');
        chev.className = 'chev';
        chev.setAttribute('aria-hidden', 'true');
        right.append(bulk, count, chev);
        summary.append(title, right);

        const rows = document.createElement('div');
        rows.className = 'rows';

        const refresh = () => {
          const fields = [...rows.querySelectorAll('.field')];
          group.hidden = fields.length === 0;
          const paths = fields.map((f) => f.dataset.path)
            .filter((path) => path && typeof get(settings, path) === 'boolean');
          bulk.hidden = paths.length < 2;
          const allOn = paths.length > 0 && paths.every((path) => get(settings, path) === true);
          bulk.textContent = allOn ? STR[lang].allOff : STR[lang].allOn;
          bulk.dataset.target = allOn ? 'off' : 'on';
          bulk.dataset.paths = JSON.stringify(paths);

          /* How many switches in this group are on, without opening it.
             This badge used to say two different things from the same slot: a
             bare "6" when none were on, "1 / 6" when one was. So a column read
             "1 / 6", "3", "2" and nothing said which of those was a total and
             which was a tally. Worse, the "6" counted every row while the "1"
             counted only the switches, so the two halves of the ratio were not
             even measuring the same thing.
             One format, one meaning: switched on, out of switches. A group
             holding no switches at all — sliders and menus only — has nothing
             to tally, and says nothing rather than inventing a number. */
          const onCount = paths.filter((path) => get(settings, path) === true).length;
          group.toggleAttribute('data-active', onCount > 0);
          count.textContent = paths.length ? onCount + ' / ' + paths.length : '';
        };

        bulk.addEventListener('click', async (ev) => {
          ev.preventDefault();      // never toggle the disclosure from this button
          ev.stopPropagation();
          const paths = JSON.parse(bulk.dataset.paths || '[]');
          const value = bulk.dataset.target === 'on';
          let next = settings;
          for (const path of paths) next = self.CostumDefaults.merge(next, patchOf(path, value));
          openGroups.add(group.name + '|' + (field[lang] || field.en));
          settings = await replace(next);
          render();
        });

        const groupKey = group.name + '|' + (field[lang] || field.en);
        group.dataset.groupKey = groupKey;
        if (openGroups.has(groupKey)) group.open = true;
        group.addEventListener('toggle', () => {
          if (searching) return;   // search opens groups on its own; that is not a choice
          // The browser closes siblings for us; mirror that in what we remember.
          if (group.open) {
            [...openGroups].forEach((k) => { if (k.startsWith(group.name + '|')) openGroups.delete(k); });
            openGroups.add(groupKey);
          } else {
            openGroups.delete(groupKey);
          }
        });

        group.append(summary, rows);
        pane.appendChild(group);
        card = rows;
        headingRefreshers.push(refresh);
        return;
      }

      const [title, hint] = labelFor(field);
      const row = document.createElement('div');
      row.className = 'field';
      row.dataset.path = field.path || '';
      row.dataset.search = (title + ' ' + (hint || '') + ' ' + field.path).toLowerCase();

      const label = document.createElement('div');
      label.className = 'label';
      const b = document.createElement('b');
      b.textContent = title;
      label.appendChild(b);
      if (hint) {
        const small = document.createElement('small');
        small.textContent = hint;
        label.appendChild(small);
      }

      row.append(label, control(field));
      card.appendChild(row);
    });

    if (key === 'summary') {
      const hint = document.createElement('p');
      hint.className = 'hint';
      hint.innerHTML = lang === 'ar'
        ? 'الملخصات بتمشي على مفتاحك أنت من <code>console.anthropic.com</code> — بتدفع سنتات للفيديو بدل اشتراك سنوي.'
        : 'Summaries run on your own key from <code>console.anthropic.com</code> — cents per video instead of a yearly subscription.';
      pane.appendChild(hint);
    }
    return pane;
  }


  /* The browser's own confirm() and alert() are a different design language
     dropped on top of this one — and on a page whose whole promise is that it
     looks native, that is the one dialog nobody asked for. This is the same
     overlay the password sheet uses, so a destructive step and a password step
     look like they come from the same app. Resolves true only if confirmed. */
  function alertDialog({ title, body, confirm, danger, cancel }) {
    return new Promise((resolve) => {
      const strings = STR[lang];
      const overlay = document.createElement('div');
      overlay.className = 'overlay';

      const card = document.createElement('div');
      card.className = 'dialog';

      const heading = document.createElement('h2');
      heading.textContent = title;
      card.appendChild(heading);

      if (body) {
        const text = document.createElement('p');
        text.className = 'dialog-body';
        text.textContent = body;
        card.appendChild(text);
      }

      const row = document.createElement('div');
      row.className = 'dialog-actions';

      const close = (value) => { overlay.remove(); document.removeEventListener('keydown', onKey); resolve(value); };
      const onKey = (ev) => {
        if (ev.key === 'Escape') { ev.preventDefault(); close(false); }
        if (ev.key === 'Enter') { ev.preventDefault(); close(true); }
      };

      if (cancel !== false) {
        const no = document.createElement('button');
        no.type = 'button';
        no.className = 'btn';
        no.textContent = strings.cancel;
        no.addEventListener('click', () => close(false));
        row.appendChild(no);
      }

      const yes = document.createElement('button');
      yes.type = 'button';
      yes.className = 'btn filled' + (danger ? ' danger-filled' : '');
      yes.textContent = confirm || strings.ok;
      yes.addEventListener('click', () => close(true));
      row.appendChild(yes);

      card.appendChild(row);
      overlay.appendChild(card);
      overlay.addEventListener('click', (ev) => { if (ev.target === overlay) close(false); });
      document.addEventListener('keydown', onKey);
      document.body.appendChild(overlay);
      yes.focus();
    });
  }

  /* One overlay serves both jobs: unlocking the page, and setting or clearing
     the password. It resolves to the typed value, or null if dismissed. */
  function passwordDialog({ title, fields, verifyWith }) {
    return new Promise((resolve) => {
      const strings = STR[lang];
      const overlay = document.createElement('div');
      overlay.className = 'overlay';

      const card = document.createElement('div');
      card.className = 'dialog';

      const heading = document.createElement('h2');
      heading.textContent = title;
      card.appendChild(heading);

      const inputs = fields.map((label) => {
        const wrap = document.createElement('label');
        wrap.className = 'dialog-field';
        const span = document.createElement('span');
        span.textContent = label;
        const input = document.createElement('input');
        input.type = 'password';
        // Not an account credential: this lock never leaves the device, so keep
        // it out of iCloud Keychain and every other password manager.
        input.autocomplete = 'off';
        input.name = 'costum-lock';
        input.setAttribute('data-1p-ignore', '');
        input.setAttribute('data-lpignore', 'true');
        input.setAttribute('data-bwignore', '');
        wrap.append(span, input);
        card.appendChild(wrap);
        return input;
      });

      const error = document.createElement('p');
      error.className = 'dialog-error';
      card.appendChild(error);

      const row = document.createElement('div');
      row.className = 'dialog-actions';
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'btn';
      cancel.textContent = strings.cancel;
      const submit = document.createElement('button');
      submit.type = 'button';
      submit.className = 'btn filled';
      submit.textContent = strings.save;
      row.append(cancel, submit);
      card.appendChild(row);

      function close(value) {
        overlay.remove();
        resolve(value);
      }

      cancel.addEventListener('click', () => close(null));
      overlay.addEventListener('click', (ev) => { if (ev.target === overlay && verifyWith === undefined) close(null); });

      async function attempt() {
        const values = inputs.map((i) => i.value);

        if (fields.length === 2 && values[0] !== values[1]) { error.textContent = strings.mismatch; return; }
        if (values[0].length < 4) { error.textContent = strings.tooShort; return; }

        if (verifyWith !== undefined) {
          const ok = await Lock.verify(values[0], verifyWith);
          if (!ok) { error.textContent = strings.wrong; inputs[0].value = ''; inputs[0].focus(); return; }
        }
        close(values[0]);
      }

      submit.addEventListener('click', attempt);
      inputs.forEach((input) => input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); attempt(); }
      }));

      overlay.appendChild(card);
      document.body.appendChild(overlay);
      inputs[0].focus();
    });
  }

  /* The page stays empty until the password is right. Nothing is rendered
     behind the overlay, so there is nothing to read by dismissing it. */
  async function gate() {
    const strings = STR[lang];
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelector('.shell').style.visibility = 'hidden';

    for (;;) {
      const entered = await passwordDialog({
        title: strings.locked,
        fields: [strings.enterPw],
        verifyWith: settings.focus.passwordHash
      });
      if (entered !== null) break;
      // Dismissing is not a way in; ask again.
    }

    document.querySelector('.shell').style.visibility = '';
    render();
  }

  /* Switching sections. Remembered, because every save rebuilds these panes
     and landing back on the first tab loses your place mid-edit. */
  /* Below the breakpoint the section list is a row that does not fit, so the
     selected section has to be scrolled to. Without this, picking a section
     from search — or coming back to the one you were last in — leaves the
     strip parked on Player while the pane underneath shows Sidebar. */
  function revealActiveTab() {
    const button = document.getElementById('tab-' + activeTab);
    // block: 'nearest' so the wide-window sidebar is not yanked around; it
    // only scrolls when the section is genuinely out of sight.
    if (button && button.scrollIntoView) button.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function selectTab(key, moveFocus) {
    activeTab = key;
    const tabs = document.getElementById('tabs');
    const panes = document.getElementById('panes');
    tabs.querySelectorAll('button').forEach((b) => {
      const on = b.id === 'tab-' + key;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && moveFocus) b.focus();
    });
    panes.querySelectorAll('.pane').forEach((p) => p.toggleAttribute('active', p.dataset.key === key));
    revealActiveTab();
  }

  /* Arrow keys walk the section list, Home and End jump to its ends. */
  document.getElementById('tabs').addEventListener('keydown', (ev) => {
    const keys = [...document.querySelectorAll('#tabs button')].map((b) => b.id.slice(4));
    const at = keys.indexOf(activeTab);
    if (at === -1) return;
    // The list is a column on a wide window and a row on a narrow one, so both
    // axes have to work.
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[ev.key];
    let next = null;
    if (step !== undefined) next = keys[(at + step + keys.length) % keys.length];
    else if (ev.key === 'Home') next = keys[0];
    else if (ev.key === 'End') next = keys[keys.length - 1];
    if (next === null) return;
    ev.preventDefault();
    selectTab(next, true);
  });

  function render() {
    const strings = STR[lang];
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelector('[data-i18n="title"]').textContent = strings.title;
    document.querySelector('[data-i18n="lede"]').textContent = strings.lede;
    document.querySelector('[data-i18n="enabled"]').textContent = strings.enabled;
    document.querySelector('[data-i18n="export"]').textContent = strings.export;
    document.querySelector('[data-i18n="import"]').textContent = strings.import;
    document.querySelector('[data-i18n="reset"]').textContent = strings.reset;

    const tabs = document.getElementById('tabs');
    const panes = document.getElementById('panes');
    tabs.setAttribute('role', 'tablist');
    tabs.textContent = '';
    panes.textContent = '';

    headingRefreshers = [];

    /* Ordered the way someone arrives at the page: "fix the watch page" comes
       before "adjust the blocking rules". Anything not listed falls to the end,
       so adding a surface cannot silently drop its tab. */
    /* Eighteen sections in one undifferentiated column is a list you read
       rather than scan. They fall into four honest groups: how a video plays,
       the YouTube pages you strip down, the tools that act on content, and
       Costum's own surfaces. Anything new lands in "More" rather than being
       silently dropped. */
    const GROUPS = [
      { en: 'Playback', ar: 'التشغيل', keys: ['player', 'layout'] },
      { en: 'Pages', ar: 'الصفحات',
        keys: ['watch', 'home', 'search', 'subscriptions', 'cards', 'shorts',
               'header', 'sidebar', 'library', 'channel', 'everywhere'] },
      { en: 'Tools', ar: 'أدوات', keys: ['block', 'modesty', 'focus', 'summary'] },
      { en: 'Costum', ar: 'Costum', keys: ['panel', 'keys'] }
    ];
    const grouped = GROUPS.flatMap((g) => g.keys);
    const leftover = Object.keys(SPEC).filter((k) => grouped.indexOf(k) === -1);
    const sections = leftover.length
      ? GROUPS.concat([{ en: 'More', ar: 'غير ذلك', keys: leftover }])
      : GROUPS;
    const keys = sections.flatMap((g) => g.keys).filter((k) => SPEC[k]);
    if (!activeTab || keys.indexOf(activeTab) === -1) activeTab = keys[0];

    let renderedGroup = null;

    keys.forEach((key) => {
      const group = sections.find((g) => g.keys.indexOf(key) !== -1);
      if (group && group !== renderedGroup) {
        renderedGroup = group;
        const heading = document.createElement('p');
        heading.className = 'tab-group';
        heading.textContent = group[lang] || group.en;
        // A label, not a tab: keep it out of the tablist's own semantics.
        heading.setAttribute('role', 'presentation');
        tabs.appendChild(heading);
      }

      const button = document.createElement('button');
      button.type = 'button';
      const name = document.createElement('span');
      name.className = 'tab-name';
      name.textContent = strings.tabs[key];
      button.append(tabIcon(key), name);
      // A list of buttons is not a list of tabs to a screen reader: without
      // these it reads as seventeen unrelated buttons and never says which
      // section is showing.
      button.setAttribute('role', 'tab');
      button.id = 'tab-' + key;
      button.setAttribute('aria-controls', 'pane-' + key);
      button.setAttribute('aria-selected', String(key === activeTab));
      // Roving tabstop: Tab reaches the section list once, then the arrows
      // move within it — the way a Mac sidebar behaves.
      button.tabIndex = key === activeTab ? 0 : -1;
      button.addEventListener('click', () => selectTab(key));
      tabs.appendChild(button);

      const pane = renderPane(key);
      pane.id = 'pane-' + key;
      pane.setAttribute('role', 'tabpanel');
      pane.setAttribute('aria-labelledby', 'tab-' + key);
      if (key === activeTab) pane.setAttribute('active', '');
      panes.appendChild(pane);
    });

    const master = document.getElementById('master');
    master.checked = settings.enabled;
    master.onchange = () => save('enabled', master.checked);

    headingRefreshers.forEach((refresh) => refresh());
    markShortcutConflicts();
    refreshTabDots();
    revealActiveTab();

    const search = document.getElementById('search');
    search.placeholder = strings.search;
    search.oninput = () => applyFilter(search.value);
    const clear = document.getElementById('search-clear');
    clear.setAttribute('aria-label', strings.clear);
    clear.title = strings.clear;
    clear.onclick = () => { search.value = ''; applyFilter(''); search.focus(); };
    if (search.value) applyFilter(search.value);
  }

  /* Has anything in this section been moved off its default? Across 226
     settings the useful question on returning is not "what is on" but "where
     did I change something", so the sidebar answers it. Recomputed after every
     save, because a marker that only updates on reload is worse than none. */
  function touched(key) {
    return (SPEC[key] || []).some((field) => {
      if (field.heading || !field.path) return false;
      const now = get(settings, field.path);
      const base = get(DEFAULTS, field.path);
      if (Array.isArray(now) || Array.isArray(base)) {
        return JSON.stringify(now) !== JSON.stringify(base);
      }
      return now !== base;
    });
  }

  function refreshTabDots() {
    document.querySelectorAll('#tabs button').forEach((button) => {
      const key = button.id.slice(4);
      const wanted = touched(key);
      const existing = button.querySelector('.tab-dot');
      if (wanted === !!existing) return;
      if (wanted) {
        const dot = document.createElement('span');
        dot.className = 'tab-dot';
        dot.setAttribute('aria-hidden', 'true');
        button.appendChild(dot);
        button.title = STR[lang].changedHere;
      } else {
        existing.remove();
        button.removeAttribute('title');
      }
    });
  }

  /* Two actions on one combination is not a setting, it is a silent loss: the
     keypress handler takes whichever it finds first and the other shortcut just
     stops working, with nothing on screen to say why. */
  function markShortcutConflicts() {
    const caps = [...document.querySelectorAll('.field[data-path^="shortcuts."] .keycap')];
    const counts = {};
    caps.forEach((cap) => {
      const combo = get(settings, cap.closest('.field').dataset.path);
      if (combo) counts[combo] = (counts[combo] || 0) + 1;
    });
    caps.forEach((cap) => {
      const combo = get(settings, cap.closest('.field').dataset.path);
      const clash = !!combo && counts[combo] > 1;
      cap.classList.toggle('conflict', clash);
      if (clash) cap.title = STR[lang].clash;
      else cap.removeAttribute('title');
    });
  }

  /* Ninety switches across nine tabs is more than anyone can hold in their head.
     Searching spans every tab at once and keeps each result under its own
     heading, so a hit still tells you where it lives. */
  /* Matching anywhere inside a word turns "ad" into a hit on "instead",
     "already" and "loads". Matching at word starts keeps short queries useful. */
  function matcher(query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let wordStart = null;
    try {
      wordStart = new RegExp('(^|[^\\p{L}\\p{N}])' + escaped, 'iu');
    } catch (e) {
      wordStart = null;   // older engines without Unicode property escapes
    }
    return (haystack) => (wordStart ? wordStart.test(haystack) : haystack.includes(query));
  }

  function applyFilter(raw) {
    const query = raw.trim().toLowerCase();
    const clear = document.getElementById('search-clear');
    if (clear) clear.hidden = raw.length === 0;
    const matches = query ? matcher(query) : null;
    const main = document.getElementById('panes');
    const tabs = document.getElementById('tabs');

    searching = query.length > 0;
    main.classList.toggle('searching', searching);

    /* `name` makes the browser keep one disclosure open per surface, which is
       right while browsing and wrong while searching: a query matching four
       groups would show four headers with only the last one expanded. Drop the
       grouping for the duration of the search, put it back afterwards. */
    main.querySelectorAll('details.group').forEach((group) => {
      if (searching) group.removeAttribute('name');
      else group.name = 'surface-' + group.closest('.pane').dataset.key;
    });
    tabs.style.opacity = query ? '.4' : '';
    tabs.style.pointerEvents = query ? 'none' : '';

    const existingEmpty = main.querySelector('.empty');
    if (existingEmpty) existingEmpty.remove();
    const existingHits = main.querySelector('.hits');
    if (existingHits) existingHits.remove();

    if (!query) {
      main.querySelectorAll('.field, .rows, .hint').forEach((el) => { el.hidden = false; });
      main.querySelectorAll('.pane').forEach((pane) => { pane.hidden = false; });
      // Collapse again, and put back whichever group the reader had open.
      main.querySelectorAll('details.group').forEach((group) => {
        group.hidden = false;
        group.open = openGroups.has(group.dataset.groupKey);
      });
      return;
    }

    let total = 0;

    main.querySelectorAll('.pane').forEach((pane) => {
      let paneHits = 0;

      pane.querySelectorAll('.field').forEach((field) => {
        const hit = matches(field.dataset.search);
        field.hidden = !hit;
        if (hit) paneHits++;
      });

      // A group with nothing left in it disappears; one with a hit opens itself,
      // so a search result is never hidden behind a closed disclosure.
      pane.querySelectorAll('details.group').forEach((group) => {
        const alive = [...group.querySelectorAll('.field')].some((f) => !f.hidden);
        group.hidden = !alive;
        if (alive) group.open = true;
      });

      pane.querySelectorAll('.hint').forEach((note) => { note.hidden = true; });
      pane.hidden = paneHits === 0;
      total += paneHits;
    });

    if (total === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      const title = document.createElement('b');
      title.textContent = STR[lang].noHits;
      const detail = document.createElement('span');
      // Quote the query back: half the time the answer is a typo.
      detail.textContent = STR[lang].noHitsFor.replace('%s', raw.trim());
      empty.append(title, detail);
      main.appendChild(empty);
      return;
    }

    // How many settings the query reached, so a narrow result set is obviously
    // narrow rather than looking like the page lost its contents.
    const hits = document.createElement('p');
    hits.className = 'hits';
    hits.textContent = total + ' ' + (total === 1 ? STR[lang].hit : STR[lang].hits);
    main.prepend(hits);
  }

  /* Mac keyboard habits: slash or Command-F jumps to the field, Escape leaves
     it. Without these the search box is only reachable with the pointer. */
  document.addEventListener('keydown', (ev) => {
    const search = document.getElementById('search');
    const inField = /^(input|textarea|select)$/i.test((ev.target.tagName || ''));

    if ((ev.metaKey || ev.ctrlKey) && ev.key === 'f') {
      ev.preventDefault();
      search.focus();
      search.select();
      return;
    }
    if (ev.key === '/' && !inField && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
      ev.preventDefault();
      search.focus();
      return;
    }
    if (ev.key === 'Escape' && ev.target === search) {
      if (search.value) { search.value = ''; applyFilter(''); }
      else search.blur();
    }
  });

  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  }

  document.getElementById('export').addEventListener('click', () => {
    download('costum-settings.json', JSON.stringify(settings, null, 2));
  });

  document.getElementById('import').addEventListener('click', () => {
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'application/json';
    picker.addEventListener('change', async () => {
      const file = picker.files && picker.files[0];
      if (!file) return;
      try {
        settings = await replace(JSON.parse(await file.text()));
        render();
        confirmToast(STR[lang].imported);
      } catch (e) {
        alertDialog({ title: STR[lang].badFile, body: STR[lang].badFileBody, cancel: false });
      }
    });
    picker.click();
  });

  document.getElementById('reset').addEventListener('click', async () => {
    const strings = STR[lang];
    const ok = await alertDialog({
      title: strings.resetTitle, body: strings.resetBody,
      confirm: strings.resetGo, danger: true
    });
    if (!ok) return;
    settings = await replace({});
    render();
    confirmToast(strings.wasReset);
  });

  read().then((loaded) => {
    settings = loaded;
    lang = settings.locale === 'auto'
      ? (navigator.language.startsWith('ar') ? 'ar' : 'en')
      : settings.locale;
    if (Lock.isLocked(settings)) gate();
    else render();
  });

  api.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) settings = self.CostumDefaults.withDefaults(changes.settings.newValue);
  });
})();
