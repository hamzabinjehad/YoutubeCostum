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
    'yt-lockup-view-model',
    /* Mobile web (m.youtube.com). Search results and the watch page's
       related list are video-with-context cards (checked live), channel pages
       use compact cards, the home grid wraps its cards in rich items. */
    'ytm-video-with-context-renderer',
    'ytm-compact-video-renderer',
    'ytm-rich-item-renderer'
  ].join(',');

  const TITLE_SELECTOR = [
    '#video-title', 'yt-formatted-string#video-title', 'a#video-title-link',
    '.yt-lockup-metadata-view-model__title',
    '.media-item-headline', '.compact-media-item-headline', 'h3.media-item-headline',
    // Channel pages on m.youtube.com, checked live.
    '.YtmCompactMediaItemHeadline'
  ].join(',');

  const CHANNEL_SELECTOR = [
    'ytd-channel-name a', '#channel-name a', '#text.ytd-channel-name',
    '.yt-content-metadata-view-model__metadata-text',
    'ytm-badge-and-byline-renderer .yt-core-attributed-string', '.compact-media-item-byline',
    /* The mobile byline is "Channel • 24M views", one span per item. The
       .yt-core-attributed-string above was a guess from documentation: on live
       m.youtube.com it matched nothing, so blocking a channel by name never
       worked on an iPhone. The first item is the channel. */
    'ytm-badge-and-byline-renderer .ytmBadgeAndBylineRendererItemByline:first-child'
  ].join(',');

  // A link that names the channel by identity, where the card carries one.
  const CHANNEL_LINK = 'a[href*="/channel/UC"], a[href^="/@"], a[href*="youtube.com/@"]';

  let exemptions = new WeakMap();
  const reasons = new WeakMap();
  let judged = new WeakMap();   // item → the identity it was last judged at
  let compiled = { keywords: [], channels: [], exact: [], regex: null, signature: '' };
  let fullSweepDue = true;

  function compile(s) {
    const b = s.block;
    const signature = JSON.stringify([b.keywords, b.channels, b.exactChannels, b.regex]);
    if (signature === compiled.signature) return compiled;
    let regex = null;
    if (b.regex) {
      try { regex = new RegExp(b.regex, 'i'); } catch (e) { regex = null; }
    }
    const key = self.CostumDefaults.channelKey;
    compiled = {
      signature,
      regex,
      keywords: b.keywords.map((k) => k.toLowerCase()).filter(Boolean),
      channels: b.channels.map((c) => c.toLowerCase()).filter(Boolean),
      /* Exact entries are an id, a handle or a whole name. Ids and handles are
         normalised the way the card's link will be; names are compared whole. */
      exact: (b.exactChannels || []).map((entry) => {
        const text = String(entry || '').trim();
        if (!text) return null;
        const id = key(text.startsWith('UC') ? '/channel/' + text : text.startsWith('@') ? '/' + text : text);
        return id ? { id, label: text } : { name: text.toLowerCase(), label: text };
      }).filter(Boolean)
    };
    return compiled;
  }

  function textOf(item) {
    const title = item.querySelector(TITLE_SELECTOR);
    const channel = item.querySelector(CHANNEL_SELECTOR);
    const link = item.querySelector(CHANNEL_LINK);
    return {
      title: (title && (title.title || title.textContent) || '').trim().toLowerCase(),
      channel: (channel && channel.textContent || '').trim().toLowerCase(),
      channelId: link ? self.CostumDefaults.channelKey(link.getAttribute('href')) : ''
    };
  }

  /* Why a card is hidden: which kind of rule, and which entry. The exact
     rules go first because they are the most specific; text rules are
     labelled as such so the explanation never reads "channel X" when what
     matched was a name that merely contains X. */
  function judge(item, rules, facts) {
    const { title, channel, channelId } = facts || textOf(item);
    const exact = rules.exact.find((rule) => (rule.id && channelId && rule.id === channelId) || (rule.name && channel && rule.name === channel));
    if (exact) return { kind: 'channel', label: exact.label };
    const blockedChannel = rules.channels.find((c) => channel.includes(c));
    if (blockedChannel) return { kind: 'channelText', label: blockedChannel };
    const keyword = rules.keywords.find((k) => title.includes(k));
    if (keyword) return { kind: 'keyword', label: keyword };
    if (rules.regex && (rules.regex.test(title) || rules.regex.test(channel))) return { kind: 'regex', label: rules.regex.source };
    return null;
  }

  function hasRules(rules) {
    return !!(rules.keywords.length || rules.channels.length || rules.exact.length || rules.regex);
  }

  function restore() {
    document.querySelectorAll('[costum-blocked]').forEach((item) => item.removeAttribute('costum-blocked'));
    exemptions = new WeakMap();
    fullSweepDue = true;
  }

  function consider(item, rules) {
    const facts = textOf(item);
    const identity = JSON.stringify(facts);
    if (exemptions.get(item) === identity) return;
    // Same words as last time means the same verdict; a recycled card with
    // new words is judged afresh.
    if (judged.get(item) === identity && item.hasAttribute('costum-blocked') === !!reasons.get(item)) return;
    judged.set(item, identity);
    const reason = judge(item, rules, facts);
    if (reason) {
      item.setAttribute('costum-blocked', '');
      reasons.set(item, reason);
    } else {
      reasons.delete(item);
      if (item.hasAttribute('costum-blocked')) item.removeAttribute('costum-blocked');
    }
  }

  function sweep(root, s) {
    const rules = compile(s);
    if (!hasRules(rules)) {
      root.querySelectorAll('[costum-blocked]').forEach((el) => el.removeAttribute('costum-blocked'));
      return;
    }
    root.querySelectorAll(ITEM_SELECTOR).forEach((item) => consider(item, rules));
    const ancestor = root.closest && root.closest(ITEM_SELECTOR);
    if (ancestor) consider(ancestor, rules);
  }

  /* ---- bounded incremental work ----
     A mutation batch on YouTube can carry hundreds of nodes, nested — a
     section and every card in it. Cards are collected once, deduplicated,
     and judged up to a budget per frame; what is left waits for the next
     frame rather than blocking this one. Nothing here rescans the document. */
  const BUDGET = 250;
  let backlog = [];
  let backlogTimer = null;

  function collect(nodes) {
    const items = new Set();
    for (const node of nodes) {
      if (node.nodeType !== 1) continue;
      const inside = node.closest && node.closest(ITEM_SELECTOR);
      if (inside) { items.add(inside); continue; }
      // Bare text arriving inside a card: judge the card, not the text node.
      if (node.matches && node.matches(ITEM_SELECTOR)) items.add(node);
      else if (node.querySelectorAll) node.querySelectorAll(ITEM_SELECTOR).forEach((item) => items.add(item));
    }
    return items;
  }

  function drain(s) {
    backlogTimer = null;
    const rules = compile(s);
    if (!hasRules(rules)) { backlog = []; return; }
    const slice = backlog.splice(0, BUDGET);
    slice.forEach((item) => { if (item.isConnected) consider(item, rules); });
    if (backlog.length) backlogTimer = setTimeout(() => drain(self.CostumSettings || s), 0);
  }

  /* What is hidden on this page right now, for the panel: title, channel
     and the rule that did it, plus a way to show each one. */
  function blockedHere() {
    return [...document.querySelectorAll('[costum-blocked]')].map((item) => {
      const facts = textOf(item);
      const reason = reasons.get(item) || { kind: 'keyword', label: '' };
      return { item, title: facts.title, channel: facts.channel, reason };
    });
  }

  function reveal(item) {
    exemptions.set(item, JSON.stringify(textOf(item)));
    item.removeAttribute('costum-blocked');
  }

  const KINDS = {
    en: { channel: 'channel', channelText: 'channel name contains', keyword: 'title contains', regex: 'pattern' },
    ar: { channel: 'قناة', channelText: 'اسم القناة يحتوي', keyword: 'العنوان يحتوي', regex: 'نمط' }
  };
  function kinds(ctx) {
    const locale = ctx.settings().locale;
    return KINDS[locale === 'ar' || (locale === 'auto' && navigator.language.startsWith('ar')) ? 'ar' : 'en'];
  }

  Costum.register({
    name: 'contentblock',
    disable() { clearTimeout(backlogTimer); backlogTimer = null; backlog = []; restore(); },
    onNavigate: restore,
    apply(s) {
      const before = compiled.signature;
      compile(s);
      const changed = before !== compiled.signature;
      if (changed) { exemptions = new WeakMap(); judged = new WeakMap(); }
      // A whole-page pass only when the rules changed or a navigation cleared
      // everything; any other settings change leaves the feed alone.
      if (changed || fullSweepDue) { fullSweepDue = false; sweep(document, s); }
    },
    actions: {
      revealBlocked: (ctx) => {
        const items = blockedHere();
        const matched = [...new Set(items.map((entry) => entry.reason.label).filter(Boolean))].slice(0, 3);
        items.forEach((entry) => reveal(entry.item));
        ctx.toast((ctx.settings().locale === 'ar' ? 'تم إظهار ' : 'Revealed ') + items.length + (matched.length ? ' · ' + matched.join(', ') : ''));
      },
      /* The panel's list: each hidden card, why, and a button that shows it.
         Showing one exempts that card for as long as it keeps its words. */
      blockedList: (ctx) => {
        const K = kinds(ctx);
        const rows = blockedHere().map((entry) => ({
          title: entry.title || entry.channel || '?',
          note: K[entry.reason.kind] + (entry.reason.label ? ' “' + entry.reason.label + '”' : '') + (entry.channel && entry.title ? ' · ' + entry.channel : ''),
          act: () => reveal(entry.item)
        }));
        if (ctx.panel && ctx.panel.showList) ctx.panel.showList(rows);
        return rows.length;
      },
      /* From the watch page: this channel goes on the exact list, by id where
         the page offers one and by its whole name otherwise. */
      blockChannel: async (ctx) => {
        const here = ctx.channel ? ctx.channel() : null;
        if (!here || (!here.id && !here.name)) return ctx.toast(ctx.settings().locale === 'ar' ? 'لسه ما تعرّفنا على القناة' : 'Channel not identified yet');
        const current = ctx.settings().block.exactChannels || [];
        const add = [here.id, here.name].filter((entry) => entry && !current.includes(entry));
        if (add.length) await ctx.patch({ block: { exactChannels: current.concat(add) } });
        ctx.toast((ctx.settings().locale === 'ar' ? 'محظورة: ' : 'Blocked: ') + (here.name || here.id));
      }
    },
    onMutation(nodes, s) {
      const rules = compile(s);
      if (!hasRules(rules)) return;
      const items = collect(nodes);
      if (!items.size) return;
      backlog.push(...items);
      if (backlog.length > BUDGET * 4) backlog = backlog.slice(-BUDGET * 4);   // never let a burst pile up unbounded
      drain(s);
    }
  });

  self.CostumBlockInternals = { judge, compile, collect, textOf, BUDGET };
})();
