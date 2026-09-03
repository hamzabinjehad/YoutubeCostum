(function () {
  'use strict';
  const Costum = self.Costum;

  /* Four gates, in the order they should fire. Each one is a different answer
   * to "not right now": a schedule you set once, a block you started just now,
   * a session you agreed to, and a pause before the page becomes usable. */

  /* Same Apple tokens as the panel, dark only — this is a full-screen cover on
     a page that is usually dark, and flashing white to block someone is the
     opposite of calming. The old palette here predated the design system: it
     used a different blue from every other surface, so the one screen that
     takes over the whole page was also the one that looked like another app. */
  const CSS = `
  :host { all: initial; }
  *, *::before, *::after { box-sizing: border-box; }

  .veil {
    position: fixed; inset: 0; z-index: 2147483002;
    background: #000000; color: #F5F5F7;
    display: grid; place-content: center; justify-items: center;
    gap: 14px; text-align: center;
    padding: calc(40px + env(safe-area-inset-top)) 28px calc(40px + env(safe-area-inset-bottom));
    font: 15px/1.6 -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    animation: veil-in .35s cubic-bezier(.32,.72,0,1);
  }
  @keyframes veil-in { from { opacity: 0; } }

  .veil b {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif;
    font-size: 27px; font-weight: 600; letter-spacing: -.021em; line-height: 1.2;
  }
  .veil p {
    margin: 0; color: rgba(235,235,245,.6); max-width: 32ch; font-size: 15px;
  }

  /* A number this large wants the light weight and fixed digit widths, so the
     countdown does not jitter as it runs down. */
  .count {
    font-size: 76px; font-weight: 200; line-height: 1;
    font-variant-numeric: tabular-nums; letter-spacing: -.04em;
    margin: 6px 0 2px;
  }

  .row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 10px; }

  button {
    font: inherit; font-size: 15px; cursor: pointer;
    min-height: 44px; padding: 11px 22px;
    border: 0; border-radius: 11px;
    background: rgba(118,118,128,.24); color: #F5F5F7;
    transition: background .18s cubic-bezier(.32,.72,0,1), transform .18s cubic-bezier(.32,.72,0,1);
  }
  button:hover { background: rgba(118,118,128,.36); }
  button:active { transform: scale(.97); }
  button.go { background: #0A84FF; color: #FFFFFF; font-weight: 590; }
  button.go:hover { background: #0A84FF; filter: brightness(1.1); }
  button:focus-visible {
    outline: 3px solid rgba(10,132,255,.6); outline-offset: 2px;
  }

  @media (max-width: 430px) {
    .veil b { font-size: 24px; }
    .count { font-size: 64px; }
    .row { flex-direction: column; align-self: stretch; width: min(320px, 100%); }
    button { width: 100%; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; }
    button:active { transform: none; }
  }
  `;

  const STR = {
    en: {
      scheduled: 'YouTube is closed right now', until: 'Your focus schedule runs until ',
      blocked: 'You blocked YouTube', backAt: 'Back at ',
      over: 'Your session is over', sessionWas: 'You gave yourself ',
      sure: 'Do you want to be here?', sureNote: 'You opened YouTube. Nothing has loaded yet.',
      pick: 'How long?', minutes: ' min', noLimit: 'No limit',
      wait: 'Take a breath', waitNote: 'The video starts on its own.',
      leave: 'Leave', enter: 'Continue', again: 'Start another'
    },
    ar: {
      scheduled: 'يوتيوب مسكّر هلأ', until: 'جلسة التركيز شغّالة لحد ',
      blocked: 'إنت حظرت يوتيوب', backAt: 'بيرجع الساعة ',
      over: 'خلصت جلستك', sessionWas: 'عطيت حالك ',
      sure: 'بدك تكون هون؟', sureNote: 'فتحت يوتيوب. لسا ما حمّل شي.',
      pick: 'قدّيش؟', minutes: ' دقيقة', noLimit: 'بلا حد',
      wait: 'خود نفس', waitNote: 'الفيديو رح يبلّش لحاله.',
      leave: 'اطلع', enter: 'كمّل', again: 'ابدأ جلسة جديدة'
    }
  };

  const SESSION_CHOICES = [5, 10, 15, 30, 60];

  let host = null;
  let shadow = null;
  let timer = null;
  let delayedFor = '';
  let confirmedFor = '';

  function strings(s) {
    const lang = s.locale === 'auto' ? (navigator.language.startsWith('ar') ? 'ar' : 'en') : s.locale;
    return STR[lang] || STR.en;
  }

  function minutes(hhmm) {
    const [h, m] = String(hhmm || '0:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  function withinSchedule(s) {
    if (!s.focus.scheduleEnabled) return false;
    const now = new Date();
    const at = now.getHours() * 60 + now.getMinutes();
    const from = minutes(s.focus.scheduleFrom);
    const to = minutes(s.focus.scheduleTo);
    return from <= to ? at >= from && at < to : at >= from || at < to;   // handles overnight windows
  }

  /* When the answer these gates give could change with nobody touching
   * anything.
   *
   * apply() runs on load and on a settings change, and nothing else. So a
   * fifteen-minute session ran until the next navigation, which on a
   * thirty-minute video is never — the one gate whose whole point is a clock
   * was the one gate that had none. The same held the other way: a schedule
   * starting at nine never closed a tab that was already open, and an expired
   * block left its veil up until something else happened.
   *
   * Pure, so the arithmetic can be checked without waiting for a clock.
   * Returns 0 when nothing is pending. */
  function nextGateAt(focus, now) {
    const marks = [];
    if (focus.sessionMinutes > 0 && focus.sessionEndsAt > now) marks.push(focus.sessionEndsAt);
    if (focus.blockUntil > now) marks.push(focus.blockUntil);
    if (focus.scheduleEnabled) {
      const today = new Date(now);
      const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      [minutes(focus.scheduleFrom), minutes(focus.scheduleTo)].forEach((edge) => {
        let when = midnight + edge * 60000;
        while (when <= now) when += 24 * 60 * 60000;   // the next one, today or tomorrow
        marks.push(when);
      });
    }
    return marks.length ? Math.min.apply(null, marks) : 0;
  }

  let gateTimer = null;

  function armGate(ctx) {
    clearTimeout(gateTimer);
    gateTimer = null;
    const when = nextGateAt(ctx.settings().focus, Date.now());
    if (!when) return;
    // A second past the mark, so the comparisons inside gate() are unambiguous.
    gateTimer = setTimeout(() => { gateTimer = null; gate(ctx); }, Math.max(250, when - Date.now() + 1000));
  }

  function clockOf(stamp) {
    return new Date(stamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function veil() {
    if (host) {
      const existing = shadow.querySelector('.veil');
      existing.textContent = '';
      return existing;
    }
    host = document.createElement('div');
    shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = CSS;
    const box = document.createElement('div');
    box.className = 'veil';
    shadow.append(style, box);
    document.documentElement.appendChild(host);
    return box;
  }

  function clear() {
    clearInterval(timer);
    timer = null;
    if (host) { host.remove(); host = null; shadow = null; }
  }

  function el(tag, text, cls) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  }

  /* On a screen whose whole job is to stop you, leaving is the encouraged
     action — so it takes the prominent style, and the keyboard lands on it.
     Continuing is still one click away; it just is not the default. */
  function leaveButton(label, primary) {
    const button = el('button', label, primary ? 'go' : '');
    button.addEventListener('click', () => { location.href = 'about:blank'; });
    if (primary) setTimeout(() => button.focus(), 0);
    return button;
  }

  function pause() {
    const video = document.querySelector('video');
    if (video) video.pause();
  }

  /* ---- the four gates ---- */

  function showStop(L, title, note) {
    const box = veil();
    box.append(el('b', title), el('p', note));
    const row = el('div', '', 'row');
    row.appendChild(leaveButton(L.leave, true));
    box.appendChild(row);
    pause();
  }

  /* A finished session used to be a wall with only a Leave button, and nothing
     anywhere cleared sessionEndsAt — so the veil came back on every visit,
     for good, and the only way out was to find "Session length" in the
     settings and zero it. The friction is the point, but a dead end is not:
     starting another session is deliberate, and it is reachable. */
  function showSessionOver(s, L, ctx) {
    const box = veil();
    box.append(el('b', L.over), el('p', L.sessionWas + s.focus.sessionMinutes + L.minutes));
    pause();

    const row = el('div', '', 'row');
    row.appendChild(leaveButton(L.leave, true));

    const again = el('button', L.again + ' · ' + s.focus.sessionMinutes + L.minutes);
    again.addEventListener('click', async () => {
      confirmedFor = location.host;   // the choice was just made here
      await ctx.patch({ focus: { sessionEndsAt: Date.now() + s.focus.sessionMinutes * 60000 } });
      clear();
    });
    row.appendChild(again);
    box.appendChild(row);
  }

  function showConfirm(s, L, ctx) {
    const box = veil();
    box.append(el('b', L.sure), el('p', L.sureNote));
    pause();

    const row = el('div', '', 'row');
    row.appendChild(leaveButton(L.leave));

    if (s.focus.sessionMinutes === 0) {
      const go = el('button', L.enter);
      go.className = 'go';
      go.addEventListener('click', () => { confirmedFor = location.host; clear(); });
      row.appendChild(go);
      box.appendChild(row);
      return;
    }

    // A session length was configured, so entering means starting the clock.
    box.appendChild(el('p', L.pick));
    const picks = el('div', '', 'row');
    SESSION_CHOICES.forEach((count) => {
      const button = el('button', count + L.minutes);
      if (count === s.focus.sessionMinutes) button.className = 'go';
      button.addEventListener('click', async () => {
        confirmedFor = location.host;
        await ctx.patch({ focus: { sessionEndsAt: Date.now() + count * 60000 } });
        clear();
      });
      picks.appendChild(button);
    });
    box.append(picks, row);
  }

  function showDelay(s, L, video) {
    const box = veil();
    box.append(el('b', L.wait));
    const count = el('div', String(s.focus.openDelay), 'count');
    box.append(count, el('p', L.waitNote));
    pause();

    let left = s.focus.openDelay;
    clearInterval(timer);
    timer = setInterval(() => {
      left -= 1;
      count.textContent = String(Math.max(0, left));
      if (left > 0) return;
      clear();
      if (video) video.play().catch(() => {});
    }, 1000);
  }

  /* Reads the settings itself rather than taking them as an argument, because
     the clock calls this too, and by then the settings apply() was handed are
     however old the last change was. */
  function gate(ctx) {
    const s = ctx.settings();
    const L = strings(s);
    const now = Date.now();

    armGate(ctx);

    if (withinSchedule(s)) {
      showStop(L, L.scheduled, L.until + s.focus.scheduleTo);
      return;
    }

    if (s.focus.blockUntil > now) {
      showStop(L, L.blocked, L.backAt + clockOf(s.focus.blockUntil));
      return;
    }

    if (s.focus.sessionEndsAt && s.focus.sessionEndsAt <= now && s.focus.sessionMinutes > 0) {
      showSessionOver(s, L, ctx);
      return;
    }

    if (host && !timer) clear();   // a gate just expired

    if (s.focus.entryConfirmation && confirmedFor !== location.host) {
      showConfirm(s, L, ctx);
      return;
    }

    const key = location.pathname + location.search;
    if (s.focus.openDelay > 0 && location.pathname.startsWith('/watch') && delayedFor !== key) {
      delayedFor = key;
      showDelay(s, L, ctx.video());
    }
  }

  Costum.register({
    name: 'focus',

    apply(s, ctx) { gate(ctx); },

    actions: {
      /* Wired to the panel: block yourself for a while, right now. */
      blockFor: (ctx, minutesAhead) => {
        const span = minutesAhead || 30;
        ctx.patch({ focus: { blockUntil: Date.now() + span * 60000 } });
      }
    }
  });

  // Exposed so the scheduling arithmetic can be tested without a clock.
  self.CostumFocusInternals = { nextGateAt, minutes };
})();
