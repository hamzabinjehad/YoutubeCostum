(function () {
  'use strict';
  const Costum = self.Costum;

  let theaterTimer = null;
  function setTheater(on) {
    const flexy = document.querySelector('ytd-watch-flexy');
    if (!flexy) return;
    if (!!flexy.hasAttribute('theater') === on) return;
    const button = document.querySelector('.ytp-size-button');
    if (button) button.click();
  }

  function miniOnScroll(ctx) {
    if (window.__costumMini) return;
    window.__costumMini = true;

    const onScroll = () => {
      const s = ctx.settings();
      const root = document.documentElement;
      const player = document.querySelector('#player-container-outer, #player-theater-container');
      if (!s.enabled || !s.layout.miniOnScroll || !player || !location.pathname.startsWith('/watch')) {
        root.removeAttribute('costum-mini');
        return;
      }

      /* Measure only while the player is still in the flow. Once it is pinned
         its box is the pinned box, and holding the column open with that would
         let the page scroll up far enough to un-pin it again. */
      if (!root.hasAttribute('costum-mini')) {
        const height = player.getBoundingClientRect().height;
        if (height > 0) root.style.setProperty('--costum-mini-hold', height + 'px');
      }

      /* Ask the parent, not the player: once pinned, the player's own bottom is
         wherever it is parked, which is never "scrolled past". `#player` keeps
         the space the player gave up, so it is the one still travelling. */
      const holder = player.parentElement || player;
      // No usable height means no placeholder, and pinning without one is the
      // flicker described above — better to stay exactly as we are.
      const hold = root.style.getPropertyValue('--costum-mini-hold');
      root.toggleAttribute('costum-mini', !!hold && holder.getBoundingClientRect().bottom < 40);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('costum:navigate', onScroll);
  }

  Costum.register({
    name: 'layout',
    disable() {
      clearTimeout(theaterTimer);
      ['costum-cinema', 'costum-zen', 'costum-mini'].forEach((name) => document.documentElement.removeAttribute(name));
      document.documentElement.style.removeProperty('--costum-mini-hold');
    },
    apply(s, ctx) {
      clearTimeout(theaterTimer);
      miniOnScroll(ctx);
      if (!s.layout.miniOnScroll) document.documentElement.removeAttribute('costum-mini');
      document.documentElement.toggleAttribute('costum-cinema', !!s.layout.cinema);
      // Re-decided per navigation: boot sets it once, and leaving a watch page
      // must take the header back rather than leave a chromeless feed.
      document.documentElement.toggleAttribute(
        'costum-zen', !!s.layout.zen && location.pathname.startsWith('/watch'));
      if (s.layout.autoTheater && location.pathname.startsWith('/watch')) {
        theaterTimer = setTimeout(() => {
          if (ctx.settings().enabled && ctx.settings().layout.autoTheater && location.pathname.startsWith('/watch')) setTheater(true);
        }, 500);
      }
    },
    actions: {
      cinema: (ctx) => {
        const on = !ctx.settings().layout.cinema;
        ctx.patch({ layout: { cinema: on } });
        ctx.toast(on ? 'Cinema on' : 'Cinema off');
      },
      pip: async (ctx) => {
        const video = ctx.video();
        if (!video) return;
        try {
          /* Safari has its own presentation-mode API and predates the standard
             one; on iOS it is the only one there is. Checking it first is what
             makes this button work on the platform the extension ships to,
             rather than reporting "unavailable" on every Apple device. */
          if (typeof video.webkitSetPresentationMode === 'function' &&
              typeof video.webkitSupportsPresentationMode === 'function' &&
              video.webkitSupportsPresentationMode('picture-in-picture')) {
            const inPip = video.webkitPresentationMode === 'picture-in-picture';
            video.webkitSetPresentationMode(inPip ? 'inline' : 'picture-in-picture');
            return;
          }
          if (document.pictureInPictureElement) await document.exitPictureInPicture();
          else if (video.requestPictureInPicture) await video.requestPictureInPicture();
          else ctx.toast('Picture in Picture unavailable');
        } catch (e) {
          ctx.toast('Picture in Picture unavailable');
        }
      }
    }
  });
})();
