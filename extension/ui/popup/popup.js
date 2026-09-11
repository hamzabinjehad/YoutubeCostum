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
  const { applyProfile, merge } = self.CostumDefaults;
  const { SPEC, surfaceName: nameOfSurface } = self.CostumSpec;
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
      locked: 'Locked by password', noTab: 'Open a YouTube tab for page controls',
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
      moreProfiles: 'Other profiles', yours: 'Your settings',
      exportLabel: 'Export', importLabel: 'Import', resetLabel: 'Reset all',
      resetBody: 'Every switch, slider and list goes back to the way it shipped. This cannot be undone.',
      resetGo: 'Reset', cancelLabel: 'Cancel',
      imported: 'Settings imported', wasReset: 'Everything reset',
      badFile: 'That file is not a Costum settings export'
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
      locked: 'مقفول بكلمة سر', noTab: 'افتح تبويب يوتيوب لتشوف تحكّمات الصفحة',
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
      moreProfiles: 'بروفايلات تانية', yours: 'إعداداتك',
      exportLabel: 'تصدير', importLabel: 'استيراد', resetLabel: 'إرجاع الكل',
      resetBody: 'كل مفتاح وسلايدر وقائمة بترجع مثل ما إجت. ما في تراجع عن هالخطوة.',
      resetGo: 'إرجاع', cancelLabel: 'إلغاء',
      imported: 'انستوردت الإعدادات', wasReset: 'رجع كل شي للأصل',
      badFile: 'هاد الملف مش ملف إعدادات مصدّر من Costum'
    }
  };

  let settings = null;
  let lang = 'en';
  let drill = null;      // which surface is open, or null for the root list
  let query = '';        // search text, which cuts across every surface
  let lastScroll = 0;    // where the root list was, so back returns there
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


  const at = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const patchOf = (path, value) => path.split('.').reverse().reduce((acc, k) => ({ [k]: acc }), value);
  const labelOf = (field) => (field[lang] || field.en);

  async function save(path, value) {
    settings = await write(patchOf(path, value));
    render();
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
  function stacked(title, ...controls) {
    return el('div', { class: 'stack-row' },
      [el('div', { class: 'row-head' }, [el('span', { class: 'row-label', text: title })]),
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
  function keyRow(field, title, value) {
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
    return stacked(title, cap);
  }

  function fieldRow(field) {
    const [title] = labelOf(field);
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
        class: 'list-row', role: 'button', tabindex: '0', 'aria-pressed': String(on)
      }, [
        el('span', { class: 'row-label' }, [el('span', { text: title })]),
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
        field.options.map(([v, label]) => segment(
          label,
          field.numeric ? Number(v) === Number(value) : v === value,
          () => save(field.path, field.numeric ? Number(v) : v)
        )));
      // Whether it shares a line with the label is a question about how wide
      // the labels are, which only the layout can answer — so the row wraps
      // and the CSS decides. Counting the options was a guess, and it was
      // wrong at three and at two.
      return el('div', { class: 'list-row' },
        [el('span', { class: 'row-label', text: title }), control]);
    }

    /* ---- typed values: a line, a list, a time, a stylesheet ---- */
    if (field.type === 'text' || field.type === 'password' || field.type === 'time') {
      const input = el('input', { type: field.type, value: value || '' });
      if (field.placeholder) input.placeholder = field.placeholder;
      input.addEventListener('change', () => save(field.path, input.value.trim()));
      return stacked(title, input);
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
      return stacked(title, input);
    }

    if (field.type === 'list') {
      const area = el('textarea', { rows: '4' });
      area.value = (value || []).join('\n');
      if (field.placeholder) area.placeholder = field.placeholder;
      area.addEventListener('change',
        () => save(field.path, self.CostumFields.splitLines(area.value)));
      return stacked(title, area);
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
      return stacked(title, area, status);
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
      return stacked(title, box);
    }

    if (field.type === 'blockNow') return blockRow(field, title, value);
    if (field.type === 'lock') return lockRow(field, title, value);
    if (field.type === 'key') return keyRow(field, title, value);

    // range and ticks
    const out = el('span', { class: 'row-value' });
    const min = field.type === 'ticks' ? field.min : field.min;
    const max = field.type === 'ticks' ? field.max : field.max;
    const step = field.type === 'ticks' ? 1 : field.step;
    const show = (v) => {
      out.textContent = field.type === 'ticks'
        ? (Number(v) === 0 ? L().auto : String(v))
        : (field.fmt ? field.fmt(Number(v)) : String(v));
    };
    const input = el('input', { type: 'range', min, max, step, value: Number(value) });
    show(Number(value));
    input.addEventListener('input', () => show(Number(input.value)));
    input.addEventListener('change', () => save(field.path, Number(input.value)));
    return el('div', { class: 'stack-row' }, [
      el('div', { class: 'row-head' }, [el('span', { class: 'row-label', text: title }), out]),
      input
    ]);
  }

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

    const body = document.getElementById('drill-body');
    body.textContent = '';

    let list = null;
    spec.forEach((field) => {
      if (field.heading) {
        const state = groupState(spec, spec.indexOf(field) + 1);
        const title = el('div', { class: 'group-title' }, [
          el('span', { text: labelOf(field) })
        ]);
        if (state.total) {
          const count = el('span', { class: 'group-count', text: state.on + ' / ' + state.total });
          if (state.on) count.setAttribute('data-on', '');
          title.appendChild(count);
        }
        body.appendChild(title);
        list = el('div', { class: 'list' });
        body.appendChild(list);
        return;
      }
      if (!list) { list = el('div', { class: 'list' }); body.appendChild(list); }
      list.appendChild(fieldRow(field));
    });
  }

  const surfaceName = (key) => nameOfSurface(key, lang);


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

  function searchHits(text) {
    const matches = matcher(text.trim().toLowerCase());
    const hits = [];
    Object.keys(SPEC).forEach((key) => {
      (SPEC[key] || []).forEach((field) => {
        if (field.heading || !field.path) return;
        const [title, hint] = labelOf(field);
        const hay = (title + ' ' + (hint || '') + ' ' + field.path).toLowerCase();
        if (matches(hay)) hits.push({ key, field, title });
      });
    });
    return hits;
  }

  function surfaceHits(text) {
    const matches = matcher(text.trim().toLowerCase());
    return Object.keys(SPEC).filter((key) => matches(surfaceName(key).toLowerCase()));
  }

  function renderSearch() {
    const t = L();
    const list = document.getElementById('search-results');
    const surfaces = document.getElementById('surface-list');
    const empty = document.getElementById('no-hits');

    const searching = query.trim().length > 0;
    // Results are an answer to a question, not a place with a footer.
    const foot = document.getElementById('root-footer');
    if (foot) foot.hidden = searching;
    list.hidden = !searching;
    surfaces.hidden = searching;
    empty.hidden = true;
    if (!searching) return;

    const matchedSurfaces = surfaceHits(query);
    const hits = searchHits(query).slice(0, 40);
    list.textContent = '';

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

    hits.forEach(({ key, field, title }) => {
      const row = fieldRow(field);
      // A result out of context needs to say where it came from.
      const label = row.querySelector('.row-label');
      if (label) label.appendChild(el('small', { class: 'result-where', text: surfaceName(key) }));
      list.appendChild(row);
    });
  }

  function render() {
    const t = L();
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Two levels in one popover: the root, or one surface pushed over it.
    const inDrill = drill !== null && SPEC[drill];
    document.getElementById('drill').hidden = !inDrill;
    /* The footer belongs to the root list. It used to stay behind when the
       drill opened over it, so "Your settings — Export, Import, Reset all" sat
       under every one of the nineteen surfaces. */
    ['surfaces', 'page-section', 'root-footer'].forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.hidden = inDrill;
    });
    document.querySelector('main').hidden = inDrill;
    if (inDrill) { renderDrill(); return; }
    // The state line says what is true rather than leaving the switch to imply it.
    document.getElementById('state').textContent = !settings.enabled ? t.offState
      : (pathname === null ? t.onGeneral : t.onHere);
    document.getElementById('label-profiles').textContent = t.profiles;
    document.getElementById('label-yours').textContent = t.yours;
    document.getElementById('export').textContent = t.exportLabel;
    document.getElementById('import').textContent = t.importLabel;
    document.getElementById('reset').textContent = t.resetLabel;
    document.getElementById('reset-body').textContent = t.resetBody;
    document.getElementById('reset-go').textContent = t.resetGo;
    document.getElementById('reset-cancel').textContent = t.cancelLabel;
    document.getElementById('label-speed').textContent = t.speed;
    // With no YouTube tab in front, the rows that remain are the ones that
    // apply everywhere — so the heading says that instead of lying about "this
    // page".
    document.getElementById('label-page').textContent = pathname === null ? t.everywhere : t.page;
    document.getElementById('label-all').textContent = t.all;

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
      settings = await replace(applyProfile(settings, settings.profile === key ? 'default' : key));
      render();
    };
    const profiles = document.getElementById('profiles');
    profiles.textContent = '';
    profiles.appendChild(segment(t.recommended, settings.profile === 'recommended',
      pick('recommended'), t.undoHint));

    const rest = [['study', t.study], ['music', t.music], ['evening', t.evening]];
    const restBox = document.getElementById('profiles-rest');
    restBox.textContent = '';
    rest.forEach(([key, label]) => {
      restBox.appendChild(segment(label, settings.profile === key, pick(key), t.undoHint));
    });
    const more = document.getElementById('more-profiles');
    document.getElementById('more-profiles-label').textContent = t.moreProfiles;
    if (rest.some(([key]) => settings.profile === key)) more.open = true;

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

    const list = document.getElementById('surface-list');
    list.textContent = '';
    surfaceKeys().forEach((key) => {
      const state = surfaceState(key);
      const count = el('span', {
        class: 'row-count',
        text: state.on ? state.on + ' / ' + state.total : String(state.total)
      });
      if (state.on) count.setAttribute('data-on', '');

      const row = el('div', { class: 'list-row', role: 'button', tabindex: '0' }, [
        self.CostumIcons.tile(key),
        el('span', { class: 'row-label' }, [el('span', { text: surfaceName(key) })]),
        count,
        el('span', { class: 'chevron', 'aria-hidden': 'true' })
      ]);
      const go = () => {
        const box = document.getElementById('scroll');
        lastScroll = box ? box.scrollTop : 0;
        drill = key;
        render();
        const inner = document.getElementById('drill-scroll');
        if (inner) inner.scrollTop = 0;
      };
      row.addEventListener('click', go);
      row.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); }
      });
      list.appendChild(row);
    });

    const search = document.getElementById('search');
    search.placeholder = t.searchPlaceholder;
    if (search.value !== query) search.value = query;
    renderSearch();
  }

  document.getElementById('master').addEventListener('change', async (ev) => {
    settings = await write({ enabled: ev.target.checked });
    render();
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
  function say(message) {
    const hint = document.getElementById('hint');
    hint.textContent = message;
    setTimeout(() => { if (hint.textContent === message) hint.textContent = ''; }, 2600);
  }

  document.getElementById('export').addEventListener('click', () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' }));
    const a = el('a', { href: url, download: 'costum-settings.json' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  });

  document.getElementById('import').addEventListener('click', () => {
    const picker = el('input', { type: 'file', accept: 'application/json' });
    picker.addEventListener('change', async () => {
      const file = picker.files && picker.files[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        // A JSON file is not a settings file. Anything without the shape gets
        // refused rather than merged into a half-configured extension.
        if (!parsed || typeof parsed !== 'object' || !parsed.declutter) throw new Error('shape');
        settings = await replace(parsed);
        render();
        say(L().imported);
      } catch (e) {
        say(L().badFile);
      }
    });
    picker.click();
  });

  const resetBox = document.getElementById('reset-confirm');
  document.getElementById('reset').addEventListener('click', () => {
    resetBox.hidden = !resetBox.hidden;
  });
  document.getElementById('reset-cancel').addEventListener('click', () => {
    resetBox.hidden = true;
  });
  document.getElementById('reset-go').addEventListener('click', async () => {
    settings = await replace({});
    resetBox.hidden = true;
    render();
    say(L().wasReset);
  });

  document.getElementById('search').addEventListener('input', (ev) => {
    query = ev.target.value;
    /* Pinning search made it reachable from inside a surface, where its results
       render into a hidden element: the field accepted typing and nothing
       happened. A search field you can always see has to always work, so a
       query steps back out to the results. */
    if (drill !== null && query.trim()) { drill = null; render(); return; }
    renderSearch();
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
