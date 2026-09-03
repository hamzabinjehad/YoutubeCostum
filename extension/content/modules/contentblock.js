(function () {
  'use strict';
  const Costum = self.Costum;

  const ITEM_SELECTOR = [
    'ytd-rich-item-renderer',
    'ytd-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-playlist-video-renderer',
    // The watch page's related list is this now, so without it keyword blocking
    // silently stopped applying in the one place people scroll most.
    'yt-lockup-view-model'
  ].join(',');

  let compiled = { keywords: [], channels: [], regex: null, signature: '' };

  function compile(s) {
    const signature = JSON.stringify([s.block.keywords, s.block.channels, s.block.regex]);
    if (signature === compiled.signature) return compiled;
    let regex = null;
    if (s.block.regex) {
      try { regex = new RegExp(s.block.regex, 'i'); } catch (e) { regex = null; }
    }
    compiled = {
      signature,
      regex,
      keywords: s.block.keywords.map((k) => k.toLowerCase()).filter(Boolean),
      channels: s.block.channels.map((c) => c.toLowerCase()).filter(Boolean)
    };
    return compiled;
  }

  function textOf(item) {
    const title = item.querySelector(
      '#video-title, yt-formatted-string#video-title, a#video-title-link, .yt-lockup-metadata-view-model__title');
    const channel = item.querySelector(
      'ytd-channel-name a, #channel-name a, #text.ytd-channel-name, .yt-content-metadata-view-model__metadata-text');
    return {
      title: (title && (title.title || title.textContent) || '').trim().toLowerCase(),
      channel: (channel && channel.textContent || '').trim().toLowerCase()
    };
  }

  function judge(item, rules) {
    const { title, channel } = textOf(item);
    if (!title && !channel) return false;
    if (rules.channels.some((c) => channel.includes(c))) return true;
    if (rules.keywords.some((k) => title.includes(k))) return true;
    if (rules.regex && (rules.regex.test(title) || rules.regex.test(channel))) return true;
    return false;
  }

  function sweep(root, s) {
    const rules = compile(s);
    if (!rules.keywords.length && !rules.channels.length && !rules.regex) {
      root.querySelectorAll('[costum-blocked]').forEach((el) => {
        el.removeAttribute('costum-blocked');
        el.style.display = '';
      });
      return;
    }
    const items = root.matches && root.matches(ITEM_SELECTOR) ? [root] : root.querySelectorAll(ITEM_SELECTOR);
    items.forEach((item) => {
      const blocked = judge(item, rules);
      if (blocked) {
        item.setAttribute('costum-blocked', '');
        item.style.display = 'none';
      } else if (item.hasAttribute('costum-blocked')) {
        item.removeAttribute('costum-blocked');
        item.style.display = '';
      }
    });
  }

  Costum.register({
    name: 'contentblock',
    apply(s) { sweep(document, s); },
    onMutation(nodes, s) {
      const rules = compile(s);
      if (!rules.keywords.length && !rules.channels.length && !rules.regex) return;
      nodes.forEach((n) => { if (n.nodeType === 1) sweep(n, s); });
    }
  });
})();
