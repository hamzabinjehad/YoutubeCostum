(function () {
  'use strict';
  const Costum = self.Costum;

  // The hiding itself is CSS from common/css.js. This module only covers the
  // parts CSS cannot express: rewriting Shorts into normal watch pages, and
  // the home redirect when declarativeNetRequest is unavailable.
  function shortsAsVideo() {
    if (!location.pathname.startsWith('/shorts/')) return;
    const id = location.pathname.split('/')[2];
    if (id) location.replace('https://www.youtube.com/watch?v=' + id);
  }

  function rewriteShortsLinks(root) {
    root.querySelectorAll('a[href^="/shorts/"]').forEach((a) => {
      const id = a.getAttribute('href').split('/')[2];
      if (id) a.setAttribute('href', '/watch?v=' + id.split('?')[0]);
    });
  }

  Costum.register({
    name: 'declutter',
    apply(s) {
      if (s.declutter.shorts === 'asVideo') {
        shortsAsVideo();
        rewriteShortsLinks(document);
      }
      /* The fallback for when declarativeNetRequest is unavailable or refused
         the rule. Same path helper the rule uses, so the two cannot disagree
         about what "/" means — and location.origin rather than a hardcoded
         host, because on iPhone this page is m.youtube.com and sending it to
         www just bounces back. */
      const home = self.CostumDefaults.homeRedirectPath(s);
      if (home && (location.pathname === '/' || location.pathname === '')) {
        location.replace(location.origin + home);
      }
    },
    onMutation(nodes, s) {
      if (s.declutter.shorts !== 'asVideo') return;
      nodes.forEach((n) => { if (n.querySelectorAll) rewriteShortsLinks(n); });
    }
  });
})();
