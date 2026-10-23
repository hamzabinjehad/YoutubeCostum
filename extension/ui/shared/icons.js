/* One tinted icon per surface, shared by the popup and the settings page.
 *
 * These are drawn here rather than pulled from SF Symbols: Apple licenses that
 * font for use in app UI on its platforms, not for redistribution inside an
 * extension bundle, and web content cannot reach the system symbol glyphs
 * anyway. So they follow the same drawing rules instead — a 24-unit square,
 * one stroke weight throughout, round caps and joins, and a solid fill only
 * where a symbol would be filled. The tints are the system palette, which is
 * what makes a list of nineteen rows scannable: you learn the colour before
 * you read the label. That only works if no two tiles in one Customize group
 * share a colour (Header and Layout were both light blue, Home and Channel
 * both orange), so a colour repeats only across groups. The Panel tile draws
 * the same three sliders as the brand mark and the button on the page.
 *
 * The pair of surfaces used to keep their own copies, and only one of them had
 * any icons at all. One list, so they cannot drift apart.
 */
(function (root) {
  'use strict';

  const ICONS = {
    player:        ['#0A84FF', '<circle cx="12" cy="12" r="8"/><path d="M10.4 8.6v6.8l5.4-3.4z" fill="currentColor" stroke="none"/>'],
    watch:         ['#5856D6', '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M10.4 9.6v4.8l4.4-2.4z" fill="currentColor" stroke="none"/>'],
    home:          ['#FF9500', '<path d="M4 10.6L12 4l8 6.6V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z"/>'],
    search:        ['#8E8E93', '<circle cx="11" cy="11" r="6"/><path d="M15.6 15.6L20 20"/>'],
    subscriptions: ['#FF3B30', '<rect x="3.5" y="8" width="17" height="11.5" rx="2.2"/><path d="M6 5.5h12M8 3h8"/>'],
    cards:         ['#34C759', '<rect x="3.5" y="5" width="17" height="9" rx="2" fill="currentColor" stroke="none"/><path d="M3.5 17.5h11M3.5 20.5h7"/>'],
    shorts:        ['#FF2D55', '<rect x="7.5" y="2.5" width="9" height="19" rx="3.2"/><path d="M11 9.6v4.8l3.6-2.4z" fill="currentColor" stroke="none"/>'],
    header:        ['#FF9500', '<path d="M5 4.5h14a2.5 2.5 0 0 1 2.5 2.5v2.5h-19V7A2.5 2.5 0 0 1 5 4.5z" fill="currentColor" stroke="none"/><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/>'],
    sidebar:       ['#A2845E', '<path d="M5 4.5h3.5v15H5A2.5 2.5 0 0 1 2.5 17V7A2.5 2.5 0 0 1 5 4.5z" fill="currentColor" stroke="none"/><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/>'],
    library:       ['#AF52DE', '<rect x="3.5" y="4.5" width="6" height="15" rx="1.6"/><rect x="11.5" y="4.5" width="4.5" height="15" rx="1.6"/><path d="M18.4 5.3l2.3 13"/>'],
    channel:       ['#32ADE6', '<circle cx="12" cy="8.6" r="3.6"/><path d="M5 20c0-3.7 3.1-5.6 7-5.6s7 1.9 7 5.6"/>'],
    everywhere:    ['#30B0C7', '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.3 2.3 3.5 5 3.5 8s-1.2 5.7-3.5 8c-2.3-2.3-3.5-5-3.5-8s1.2-5.7 3.5-8z"/>'],
    layout:        ['#AF52DE', '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M14 4.5v15M14 12h7"/>'],
    block:         ['#FF3B30', '<circle cx="12" cy="12" r="8"/><path d="M6.4 6.4l11.2 11.2"/>'],
    summary:       ['#BF5AF2', '<path d="M11 4l1.5 4.2L16.7 9.7l-4.2 1.5L11 15.4 9.5 11.2 5.3 9.7l4.2-1.5z"/><path d="M17.4 15.2l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8z"/>'],
    modesty:       ['#5AC8A8', '<path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6z"/><path d="M4.5 19.5l15-15"/>'],
    focus:         ['#5E5CE6', '<path d="M19.4 14.6A7.6 7.6 0 0 1 9.4 4.6a7.6 7.6 0 1 0 10 10z"/>'],
    panel:         ['#FF6482', '<path d="M5 7h14M5 12h14M5 17h14"/><circle cx="17" cy="7" r="2.4" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="2.4" fill="currentColor" stroke="none"/><circle cx="14" cy="17" r="2.4" fill="currentColor" stroke="none"/>'],
    keys:          ['#8E8E93', '<rect x="2" y="7" width="20" height="10" rx="2.2"/><path d="M6 10.6h.01M9.5 10.6h.01M13 10.6h.01M16.5 10.6h.01M8 13.9h8"/>']
  };

  const FALLBACK = ['#8E8E93', '<circle cx="12" cy="12" r="7"/>'];

  /* A rounded tile with the glyph knocked out in white, the way Settings draws
     them. `size` is the CSS class's business, not this function's. */
  function tile(key) {
    const [tint, inner] = ICONS[key] || FALLBACK;
    const span = document.createElement('span');
    span.className = 'tab-icon';
    span.style.setProperty('--tint', tint);
    span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" '
      + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
    return span;
  }

  root.CostumIcons = { ICONS, tile };
})(typeof self !== 'undefined' ? self : this);
