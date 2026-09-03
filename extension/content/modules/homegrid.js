(function () {
  'use strict';
  const Costum = self.Costum;

  /* Column count is a CSS variable YouTube already honours, so that lives in
   * common/css.js. Rows cannot be: how many cards make a row depends on the
   * window width and the layout in force, so the only reliable way to count a
   * row is to look at where the cards actually landed. */
  const ITEM = 'ytd-rich-item-renderer, ytm-rich-item-renderer';
  const MARK = 'costum-row-clipped';

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
    if (!limit || limit < 1 || !onHome()) {
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

  Costum.register({
    name: 'homeGrid',
    apply(s) { apply(s); },
    onMutation(nodes, s) { if (s.layout.homeRows > 0) applySoon(s); }
  });
})();
