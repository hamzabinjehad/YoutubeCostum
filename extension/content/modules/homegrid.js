(function () {
  'use strict';
  const Costum = self.Costum;

  /* Column count is a CSS variable YouTube already honours, so that lives in
   * common/css.js. Rows cannot be: how many cards make a row depends on the
   * window width and the layout in force, so the only reliable way to count a
   * row is to look at where the cards actually landed. */
  const ITEM = 'ytd-rich-item-renderer, ytm-rich-item-renderer';
  const MARK = 'costum-row-clipped';

  /* Columns applied everywhere a grid appears, rows only on the home page —
     the same control behaving differently depending on which feed you were
     looking at. Any page that renders the grid gets both now. */
  function onGridFeed() {
    return !!document.querySelector('ytd-rich-grid-renderer, ytm-rich-grid-renderer');
  }

  function onHome() {
    const path = location.pathname;
    return path === '/' || path === '';
  }

  function clip(limit) {
    const grid = document.querySelector('ytd-rich-grid-renderer, ytm-rich-grid-renderer');
    if (!grid) return;

    const items = [...grid.querySelectorAll(ITEM)];
    if (!items.length) return;

    // One read pass, then one write pass — never interleaved, or every card
    // costs a layout.
    const tops = items.map((item) => (item.hasAttribute(MARK) ? null : item.offsetTop));

    let row = 0;
    let lastTop = null;
    items.forEach((item, index) => {
      const top = tops[index];
      if (top === null) return;               // already hidden, no position to read
      if (lastTop === null || Math.abs(top - lastTop) > 4) {
        row += 1;
        lastTop = top;
      }
      if (row > limit) {
        item.setAttribute(MARK, '');
        item.style.setProperty('display', 'none', 'important');
      }
    });
  }

  function restore() {
    document.querySelectorAll('[' + MARK + ']').forEach((item) => {
      item.removeAttribute(MARK);
      item.style.removeProperty('display');
    });
  }

  function apply(s) {
    const limit = s.layout.homeRows;
    if (!limit || limit < 1 || !onGridFeed()) {
      if (document.querySelector('[' + MARK + ']')) restore();
      return;
    }
    clip(limit);
  }

  /* clip() reads offsetTop on every card, which forces a layout. Running that
     on every mutation batch means forcing one several times a second on the
     page with the most cards on it. The row count cannot change faster than
     the grid can render anyway. */
  let due = null;
  let ran = 0;

  function applySoon(s) {
    if (due) return;
    due = setTimeout(() => {
      due = null;
      ran = Date.now();
      apply(s);
    }, Math.max(0, 300 - (Date.now() - ran)));
  }

  /* The watch page's related column is a list, not a grid, so it is capped by
     counting rather than by measuring where rows fall. */
  const RELATED_MARK = 'costum-related-clipped';

  function clipRelated(limit) {
    const holder = document.querySelector('#related ytd-item-section-renderer, #related');
    if (!holder) return;
    const items = [...holder.querySelectorAll('yt-lockup-view-model, ytd-compact-video-renderer')];
    items.forEach((item, index) => {
      const over = index >= limit;
      if (over === item.hasAttribute(RELATED_MARK)) return;
      item.toggleAttribute(RELATED_MARK, over);
      if (over) item.style.setProperty('display', 'none', 'important');
      else item.style.removeProperty('display');
    });
  }

  function restoreRelated() {
    document.querySelectorAll('[' + RELATED_MARK + ']').forEach((item) => {
      item.removeAttribute(RELATED_MARK);
      item.style.removeProperty('display');
    });
  }

  Costum.register({
    name: 'homeGrid',
    apply(s) {
      apply(s);
      if (s.layout.relatedLimit > 0) clipRelated(s.layout.relatedLimit);
      else restoreRelated();
    },
    onMutation(nodes, s) {
      if (s.layout.homeRows > 0) applySoon(s);
      if (s.layout.relatedLimit > 0) clipRelated(s.layout.relatedLimit);
    }
  });
})();
