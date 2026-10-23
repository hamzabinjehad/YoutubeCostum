/* The toolbar popup. On macOS this is the main way in, so it carries the same
   controls as the in-page panel rather than being a shortcut to a settings
   page. Like the panel, it shows the switches for the page you are on.

   The exclusive choices — profile, speed — are segmented controls, and every
   page switch is a switch, so the state is readable at a glance instead of
   spelled out in a word beside each row. */
(function () {
  'use strict';
  const api = self.browser || self.chrome;
  const { read, write, replace, request } = self.CostumStore;
  const { applyProfile, merge } = self.CostumDefaults;
  const { SPEC, surfaceName: nameOfSurface, optionLabel } = self.CostumSpec;
  const Lock = self.CostumLock;

  /* Arabic counts by number: one and two have their own forms, three to ten
     take the plural, eleven and up the singular again. "10 نتيجة" is what
     you get from treating it like English. */
  const arCount = (n, one, two, few, many) => (n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? n + few : n + many);
  const arSettings = (n) => arCount(n, 'إعداد واحد', 'إعدادان', ' إعدادات', ' إعداد');

  const STR = {
    en: {
      profiles: 'Choose a mode', activeMode: 'Active mode', speed: 'Default speed', page: 'Page preferences',
      site: 'All of YouTube',
      /* How far a section reaches. One word, "page", was carrying three
         different promises. */
      scopeSite: 'All of YouTube', scopeEvery: 'Every video',
      scopeOf: { watch: 'Every watch page', home: 'Every home page', search: 'Every search page' },
      checking: 'Checking this page…',
      skipAds: 'Skip video ads', playback: 'Playback', off: 'off',
      catSite: 'All of YouTube', catPages: 'By page', catTools: 'Tools',
      results: (n) => n + (n === 1 ? ' result' : ' results'),
      customizeTitle: 'Customize',
      resetSurface: 'Reset', resetOne: 'Reset to default',
      resetSurfaceBody: (name, n) => 'Put ' + n + ' ' + name + ' ' + (n === 1 ? 'setting' : 'settings') + ' back to default?',
      surfaceReset: (name) => name + ' reset to default',
      changedHere: (n) => n + ' changed',
      onHere: 'On for this page', onGeneral: 'On', offState: 'Off',
      notAllowed: 'Not allowed on youtube.com yet',
      notAllowedSafari: 'Safari has not let Costum run on this site. Click the Costum icon in the address bar and choose "Always Allow on This Website", then reload YouTube.',
      notAllowedChrome: 'Costum is not allowed to run on YouTube yet. Open the Extensions menu, give Costum access to youtube.com, then reload YouTube.',
      notAllowedIphone: 'Safari has not let Costum run on this site (an "Allow for One Day" answer runs out after a day). Tap the Page Menu button in the address bar, tap Costum for YouTube, choose "Always Allow…", then reload YouTube.',
      notAllowedIpad: 'Safari has not let Costum run on this site (an "Allow for One Day" answer runs out after a day). Tap the Extensions button in the address bar, tap Costum for YouTube, choose "Always Allow…", then reload YouTube.',
      bridgeBlocked: 'On — but the player bridge was blocked, so speed, quality and captions will not work here.',
      undoHint: 'Tap again to put your own settings back',
      recommended: 'Recommended', study: 'Study', music: 'Music', evening: 'Evening',
      zen: 'Just the video', cinema: 'Cinema mode', shorts: 'Hide Shorts', comments: 'Hide comments',
      desktopOnly: 'Desktop YouTube only',
      deadHere: (n) => (n === 1 ? 'One switch is finding nothing on this page; YouTube may have changed it —' : n + ' switches are finding nothing on this page; YouTube may have changed them —'),
      related: 'Hide related videos', chat: 'Hide live chat', feed: 'Hide home feed',
      chips: 'Hide chip bar', suggest: 'Hide search suggestions',
      infinite: 'Stop infinite scroll', ads: 'Hide banner ads',
      locked: 'Locked', unlock: 'Unlock',
      lockedNote: 'These settings are password protected.', noTab: 'Open a YouTube tab for page controls',
      all: 'All settings', back: 'Back',
      searchPlaceholder: 'Search every setting', noHits: 'No setting by that name. Try a page — home, watch, sidebar — or what you want gone, like comments or Shorts.',
      auto: 'Default',
      rule: 'rule applied', rules: 'rules applied', badCss: 'nothing here parsed as CSS',
      pwOn: 'Password set', pwOff: 'No password',
      setPw: 'Set a password', removePw: 'Remove password',
      newPw: 'New password', confirmPw: 'Repeat it', currentPw: 'Current password',
      pwShort: 'At least four characters', pwMismatch: 'Those do not match',
      pwWrong: 'Wrong password', save: 'Save', cancel: 'Cancel',
      noKey: 'Not set', recordHint: 'Press the keys, or Esc to cancel',
      recording: 'Press a key…',
      blockedUntil: 'Blocked until ', unblock: 'Lift the block',
      min: 'min', hour: '1 h', hours2: '2 h',
      moreProfiles: 'Other modes', yours: 'Your settings',
      changed: 'Your changes', changedNone: 'Nothing changed yet',
      changedCount: (n) => n + (n === 1 ? ' setting' : ' settings'),
      personal: 'Personal settings', personalWhat: 'No preset is active',
      customize: 'Customize YouTube', customizeNote: 'All settings, modes and data',
      customizeBack: 'Control Center',
      countSpoken: (on, total) => (on
        ? on + ' of ' + total + ' settings on'
        : total + ' settings, none on'),
      profileWhat: {
        recommended: 'Hides Shorts, suggestions and end screens, stops the endless feed',
        study: 'All of that, plus comments and the home feed — and plays at 1.5×',
        music: 'Keeps comments and suggestions, evens out the volume',
        evening: 'Dims the picture, cinema mode, hides Shorts'
      },
      profileApplied: (name, n) => name + ' applied — ' + n + (n === 1 ? ' setting' : ' settings') + ' changed',
      profileCleared: (name) => name + ' undone — your own settings are back',
      exportLabel: 'Export', importLabel: 'Import', resetLabel: 'Reset all',
      resetBody: 'Every switch, slider and list goes back to the way it shipped. This cannot be undone.',
      resetGo: 'Reset', cancelLabel: 'Cancel',
      imported: 'Settings imported', wasReset: 'Everything reset',
      badFile: 'That file is not a Costum settings export',
      badFileNewer: 'This file was written by a newer Costum. Update Costum, then import it.',
      badFileValue: (path) => 'This file has an invalid value at "' + path + '". Nothing was imported.',
      importChanges: (n) => (n === 1 ? '1 setting will change' : n + ' settings will change'),
      importNothing: 'Nothing would change — this file matches your settings',
      importFrom: (when) => 'Exported ' + when,
      importSkipped: (n) => n + ' unknown ' + (n === 1 ? 'setting' : 'settings') + ' will be skipped',
      importKeyKept: 'Your API key stays as it is on this device.',
      importGo: 'Import',
      syncLocal: 'Stored in this browser only',
      syncCloud: 'iCloud sync',
      syncNever: 'not synced yet',
      syncAt: (when) => 'synced ' + when,
      syncPending: 'changes waiting to sync',
      syncNotSignedIn: 'sign in to iCloud on this device to sync',
      syncError: {
        'not-signed-in': 'not signed in to iCloud', 'too-large': 'settings too large for iCloud',
        'store-refused': 'iCloud refused the write', 'native-unavailable': 'the Costum app did not answer'
      },
      syncNow: 'Sync now', syncing: 'Syncing…', synced: 'Synced', syncFailed: 'Sync failed',
      syncReplaced: 'iCloud had newer settings; your unsent edits were kept under Restore',
      restore: 'Restore previous',
      restoreKinds: { beforeImport: 'Before the last import', beforeReset: 'Before the last reset', beforeSync: 'Your unsent edits, before sync replaced them' },
      restored: 'Previous settings restored',
      yourModes: 'Your modes', noModes: 'Save the way things are set now, and come back to it in one tap.',
      saveMode: 'Save current settings as a mode', modeName: 'Mode name', modeSaved: (name) => name + ' saved as a mode',
      modeActive: 'Active', modeWould: (n) => (n === 1 ? '1 setting would change' : n + ' settings would change'),
      modeSame: 'Matches your current settings', modeTools: 'Mode options',
      modePreviewLabel: 'Would change', modeRename: 'Rename', modeUpdate: 'Update to current settings', modeDuplicate: 'Duplicate', modeDelete: 'Delete',
      modeRenamed: 'Mode renamed', modeUpdated: (name) => name + ' updated', modeDeleted: (name) => name + ' deleted',
      modeApplied: (name, n) => name + ' applied — ' + n + (n === 1 ? ' setting' : ' settings') + ' changed', modeCleared: (name) => name + ' undone — your own settings are back',
      channels: 'Channel preferences', channelSpeed: (v) => v + '×', channelSound: 'sound', channelClutter: 'clutter',
      channelForget: 'Forget', channelForgotten: (name) => name + ' forgotten',
      bookmarks: 'Bookmarks', bookmarkSearch: 'Search bookmarks', bookmarksEmpty: 'Nothing saved yet. While watching, tap Bookmark in the Costum panel or press the shortcut.',
      bookmarksNoHits: 'No bookmark matches that.', bookmarksCount: (n, limit) => n + ' of ' + limit + ' bookmarks, stored in this browser only',
      bookmarkOpen: 'Open', bookmarkEdit: 'Edit note', bookmarkDelete: 'Delete', bookmarkNote: 'Note',
      bookmarksClearBody: 'Every bookmark and note goes. This cannot be undone.', bookmarksCleared: 'All bookmarks deleted',
      bookmarksImported: (r) => r.added + ' added' + (r.duplicates ? ', ' + r.duplicates + ' already there' : '') + (r.refused ? ', ' + r.refused + ' refused (library full)' : '') + (r.skipped ? ', ' + r.skipped + ' unreadable' : ''),
      badBookmarkFile: 'That file is not a Costum bookmark export', bookmarkSaved: 'Note saved', bookmarkDeleted: 'Bookmark deleted',
      summaries: 'Saved summaries', summaryOpen: 'Open video', summaryCopy: 'Copy', summaryDelete: 'Delete',
      summaryCopied: 'Copied with the video link', summaryDeleted: 'Summary deleted', summaryDetail: { brief: 'brief', detailed: 'detailed' }, summaryPartial: 'partial coverage'
    },
    ar: {
      profiles: 'اختيار وضع', activeMode: 'الوضع الحالي', speed: 'السرعة الافتراضية', page: 'تفضيلات الصفحة',
      site: 'كل يوتيوب',
      scopeSite: 'كل يوتيوب', scopeEvery: 'كل فيديو',
      scopeOf: { watch: 'كل صفحات المشاهدة', home: 'كل صفحات الرئيسية', search: 'كل صفحات البحث' },
      checking: 'عم نتأكد من هالصفحة…',
      skipAds: 'تخطي إعلانات الفيديو', playback: 'التشغيل', off: 'مطفي',
      catSite: 'كل يوتيوب', catPages: 'حسب الصفحة', catTools: 'أدوات',
      results: (n) => arCount(n, 'نتيجة واحدة', 'نتيجتان', ' نتائج', ' نتيجة'),
      customizeTitle: 'تخصيص',
      resetSurface: 'إرجاع', resetOne: 'إرجاع للأصل',
      resetSurfaceBody: (name, n) => 'ترجّع ' + arSettings(n) + ' من «' + name + '» للأصل؟',
      surfaceReset: (name) => 'رجع «' + name + '» للأصل',
      changedHere: (n) => arSettings(n) + (n >= 3 && n <= 10 ? ' متغيّرة' : ' متغيّر'),
      onHere: 'شغّال على هالصفحة', onGeneral: 'شغّال', offState: 'مطفي',
      notAllowed: 'لسه مش مسموح على youtube.com',
      notAllowedSafari: 'سفاري ما سمح لـCostum يشتغل على هالموقع. اضغط أيقونة Costum بشريط العنوان واختار «السماح دائماً على هذا الموقع»، بعدين أعد تحميل يوتيوب.',
      notAllowedChrome: 'لسّه Chrome ما سمح لـCostum يشتغل على YouTube. افتح قائمة الإضافات، واسمح لـCostum بالوصول إلى youtube.com، وبعدين أعد تحميل YouTube.',
      notAllowedIphone: 'سفاري ما سمح لـCostum يشتغل على هالموقع (جواب «السماح ليوم واحد» بيخلص بعد يوم). اضغط زر قائمة الصفحة بشريط العنوان، اضغط Costum for YouTube، اختار «السماح دائماً…»، بعدين أعد تحميل يوتيوب.',
      notAllowedIpad: 'سفاري ما سمح لـCostum يشتغل على هالموقع (جواب «السماح ليوم واحد» بيخلص بعد يوم). اضغط زر الإضافات بشريط العنوان، اضغط Costum for YouTube، اختار «السماح دائماً…»، بعدين أعد تحميل يوتيوب.',
      bridgeBlocked: 'شغّال — بس جسر المشغّل انحجب، فالسرعة والجودة والترجمة ما رح يشتغلوا هون.',
      undoHint: 'اضغط مرة تانية لترجيع إعداداتك',
      recommended: 'الموصى به', study: 'دراسة', music: 'موسيقى', evening: 'سهرة',
      zen: 'الفيديو بس', cinema: 'وضع السينما', shorts: 'إخفاء Shorts', comments: 'إخفاء التعليقات',
      desktopOnly: 'يوتيوب الكمبيوتر فقط',
      deadHere: (n) => arCount(n, 'في مفتاح ما عم يلاقي شي بهالصفحة، يمكن يوتيوب غيّره —', 'في مفتاحين ما عم يلاقوا شي بهالصفحة، يمكن يوتيوب غيّرهن —', ' مفاتيح ما عم تلاقي شي بهالصفحة، يمكن يوتيوب غيّرها —', ' مفتاح ما عم يلاقي شي بهالصفحة، يمكن يوتيوب غيّرها —'),
      related: 'إخفاء المقترحات', chat: 'إخفاء الشات المباشر', feed: 'إخفاء خلاصة الرئيسية',
      chips: 'إخفاء شريط الفئات', suggest: 'إخفاء اقتراحات البحث',
      infinite: 'إيقاف التمرير اللانهائي', ads: 'إخفاء بانرات الإعلانات',
      locked: 'مقفول', unlock: 'فتح',
      lockedNote: 'هالإعدادات محمية بكلمة سر.', noTab: 'افتح تبويب يوتيوب لتشوف تحكّمات الصفحة',
      all: 'كل الإعدادات', back: 'رجوع',
      searchPlaceholder: 'دوّر بكل الإعدادات', noHits: 'ما في إعداد بهالاسم. جرّب اسم صفحة — الرئيسية، المشاهدة، الشريط الجانبي — أو الشي اللي بدك تخفيه، متل التعليقات أو Shorts.',
      auto: 'تلقائي',
      rule: 'قاعدة مطبَّقة', rules: 'قواعد مطبَّقة', badCss: 'ما انقرأ شي كـCSS',
      pwOn: 'مضبوطة', pwOff: 'ما في',
      setPw: 'تعيين كلمة سر', removePw: 'إزالة كلمة السر',
      newPw: 'كلمة السر الجديدة', confirmPw: 'أعدها', currentPw: 'كلمة السر الحالية',
      pwShort: 'أربع خانات على الأقل', pwMismatch: 'ما بتطابقوا',
      pwWrong: 'كلمة السر غلط', save: 'حفظ', cancel: 'إلغاء',
      noKey: 'ما في', recordHint: 'اضغط الأزرار، أو Esc للإلغاء',
      recording: 'اضغط زر…',
      blockedUntil: 'محظور لحد ', unblock: 'رفع الحظر',
      min: 'دقيقة', hour: 'ساعة', hours2: 'ساعتين',
      moreProfiles: 'أوضاع تانية', yours: 'إعداداتك',
      changed: 'تغييراتك', changedNone: 'لسه ما غيّرت إشي',
      changedCount: (n) => arSettings(n),
      personal: 'إعداداتك الشخصية', personalWhat: 'ما في وضع جاهز شغّال',
      customize: 'تخصيص YouTube', customizeNote: 'كل الإعدادات والأوضاع والبيانات',
      customizeBack: 'مركز التحكّم',
      countSpoken: (on, total) => (on
        ? on + ' من ' + total + ' إعداد مفعّل'
        : total + ' إعداد، ولا واحد مفعّل'),
      profileWhat: {
        recommended: 'بيخفي Shorts والمقترحات وشاشات النهاية، وبيوقف الخلاصة اللانهائية',
        study: 'هاد كله، زائد التعليقات وخلاصة الرئيسية — وبيشغّل على ١.٥×',
        music: 'بيخلّي التعليقات والمقترحات، وبيوحّد مستوى الصوت',
        evening: 'بيخفّف السطوع، وضع السينما، وبيخفي Shorts'
      },
      profileApplied: (name, n) => 'انطبق ' + name + ' — ' + arSettings(n) + (n >= 3 && n <= 10 ? ' تغيّرت' : ' تغيّر'),
      profileCleared: (name) => 'انلغى ' + name + ' — رجعت إعداداتك',
      exportLabel: 'تصدير', importLabel: 'استيراد', resetLabel: 'إرجاع الكل',
      resetBody: 'كل مفتاح وسلايدر وقائمة بترجع مثل ما إجت. ما في تراجع عن هالخطوة.',
      resetGo: 'إرجاع', cancelLabel: 'إلغاء',
      imported: 'انستوردت الإعدادات', wasReset: 'رجع كل شي للأصل',
      badFile: 'هاد الملف مش ملف إعدادات مصدّر من Costum',
      badFileNewer: 'هالملف مكتوب بنسخة أحدث من Costum. حدّث Costum وبعدين استورده.',
      badFileValue: (path) => 'بالملف قيمة غير صالحة عند «' + path + '». ما انستورد شي.',
      importChanges: (n) => 'رح يتغيّر ' + arSettings(n),
      importNothing: 'ما رح يتغيّر شي — الملف مطابق لإعداداتك',
      importFrom: (when) => 'مصدّر ' + when,
      importSkipped: (n) => 'رح يتم تجاهل ' + n + ' إعداد غير معروف',
      importKeyKept: 'مفتاح API بيضل متل ما هو على هالجهاز.',
      importGo: 'استيراد',
      syncLocal: 'محفوظة بهالمتصفح بس',
      syncCloud: 'مزامنة iCloud',
      syncNever: 'لسه ما تزامنت',
      syncAt: (when) => 'تزامنت ' + when,
      syncPending: 'في تغييرات بانتظار المزامنة',
      syncNotSignedIn: 'سجّل دخول iCloud على هالجهاز للمزامنة',
      syncError: {
        'not-signed-in': 'مش مسجّل دخول بـiCloud', 'too-large': 'الإعدادات أكبر من حد iCloud',
        'store-refused': 'iCloud رفض الكتابة', 'native-unavailable': 'تطبيق Costum ما ردّ'
      },
      syncNow: 'زامن هلأ', syncing: 'عم يزامن…', synced: 'تزامنت', syncFailed: 'فشلت المزامنة',
      syncReplaced: 'كان بـiCloud إعدادات أحدث؛ تعديلاتك غير المرسلة محفوظة تحت «استرجاع»',
      restore: 'استرجاع السابق',
      restoreKinds: { beforeImport: 'قبل آخر استيراد', beforeReset: 'قبل آخر إرجاع', beforeSync: 'تعديلاتك غير المرسلة قبل ما بدّلتها المزامنة' },
      restored: 'رجعت الإعدادات السابقة',
      yourModes: 'أوضاعك', noModes: 'احفظ الإعدادات متل ما هي هلأ، وارجعلها بضغطة وحدة.',
      saveMode: 'حفظ الإعدادات الحالية كوضع', modeName: 'اسم الوضع', modeSaved: (name) => 'انحفظ ' + name + ' كوضع',
      modeActive: 'شغّال', modeWould: (n) => 'رح يتغيّر ' + arSettings(n),
      modeSame: 'مطابق لإعداداتك الحالية', modeTools: 'خيارات الوضع',
      modePreviewLabel: 'رح يتغيّر', modeRename: 'إعادة تسمية', modeUpdate: 'تحديث للإعدادات الحالية', modeDuplicate: 'نسخ', modeDelete: 'حذف',
      modeRenamed: 'اتغيّر الاسم', modeUpdated: (name) => 'اتحدّث ' + name, modeDeleted: (name) => 'انحذف ' + name,
      modeApplied: (name, n) => 'انطبق ' + name + ' — ' + arSettings(n) + (n >= 3 && n <= 10 ? ' تغيّرت' : ' تغيّر'), modeCleared: (name) => 'انلغى ' + name + ' — رجعت إعداداتك',
      channels: 'تفضيلات القنوات', channelSpeed: (v) => v + '×', channelSound: 'الصوت', channelClutter: 'الترتيب',
      channelForget: 'انسى', channelForgotten: (name) => 'انتسيت ' + name,
      bookmarks: 'العلامات', bookmarkSearch: 'دوّر بالعلامات', bookmarksEmpty: 'لسه ما في شي محفوظ. وقت المشاهدة، اضغط «علامة» بلوحة Costum أو الاختصار.',
      bookmarksNoHits: 'ما في علامة بتطابق.', bookmarksCount: (n, limit) => n + ' من ' + limit + ' علامة، محفوظة بهالمتصفح بس',
      bookmarkOpen: 'افتح', bookmarkEdit: 'عدّل الملاحظة', bookmarkDelete: 'حذف', bookmarkNote: 'ملاحظة',
      bookmarksClearBody: 'كل العلامات والملاحظات بتروح. ما في تراجع.', bookmarksCleared: 'انحذفت كل العلامات',
      bookmarksImported: (r) => 'انضاف ' + r.added + (r.duplicates ? '، ' + r.duplicates + ' موجودة أصلاً' : '') + (r.refused ? '، ' + r.refused + ' مرفوضة (المكتبة ممتلية)' : '') + (r.skipped ? '، ' + r.skipped + ' غير مقروءة' : ''),
      badBookmarkFile: 'هاد الملف مش ملف علامات مصدّر من Costum', bookmarkSaved: 'انحفظت الملاحظة', bookmarkDeleted: 'انحذفت العلامة',
      summaries: 'الملخصات المحفوظة', summaryOpen: 'افتح الفيديو', summaryCopy: 'نسخ', summaryDelete: 'حذف',
      summaryCopied: 'انتسخ مع رابط الفيديو', summaryDeleted: 'انحذف الملخص', summaryDetail: { brief: 'موجز', detailed: 'مفصّل' }, summaryPartial: 'تغطية جزئية'
    }
  };

  let settings = null;
  let lang = 'en';
  let drill = null;      // which surface is open, or null for the root list
  /* Which groups the reader has opened. Held here rather than read back off the
     DOM because a save rebuilds the pane, and a fold that reopens on every
     toggle is worse than no fold at all. */
  let openGroups = new Set();
  let query = '';        // search text, which cuts across every surface
  let lastScroll = 0;    // where the root list was, so back returns there
  let pathname = null;   // of the active YouTube tab, if there is one
  /* m.youtube.com: what an iPhone is served. Switches written against the
     desktop page do nothing there, so they are not offered on this tab. */
  let mobile = false;
  /* The popup has two useful jobs: an immediate Control Center and the full
     Customize workspace. A drilled settings surface sits above whichever one
     opened it, so Back has a truthful destination. */
  let workspace = 'control';

  const L = () => STR[lang] || STR.en;

  /* The extension follows Safari's `browser` namespace and Chrome's `chrome`
   * namespace, but the browser chrome around an extension is still different.
   * In particular, Safari's address-bar permission instruction is a dead end
   * in Chrome and Edge, where site access lives in the Extensions menu. */
  const isChromeFamily = () => (api === self.chrome && api !== self.browser)
    || /(?:chrome|chromium|crios|edg)\//i.test(navigator.userAgent || '');
  /* Safari puts the site permission in a different place on each device:
     the toolbar icon on a Mac, the Page Menu on an iPhone, the Extensions
     button on an iPad (whose Safari reports a Mac user agent, but has touch). */
  const safariDevice = () => {
    const ua = navigator.userAgent;
    if (/iPhone|iPod/.test(ua)) return 'iphone';
    if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ipad';
    return 'mac';
  };
  const sitePermissionHelp = () => (isChromeFamily() ? L().notAllowedChrome
    : safariDevice() === 'iphone' ? L().notAllowedIphone
      : safariDevice() === 'ipad' ? L().notAllowedIpad
        : L().notAllowedSafari);

  let alive = null;      // what the content script said when asked, or null
  let checking = false;  // the ping is still out; the state line says so
  let modeOpen = false;  // the mode picker under the Active mode row
  let controlScroll = 0; // where the Control Center was, so closing Customize returns there

  /* The YouTube tab in front, if there is one. The ping that asks whether the
     content script is alive is separate: it can take a second to time out, and
     the popover used to draw nothing at all until it had — a blank pane for
     the one case where the reader most needs to be told what is wrong. */
  async function activeTab() {
    try {
      const tabs = await api.tabs.query({ active: true, currentWindow: true });
      const tab = tabs && tabs[0];
      const url = tab && tab.url;
      if (!url || !/^https?:\/\/[^/]*youtube\.com/.test(url)) return null;
      return tab;
    } catch (e) {
      return null;   // no tabs permission, or nothing to read
    }
  }

  /* Is the content script actually running in that tab? Nothing else the
     popover knows can answer this: the switch being on and the tab being on
     youtube.com are both true on a site Safari has not allowed yet, and on that
     site nothing works. A reply within a second is the only evidence. */
  function ping(tabId) {
    return new Promise((resolve) => {
      const done = (v) => { clearTimeout(timer); resolve(v); };
      const timer = setTimeout(() => done(false), 1000);
      try {
        const p = api.tabs.sendMessage(tabId, { type: 'ping' });
        if (p && p.then) p.then((r) => done(r && r.alive ? r : false), () => done(false));
      } catch (e) { done(false); }
    });
  }

  function el(tag, attrs, kids) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'text') node.textContent = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined) node.setAttribute(k, v);
    });
    (kids || []).forEach((kid) => kid && node.appendChild(kid));
    return node;
  }

  /* One segment of a segmented control. Pressing the selected one again is a
     way back out — that is how the profile row clears itself. */
  function segment(label, pressed, onClick, hint) {
    return el('button', {
      class: 'segment', type: 'button', text: label,
      'aria-pressed': String(!!pressed),
      title: pressed && hint ? hint : null,
      onclick: onClick
    });
  }

  /* The tick on a chosen row. Drawn, not a character: a glyph from the font
     changes weight with the face. */
  function tick() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('class', 'tick');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M3 8.5l3.2 3.2L13 5');
    svg.appendChild(path);
    return svg;
  }

  /* Same page-scoped idea as the panel: only show what applies here. */
  function pageRows() {
    const s = settings;
    const d = s.declutter;
    const t = L();
    /* “This page” only carries effects that are genuinely contextual. Global
       preferences live in Customize; mixing them here made “this page” a
       promise the switches did not keep. */
    if (pathname === null) return [];
    const groups = self.CostumCss.currentPages(pathname);
    const rows = [];

    // A switch that cannot act on this tab's page is not offered here.
    const add = (path, label, on, patch) => {
      if (self.CostumCss.worksOn(path, mobile)) rows.push({ label, on, patch });
    };

    if (groups.includes('watch')) {
      add('layout.zen', t.zen, s.layout.zen, { layout: { zen: !s.layout.zen } });
      add('layout.cinema', t.cinema, s.layout.cinema, { layout: { cinema: !s.layout.cinema } });
      add('declutter.watch.comments', t.comments, d.watch.comments, { declutter: { watch: { comments: !d.watch.comments } } });
    }
    if (groups.includes('home')) {
      add('declutter.home.feed', t.feed, d.home.feed, { declutter: { home: { feed: !d.home.feed } } });
      add('declutter.home.chips', t.chips, d.home.chips, { declutter: { home: { chips: !d.home.chips } } });
    }
    if (groups.includes('search')) {
      add('declutter.search.suggestions', t.suggest, d.search.suggestions, { declutter: { search: { suggestions: !d.search.suggestions } } });
    }

    return rows;
  }

  /* The page a viewer is on, as the settings model names it, for the scope
     caption over the page rows. */
  function pageKind() {
    if (pathname === null) return null;
    const groups = self.CostumCss.currentPages(pathname);
    return ['watch', 'home', 'search'].find((key) => groups.includes(key)) || null;
  }

  /* The three distraction controls people reach for wherever they are. They
     change all of YouTube, and the section heading says so. */
  function siteRows() {
    const s = settings;
    const d = s.declutter;
    const t = L();
    return [
      { label: t.shorts, on: d.shorts === 'hide', patch: { declutter: { shorts: d.shorts === 'hide' ? 'show' : 'hide' } } },
      { label: t.infinite, on: d.global.infiniteScroll, patch: { declutter: { global: { infiniteScroll: !d.global.infiniteScroll } } } }
    ];
  }

  /* Playback is every video from now on: the default speed and whether ads
     are skipped, the same pair the panel groups under the same caption. */
  function playbackRows() {
    const s = settings;
    const t = L();
    return [
      { label: t.skipAds, on: s.playback.skipAds, patch: { playback: { skipAds: !s.playback.skipAds } } }
    ];
  }


  const at = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const patchOf = (path, value) => path.split('.').reverse().reduce((acc, k) => ({ [k]: acc }), value);
  const labelOf = (field) => (field[lang] || field.en);

  async function save(path, value) {
    try { settings = await write(patchOf(path, value)); render(); }
    catch (e) {
      const status = document.querySelector('[role="status"]');
      if (status) status.textContent = lang === 'ar' ? 'تعذّر حفظ الإعداد. حاول مجدداً.' : 'Could not save the setting. Please try again.';
    }
  }

  /* The popover carries the controls people reach for. A handful of settings —
     the CSS box, a keyboard shortcut capture, the password, the timed block —
     need room or a keyboard, and those say so and hand over rather than being
     squeezed into a 320px column badly. */
  /* Everything the spec can declare. There is no "open the full page for this
     one" left: a popover that hands eleven of its settings to somewhere else is
     not the place you manage the extension from, it is a shortcut to it. */
  const HANDLED = new Set(['bool', 'select', 'ticks', 'range', 'text', 'password',
    'time', 'numbers', 'list', 'css', 'checks', 'lock', 'key', 'blockNow']);

  /* Label on its own line, control full width beneath it. At 340px a text box
     or a textarea beside a label leaves neither of them usable. */
  function stacked(title, hint, ...controls) {
    return el('div', { class: 'stack-row' },
      [el('div', { class: 'row-head' }, [el('span', { class: 'row-label', text: title })]),
        hint ? el('small', { class: 'row-note', text: hint }) : null,
        ...controls]);
  }

  /* Blocking YouTube for a while: four spans while it is off, and while it is
     running, when it lifts and a way out. The row moved here with the settings
     page; without it the setting drew as a dead label, because the contract
     check's regex could not see a camelCase type name and reported a renderer
     that did not exist. */
  function blockRow(field, title, value) {
    const until = Number(value) || 0;
    const running = until > Date.now();
    const head = el('div', { class: 'row-head' },
      [el('span', { class: 'row-label', text: title })]);

    if (running) {
      const when = el('span', { class: 'row-value',
        text: L().blockedUntil + new Date(until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      head.appendChild(when);
      const lift = el('button', { type: 'button', class: 'btn', text: L().unblock });
      lift.addEventListener('click', () => save(field.path, 0));
      return el('div', { class: 'stack-row' }, [head, lift]);
    }

    const spans = el('div', { class: 'segmented' },
      [[15, '15 ' + L().min], [30, '30 ' + L().min], [60, L().hour], [120, L().hours2]]
        .map(([minutes, label]) => segment(label, false,
          () => save(field.path, Date.now() + minutes * 60000))));
    return el('div', { class: 'stack-row' }, [head, spans]);
  }

  /* The settings password, set and removed in place. The full page opens a
     modal for this; a 340px popover has nowhere to put one, and the fields can
     simply appear under the button that asked for them. */
  function lockRow(field, title, value) {
    const state = el('span', { class: 'row-value', text: value ? L().pwOn : L().pwOff });
    const button = el('button', { type: 'button', class: 'btn',
      text: value ? L().removePw : L().setPw });
    const form = el('div', { class: 'inline-form', hidden: '' });
    const error = el('small', { class: 'row-note danger' });
    const row = el('div', { class: 'stack-row' }, [
      el('div', { class: 'row-head' },
        [el('span', { class: 'row-label', text: title }), state]),
      button, form, error
    ]);

    button.addEventListener('click', () => {
      if (!form.hidden) { form.hidden = true; error.textContent = ''; return; }
      form.textContent = '';
      error.textContent = '';
      const first = el('input', { type: 'password', placeholder: value ? L().currentPw : L().newPw });
      const second = value ? null : el('input', { type: 'password', placeholder: L().confirmPw });
      const go = el('button', { type: 'button', class: 'btn filled', text: L().save });
      form.append(first, ...(second ? [second] : []), go);
      form.hidden = false;
      first.focus();

      const submit = async () => {
        error.textContent = '';
        if (value) {
          if (!await Lock.verify(first.value, value)) { error.textContent = L().pwWrong; return; }
          await save(field.path, '');
        } else {
          if (first.value.length < 4) { error.textContent = L().pwShort; return; }
          if (first.value !== second.value) { error.textContent = L().pwMismatch; return; }
          await save(field.path, await Lock.make(first.value));
        }
        form.hidden = true;
      };
      go.addEventListener('click', submit);
      [first, second].forEach((input) => input && input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); submit(); }
      }));
    });
    return row;
  }

  /* A key cap rather than a text box: storage keeps the raw KeyboardEvent code
     because that is what matching a keypress needs, and nobody has to read it. */
  function keyRow(field, title, hint, value) {
    const cap = el('button', { type: 'button', class: 'keycap' });
    const paint = (combo) => {
      const label = self.CostumDefaults.formatShortcut(combo);
      cap.textContent = label || L().noKey;
      cap.classList.toggle('unset', !label);
      cap.setAttribute('aria-label', title + ': ' + (label || L().noKey) + '. ' + L().recordHint);
    };
    paint(value);

    const stop = () => {
      cap.removeAttribute('data-recording');
      document.removeEventListener('keydown', record, true);
      paint(at(settings, field.path));
    };
    function record(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (ev.key === 'Escape') { stop(); return; }
      if (['Shift', 'Control', 'Alt', 'Meta'].indexOf(ev.key) !== -1) return;
      const combo = (ev.ctrlKey ? 'Ctrl+' : '') + (ev.altKey ? 'Alt+' : '')
        + (ev.shiftKey ? 'Shift+' : '') + (ev.metaKey ? 'Meta+' : '') + ev.code;
      stop();
      save(field.path, combo);
    }
    cap.addEventListener('click', () => {
      if (cap.hasAttribute('data-recording')) { stop(); return; }
      cap.setAttribute('data-recording', '');
      cap.textContent = L().recording;
      document.addEventListener('keydown', record, true);
    });
    return stacked(title, hint, cap);
  }

  /* Every setting draws with the explanation the spec wrote for it. The
     second string in each label was being thrown away here, so a switch named
     "Prefer H.264 over VP9/AV1" had to be guessed at. */
  /* On mobile YouTube a switch that only the desktop page has stays in
     Customize (it still syncs to the Mac and iPad) but says so, rather than
     looking like it works here. */
  function desktopNote(path) {
    if (self.CostumCss.worksOn(path, mobile)) return null;
    return el('small', { class: 'row-note', text: L().desktopOnly });
  }

  function fieldRow(field) {
    const row = fieldControl(field);
    const note = desktopNote(field.path);
    if (note && row) {
      if (row.classList.contains('stack-row')) row.querySelector('.row-head').after(note);
      else if (row.querySelector('.row-label')) row.querySelector('.row-label').appendChild(note);
    }
    return row;
  }

  function fieldControl(field) {
    const [title, hint] = labelOf(field);
    const value = at(settings, field.path);

    /* HANDLED covers every type the spec uses and a test holds it that way, so
       this is only reachable by adding a type and forgetting the renderer. It
       draws the setting as plainly unavailable rather than as a working row
       that quietly does nothing — there is no other page to send it to. */
    if (!HANDLED.has(field.type)) {
      return el('div', { class: 'list-row' }, [
        el('span', { class: 'row-label' }, [el('span', { text: title })]),
        el('span', { class: 'row-value', text: field.type })
      ]);
    }

    if (field.type === 'bool') {
      const on = field.invert ? !value : !!value;
      const row = el('div', {
        class: 'list-row', role: 'button', tabindex: '0', 'aria-pressed': String(on),
        'data-control-id': 'field:' + field.path
      }, [
        el('span', { class: 'row-label' }, [
          el('span', { text: title }),
          hint ? el('small', { text: hint }) : null
        ]),
        el('span', { class: 'sw-track', 'aria-hidden': 'true' })
      ]);
      const fire = () => save(field.path, field.invert ? on : !on);
      row.addEventListener('click', fire);
      row.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); fire(); }
      });
      return row;
    }

    if (field.type === 'select') {
      const control = el('div', { class: 'segmented' },
        field.options.map((option) => segment(
          optionLabel(option, lang),
          field.numeric ? Number(option[0]) === Number(value) : option[0] === value,
          () => save(field.path, field.numeric ? Number(option[0]) : option[0])
        )));
      // Whether it shares a line with the label is a question about how wide
      // the labels are, which only the layout can answer — so the row wraps
      // and the CSS decides. Counting the options was a guess, and it was
      // wrong at three and at two.
      return el('div', { class: 'list-row' }, [
        el('span', { class: 'row-label' }, [
          el('span', { text: title }),
          hint ? el('small', { text: hint }) : null
        ]),
        control
      ]);
    }

    /* ---- typed values: a line, a list, a time, a stylesheet ---- */
    if (field.type === 'text' || field.type === 'password' || field.type === 'time') {
      const input = el('input', { type: field.type, value: value || '' });
      if (field.placeholder) input.placeholder = field.placeholder;
      input.addEventListener('input', () => input.setCustomValidity(''));
      input.addEventListener('change', () => {
        if (field.path === 'block.regex' && input.value.trim()) {
          try { new RegExp(input.value.trim(), 'i'); }
          catch (e) {
            input.setCustomValidity(lang === 'ar' ? 'التعبير النمطي غير صالح' : 'Enter a valid regular expression');
            input.reportValidity();
            return;
          }
        }
        save(field.path, input.value.trim());
      });
      return stacked(title, hint, input);
    }

    if (field.type === 'numbers') {
      // One line you can read back, rather than a column of separate boxes.
      const input = el('input', { type: 'text', value: (value || []).join(', ') });
      if (field.placeholder) input.placeholder = field.placeholder;
      input.addEventListener('change', () => {
        const clean = self.CostumFields.parseNumbers(input.value, field.min, field.max);
        // Refusing an empty result is what stops a typo from removing the
        // panel's speed control altogether.
        if (!clean) { input.value = (at(settings, field.path) || []).join(', '); return; }
        input.value = clean.join(', ');
        save(field.path, clean);
      });
      return stacked(title, hint, input);
    }

    if (field.type === 'list') {
      const area = el('textarea', { rows: '4' });
      area.value = (value || []).join('\n');
      if (field.placeholder) area.placeholder = field.placeholder;
      area.addEventListener('change',
        () => save(field.path, self.CostumFields.splitLines(area.value)));
      return stacked(title, hint, area);
    }

    if (field.type === 'css') {
      const area = el('textarea', { rows: '5', spellcheck: 'false', class: 'code' });
      area.value = value || '';
      if (field.placeholder) area.placeholder = field.placeholder;
      const status = el('small', { class: 'row-note' });
      area.addEventListener('change', () => {
        const rules = self.CostumFields.cssRuleCount(area.value);
        status.textContent = rules === null ? ''
          : (rules ? rules + ' ' + (rules === 1 ? L().rule : L().rules) : L().badCss);
        save(field.path, area.value);
      });
      return stacked(title, hint, area, status);
    }

    if (field.type === 'checks') {
      // Independent choices stored as one array.
      const chosen = new Set(value || []);
      const box = el('div', { class: 'check-list' });
      field.options.forEach(([key, label]) => {
        const input = el('input', { type: 'checkbox' });
        input.checked = chosen.has(key);
        input.addEventListener('change', () => {
          if (input.checked) chosen.add(key); else chosen.delete(key);
          // Spec order, not click order, so the stored value does not churn.
          save(field.path, field.options.map(([k]) => k).filter((k) => chosen.has(k)));
        });
        const item = el('label', { class: 'check' }, [input, el('span', { text: label })]);
        box.appendChild(item);
      });
      return stacked(title, hint, box);
    }

    if (field.type === 'blockNow') return blockRow(field, title, value);
    if (field.type === 'lock') return lockRow(field, title, value);
    if (field.type === 'key') return keyRow(field, title, hint, value);

    // range and ticks. The readout doubles as the way back: once the value
    // differs from the default it becomes a button that puts it back, the same
    // affordance the in-page panel gives its sliders.
    const fallback = Number(at(self.CostumDefaults.withDefaults({}), field.path));
    const out = el('button', { class: 'row-value', type: 'button', 'data-control-id': 'reset:' + field.path });
    const min = field.min;
    const max = field.max;
    const step = field.type === 'ticks' ? 1 : field.step;
    const format = (v) => (field.type === 'ticks'
      ? (Number(v) === 0 ? L().auto : String(v))
      : (field.fmt ? field.fmt(Number(v), L()) : String(v)));
    const input = el('input', { type: 'range', min, max, step, value: Number(value), 'aria-label': title,
      'data-control-id': 'range:' + field.path });
    const show = (v) => {
      const changed = Number(v) !== fallback;
      out.textContent = format(v);
      out.toggleAttribute('data-modified', changed);
      // Until the value has moved there is nothing to press; the readout is
      // then only what the slider says, and the slider says it itself.
      out.disabled = !changed;
      out.setAttribute('aria-hidden', String(!changed));
      out.setAttribute('aria-label', L().resetOne + ' (' + format(fallback) + ')');
      // The slider speaks its formatted value, not the raw number: "1.5×" and
      // "off", not "1.5" and "0".
      input.setAttribute('aria-valuetext', format(v));
    };
    show(Number(value));
    input.addEventListener('input', () => show(Number(input.value)));
    input.addEventListener('change', () => save(field.path, Number(input.value)));
    out.addEventListener('click', () => { if (Number(input.value) !== fallback) save(field.path, fallback); });
    return el('div', { class: 'stack-row' }, [
      el('div', { class: 'row-head' }, [el('span', { class: 'row-label', text: title }), out]),
      hint ? el('small', { class: 'row-note', text: hint }) : null,
      input
    ]);
  }

  /* The catalogue by reach. Anything the spec adds later and this list does
     not name lands under Tools rather than disappearing. */
  const CATEGORIES = [
    ['catSite', ['player', 'layout', 'cards', 'header', 'sidebar', 'everywhere']],
    ['catPages', ['watch', 'home', 'search', 'subscriptions', 'library', 'channel', 'shorts']],
    ['catTools', ['block', 'focus', 'summary', 'keys', 'modesty', 'panel']]
  ];

  /* The surfaces, in the order they are read down the list. */
  function surfaceKeys() {
    const ORDER = ['player', 'watch', 'home', 'search', 'subscriptions', 'cards',
                   'shorts', 'header', 'sidebar', 'library', 'channel', 'everywhere',
                   'layout', 'block', 'focus', 'summary', 'keys'];
    return Object.keys(SPEC).sort((a, b) => {
      const ai = ORDER.indexOf(a), bi = ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }

  /* How many of a group's switches are on. The settings page puts this beside
     every group; without it you had to read all forty rows of a surface to see
     where anything was set. */
  function groupState(spec, from) {
    let on = 0;
    let total = 0;
    for (let i = from; i < spec.length; i++) {
      if (spec[i].heading) break;
      if (spec[i].type !== 'bool') continue;
      total += 1;
      const value = at(settings, spec[i].path);
      if (spec[i].invert ? !value : !!value) on += 1;
    }
    return { on, total };
  }

  function renderDrill() {
    const t = L();
    const spec = SPEC[drill] || [];
    const heading = document.getElementById('drill-title');
    heading.textContent = '';
    heading.append(self.CostumIcons.tile(drill), document.createTextNode(surfaceName(drill)));
    document.getElementById('back-label').textContent = t.back;

    /* One way back for the whole surface, offered only when something on it
       has moved. The count is in the accessible name and in the question it
       asks before acting; the button itself stays one word. */
    const changedHere = changedSettings().filter((c) => c.key === drill);
    const reset = document.getElementById('drill-reset');
    reset.hidden = !changedHere.length;
    reset.textContent = t.resetSurface;
    reset.setAttribute('aria-label', t.resetSurface + ' — ' + surfaceName(drill) + ', ' + t.changedHere(changedHere.length));
    document.getElementById('drill-reset-body').textContent = t.resetSurfaceBody(surfaceName(drill), changedHere.length);
    document.getElementById('drill-reset-go').textContent = t.resetGo;
    document.getElementById('drill-reset-cancel').textContent = t.cancelLabel;
    if (!changedHere.length) document.getElementById('drill-reset-confirm').hidden = true;

    const body = document.getElementById('drill-body');
    body.textContent = '';

    /* Groups fold. The Watch page carries forty settings in six groups and ran
       to five and a third screens of scrolling; folded, the whole surface is a
       list of six names you can read at once. A group holding anything you have
       switched on opens by itself, so folding never hides your own state —
       the same rule the profile disclosure follows. Which are open survives a
       save, because every toggle re-renders this whole pane. */
    let list = null;
    let group = null;
    spec.forEach((field) => {
      if (field.heading) {
        const state = groupState(spec, spec.indexOf(field) + 1);
        const summary = el('summary', { class: 'group-title' }, [
          el('span', { text: labelOf(field) })
        ]);
        if (state.total) {
          const count = el('span', { class: 'group-count',
            text: state.on + ' / ' + state.total,
            'aria-label': L().countSpoken(state.on, state.total) });
          if (state.on) count.setAttribute('data-on', '');
          summary.appendChild(count);
        }
        summary.appendChild(el('span', { class: 'chev', 'aria-hidden': 'true' }));

        const key = drill + ':' + labelOf(field);
        group = el('details', { class: 'group' });
        group.dataset.groupKey = key;
        group.open = openGroups.has(key) || (!openGroups.size && state.on > 0);
        group.addEventListener('toggle', () => {
          if (group.open) openGroups.add(key); else openGroups.delete(key);
        });
        list = el('div', { class: 'list' });
        group.append(summary, list);
        body.appendChild(group);
        return;
      }
      if (!group) {
        // Settings before the first heading belong to no group and stay out.
        if (!list) { list = el('div', { class: 'list' }); body.appendChild(list); }
      }
      list.appendChild(fieldRow(field));
    });
  }

  const surfaceName = (key) => nameOfSurface(key, lang);

  /* Customize opens at its top. It inherited the Control Center's scroll
     position for a while, so a reader who had scrolled down to press the
     Customize row arrived with the way back already off the top of the pane. */
  function openCustomize() {
    const box = document.getElementById('scroll');
    controlScroll = box ? box.scrollTop : 0;
    workspace = 'customize';
    query = '';
    render();
    if (box) box.scrollTop = 0;
    loadBookmarks();
    loadSummaries();
    // With a mouse, typing is the fastest way in. On a touch screen, focusing
    // the field raises the keyboard over half the list the moment Customize
    // opens, so focus lands on the view's title instead: no keyboard, and a
    // screen reader still arrives at the top of the new view rather than
    // nowhere. Not the back button: on iPad that drew a focus ring around it
    // every time Customize opened.
    const search = document.getElementById('search');
    const target = matchMedia('(pointer: fine)').matches ? search : document.getElementById('customize-title');
    if (target) target.focus({ preventScroll: true });
  }

  function closeCustomize() {
    workspace = 'control';
    query = '';
    render();
    const box = document.getElementById('scroll');
    if (box) box.scrollTop = controlScroll;
    const opener = document.getElementById('open-customize');
    if (opener) opener.focus({ preventScroll: true });
  }


  /* How many of a surface's switches are on. The settings page shows this per
     group; without it the list of nineteen surfaces gives no clue which ones
     you have already touched. */
  function surfaceState(key) {
    let on = 0;
    let total = 0;
    (SPEC[key] || []).forEach((field) => {
      if (field.heading || field.type !== 'bool') return;
      total += 1;
      const value = at(settings, field.path);
      if (field.invert ? !value : !!value) on += 1;
    });
    return { on, total };
  }

  /* Every setting that is not where it shipped, across all nineteen surfaces.
     The counts answer "how many"; until this there was no way to ask "which"
     except to open each surface and read it. Compared against the defaults
     rather than against a list of what was touched, so a setting turned on and
     back off again correctly does not appear. */
  function changedSettings() {
    const base = self.CostumDefaults.withDefaults({});
    const out = [];
    surfaceKeys().forEach((key) => {
      (SPEC[key] || []).forEach((field) => {
        if (field.heading || !field.path) return;
        const now = at(settings, field.path);
        const was = at(base, field.path);
        if (JSON.stringify(now) === JSON.stringify(was)) return;
        out.push({ key, field, now });
      });
    });
    return out;
  }

  /* Matching at word starts, the same rule the settings page uses: anywhere in
     the word turns "ad" into hits on "instead" and "already". */
  function matcher(text) {
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      const re = new RegExp('(^|[^\\p{L}\\p{N}])' + escaped, 'iu');
      return (hay) => re.test(hay);
    } catch (e) {
      return (hay) => hay.includes(text);
    }
  }

  /* A hit remembers the group it sits in, so "comments" finds every setting
     under the Comments heading — not only the ones with the word in their own
     name — and the result can say "Watch page · Comments" rather than leaving
     the reader to guess which of forty rows it was. */
  function searchHits(text) {
    const matches = matcher(text.trim().toLowerCase());
    const hits = [];
    Object.keys(SPEC).forEach((key) => {
      let group = '';
      (SPEC[key] || []).forEach((field) => {
        if (field.heading) { group = field.surface ? '' : labelOf(field); return; }
        if (!field.path) return;
        const [title, hint] = labelOf(field);
        const hay = (title + ' ' + (hint || '') + ' ' + field.path + ' ' + group).toLowerCase();
        if (matches(hay)) hits.push({ key, field, title, group });
      });
    });
    return hits;
  }

  function surfaceHits(text) {
    const matches = matcher(text.trim().toLowerCase());
    return Object.keys(SPEC).filter((key) => matches(surfaceName(key).toLowerCase()));
  }

  /* One row per changed setting, each naming the surface it came from so the
     list reads without having to remember where anything lives. Tapping one
     goes there. */
  function renderChanged() {
    const t = L();
    const box = document.getElementById('changed');
    const list = document.getElementById('changed-list');
    const count = document.getElementById('changed-count');
    if (!box) return;
    const rows = changedSettings();
    count.textContent = rows.length ? t.changedCount(rows.length) : t.changedNone;
    box.classList.toggle('nothing', !rows.length);
    if (!rows.length) { box.open = false; list.textContent = ''; return; }

    list.textContent = '';
    rows.slice(0, 60).forEach(({ key, field }) => {
      const row = el('div', { class: 'list-row', role: 'button', tabindex: '0' }, [
        // The surface is named only when it adds something: a setting called
        // "Shorts" on the Shorts surface read as "ShortsShorts".
        el('span', { class: 'row-label' }, [
          el('span', { text: labelOf(field)[0] }),
          ...(labelOf(field)[0] === surfaceName(key) ? []
            : [el('small', { class: 'result-where', text: surfaceName(key) })])
        ]),
        el('span', { class: 'chevron', 'aria-hidden': 'true' })
      ]);
      const go = () => {
        const scroller = document.getElementById('scroll');
        lastScroll = scroller ? scroller.scrollTop : 0;
        drill = key;
        render();
      };
      row.addEventListener('click', go);
      row.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); }
      });
      list.appendChild(row);
    });
  }

  function renderSearch() {
    const t = L();
    const list = document.getElementById('search-results');
    const surfaces = document.getElementById('surface-list');
    const empty = document.getElementById('no-hits');

    const searching = query.trim().length > 0;
    document.getElementById('profiles-section').hidden = searching;
    document.getElementById('bookmarks-section').hidden = searching;
    document.getElementById('summaries-section').hidden = searching || !summaries.length;
    document.getElementById('channels-section').hidden = searching || !Object.keys(settings.channelPrefs || {}).length;
    // Results are an answer to a question, not a place with a footer.
    const foot = document.getElementById('root-footer');
    if (foot) foot.hidden = searching;
    const heading = document.getElementById('label-results');
    list.hidden = !searching;
    heading.hidden = !searching;
    surfaces.hidden = searching;
    empty.hidden = true;
    if (!searching) return;

    const matchedSurfaces = surfaceHits(query);
    const allHits = searchHits(query);
    const hits = allHits.slice(0, 40);
    list.textContent = '';
    // The count answers "did it find anything" before the list is read.
    heading.textContent = t.results(matchedSurfaces.length + allHits.length);

    // A surface whose own name matches is offered as a place to go, above the
    // individual settings — searching "sidebar" means the sidebar, usually.
    matchedSurfaces.forEach((key) => {
      const row = el('div', { class: 'list-row', role: 'button', tabindex: '0' }, [
        self.CostumIcons.tile(key),
        el('span', { class: 'row-label' }, [el('span', { text: surfaceName(key) })]),
        el('span', { class: 'chevron', 'aria-hidden': 'true' })
      ]);
      const go = () => { drill = key; query = ''; render(); };
      row.addEventListener('click', go);
      row.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); }
      });
      list.appendChild(row);
    });

    if (!matchedSurfaces.length && !hits.length) {
      empty.textContent = t.noHits;
      empty.hidden = false;
      return;
    }

    hits.forEach(({ key, field, group }) => {
      const row = fieldRow(field);
      // A result out of context needs to say where it came from.
      const label = row.querySelector('.row-label');
      if (label) label.appendChild(el('small', { class: 'result-where',
        text: surfaceName(key) + (group ? ' · ' + group : '') }));
      list.appendChild(row);
    });
  }

  /* ---- modes of your own ----
     A row applies like a built-in mode and can be undone the same way. What
     it would change is computed live against the current settings, so the
     caption is a preview and never a stale promise. The tools sit behind one
     button per row: renaming, updating to what is set now, duplicating,
     deleting. */
  let openTools = null;   // the mode id whose tools are showing

  async function commit(next, said) {
    settings = await replace(next);
    render();
    if (said) announce(said);
  }

  function renderCustomModes() {
    const t = L();
    const D = self.CostumDefaults;
    document.getElementById('label-custom-modes').textContent = t.yourModes;
    document.getElementById('mode-save').textContent = t.saveMode;
    document.getElementById('mode-name').placeholder = t.modeName;
    document.getElementById('mode-name').setAttribute('aria-label', t.modeName);
    document.getElementById('mode-go').textContent = t.save;
    const list = document.getElementById('custom-modes');
    list.textContent = '';
    const modes = settings.customModes || [];
    if (!modes.length) { list.appendChild(el('p', { class: 'hint', text: t.noModes })); return; }

    modes.forEach((mode) => {
      const name = D.CUSTOM_PREFIX + mode.id;
      // In force only while nothing differs: a mode that was applied and then
      // edited past is offered again, with what it would put back.
      const changes = D.modePreview(settings, name);
      const on = settings.profile === name && !changes.length;
      const caption = on ? t.modeActive : (changes.length ? t.modeWould(changes.length) : t.modeSame);
      const tools = el('button', { type: 'button', class: 'row-tools', text: '\u22EF',
        'aria-label': t.modeTools + ': ' + mode.name, 'aria-expanded': String(openTools === mode.id),
        'data-control-id': 'mode-tools:' + mode.id });
      const row = el('div', {
        class: 'list-row', role: 'button', tabindex: '0', 'aria-pressed': String(on),
        'aria-label': mode.name + ' — ' + caption, title: t.undoHint,
        'data-control-id': 'mode:' + mode.id
      }, [
        el('span', { class: 'row-label' }, [el('span', { text: mode.name }), el('small', { text: caption })]),
        tools,
        el('span', { class: 'sw-track', 'aria-hidden': 'true' })
      ]);
      const fire = () => commit(D.applyProfile(settings, on ? 'default' : name),
        on ? t.modeCleared(mode.name) : t.modeApplied(mode.name, changes.length));
      row.addEventListener('click', (ev) => { if (!tools.contains(ev.target)) fire(); });
      row.addEventListener('keydown', (ev) => {
        if ((ev.key === 'Enter' || ev.key === ' ') && ev.target === row) { ev.preventDefault(); fire(); }
      });
      tools.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openTools = openTools === mode.id ? null : mode.id;
        render();
        const again = document.querySelector('[data-control-id="mode-tools:' + mode.id + '"]');
        if (again) again.focus();
      });
      list.appendChild(row);

      if (openTools !== mode.id) return;
      const strip = el('div', { class: 'mode-tools' });
      if (changes.length) {
        strip.appendChild(el('small', { class: 'hint', text: t.modePreviewLabel + ':' }));
        const preview = el('ul', { class: 'mode-preview hint' });
        changes.slice(0, 8).forEach((path) => preview.appendChild(el('li', { text: fieldLabel(path) })));
        if (changes.length > 8) preview.appendChild(el('li', { text: '… +' + (changes.length - 8) }));
        strip.appendChild(preview);
      }
      const renameForm = el('div', { class: 'inline-form' });
      const renameInput = el('input', { type: 'text', value: mode.name, maxlength: '40', 'aria-label': t.modeRename,
        'data-control-id': 'mode-rename:' + mode.id });
      const renameGo = el('button', { type: 'button', class: 'btn', text: t.modeRename, 'data-control-id': 'mode-rename-go:' + mode.id });
      renameGo.addEventListener('click', () => {
        const label = renameInput.value.trim();
        if (!label || label === mode.name) return;
        commit(D.renameCustomMode(settings, mode.id, label), t.modeRenamed);
      });
      renameInput.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); renameGo.click(); } });
      renameForm.append(renameInput, renameGo);
      strip.appendChild(renameForm);
      const button = (label, action, cls, id) => {
        const b = el('button', { type: 'button', class: 'btn' + (cls ? ' ' + cls : ''), text: label, 'data-control-id': id + ':' + mode.id });
        b.addEventListener('click', action);
        return b;
      };
      strip.append(
        button(t.modeUpdate, () => commit(D.saveCustomMode(settings, mode.name, mode.id), t.modeUpdated(mode.name)), '', 'mode-update'),
        button(t.modeDuplicate, () => commit(D.duplicateCustomMode(settings, mode.id)), '', 'mode-duplicate'),
        button(t.modeDelete, () => { openTools = null; commit(D.deleteCustomMode(settings, mode.id), t.modeDeleted(mode.name)); }, 'danger', 'mode-delete')
      );
      list.appendChild(strip);
    });
  }

  /* ---- channels with preferences of their own ---- */
  function renderChannels() {
    const t = L();
    const D = self.CostumDefaults;
    const section = document.getElementById('channels-section');
    const list = document.getElementById('channels-list');
    document.getElementById('label-channels').textContent = t.channels;
    const entries = Object.entries(settings.channelPrefs || {});
    section.hidden = !entries.length;
    list.textContent = '';
    entries.forEach(([id, prefs]) => {
      const parts = [];
      if (prefs.speed) parts.push(t.channelSpeed(prefs.speed));
      if (prefs.audio) parts.push(t.channelSound);
      if (prefs.watch) parts.push(t.channelClutter);
      const forget = el('button', { type: 'button', class: 'row-tools', text: t.channelForget,
        'aria-label': t.channelForget + ': ' + (prefs.name || id), 'data-control-id': 'channel-forget:' + id });
      forget.addEventListener('click', () =>
        commit(D.setChannelPrefs(settings, id, prefs.name, { speed: 0, audio: null, watch: null }), t.channelForgotten(prefs.name || id)));
      list.appendChild(el('div', { class: 'list-row', 'data-control-id': 'channel:' + id }, [
        el('span', { class: 'row-label' }, [
          el('span', { text: prefs.name || id }),
          el('small', { text: parts.join(' · ') || id })
        ]),
        forget
      ]));
    });
  }

  /* ---- the bookmark library ----
     Read from the background when Customize opens and after every change;
     searched here, since the whole list is already in hand. Opening goes to
     the video at the saved second, in a new tab. */
  let bookmarks = { items: [], count: 0, limit: 0 };
  let bookmarkQuery = '';
  let editingBookmark = null;

  async function loadBookmarks() {
    try { bookmarks = await request('bookmarks.list'); } catch (e) { bookmarks = { items: [], count: 0, limit: 0 }; }
    renderBookmarks();
  }

  function openBookmark(item) {
    const url = self.CostumBookmarks.link(item);
    try { api.tabs.create({ url }); } catch (e) { window.open(url, '_blank'); }
  }

  function renderBookmarks() {
    const t = L();
    const B = self.CostumBookmarks;
    const list = document.getElementById('bookmarks-list');
    const empty = document.getElementById('bookmarks-empty');
    document.getElementById('label-bookmarks').textContent = t.bookmarks;
    const search = document.getElementById('bookmark-search');
    search.placeholder = t.bookmarkSearch;
    search.setAttribute('aria-label', t.bookmarkSearch);
    document.getElementById('bookmarks-export').textContent = t.exportLabel;
    document.getElementById('bookmarks-import').textContent = t.importLabel;
    document.getElementById('bookmarks-clear').textContent = t.bookmarkDelete + ' · ' + t.all.toLowerCase();
    document.getElementById('bookmarks-clear-body').textContent = t.bookmarksClearBody;
    document.getElementById('bookmarks-clear-go').textContent = t.bookmarkDelete;
    document.getElementById('bookmarks-clear-cancel').textContent = t.cancelLabel;
    document.getElementById('bookmarks-count').textContent = bookmarks.limit ? t.bookmarksCount(bookmarks.count, bookmarks.limit) : '';
    document.getElementById('bookmarks-clear').hidden = !bookmarks.count;
    document.getElementById('bookmarks-export').hidden = !bookmarks.count;
    // Nothing to search until something is saved.
    search.parentElement.hidden = !bookmarks.count;

    const items = B.search(bookmarks.items, bookmarkQuery);
    list.textContent = '';
    empty.hidden = !!items.length;
    // An empty card still draws its hairline ring: a stray rule under the heading.
    list.hidden = !items.length;
    empty.textContent = bookmarks.count ? t.bookmarksNoHits : t.bookmarksEmpty;
    items.slice(0, 100).forEach((item) => {
      const when = B.clock(item.at) + (item.channel ? ' · ' + item.channel : '') + ' · ' + new Date(item.createdAt).toLocaleDateString();
      const label = el('span', { class: 'row-label' }, [
        el('span', { text: item.title || item.videoId }),
        el('small', { text: when }),
        item.note ? el('span', { class: 'note', text: item.note }) : null
      ]);
      const actions = el('div', { class: 'bookmark-actions' });
      const button = (text, action, cls, key) => {
        const b = el('button', { type: 'button', class: 'btn' + (cls ? ' ' + cls : ''), text, 'data-control-id': key + ':' + item.id });
        b.addEventListener('click', action);
        return b;
      };
      actions.append(
        button(t.bookmarkOpen, () => openBookmark(item), '', 'bookmark-open'),
        button(t.bookmarkEdit, () => { editingBookmark = editingBookmark === item.id ? null : item.id; renderBookmarks(); }, '', 'bookmark-edit'),
        button(t.bookmarkDelete, async () => {
          try { await request('bookmarks.delete', { id: item.id }); say(t.bookmarkDeleted); } catch (e) { say(t.badBookmarkFile); }
          loadBookmarks();
        }, 'danger', 'bookmark-delete')
      );
      if (editingBookmark === item.id) {
        const form = el('div', { class: 'inline-form' });
        const input = el('input', { type: 'text', value: item.note, maxlength: String(B.LIMITS.note), 'aria-label': t.bookmarkNote, placeholder: t.bookmarkNote, 'data-control-id': 'bookmark-note:' + item.id });
        const go = el('button', { type: 'button', class: 'btn filled', text: t.save, 'data-control-id': 'bookmark-note-save:' + item.id });
        go.addEventListener('click', async () => {
          try { await request('bookmarks.update', { id: item.id, patch: { note: input.value } }); say(t.bookmarkSaved); } catch (e) { say(t.badBookmarkFile); }
          editingBookmark = null;
          loadBookmarks();
        });
        input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); go.click(); } });
        form.append(input, go);
        actions.appendChild(form);
      }
      list.appendChild(el('div', { class: 'list-row bookmark-row', 'data-control-id': 'bookmark:' + item.id }, [label, actions]));
    });
  }

  /* ---- saved summaries ----
     Kept on this device by the background; listed here so one can be found,
     copied with its video link, or deleted without clearing the rest. */
  let summaries = [];
  async function loadSummaries() {
    try { summaries = await request('summary.list'); } catch (e) { summaries = []; }
    renderSummaries();
  }

  function renderSummaries() {
    const t = L();
    const section = document.getElementById('summaries-section');
    const list = document.getElementById('summaries-list');
    document.getElementById('label-summaries').textContent = t.summaries;
    section.hidden = !summaries.length || query.trim().length > 0;
    list.textContent = '';
    summaries.forEach((entry) => {
      const meta = [t.summaryDetail[entry.detail] || entry.detail, new Date(entry.at).toLocaleDateString()];
      if (entry.partial) meta.push(t.summaryPartial);
      const link = 'https://www.youtube.com/watch?v=' + encodeURIComponent(entry.videoId);
      const actions = el('div', { class: 'bookmark-actions' });
      const button = (text, action, cls, key) => {
        const b = el('button', { type: 'button', class: 'btn' + (cls ? ' ' + cls : ''), text, 'data-control-id': key + ':' + entry.key });
        b.addEventListener('click', action);
        return b;
      };
      actions.append(
        button(t.summaryOpen, () => { try { api.tabs.create({ url: link }); } catch (e) { window.open(link, '_blank'); } }, '', 'summary-open'),
        button(t.summaryCopy, async () => {
          try { await navigator.clipboard.writeText((entry.title ? entry.title + '\n' : '') + link + '\n\n' + entry.text); say(t.summaryCopied); }
          catch (e) { say(t.copyFailed || t.badFile); }
        }, '', 'summary-copy'),
        button(t.summaryDelete, async () => {
          try { await request('summary.delete', { key: entry.key }); say(t.summaryDeleted); } catch (e) { say(t.badFile); }
          loadSummaries();
        }, 'danger', 'summary-delete')
      );
      list.appendChild(el('div', { class: 'list-row bookmark-row', 'data-control-id': 'summary:' + entry.key }, [
        el('span', { class: 'row-label' }, [el('span', { text: entry.title || entry.videoId }), el('small', { text: meta.join(' · ') })]),
        actions
      ]));
    });
  }

  document.getElementById('bookmark-search').addEventListener('input', (ev) => {
    bookmarkQuery = ev.target.value;
    renderBookmarks();
  });
  document.getElementById('bookmarks-export').addEventListener('click', async () => {
    let envelope;
    try { envelope = await request('bookmarks.export'); } catch (e) { return; }
    const url = URL.createObjectURL(new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' }));
    const a = el('a', { href: url, download: 'costum-bookmarks.json' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  });
  document.getElementById('bookmarks-import').addEventListener('click', () => {
    const picker = el('input', { type: 'file', accept: 'application/json' });
    picker.addEventListener('change', async () => {
      const file = picker.files && picker.files[0];
      if (!file) return;
      try {
        const result = await request('bookmarks.import', { payload: JSON.parse(await file.text()) });
        say(L().bookmarksImported(result));
      } catch (e) { say(L().badBookmarkFile); }
      loadBookmarks();
    });
    picker.click();
  });
  const clearBox = document.getElementById('bookmarks-clear-confirm');
  document.getElementById('bookmarks-clear').addEventListener('click', () => { clearBox.hidden = !clearBox.hidden; });
  document.getElementById('bookmarks-clear-cancel').addEventListener('click', () => { clearBox.hidden = true; });
  document.getElementById('bookmarks-clear-go').addEventListener('click', async () => {
    try { await request('bookmarks.clear'); say(L().bookmarksCleared); } catch (e) { say(L().badBookmarkFile); }
    clearBox.hidden = true;
    loadBookmarks();
  });

  document.getElementById('mode-save').addEventListener('click', () => {
    const form = document.getElementById('mode-form');
    form.hidden = !form.hidden;
    if (!form.hidden) document.getElementById('mode-name').focus();
  });
  document.getElementById('mode-go').addEventListener('click', () => {
    const input = document.getElementById('mode-name');
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    input.value = '';
    document.getElementById('mode-form').hidden = true;
    commit(self.CostumDefaults.saveCustomMode(settings, name), L().modeSaved(name));
  });
  document.getElementById('mode-name').addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { ev.preventDefault(); document.getElementById('mode-go').click(); }
  });

  function render() {
    const focusId = document.activeElement && document.activeElement.getAttribute('data-control-id');
    const t = L();
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Three useful states in one popover: the immediate Control Center, the
    // Customize workspace, or one settings surface pushed above either one.
    const inDrill = drill !== null && !!SPEC[drill];
    const inControl = !inDrill && workspace === 'control';
    const inCustomize = !inDrill && workspace === 'customize';
    document.getElementById('drill').hidden = !inDrill;
    /* `scroll` and not only its contents: with every child hidden it still held
       `flex: 1 1 auto` and its own padding, so it kept a share of the pane and
       pushed the drilled surface down behind a band of nothing. */
    document.getElementById('scroll').hidden = inDrill;
    document.getElementById('control-center').hidden = !inControl;
    document.getElementById('customize-workspace').hidden = !inCustomize;
    document.getElementById('search-bar').hidden = !inCustomize;
    document.getElementById('page-section').hidden = !inControl;
    document.getElementById('root-footer').hidden = !inCustomize;
    if (inDrill) { renderDrill(); return; }
    const currentPageRows = pageRows();
    document.getElementById('page-empty').hidden = pathname !== null;
    document.getElementById('page-empty').textContent = t.noTab;
    document.getElementById('page-section').hidden = !inControl || !currentPageRows.length;
    // The state line says what is true rather than leaving the switch to imply it.
    const state = document.getElementById('state');
    // On a YouTube tab with nothing answering: Safari has not allowed the
    // site. This is the case that used to read "On for this page".
    const notAllowed = settings.enabled && pathname !== null && alive === false;
    if (!settings.enabled) state.textContent = t.offState;
    else if (pathname === null) state.textContent = t.onGeneral;
    // The ping is still out. Said as such, rather than claiming "on" for a
    // second and then taking it back.
    else if (checking) state.textContent = t.checking;
    else if (notAllowed) state.textContent = t.notAllowed;
    else if (alive && alive.bridge === 'blocked') state.textContent = t.bridgeBlocked;
    else state.textContent = t.onHere;
    document.querySelector('.hero').classList.toggle('warn', notAllowed);
    document.querySelector('.hero').classList.toggle('checking', !!checking && settings.enabled && pathname !== null);
    /* The instruction goes where the eye already is, in the pinned strip under
       the header, and stays: this is not a passing confirmation but the reason
       nothing on the page is changing. */
    const strip = document.getElementById('announce');
    /* Second only to "not allowed here": switches that are on and finding
       nothing on this page, which is what a YouTube rename looks like. */
    const dead = (alive && alive.health) || [];
    if (notAllowed) { strip.textContent = sitePermissionHelp(); strip.classList.add('warn'); }
    else if (dead.length && settings.enabled) {
      strip.textContent = t.deadHere(dead.length) + ' ' + dead.map((key) => fieldLabel('declutter.' + key).split(' · ')[0]).join(', ') + '.';
      strip.classList.add('warn');
    }
    else if (strip.classList.contains('warn')) { strip.textContent = ''; strip.classList.remove('warn'); }
    document.getElementById('label-mode').textContent = t.activeMode;
    document.getElementById('label-profiles').textContent = t.profiles;
    document.getElementById('label-changed').textContent = t.changed;
    renderChanged();
    document.getElementById('label-yours').textContent = t.yours;
    document.getElementById('export').textContent = t.exportLabel;
    document.getElementById('import').textContent = t.importLabel;
    document.getElementById('reset').textContent = t.resetLabel;
    document.getElementById('reset-body').textContent = t.resetBody;
    document.getElementById('reset-go').textContent = t.resetGo;
    document.getElementById('reset-cancel').textContent = t.cancelLabel;
    document.getElementById('import-go').textContent = t.importGo;
    document.getElementById('import-cancel').textContent = t.cancelLabel;
    document.getElementById('sync-now').textContent = t.syncNow;
    document.getElementById('label-restore').textContent = t.restore;
    renderSync();
    renderRestore();
    document.getElementById('label-speed').textContent = t.playback;
    document.getElementById('label-page').textContent = t.page;
    document.getElementById('label-everywhere').textContent = t.site;
    // The reach of each section, in its own caption. The mode and the
    // everywhere rows are the whole site; the speed is every video from now
    // on, not the one playing; the page rows are every page of this kind.
    const kind = pageKind();
    document.getElementById('scope-mode').textContent = t.scopeSite;
    document.getElementById('scope-speed').textContent = t.scopeEvery;
    document.getElementById('scope-page').textContent = kind ? t.scopeOf[kind] : '';
    document.getElementById('open-customize-label').textContent = t.customize;
    document.getElementById('open-customize-note').textContent = t.customizeNote;
    document.getElementById('customize-back-label').textContent = t.customizeBack;
    document.getElementById('customize-title').textContent = t.customizeTitle;

    const master = document.getElementById('master');
    master.checked = settings.enabled;
    master.disabled = Lock.isLocked(settings);
    master.setAttribute('aria-label', 'Costum');

    const hint = document.getElementById('hint');
    hint.textContent = master.disabled ? t.locked
      : (settings.enabled && pathname === null ? t.noTab : '');

    /* One recommendation in front, the other three behind a disclosure that
       opens on its own when one of them is the profile in force — so the
       screen never hides the state it is in. */
    const pick = (key) => async () => {
      const clearing = settings.profile === key;
      const label = { recommended: t.recommended, study: t.study,
        music: t.music, evening: t.evening }[key];
      settings = await replace(applyProfile(settings, clearing ? 'default' : key));
      render();
      // Said out loud as well as drawn: the largest write this surface makes
      // used to report itself only as numbers moving in a list.
      /* The same number the list underneath is about to show. Counting the
         switches that are on instead gave "7 settings on" next to a list
         headed "5 settings", which is two answers to one question. */
      announce(clearing ? t.profileCleared(label)
        : t.profileApplied(label, changedSettings().length));
    };
    /* A profile is a row with a switch, the same control as every other row in
       this popover. It used to be a lone chip in the segmented control's pressed
       style — but pressed means "selected among these", and with no sibling to
       be selected against it did not say whether the profile was on. The
       description sits inside the row as its own caption, the way a setting's
       does, instead of 19px below it as if it were another section. */
    /* In Customize a mode is a switch row like every other row there. In the
       picker under the Active mode row the four are one exclusive choice, and
       are drawn and announced as one: radios, with a tick on the chosen one. */
    const profileRow = (key, label, prefix) => {
      const on = settings.profile === key;
      const radio = prefix === 'pick:';
      const row = el('div', {
        class: 'list-row' + (radio ? ' pick' : ''), role: radio ? 'radio' : 'button', tabindex: '0',
        [radio ? 'aria-checked' : 'aria-pressed']: String(on),
        'aria-label': label + ' — ' + t.profileWhat[key], title: t.undoHint,
        'data-control-id': (prefix || 'profile:') + key
      }, [
        el('span', { class: 'row-label' }, [
          el('span', { text: label }),
          el('small', { text: t.profileWhat[key] })
        ]),
        radio ? tick() : el('span', { class: 'sw-track', 'aria-hidden': 'true' })
      ]);
      const fire = pick(key);
      row.addEventListener('click', fire);
      row.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); fire(); }
      });
      return row;
    };
    const profiles = document.getElementById('profiles');
    profiles.textContent = '';
    profiles.appendChild(profileRow('recommended', t.recommended));

    const rest = [['study', t.study], ['music', t.music], ['evening', t.evening]];
    const restBox = document.getElementById('profiles-rest');
    restBox.textContent = '';
    rest.forEach(([key, label]) => restBox.appendChild(profileRow(key, label)));
    const more = document.getElementById('more-profiles');
    document.getElementById('more-profiles-label').textContent = t.moreProfiles;
    if (rest.some(([key]) => settings.profile === key)) more.open = true;
    renderCustomModes();
    renderChannels();
    renderBookmarks();

    /* The Control Center never makes a person decode a switch list to learn
       which mode is in force. It tells the truth about a personal setup too:
       the default is not the Recommended mode. */
    const activeProfile = document.getElementById('active-profile');
    const activeKey = settings.profile;
    const activeCustom = self.CostumDefaults.customMode(settings, activeKey);
    const activeLabel = activeKey === 'default'
      ? t.personal
      : activeCustom ? activeCustom.name
      : ({ recommended: t.recommended, study: t.study, music: t.music, evening: t.evening }[activeKey] || t.personal);
    const activeNote = activeKey === 'default' ? t.personalWhat : activeCustom ? t.yourModes : (t.profileWhat[activeKey] || t.personalWhat);
    activeProfile.textContent = '';
    activeProfile.setAttribute('aria-label', activeLabel + ' — ' + activeNote);
    activeProfile.setAttribute('aria-expanded', String(modeOpen));
    activeProfile.setAttribute('data-control-id', 'active-profile');
    activeProfile.classList.toggle('open', modeOpen);
    activeProfile.append(
      el('span', { class: 'row-label' }, [
        el('span', { text: activeLabel }),
        el('small', { text: activeNote })
      ]),
      el('span', { class: 'chevron fold-chevron', 'aria-hidden': 'true' })
    );

    /* The picker: the four built-in modes and any saved ones, as the same
       switch rows Customize draws, so a mode is two taps from the front and
       no navigation. Renaming and deleting stay in Customize. */
    const picker = document.getElementById('mode-picker');
    picker.hidden = !modeOpen;
    picker.setAttribute('aria-label', t.activeMode);
    picker.textContent = '';
    if (modeOpen) {
      [['recommended', t.recommended], ['study', t.study], ['music', t.music], ['evening', t.evening]]
        .forEach(([key, label]) => picker.appendChild(profileRow(key, label, 'pick:')));
      const D = self.CostumDefaults;
      (settings.customModes || []).forEach((mode) => {
        const name = D.CUSTOM_PREFIX + mode.id;
        const changes = D.modePreview(settings, name);
        const on = settings.profile === name && !changes.length;
        const caption = on ? t.modeActive : (changes.length ? t.modeWould(changes.length) : t.modeSame);
        const row = el('div', {
          class: 'list-row pick', role: 'radio', tabindex: '0', 'aria-checked': String(on),
          'aria-label': mode.name + ' — ' + caption, title: t.undoHint,
          'data-control-id': 'pick:' + name
        }, [
          el('span', { class: 'row-label' }, [el('span', { text: mode.name }), el('small', { text: caption })]),
          tick()
        ]);
        const fire = () => commit(D.applyProfile(settings, on ? 'default' : name),
          on ? t.modeCleared(mode.name) : t.modeApplied(mode.name, changes.length));
        row.addEventListener('click', fire);
        row.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); fire(); }
        });
        picker.appendChild(row);
      });
    }

    const current = Number(settings.playback.defaultSpeed);
    /* The readout and the pressed preset were printing the same "1×" twenty
       pixels apart. It earns its place only when the speed is somewhere the six
       presets cannot show — the panel and the slider can leave it between
       them — so it appears then and stays quiet otherwise. */
    const presets = [0.75, 1, 1.25, 1.5, 1.75, 2];
    const onAPreset = presets.some((v) => Math.abs(current - v) < 0.001);
    document.getElementById('speed-value').textContent = onAPreset
      ? '' : current.toFixed(2).replace(/\.?0+$/, '') + '×';

    const speeds = document.getElementById('speeds');
    speeds.textContent = '';
    presets.forEach((value) => {
      const choice = segment(value + '×', Math.abs(current - value) < 0.001, async () => {
        if (notAllowed) return;
        settings = await write({ playback: { defaultSpeed: value } });
        render();
      });
      choice.disabled = notAllowed;
      choice.setAttribute('data-control-id', 'speed:' + value);
      speeds.appendChild(choice);
    });

    const quickRow = (item) => {
      const row = el('div', {
        class: 'list-row', role: 'button', tabindex: notAllowed ? '-1' : '0',
        'aria-pressed': String(!!item.on), 'aria-disabled': String(notAllowed),
        'data-control-id': 'quick:' + item.label
      }, [
        el('span', { class: 'row-label' }, [el('span', { text: item.label })]),
        el('span', { class: 'sw-track', 'aria-hidden': 'true' })
      ]);
      const fire = async () => {
        if (notAllowed) return;
        settings = await write(item.patch); render();
      };
      row.addEventListener('click', fire);
      row.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); fire(); }
      });
      return row;
    };
    const quick = document.getElementById('quick');
    quick.textContent = '';
    currentPageRows.forEach((item) => quick.appendChild(quickRow(item)));
    const quickAll = document.getElementById('quick-all');
    quickAll.textContent = '';
    siteRows().forEach((item) => quickAll.appendChild(quickRow(item)));
    const quickPlayback = document.getElementById('quick-playback');
    quickPlayback.textContent = '';
    playbackRows().forEach((item) => quickPlayback.appendChild(quickRow(item)));
    speeds.setAttribute('aria-label', t.speed);

    /* The catalogue in three groups by reach, which is also the answer to the
       question every switch raises: what will this change? */
    const list = document.getElementById('surface-list');
    list.textContent = '';
    const known = new Set(CATEGORIES.flatMap(([, keys]) => keys));
    CATEGORIES.forEach(([cat, keys], index) => {
      const here = keys.filter((key) => SPEC[key]);
      if (index === CATEGORIES.length - 1) surfaceKeys().forEach((key) => { if (!known.has(key)) here.push(key); });
      if (!here.length) return;
      list.appendChild(el('div', { class: 'label' }, [el('span', { text: t[cat] })]));
      const group = el('div', { class: 'list' });
      here.forEach((key) => group.appendChild(surfaceRow(key)));
      list.appendChild(group);
    });
    function surfaceRow(key) {
      const state = surfaceState(key);
      const count = el('span', {
        class: 'row-count',
        text: state.on ? state.on + ' / ' + state.total : String(state.total)
      });
      if (state.on) count.setAttribute('data-on', '');

      /* Read aloud, the row was "Player1 / 10": two numbers and no word saying
         what they count. The badge is decoration once the row says it. */
      count.setAttribute('aria-hidden', 'true');
      const row = el('div', {
        class: 'list-row', role: 'button', tabindex: '0',
        'aria-label': surfaceName(key) + ', ' + L().countSpoken(state.on, state.total)
      }, [
        self.CostumIcons.tile(key),
        el('span', { class: 'row-label' }, [el('span', { text: surfaceName(key) })]),
        count,
        el('span', { class: 'chevron', 'aria-hidden': 'true' })
      ]);
      const go = () => {
        const box = document.getElementById('scroll');
        lastScroll = box ? box.scrollTop : 0;
        drill = key;
        openGroups = new Set();   // each surface opens on its own state, not the last one's
        render();
        const inner = document.getElementById('drill-scroll');
        if (inner) inner.scrollTop = 0;
      };
      row.addEventListener('click', go);
      row.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); }
      });
      return row;
    }

    const search = document.getElementById('search');
    search.placeholder = t.searchPlaceholder;
    search.setAttribute('aria-label', t.searchPlaceholder);
    if (search.value !== query) search.value = query;
    if (inCustomize) renderSearch();
    if (focusId) {
      const replacement = [...document.querySelectorAll('[data-control-id]')]
        .find((node) => node.getAttribute('data-control-id') === focusId);
      if (replacement && replacement.offsetParent !== null) replacement.focus({ preventScroll: true });
    }
  }

  document.getElementById('master').addEventListener('change', async (ev) => {
    settings = await write({ enabled: ev.target.checked });
    render();
  });

  document.getElementById('open-customize').addEventListener('click', openCustomize);
  document.getElementById('active-profile').addEventListener('click', () => {
    modeOpen = !modeOpen;
    render();
  });
  document.getElementById('customize-back').addEventListener('click', closeCustomize);

  /* Resetting one surface: every changed setting on it goes back to what it
     shipped as, in one write, after a question asked in place. */
  const drillResetBox = document.getElementById('drill-reset-confirm');
  document.getElementById('drill-reset').addEventListener('click', () => {
    drillResetBox.hidden = !drillResetBox.hidden;
    if (!drillResetBox.hidden) document.getElementById('drill-reset-go').focus();
  });
  document.getElementById('drill-reset-cancel').addEventListener('click', () => {
    drillResetBox.hidden = true;
    document.getElementById('drill-reset').focus();
  });
  document.getElementById('drill-reset-go').addEventListener('click', async () => {
    const t = L();
    const base = self.CostumDefaults.withDefaults({});
    let patch = {};
    changedSettings().filter((c) => c.key === drill)
      .forEach(({ field }) => { patch = merge(patch, patchOf(field.path, at(base, field.path))); });
    drillResetBox.hidden = true;
    const name = surfaceName(drill);
    try { settings = await write(patch); render(); announce(t.surfaceReset(name)); }
    catch (e) { announce(lang === 'ar' ? 'تعذّر حفظ الإعداد. حاول مجدداً.' : 'Could not save the setting. Please try again.'); }
    document.getElementById('back').focus();
  });

  document.getElementById('back').addEventListener('click', () => {
    drill = null;
    render();
    // Back means back to where you were, not to the top of a nineteen-row list.
    const box = document.getElementById('scroll');
    if (box && lastScroll) { box.scrollTop = lastScroll; lastScroll = 0; }
  });

  /* ---- the settings file ----
     238 settings with no way to save, move or undo them was the lowest score in
     the review: there was no export, import or reset anywhere once the settings
     page went. A brief note carries the result, because a popover that closes
     on a file dialog cannot rely on being open to report back. */
  /* A polite live region, cleared after a beat so it does not linger as a
     stale claim about a state that has since changed. */
  let announceTimer = null;
  function announce(message) {
    const box = document.getElementById('announce');
    if (!box) return;
    box.textContent = message;
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      if (box.textContent === message) box.textContent = '';
    }, 4000);
  }

  function say(message) {
    const hint = document.getElementById('hint');
    hint.textContent = message;
    setTimeout(() => { if (hint.textContent === message) hint.textContent = ''; }, 2600);
  }

  /* ---- where the settings live ----
     Asked of the background rather than guessed from the browser: on Safari it
     knows whether the last push landed and when; on Chrome and Edge it says
     plainly that nothing leaves the profile. The status is fetched once at
     open and after each sync action — not on every render, which would put a
     native round trip behind every switch. */
  let syncInfo = null;
  const clockOf = (stamp) => new Date(stamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  function renderSync() {
    const t = L();
    const line = document.getElementById('sync-status');
    const button = document.getElementById('sync-now');
    if (!syncInfo) { line.textContent = ''; button.hidden = true; return; }
    if (syncInfo.mode !== 'icloud') { line.textContent = t.syncLocal; button.hidden = true; return; }
    button.hidden = false;
    let detail;
    if (syncInfo.available === false) detail = t.syncNotSignedIn;
    else if (syncInfo.lastError) detail = t.syncError[syncInfo.lastError] || syncInfo.lastError;
    else if (syncInfo.dirty) detail = t.syncPending;
    else if (syncInfo.lastSuccessAt) detail = t.syncAt(clockOf(syncInfo.lastSuccessAt));
    else detail = t.syncNever;
    line.textContent = t.syncCloud + ' · ' + detail;
    line.classList.toggle('danger', !!syncInfo.lastError || syncInfo.available === false);
  }

  async function loadSync() {
    try { syncInfo = await request('sync.status'); } catch (e) { syncInfo = null; }
    renderSync();
  }

  document.getElementById('sync-now').addEventListener('click', async () => {
    const t = L();
    const button = document.getElementById('sync-now');
    button.disabled = true;
    say(t.syncing);
    try {
      const outcome = await request('sync.refresh', { force: true });
      settings = await read();
      render();
      const failed = !outcome || /failed|unsupported/.test(outcome.result);
      say(outcome && outcome.result === 'replaced-unsent' ? t.syncReplaced : (failed ? t.syncFailed : t.synced));
    } catch (e) { say(t.syncFailed); }
    finally { button.disabled = false; await loadSync(); renderRestore(); }
  });

  /* ---- the settings file ----
     A versioned envelope, without the API key: the same rules as iCloud, since
     a file travels further. */
  const appVersion = () => {
    try { return api.runtime.getManifest().version; } catch (e) { return ''; }
  };

  document.getElementById('export').addEventListener('click', () => {
    const envelope = self.CostumDefaults.packageExport(settings, appVersion());
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' }));
    const a = el('a', { href: url, download: 'costum-settings.json' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  });

  /* What a file would do, said before it does it. The checks run here, on the
     parsed text, and again in the background on the way in — the popover only
     previews; the background is what decides. */
  let pendingImport = null;
  const importBox = document.getElementById('import-confirm');

  function fieldLabel(path) {
    for (const key of Object.keys(SPEC)) {
      const field = (SPEC[key] || []).find((f) => f.path === path);
      if (field) return labelOf(field)[0] + ' · ' + surfaceName(key);
    }
    return path;
  }

  function previewImport(payload) {
    const t = L();
    const D = self.CostumDefaults;
    const checked = D.validateImport(payload);
    if (!checked.ok) {
      if (checked.error === 'newer-version') return { ok: false, message: t.badFileNewer };
      if (checked.error === 'invalid-value') return { ok: false, message: t.badFileValue(checked.path) };
      return { ok: false, message: t.badFile };
    }
    const next = D.fromSync(checked.settings, settings);
    const changes = D.diffPaths(settings, next).filter((path) => path !== 'profileUndo');
    return { ok: true, payload, changes, unknown: checked.unknown, exportedAt: checked.exportedAt };
  }
  self.CostumPopupInternals = { previewImport };

  function showImportPreview(preview) {
    const t = L();
    pendingImport = preview.payload;
    const lines = [preview.changes.length ? t.importChanges(preview.changes.length) : t.importNothing];
    if (preview.exportedAt) {
      const when = new Date(preview.exportedAt);
      if (!isNaN(when)) lines.push(t.importFrom(when.toLocaleDateString()));
    }
    if (preview.unknown.length) lines.push(t.importSkipped(preview.unknown.length));
    lines.push(t.importKeyKept);
    document.getElementById('import-body').textContent = lines.join(' · ');
    const list = document.getElementById('import-list');
    list.textContent = '';
    preview.changes.slice(0, 12).forEach((path) => list.appendChild(el('li', { text: fieldLabel(path) })));
    if (preview.changes.length > 12) list.appendChild(el('li', { text: '… +' + (preview.changes.length - 12) }));
    resetBox.hidden = true;
    importBox.hidden = false;
    document.getElementById('import-go').disabled = !preview.changes.length;
    document.getElementById('import-go').focus();
  }

  document.getElementById('import').addEventListener('click', () => {
    const picker = el('input', { type: 'file', accept: 'application/json' });
    picker.addEventListener('change', async () => {
      const file = picker.files && picker.files[0];
      if (!file) return;
      let parsed;
      try { parsed = JSON.parse(await file.text()); }
      catch (e) { say(L().badFile); return; }
      const preview = previewImport(parsed);
      if (!preview.ok) { say(preview.message); return; }
      showImportPreview(preview);
    });
    picker.click();
  });

  document.getElementById('import-cancel').addEventListener('click', () => {
    importBox.hidden = true; pendingImport = null;
  });
  document.getElementById('import-go').addEventListener('click', async () => {
    if (!pendingImport) return;
    const t = L();
    try {
      const result = await request('settings.import', { payload: pendingImport });
      settings = result.settings;
      importBox.hidden = true; pendingImport = null;
      render();
      say(t.imported);
    } catch (e) {
      const code = String(e && e.message || e);
      say(code === 'newer-version' ? t.badFileNewer : t.badFile);
    }
    renderRestore();
  });

  const resetBox = document.getElementById('reset-confirm');
  document.getElementById('reset').addEventListener('click', () => {
    importBox.hidden = true;
    resetBox.hidden = !resetBox.hidden;
  });
  document.getElementById('reset-cancel').addEventListener('click', () => {
    resetBox.hidden = true;
  });
  document.getElementById('reset-go').addEventListener('click', async () => {
    settings = await request('settings.reset');
    resetBox.hidden = true;
    render();
    say(L().wasReset);
    renderRestore();
  });

  /* ---- the way back ----
     Each backup slot is one row: what it is, when it was taken. Restoring is a
     replacement too, so it keeps what it displaced in the same slot. */
  let backups = [];
  async function renderRestore() {
    const t = L();
    const box = document.getElementById('restore-box');
    const list = document.getElementById('restore-list');
    try { backups = await request('backup.list'); } catch (e) { backups = []; }
    box.hidden = !backups.length;
    list.textContent = '';
    backups.forEach(({ kind, at }) => {
      const row = el('div', { class: 'list-row', role: 'button', tabindex: '0', 'data-control-id': 'restore:' + kind }, [
        el('span', { class: 'row-label' }, [
          el('span', { text: t.restoreKinds[kind] || kind }),
          el('small', { text: new Date(at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) })
        ]),
        el('span', { class: 'chevron', 'aria-hidden': 'true' })
      ]);
      const go = async () => {
        try {
          settings = await request('backup.restore', { kind });
          render();
          say(t.restored);
        } catch (e) { say(t.badFile); }
        renderRestore();
      };
      row.addEventListener('click', go);
      row.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); }
      });
      list.appendChild(row);
    });
  }

  /* Search belongs to the root list. Inside a surface you are already somewhere
     specific and there is a way back, so the field would be one more thing to
     read past. It is hidden there rather than left visible and inert — which is
     what it was for a while, accepting typing and rendering its results into an
     element nobody could see. */
  document.getElementById('search').addEventListener('input', (ev) => {
    query = ev.target.value;
    renderSearch();
    // Results start at their top, whatever the list was scrolled to.
    const box = document.getElementById('scroll');
    if (box) box.scrollTop = 0;
  });

  /* Nothing is drawn behind the gate. Hiding a rendered surface would leave
     every value in the DOM for anyone who opens an inspector, and the point of
     the lock is that the settings are not reachable. */
  function gate() {
    const t = L();
    const box = document.getElementById('gate');
    const field = document.getElementById('gate-input');
    const error = document.getElementById('gate-error');
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('gate-title').textContent = t.locked;
    document.getElementById('gate-note').textContent = t.lockedNote;
    document.getElementById('gate-go').textContent = t.unlock;
    box.hidden = false;
    field.focus();

    const tryIt = async () => {
      if (await Lock.verify(field.value, settings.focus.passwordHash)) {
        box.hidden = true;
        render();
        return;
      }
      error.textContent = t.pwWrong;
      field.value = '';
      field.focus();
    };
    document.getElementById('gate-go').addEventListener('click', tryIt);
    field.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); tryIt(); }
    });
  }

  Promise.all([read(), activeTab()]).then(async ([loaded, tab]) => {
    settings = loaded;
    pathname = tab ? new URL(tab.url).pathname : null;
    mobile = tab ? self.CostumCss.isMobileHost(new URL(tab.url).hostname) : false;
    checking = !!tab;
    lang = settings.locale === 'auto'
      ? (navigator.language.startsWith('ar') ? 'ar' : 'en')
      : settings.locale;
    if (Lock.isLocked(settings)) gate();
    else render();
    /* Drawn first, asked second: the pane appears at once and the state line
       says it is checking, then says what it found. */
    if (tab) {
      alive = await ping(tab.id);
      checking = false;
      if (!Lock.isLocked(settings)) render();
    }
    /* Opening the popover is the moment to ask iCloud for anything another
       device changed. Throttled in the background; a re-render follows only
       when something actually arrived. */
    loadSync();
    try {
      const outcome = await request('sync.refresh');
      if (outcome && /applied|replaced/.test(outcome.result)) {
        settings = await read();
        if (!Lock.isLocked(settings)) render();
        if (outcome.result === 'replaced-unsent') announce(L().syncReplaced);
      }
      if (outcome && outcome.result !== 'throttled') loadSync();
    } catch (e) { /* no background, no sync — the status line already says so */ }
  });
})();
