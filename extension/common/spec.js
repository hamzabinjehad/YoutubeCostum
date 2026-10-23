/* Costum for YouTube — the settings spec.
 *
 * One description of every setting: where it lives, what kind of control it
 * needs, and what it is called in both languages. It was written inside the
 * settings page, which meant the popup could only ever link to that page
 * rather than show the same settings itself. It is data, so it belongs to
 * neither surface.
 *
 * `DEFAULTS` has to be loaded first — the shortcut rows are generated from it.
 */
(function (root) {
  'use strict';
  const { DEFAULTS } = root.CostumDefaults;

  /* "1.5×" wherever a speed is printed: the presets, the readout and the
     summary of changes all said the same number three different ways. */
  const speed = (v) => v.toFixed(2).replace(/\.?0+$/, '') + '×';

  /* Option labels are [value, en, ar]; the Arabic is omitted where the label is
     a number or a name that does not translate. */
  function optionLabel(option, lang) {
    return (lang === 'ar' && option[2]) || option[1];
  }

  const SPEC = {
    player: [
      { heading: true, en: 'Speed', ar: 'السرعة' },
      { path: 'playback.defaultSpeed', type: 'range', min: 0.25, max: 4, step: 0.05, fmt: (v) => speed(v),
        en: ['Default speed', 'Applied automatically when a video starts.'], ar: ['السرعة الافتراضية', 'بتنطبق تلقائياً مع بداية كل فيديو.'] },
      { path: 'playback.musicSpeed', type: 'range', min: 0, max: 2, step: 0.05, fmt: (v, L) => (v === 0 ? (L && L.off) || 'off' : speed(v)),
        en: ['Speed on music channels', 'Zero leaves music at normal speed.'], ar: ['السرعة على قنوات الموسيقى', 'صفر يعني تبقى الموسيقى بسرعتها الطبيعية.'] },
      { path: 'playback.speedStep', type: 'range', min: 0.01, max: 0.5, step: 0.01, fmt: (v) => '±' + v.toFixed(2),
        en: ['Speed step', 'How much each keypress or wheel notch moves.'], ar: ['خطوة السرعة', 'مقدار التغيير مع كل ضغطة أو حركة عجلة.'] },
      { path: 'playback.rememberSpeed', type: 'bool', en: ['Remember speed between videos', ''], ar: ['تذكّر السرعة بين الفيديوهات', ''] },
      { path: 'playback.speedPresets', type: 'numbers', min: 0.07, max: 16, placeholder: '0.5, 1, 1.5, 2',
        en: ['Speed buttons in the panel', 'The row of speeds the in-page panel offers. Sorted for you.'],
        ar: ['أزرار السرعة باللوحة', 'صف السرعات اللي بتظهر بلوحة الصفحة. بينترتب تلقائياً.'] },
      { path: 'playback.wheelOnPlayer', type: 'select', options: [['none', 'Off', 'مطفي'], ['speed', 'Speed', 'السرعة'], ['volume', 'Volume', 'الصوت']],
        en: ['Mouse wheel over the player', ''], ar: ['عجلة الماوس فوق المشغّل', ''] },
      { heading: true, en: 'Quality and format', ar: 'الجودة والصيغة' },
      { path: 'playback.forceQuality', type: 'select',
        options: [['auto', 'Auto', 'تلقائي'], ['highres', '4K+'], ['hd2160', '2160p'], ['hd1440', '1440p'], ['hd1080', '1080p'], ['hd720', '720p'], ['large', '480p'], ['medium', '360p']],
        en: ['Force quality', 'Falls back to the best level the video actually offers.'], ar: ['فرض الجودة', 'بينزل لأعلى جودة متاحة فعلياً بالفيديو.'] },
      { path: 'playback.blockHighFramerate', type: 'bool',
        en: ['Block 48/60 fps formats', 'Cuts battery drain on laptops.'], ar: ['منع صيغ 48/60 إطار', 'بيقلل استهلاك البطارية على اللابتوب.'] },
      { path: 'playback.preferAvc', type: 'bool',
        en: ['Prefer H.264 over VP9/AV1', 'Uses the Mac hardware decoder.'], ar: ['تفضيل H.264 على VP9/AV1', 'بيستخدم فك التشفير العتادي بالماك.'] },
      { heading: true, en: 'Autoplay', ar: 'التشغيل التلقائي' },
      { path: 'playback.autoplay', type: 'select', options: [['default', 'Leave alone', 'خلّيه'], ['pause', 'Always pause', 'وقّف دايماً'], ['play', 'Always play', 'شغّل دايماً']],
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
        en: ['Columns per row', 'Applies to every grid feed — home, subscriptions, a channel.'],
        ar: ['أعمدة بالصف', 'بتنطبق على كل خلاصة شبكية — الرئيسية والاشتراكات والقناة.'] },
      { path: 'layout.feedWidth', type: 'range', min: 0, max: 2400, step: 100,
        fmt: (v) => (v === 0 ? 'Full width' : v + 'px'),
        en: ['Feed width', 'Caps how wide the grid runs. Zero leaves it edge to edge.'],
        ar: ['عرض الخلاصة', 'بيحدّد قدّيش بتتمدّد الشبكة. صفر بيتركها من حافة لحافة.'] },
      { path: 'layout.cardMinWidth', type: 'range', min: 0, max: 600, step: 20,
        fmt: (v) => (v === 0 ? 'Default' : v + 'px'),
        en: ['Smallest card', 'A bigger floor means fewer, larger cards per row.'],
        ar: ['أصغر كرت', 'كل ما كبر الحد، قلّت الكروت وكبرت بالصف.'] },
      { path: 'layout.rowGap', type: 'range', min: 0, max: 96, step: 4,
        fmt: (v) => (v === 0 ? 'Default' : v + 'px'),
        en: ['Space between rows', ''],
        ar: ['المسافة بين الصفوف', ''] },
      { path: 'layout.relatedLimit', type: 'ticks', min: 0, max: 20,
        en: ['Related videos to keep', 'On the watch page. Zero keeps every one.'],
        ar: ['كم فيديو مقترح يضل', 'بصفحة المشاهدة. صفر بيخلّيهم كلهم.'] },
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
        options: [['', 'YouTube default', 'خط يوتيوب'], ['system-ui, sans-serif', 'System', 'خط النظام'],
                  ['Georgia, serif', 'Serif', 'Serif'], ['ui-monospace, Menlo, monospace', 'Monospace', 'Monospace'],
                  ['"Comic Sans MS", cursive', 'Comic Sans']],
        en: ['Font', 'Applies across every YouTube page.'],
        ar: ['الخط', 'بينطبق على كل صفحات يوتيوب.'] },
      { path: 'declutter.thumbnails', type: 'select', options: [['normal', 'Normal', 'عادية'], ['grayscale', 'Grayscale', 'رمادية'], ['blur', 'Blur until hover', 'مموّهة لحد ما تأشّر'], ['hide', 'Hide', 'إخفاء']],
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
      { path: 'declutter.shorts', type: 'select', options: [['show', 'Show', 'إظهار'], ['hide', 'Hide', 'إخفاء'], ['asVideo', 'Open as normal videos', 'افتحها كفيديوهات عادية']],
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
      { heading: true, dense: true, en: 'Navigation entries', ar: 'مداخل التنقّل' },
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
        en: ['Title contains', 'Text matching: one per line, found anywhere in the title.'], ar: ['العنوان يحتوي', 'مطابقة نصية: كلمة بكل سطر، بتنطابق بأي مكان بالعنوان.'] },
      { path: 'block.exactChannels', type: 'list', placeholder: 'UC… or @handle or the exact channel name',
        en: ['Blocked channels (exact)', 'A channel id, an @handle, or a whole channel name. “Block this channel” in the panel adds the one you are watching.'],
        ar: ['قنوات محظورة (مطابقة تامة)', 'معرّف القناة، أو @المعرّف، أو اسم القناة كاملاً. «احظر هالقناة» باللوحة بتضيف القناة اللي عم تتفرج عليها.'] },
      { path: 'block.channels', type: 'list', placeholder: 'Channel name',
        en: ['Channel name contains', 'Text matching: one per line, found anywhere in the channel name.'], ar: ['اسم القناة يحتوي', 'مطابقة نصية: قناة بكل سطر، بتنطابق بأي مكان بالاسم.'] },
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
        options: [['off', 'Show normally', 'إظهار عادي'], ['blur', 'Blur', 'تمويه'], ['hide', 'Hide', 'إخفاء']],
        en: ['Thumbnails, avatars and banners', 'Covers pictures of people across every page.'],
        ar: ['الصور المصغّرة والأفاتار والبانرات', 'بتغطي صور الأشخاص بكل الصفحات.'] },
      { path: 'modesty.video', type: 'select',
        options: [['off', 'Show normally', 'إظهار عادي'], ['blur', 'Blur', 'تمويه'], ['audio', 'Sound only', 'الصوت بس']],
        en: ['The video itself', 'Sound only blanks the picture completely; audio keeps playing.'],
        ar: ['الفيديو نفسه', '«الصوت فقط» بيطفي الصورة تماماً والصوت بيضل شغّال.'] },
      { path: 'modesty.strength', type: 'range', min: 4, max: 40, step: 1, fmt: (v) => v + ' px',
        en: ['How heavy the blur is', ''], ar: ['قوة التغطية', ''] },
      { path: 'modesty.reveal', type: 'select',
        options: [['hover', 'While pointed at', 'وقت التأشير'], ['never', 'Never', 'أبداً']],
        en: ['Uncover an image', 'Only affects blurred images, never the video.'],
        ar: ['كشف الصورة', 'بينطبق على الصور المغطّاة بس، مش على الفيديو.'] }
    ],
    panel: [
      { heading: true, en: 'The in-page panel', ar: 'لوحة الصفحة' },
      { path: 'panel.showButton', type: 'bool',
        en: ['Show the button on YouTube', 'Without it, the panel opens only from its keyboard shortcut.'],
        ar: ['إظهار الزر على يوتيوب', 'بدونه، اللوحة بتنفتح بس من اختصار الكيبورد.'] },
      { path: 'panel.corner', type: 'select',
        options: [['bottom-right', 'Bottom right', 'تحت يمين'], ['bottom-left', 'Bottom left', 'تحت يسار'],
                  ['top-right', 'Top right', 'فوق يمين'], ['top-left', 'Top left', 'فوق يسار']],
        en: ['Where the button sits', 'Move it if it covers something you need.'],
        ar: ['مكان الزر', 'حرّكه إذا كان بيغطي شي بتحتاجه.'] }
    ],
    summary: [
      { heading: true, en: 'Video summaries', ar: 'ملخصات الفيديو' },
      { path: 'summary.enabled', type: 'bool', en: ['Enable video summaries', 'Uses your Claude API key. Long videos can use up to 5 paid requests; limited coverage is labeled.'], ar: ['تفعيل ملخصات الفيديو', 'يستخدم مفتاح Claude API. قد يستخدم الفيديو الطويل حتى 5 طلبات مدفوعة، مع توضيح التغطية الجزئية.'] },
      { path: 'summary.apiKey', type: 'password', placeholder: 'sk-ant-...',
        en: ['Your Claude API key', 'Stored on this device only and sent straight to Anthropic. We never see it.'],
        ar: ['مفتاح Claude API تبعك', 'بينحفظ على هالجهاز بس وبينبعت مباشرة لأنثروبيك. إحنا ما منشوفه.'] },
      { path: 'summary.pageButton', type: 'bool',
        en: ['Add a Summarize button to the video page', ''], ar: ['إضافة زر تلخيص لصفحة الفيديو', ''] },
      { path: 'summary.model', type: 'select', options: [['claude-opus-5', 'Opus 5'], ['claude-sonnet-5', 'Sonnet 5'], ['claude-haiku-4-5', 'Haiku 4.5']],
        en: ['Model', 'Haiku is the cheapest; Opus reads long videos best.'], ar: ['الموديل', 'Haiku الأرخص، و Opus الأفضل للفيديوهات الطويلة.'] },
      { path: 'summary.language', type: 'select', options: [['auto', 'Match the video', 'بلغة الفيديو'], ['ar', 'Arabic', 'العربية'], ['en', 'English', 'الإنجليزية']],
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
        options: [['0', 'No limit', 'بلا حد'], ['5', '5 min', '٥ دقايق'], ['10', '10 min', '١٠ دقايق'], ['15', '15 min', '١٥ دقيقة'], ['30', '30 min', '٣٠ دقيقة'], ['60', '60 min', '٦٠ دقيقة']],
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
        en: ['Lock these settings', 'Asked for every time the popup opens. Stored as a salted hash, never as text.'],
        ar: ['قفل هالإعدادات', 'بتنطلب كل ما تفتح الإكستنشن. بتنحفظ كبصمة مملّحة، مش كنص.'] }
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
          summarize: ['Summarize the video', 'لخّص الفيديو'],
          bookmark: ['Bookmark this moment', 'علّم هاللحظة']
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

  /* What each surface is called. This lived in the settings page's own copy
     deck, which is why the popover could only guess at a name by reading the
     first group heading — and got "Speed" for the player and "The feed" for
     two different surfaces. A surface's name belongs to the surface. */
  const SURFACE_NAMES = {
    en: { shorts: 'Shorts', cards: 'Video cards', subscriptions: 'Subscriptions', header: 'Header', player: 'Player', layout: 'Layout', everywhere: 'Everywhere', watch: 'Watch page', home: 'Home', search: 'Search', sidebar: 'Sidebar', library: 'Library', channel: 'Channel', block: 'Blocking', summary: 'Summary', focus: 'Focus', modesty: 'Modesty', panel: 'Panel', keys: 'Shortcuts' },
    ar: { shorts: 'Shorts', cards: 'كروت الفيديو', subscriptions: 'الاشتراكات', header: 'رأس الصفحة', player: 'المشغّل', layout: 'التخطيط', everywhere: 'بكل الصفحات', watch: 'المشاهدة', home: 'الرئيسية', search: 'البحث', sidebar: 'الشريط الجانبي', library: 'المكتبة', channel: 'القناة', block: 'الحظر', summary: 'الملخص', focus: 'التركيز', modesty: 'الحشمة', panel: 'اللوحة', keys: 'الاختصارات' }
  };

  function surfaceName(key, lang) {
    const table = SURFACE_NAMES[lang] || SURFACE_NAMES.en;
    return table[key] || key;
  }

  root.CostumSpec = { SPEC, SURFACE_NAMES, surfaceName, optionLabel };
})(typeof self !== 'undefined' ? self : this);
