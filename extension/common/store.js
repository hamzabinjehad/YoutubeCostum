/* Thin async wrapper over browser.storage.local, shared by popup and options. */
(function (root) {
  'use strict';
  const api = root.browser || root.chrome;

  async function read() {
    const bag = await api.storage.local.get('settings');
    return root.CostumDefaults.withDefaults(bag && bag.settings);
  }

  async function request(type, payload) {
    const reply = await api.runtime.sendMessage(Object.assign({ type }, payload));
    if (!reply || !reply.ok) throw new Error(reply && reply.error || 'Settings could not be saved');
    return reply.result;
  }

  function write(patch) { return request('settings.set', { patch }); }
  function replace(settings) { return request('settings.replace', { settings }); }

  root.CostumStore = { read, write, replace, request };
})(typeof self !== 'undefined' ? self : this);
