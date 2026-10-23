/* Runs in the PAGE world, not the extension world.
 * Only three things genuinely need it: the YouTube player API object,
 * the player response (for captions), and the codec/format negotiation. */
(function () {
  'use strict';
  if (window.__costumBridge) return;
  window.__costumBridge = true;

  let config = { forceQuality: 'auto', blockHighFramerate: false, preferAvc: false };

  const send = (payload) => window.postMessage(Object.assign({ __costum: 'from-page' }, payload), '*');

  /* ---- format negotiation ---------------------------------------------- */

  const origIsTypeSupported = window.MediaSource && window.MediaSource.isTypeSupported;
  if (origIsTypeSupported) {
    window.MediaSource.isTypeSupported = function (type) {
      if (config.preferAvc && typeof type === 'string' && /vp0?9|vp8|av01/i.test(type)) return false;
      return origIsTypeSupported.call(this, type);
    };
  }

  function stripHighFramerate(playerResponse) {
    const sd = playerResponse && playerResponse.streamingData;
    if (!sd || !config.blockHighFramerate) return playerResponse;
    const keep = (f) => !(typeof f.fps === 'number' && f.fps > 30);
    if (Array.isArray(sd.adaptiveFormats)) {
      const filtered = sd.adaptiveFormats.filter(keep);
      // never leave the player with nothing to play
      if (filtered.some((f) => f.mimeType && f.mimeType.startsWith('video/'))) sd.adaptiveFormats = filtered;
    }
    if (Array.isArray(sd.formats)) sd.formats = sd.formats.filter(keep);
    return playerResponse;
  }

  // Initial page load: catch the response before the player consumes it.
  let initialResponse = window.ytInitialPlayerResponse;
  Object.defineProperty(window, 'ytInitialPlayerResponse', {
    configurable: true,
    get() { return initialResponse; },
    set(value) { initialResponse = stripHighFramerate(value); }
  });
  if (initialResponse) stripHighFramerate(initialResponse);

  /* SPA navigations: the player response arrives over the network instead.
   *
   * This is read on every navigation, not only when high framerates are being
   * stripped, because it is also the only fresh copy of the caption list.
   * `ytInitialPlayerResponse` still holds whatever video the tab was opened
   * on, so summaries used to fetch the *first* video's transcript for every
   * video watched after it — with the current title on top of it. */
  const PLAYER_ENDPOINT = /\/youtubei\/v1\/player/;
  const origFetch = window.fetch;
  if (origFetch) {
    window.fetch = async function (input, init) {
      const res = await origFetch.call(this, input, init);
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      if (!PLAYER_ENDPOINT.test(url)) return res;
      try {
        const json = await res.clone().json();
        stripHighFramerate(json);
        // videoDetails is what separates a player response from the other
        // things this endpoint answers with.
        if (json && json.videoDetails) initialResponse = json;
        // Only rebuilding the body when something was actually removed: the
        // response is large, and re-serialising it for nothing is a cost on
        // every navigation.
        if (!config.blockHighFramerate) return res;
        return new Response(JSON.stringify(json), { status: res.status, statusText: res.statusText, headers: res.headers });
      } catch (e) {
        return res;
      }
    };
  }

  /* ---- player API ------------------------------------------------------- */

  const player = () => document.getElementById('movie_player');

  /* Which world this file actually ended up in. It is injected as a script tag
     so it should be the page's, but "should be" is what diagnostics exists to
     stop trusting: in an isolated world the DOM looks identical while none of
     the page's own JavaScript is reachable, and forced quality, codec choice
     and captions all quietly do nothing.
     The player element is the honest test — the same object this file already
     calls getVideoData on. When there is no player to ask, it says so rather
     than guessing, and diagnostics only warns on a definite 'isolated'. */
  function world() {
    const p = player();
    if (p && typeof p.getVideoData === 'function') return 'page';
    if (typeof window.ytcfg !== 'undefined' || typeof window.yt !== 'undefined') return 'page';
    return p ? 'isolated' : 'unknown';
  }

  /* Measured on a live player, and the two directions behave differently:
   *
   *   lowering — setPlaybackQualityRange() works on its own. The adaptive
   *     algorithm picks inside the range, so a low ceiling is obeyed.
   *   raising  — it does not. Asking for 1080p left the video at 480p with
   *     hd1080 sitting in the available list, because the algorithm is still
   *     free to choose the bottom of the range and does so on a slow measure.
   *     setPlaybackQuality() is what actually pins it up.
   *
   * So both are called: the single argument moves it now, the range keeps the
   * algorithm from drifting back down afterwards. This is why "force quality"
   * looked broken — it only ever failed in the direction people use it.
   *
   * Nothing here reaches a quality the account is not served. Premium bitrates
   * arrive as a separate stream that is absent from the player response without
   * a subscription, so there is nothing for any client-side call to select. */
  let qualityRetries = 0;
  let qualityTimer = null;

  function applyQuality() {
    const p = player();
    if (!p || config.forceQuality === 'auto') return false;
    if (!p.getAvailableQualityLevels) return false;

    const available = p.getAvailableQualityLevels();
    if (!available || !available.length) return false;   // player not ready yet

    const order = ['highres', 'hd2880', 'hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny'];
    const wantIndex = order.indexOf(config.forceQuality);
    // the requested level, or the best one below it that is actually offered
    const pick = order.slice(wantIndex < 0 ? 0 : wantIndex).find((q) => available.includes(q));
    if (!pick) return false;

    try {
      if (p.setPlaybackQualityRange) p.setPlaybackQualityRange(pick, pick);
      if (p.setPlaybackQuality) p.setPlaybackQuality(pick);
    } catch (e) {
      return false;
    }
    return true;
  }

  /* The player reports no quality levels for the first moment after a
   * navigation, and the adaptive algorithm can pull the level back down once
   * playback settles. So the request is repeated until it sticks, then left
   * alone — polling forever would fight someone who picks a quality by hand. */
  function pressQuality() {
    clearTimeout(qualityTimer);
    qualityRetries = 0;
    const attempt = () => {
      if (config.forceQuality === 'auto') return;
      const p = player();
      applyQuality();
      const settled = p && p.getPlaybackQuality && p.getPlaybackQuality() === config.forceQuality;
      if (settled || ++qualityRetries > 8) return;
      qualityTimer = setTimeout(attempt, 700);
    };
    attempt();
  }

  function meta() {
    const r = initialResponse || {};
    const responseId = r.videoDetails && r.videoDetails.videoId;
    const urlId = new URLSearchParams(location.search).get('v') || '';
    const tracks = responseId === urlId ? (((r.captions || {}).playerCaptionsTracklistRenderer || {}).captionTracks) || [] : [];
    const p = player();
    const data = p && p.getVideoData ? p.getVideoData() : {};
    return {
      world: world(),
      videoId: urlId,
      captionVideoId: responseId || '',
      captionsReady: responseId === urlId,
      // The channel's stable id, for per-channel preferences; only trusted
      // when the response is the current video's.
      channelId: (responseId === urlId && r.videoDetails.channelId) || '',
      author: (responseId === urlId && r.videoDetails.author) || '',
      title: (data.video_id === urlId && data.title) || (responseId === urlId && r.videoDetails.title) || document.title.replace(/ - YouTube$/, ''),
      captionTracks: tracks.map((t) => ({
        baseUrl: t.baseUrl,
        lang: t.languageCode,
        kind: t.kind || '',
        name: (t.name && (t.name.simpleText || (t.name.runs || []).map((x) => x.text).join(''))) || ''
      }))
    };
  }

  window.addEventListener('message', (ev) => {
    if (ev.source !== window || !ev.data || ev.data.__costum !== 'to-page') return;
    const { cmd, payload, id } = ev.data;

    if (cmd === 'config') {
      config = Object.assign(config, payload);
      pressQuality();
      send({ id, result: true });
    } else if (cmd === 'applyQuality') {
      send({ id, result: applyQuality() });
    } else if (cmd === 'qualityState') {
      const p = player();
      send({ id, result: p && p.getPlaybackQuality ? {
        current: p.getPlaybackQuality(),
        preferred: p.getPreferredQuality ? p.getPreferredQuality() : null,
        available: p.getAvailableQualityLevels ? p.getAvailableQualityLevels() : [],
        wanted: config.forceQuality
      } : null });
    } else if (cmd === 'volume') {
      const p = player();
      const delta = Number(payload && payload.delta);
      if (!p || typeof p.getVolume !== 'function' || typeof p.setVolume !== 'function' || !Number.isFinite(delta)) {
        send({ id, result: null });
      } else {
        try {
          p.setVolume(Math.max(0, Math.min(100, p.getVolume() + Math.max(-5, Math.min(5, delta)))));
          send({ id, result: { volume: p.getVolume() } });
        } catch (e) { send({ id, result: null }); }
      }
    } else if (cmd === 'meta') {
      send({ id, result: meta() });
    } else if (cmd === 'formats') {
      // Only the progressive list carries a playable direct URL.
      const current = initialResponse && initialResponse.videoDetails && initialResponse.videoDetails.videoId === new URLSearchParams(location.search).get('v');
      const sd = (current && initialResponse.streamingData) || {};
      send({ id, result: (sd.formats || []).map((f) => ({ url: f.url, mimeType: f.mimeType, height: f.height, fps: f.fps })) });
    }
  });

  // The player is rebuilt on every SPA navigation; re-assert quality then.
  document.addEventListener('yt-navigate-finish', () => setTimeout(pressQuality, 300), true);
  document.addEventListener('yt-player-updated', () => setTimeout(pressQuality, 100), true);

  send({ ready: true });
})();
