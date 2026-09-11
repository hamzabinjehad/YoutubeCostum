/* Costum for YouTube — background.
 * Safari gives us no devtools window for this context, so every failure is
 * caught and pushed into a rolling log the options page can display. */
(function () {
  'use strict';

  // As a service worker there is no host page to load defaults.js for us.
  if (!self.CostumDefaults && typeof importScripts === 'function') {
    importScripts('../common/defaults.js');
  }

  const api = self.browser || self.chrome;
  const { withDefaults, merge, forSync, fromSync } = self.CostumDefaults;

  const LOG_MAX = 200;
  const log = [];

  function note(level, where, detail) {
    log.push({ t: Date.now(), level, where, detail: String(detail) });
    if (log.length > LOG_MAX) log.splice(0, log.length - LOG_MAX);
  }

  async function readSettings() {
    try {
      const bag = await api.storage.local.get('settings');
      return withDefaults(bag && bag.settings);
    } catch (e) {
      note('error', 'readSettings', e);
      return withDefaults(null);
    }
  }

  async function writeSettings(patch) {
    const next = merge(await readSettings(), patch);
    await api.storage.local.set({ settings: next });
    pushToCloud(next);
    return next;
  }

  /* ---- iCloud sync via the containing app -------------------------------
   * The Swift host mirrors the payload into NSUbiquitousKeyValueStore.
   * There is no server and no subscription behind this. */
  function pushToCloud(settings) {
    if (!api.runtime.sendNativeMessage) return;
    try {
      api.runtime.sendNativeMessage('application.id', { type: 'sync.push', settings: forSync(settings) });
    } catch (e) {
      note('warn', 'pushToCloud', e);
    }
  }

  async function pullFromCloud() {
    if (!api.runtime.sendNativeMessage) return null;
    try {
      const reply = await api.runtime.sendNativeMessage('application.id', { type: 'sync.pull' });
      return reply && reply.settings ? reply.settings : null;
    } catch (e) {
      note('warn', 'pullFromCloud', e);
      return null;
    }
  }

  /* ---- SponsorBlock ----------------------------------------------------- */
  /* Bounded: one entry per video watched, and on macOS this context can live
     for a whole browsing session. A Map iterates in insertion order, so the
     first key is always the oldest. */
  const SPONSOR_CACHE_MAX = 200;
  const sponsorCache = new Map();

  function remember(key, segments) {
    sponsorCache.set(key, { t: Date.now(), segments });
    while (sponsorCache.size > SPONSOR_CACHE_MAX) {
      sponsorCache.delete(sponsorCache.keys().next().value);
    }
    return segments;
  }

  async function fetchSponsorSegments(videoId, categories) {
    const key = videoId + '|' + categories.join(',');
    const hit = sponsorCache.get(key);
    if (hit && Date.now() - hit.t < 30 * 60 * 1000) return hit.segments;

    const url = 'https://sponsor.ajay.app/api/skipSegments'
      + '?videoID=' + encodeURIComponent(videoId)
      + '&categories=' + encodeURIComponent(JSON.stringify(categories));

    const res = await fetch(url);
    if (res.status === 404) {
      return remember(key, []);
    }
    if (!res.ok) throw new Error('SponsorBlock HTTP ' + res.status);

    const segments = (await res.json())
      .filter((s) => Array.isArray(s.segment) && s.segment.length === 2)
      .map((s) => ({ start: s.segment[0], end: s.segment[1], category: s.category }));

    return remember(key, segments);
  }

  /* ---- AI summary, on the user's own key -------------------------------- */
  async function summarize({ apiKey, model, transcript, title, language }) {
    if (!apiKey) throw new Error('no-api-key');

    const want = language === 'ar' ? 'Arabic'
      : language === 'en' ? 'English'
      : 'the same language as the transcript';

    const body = {
      model: model || 'claude-opus-5',
      max_tokens: 1400,
      messages: [{
        role: 'user',
        content:
          'Summarize this YouTube transcript in ' + want + '.\n' +
          'Video title: ' + (title || 'unknown') + '\n\n' +
          'Return: a two-sentence overview, then 5-8 key points, each prefixed with its ' +
          'timestamp in [mm:ss] form taken from the transcript. No preamble.\n\n' +
          '--- TRANSCRIPT ---\n' + transcript
      }]
    };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error('Claude API HTTP ' + res.status + ': ' + (await res.text()).slice(0, 300));

    const data = await res.json();
    return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  }

  /* ---- home redirect, via declarativeNetRequest -------------------------
   * The rule itself is built in defaults.js, where it can be checked without a
   * browser. The filter is the part that goes wrong, and it goes wrong
   * silently: too broad a one redirects the whole site. */
  const { HOME_RULE_ID, homeRedirectPath, homeRedirectRule } = self.CostumDefaults;

  /* Matches the rule_resources id in the manifest; a test pins the pair. */
  const ADS_RULESET = 'ads';

  async function syncHomeRedirect(settings) {
    if (!api.declarativeNetRequest) return;
    const rule = homeRedirectRule(settings);
    const removeRuleIds = [HOME_RULE_ID];
    try {
      await api.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules: rule ? [rule] : [] });
      return;
    } catch (e) {
      if (!rule) { note('error', 'syncHomeRedirect', e); return; }
      note('warn', 'syncHomeRedirect', e);
    }
    /* `redirect.transform` is the form that keeps the host, so m.youtube.com
       stays where iPhone Safari already is. An engine that will not take it
       should still get the redirect rather than nothing: one that lands on www
       is worse than one that keeps the host, and better than one that never
       fires. */
    try {
      await api.declarativeNetRequest.updateDynamicRules({
        removeRuleIds,
        addRules: [Object.assign({}, rule, {
          action: { type: 'redirect', redirect: { url: 'https://www.youtube.com' + homeRedirectPath(settings) } }
        })]
      });
    } catch (e) {
      note('error', 'syncHomeRedirect', e);
    }
  }

  /* ---- ad request blocking, via the static ruleset ----------------------
   * The rules ship in rules/ads.json, declared disabled in the manifest, and
   * this is what turns them on. `updateEnabledRulesets` is the form Safari
   * supports — `updateDynamicRules` is not implemented there, which is why the
   * home redirect above needs its content-script fallback and this does not.
   *
   * The switch was in the settings page for a while with nothing behind it:
   * this function was called in three places and never defined, so every
   * settings change threw in the background and nothing was blocked. */
  async function syncAdRules(settings) {
    const dnr = api.declarativeNetRequest;
    if (!dnr || !dnr.updateEnabledRulesets) return;
    const wanted = !!(settings && settings.playback && settings.playback.blockAdRequests);
    try {
      const enabled = dnr.getEnabledRulesets ? await dnr.getEnabledRulesets() : [];
      const already = enabled.indexOf(ADS_RULESET) !== -1;
      if (already === wanted) return;
      await dnr.updateEnabledRulesets(wanted
        ? { enableRulesetIds: [ADS_RULESET] }
        : { disableRulesetIds: [ADS_RULESET] });
      note('info', 'syncAdRules', wanted ? 'enabled' : 'disabled');
    } catch (e) {
      note('error', 'syncAdRules', e);
    }
  }

  /* ---- message desk ----------------------------------------------------- */
  const handlers = {
    'settings.get': () => readSettings(),
    'settings.set': (msg) => writeSettings(msg.patch),
    'settings.replace': async (msg) => {
      const next = withDefaults(msg.settings);
      await api.storage.local.set({ settings: next });
      pushToCloud(next);
      return next;
    },
    'sponsors.get': (msg) => fetchSponsorSegments(msg.videoId, msg.categories),
    'summary.make': (msg) => summarize(msg),
    'cloud.pull': () => pullFromCloud(),
    'log.get': () => log.slice(-100),
    'ads.status': async () => {
      if (!api.declarativeNetRequest || !api.declarativeNetRequest.getEnabledRulesets) return { supported: false };
      try {
        return { supported: true, enabled: await api.declarativeNetRequest.getEnabledRulesets() };
      } catch (e) {
        return { supported: true, error: String(e) };
      }
    }
  };

  api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    const handler = msg && handlers[msg.type];
    if (!handler) return false;
    Promise.resolve(handler(msg, sender))
      .then((result) => sendResponse({ ok: true, result }))
      .catch((err) => {
        note('error', msg.type, err);
        sendResponse({ ok: false, error: String(err && err.message ? err.message : err) });
      });
    return true; // keep the channel open for the async reply
  });

  api.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.settings) return;
    const settings = withDefaults(changes.settings.newValue);
    syncHomeRedirect(settings);
    syncAdRules(settings);
  });

  api.runtime.onInstalled.addListener(async () => {
    const local = await readSettings();
    const cloud = await pullFromCloud();
    // fromSync keeps this device's own API key: the synced copy never carries
    // one, so a plain overwrite would erase it on every update.
    const settings = cloud ? fromSync(cloud, local) : local;
    await api.storage.local.set({ settings });
    syncHomeRedirect(settings);
    syncAdRules(settings);
  });

  readSettings().then((settings) => {
    syncHomeRedirect(settings);
    syncAdRules(settings);
  });
})();
