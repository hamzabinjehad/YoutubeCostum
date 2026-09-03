/* The toolbar popup. On macOS this is the main way in, so it carries the same
   controls as the in-page panel rather than being a shortcut to a settings
   page. Like the panel, it shows the switches for the page you are on.

   The exclusive choices — profile, speed — are segmented controls, and every
   page switch is a switch, so the state is readable at a glance instead of
   spelled out in a word beside each row. */
(function () {
  'use strict';
  const api = self.browser || self.chrome;
  const { read, write, replace } = self.CostumStore;
  const { applyProfile } = self.CostumDefaults;
  const Lock = self.CostumLock;

  const STR = {
    en: {
      profiles: 'Profiles', speed: 'Speed', page: 'This page', everywhere: 'Everywhere',
      settings: 'All settings',
      onHere: 'On for this page', onGeneral: 'On', offState: 'Off',
      undoHint: 'Tap again to put your own settings back',
      recommended: 'Recommended', study: 'Study', music: 'Music', evening: 'Evening',
      cinema: 'Cinema mode', shorts: 'Hide Shorts', comments: 'Hide comments',
      related: 'Hide related videos', chat: 'Hide live chat', feed: 'Hide home feed',
      chips: 'Hide chip bar', suggest: 'Hide search suggestions',
      infinite: 'Stop infinite scroll', ads: 'Hide banner ads',
      locked: 'Locked by password', noTab: 'Open a YouTube tab for page controls'
    },
    ar: {
      profiles: 'البروفايلات', speed: 'السرعة', page: 'هالصفحة', everywhere: 'بكل الصفحات',
      settings: 'كل الإعدادات',
      onHere: 'شغّال على هالصفحة', onGeneral: 'شغّال', offState: 'مطفي',
      undoHint: 'اضغط مرة تانية لترجيع إعداداتك',
      recommended: 'الموصى به', study: 'دراسة', music: 'موسيقى', evening: 'سهرة',
      cinema: 'وضع السينما', shorts: 'إخفاء Shorts', comments: 'إخفاء التعليقات',
      related: 'إخفاء المقترحات', chat: 'إخفاء الشات المباشر', feed: 'إخفاء خلاصة الرئيسية',
      chips: 'إخفاء شريط الفئات', suggest: 'إخفاء اقتراحات البحث',
      infinite: 'إيقاف التمرير اللانهائي', ads: 'إخفاء بانرات الإعلانات',
      locked: 'مقفول بكلمة سر', noTab: 'افتح تبويب يوتيوب لتشوف تحكّمات الصفحة'
    }
  };

  let settings = null;
  let lang = 'en';
  let pathname = null;   // of the active YouTube tab, if there is one

  const L = () => STR[lang] || STR.en;

  async function activePath() {
    try {
      const tabs = await api.tabs.query({ active: true, currentWindow: true });
      const url = tabs && tabs[0] && tabs[0].url;
      if (!url || !/^https?:\/\/[^/]*youtube\.com/.test(url)) return null;
      return new URL(url).pathname;
    } catch (e) {
      return null;   // no tabs permission, or nothing to read
    }
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

  /* Same page-scoped idea as the panel: only show what applies here. */
  function pageRows() {
    const s = settings;
    const d = s.declutter;
    const t = L();
    const groups = pathname === null ? ['global'] : self.CostumCss.currentPages(pathname);
    const rows = [];

    const add = (label, on, patch) => rows.push({ label, on, patch });

    add(t.cinema, s.layout.cinema, { layout: { cinema: !s.layout.cinema } });
    add(t.shorts, d.shorts === 'hide', { declutter: { shorts: d.shorts === 'hide' ? 'show' : 'hide' } });

    if (groups.includes('watch')) {
      add(t.comments, d.watch.comments, { declutter: { watch: { comments: !d.watch.comments } } });
      add(t.related, d.watch.related, { declutter: { watch: { related: !d.watch.related } } });
      add(t.chat, d.watch.liveChat, { declutter: { watch: { liveChat: !d.watch.liveChat } } });
    }
    if (groups.includes('home')) {
      add(t.feed, d.home.feed, { declutter: { home: { feed: !d.home.feed } } });
      add(t.chips, d.home.chips, { declutter: { home: { chips: !d.home.chips } } });
    }
    if (groups.includes('search')) {
      add(t.suggest, d.search.suggestions, { declutter: { search: { suggestions: !d.search.suggestions } } });
    }

    add(t.infinite, d.global.infiniteScroll, { declutter: { global: { infiniteScroll: !d.global.infiniteScroll } } });
    add(t.ads, d.global.bannerAds, { declutter: { global: { bannerAds: !d.global.bannerAds } } });

    return rows;
  }

  function render() {
    const t = L();
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
    // The state line says what is true rather than leaving the switch to imply it.
    document.getElementById('state').textContent = !settings.enabled ? t.offState
      : (pathname === null ? t.onGeneral : t.onHere);
    document.getElementById('label-profiles').textContent = t.profiles;
    document.getElementById('label-speed').textContent = t.speed;
    // With no YouTube tab in front, the rows that remain are the ones that
    // apply everywhere — so the heading says that instead of lying about "this
    // page".
    document.getElementById('label-page').textContent = pathname === null ? t.everywhere : t.page;
    document.getElementById('open-label').textContent = t.settings;

    const master = document.getElementById('master');
    master.checked = settings.enabled;
    master.disabled = Lock.isLocked(settings);
    master.setAttribute('aria-label', 'Costum');

    const hint = document.getElementById('hint');
    hint.textContent = master.disabled ? t.locked
      : (settings.enabled && pathname === null ? t.noTab : '');

    const profiles = document.getElementById('profiles');
    profiles.textContent = '';
    profiles.classList.add('grid2');
    [['recommended', t.recommended], ['study', t.study], ['music', t.music], ['evening', t.evening]]
      .forEach(([key, label]) => {
        profiles.appendChild(segment(label, settings.profile === key, async () => {
          settings = await replace(applyProfile(settings, settings.profile === key ? 'default' : key));
          render();
        }, t.undoHint));
      });

    const current = Number(settings.playback.defaultSpeed);
    document.getElementById('speed-value').textContent = current.toFixed(2).replace(/\.?0+$/, '') + '×';

    const speeds = document.getElementById('speeds');
    speeds.textContent = '';
    [0.75, 1, 1.25, 1.5, 1.75, 2].forEach((value) => {
      speeds.appendChild(segment(value + '×', Math.abs(current - value) < 0.001, async () => {
        settings = await write({ playback: { defaultSpeed: value } });
        render();
      }));
    });

    const quick = document.getElementById('quick');
    quick.textContent = '';
    pageRows().forEach((item) => {
      const row = el('div', { class: 'list-row', role: 'button', tabindex: '0', 'aria-pressed': String(!!item.on) }, [
        el('span', { class: 'row-label' }, [el('span', { text: item.label })]),
        el('span', { class: 'sw-track', 'aria-hidden': 'true' })
      ]);
      const fire = async () => { settings = await write(item.patch); render(); };
      row.addEventListener('click', fire);
      row.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); fire(); }
      });
      quick.appendChild(row);
    });
  }

  document.getElementById('master').addEventListener('change', async (ev) => {
    settings = await write({ enabled: ev.target.checked });
    render();
  });

  document.getElementById('open').addEventListener('click', () => {
    api.runtime.openOptionsPage();
    window.close();
  });

  Promise.all([read(), activePath()]).then(([loaded, path]) => {
    settings = loaded;
    pathname = path;
    lang = settings.locale === 'auto'
      ? (navigator.language.startsWith('ar') ? 'ar' : 'en')
      : settings.locale;
    render();
  });
})();
