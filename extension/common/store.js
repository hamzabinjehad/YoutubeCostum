/* Thin async wrapper over browser.storage.local, shared by popup and options. */
(function (root) {
  'use strict';
  const api = root.browser || root.chrome;

  async function read() {
    const bag = await api.storage.local.get('settings');
    return root.CostumDefaults.withDefaults(bag && bag.settings);
  }

  async function write(patch) {
    const current = await read();
    const next = root.CostumDefaults.merge(current, patch);
    await api.storage.local.set({ settings: next });
    return next;
  }

  async function replace(settings) {
    const next = root.CostumDefaults.withDefaults(settings);
    await api.storage.local.set({ settings: next });
    return next;
  }

  root.CostumStore = { read, write, replace };
})(typeof self !== 'undefined' ? self : this);
