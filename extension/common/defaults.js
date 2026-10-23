/* Costum for YouTube — the single source of truth for settings.
 * Every module reads from one object and knows how to switch itself off,
 * so a YouTube DOM change breaks one feature instead of the extension. */
(function (root) {
  'use strict';

  const DEFAULTS = {
    enabled: true,
    locale: 'auto',          // auto | en | ar
    profile: 'default',      // default | study | music | evening

    playback: {
      defaultSpeed: 1,
      speedPresets: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3],
      speedStep: 0.05,
      wheelOnPlayer: 'none', // none | speed | volume
      rememberSpeed: true,
      musicSpeed: 0,         // 0 = don't override on music videos
      forceQuality: 'auto',  // auto | highres | hd2160 | hd1440 | hd1080 | hd720 | large | medium
      blockHighFramerate: false,
      preferAvc: false,
      autoplay: 'default',   // default | pause | play
      pauseBackgroundTabs: false,
      skipAds: false,        // click Skip the moment it appears; off by default
      blockAdRequests: false,// stop ad requests at the network layer
      nativePlayer: false,   // hand the video to Safari's own player
      loop: { enabled: false, start: null, end: null, videoId: '' }
    },

    audio: {
      boost: 1,              // 1x .. 10x
      bass: 0,               // dB, -12 .. +12
      normalize: false,
      monoDownmix: false
    },

    picture: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sharpen: 0,
      invert: false
    },

    layout: {
      zen: false,            // one switch: the video and nothing else
      cinema: false,
      cinemaDim: 70,         // % dim of surroundings
      widePlayer: false,
      fitToWindow: false,
      autoTheater: false,
      miniOnScroll: false,
      hideScrollbar: false,
      homeColumns: 0,        // 0 = YouTube's own responsive count
      homeRows: 0,           // 0 = however many rows YouTube wants to load
      feedWidth: 0,          // px cap on the grid; 0 = full width
      cardMinWidth: 0,       // px floor on a card; bigger means fewer, larger
      rowGap: 0,             // px between rows; 0 = YouTube's 32
      relatedLimit: 0        // how many related videos to keep; 0 = all
    },

    /* Grouped by the YouTube page each control acts on, because that is how
     * people actually think about clutter: "the watch page is noisy", not
     * "element 37 is noisy". The panel shows the group for the page you are on. */
    declutter: {
      shorts: 'show',        // show | hide | asVideo — the headline control
      shortsScroll: true,    // false stops the endless swipe between Shorts
      thumbnails: 'normal',  // normal | grayscale | blur | hide
      font: '',              // '' keeps YouTube's own face
      titleCount: false,     // strip the "(3)" YouTube puts in the tab title
      customCss: '',         // the escape hatch for whatever 231 switches missed
      redirectHome: '',      // e.g. /feed/subscriptions

      global: {
        popups: false,
        bannerAds: false,
        infiniteScroll: false,
        notifications: false,
        merchShelf: false
      },

      watch: {
        comments: false,
        related: false,
        relatedCategories: false,
        liveChat: false,
        endScreens: false,
        infoCards: false,
        playNext: false,
        moreFromChannel: false,
        shortsInDescription: false,
        fundraiser: false,
        actionBar: false,
        subscribe: false,
        join: false,
        likeDislike: false,
        videoTitle: false,
        channelInfo: false,
        subscriberCount: false,
        viewsAndDate: false,
        description: false,
        commentsCount: false,
        commentsSort: false,
        commentAvatar: false,
        commentAuthor: false,
        commentTime: false,
        commentVotes: false,
        commentReply: false,
        commentReplies: false,
        playButton: false,
        volumeButton: false,
        captionsButton: false,
        settingsButton: false,
        theaterButton: false,
        fullscreenButton: false,
        autoplayToggle: false,
        chaptersButton: false,
        gradientBottom: false,
        gradientTop: false,
        videoTime: false,
        heatmap: false,
        paidPromotion: false
      },

      home: {
        feed: false,
        chips: false,        // For you, Trending, and the rest of the chip bar
        mixes: false,
        playlists: false,
        news: false,         // Breaking news, trending and the other editorial shelves
        banners: false       // New to you, Premium pitches, surveys
      },

      search: {
        suggestions: false,
        previousSearches: false,
        chips: false,
        filters: false,
        aboutResults: false,
        peopleAlsoSearch: false,
        promotedVideos: false,
        promotedWebsites: false,
        shelves: false,
        channels: false,
        playlists: false,
        rightSidebar: false,
        infiniteScroll: false
      },

      shortsPlayer: {
        overlay: false,
        title: false,
        channelBar: false,
        avatar: false,
        actions: false,
        navButtons: false,
        subscribe: false,
        description: false,
        menu: false
      },

      cards: {
        title: false,
        channelAvatar: false,
        channelName: false,
        meta: false,
        duration: false,
        menu: false,
        snippet: false,
        badges: false,
        progress: false,
        hoverPlay: false,
        cornerRadius: false,
        grayscaleAvatar: false
      },

      subscriptions: {
        watched: false,
        livePremiere: false,
        upcoming: false,
        shorts: false
      },

      header: {
        hideAll: false,
        logo: false,
        logoWord: false,
        logoLink: false,
        countryCode: false,
        searchBar: false,
        searchSuggestions: false,
        previousSearches: false,
        voiceSearch: false,
        create: false,
        notifications: false,
        notificationsCount: false,
        signIn: false,
        avatar: false
      },

      sidebar: {
        hideAll: false,
        burger: false,
        icons: false,
        home: false,
        shortsButton: false,
        subscriptionsButton: false,
        music: false,
        kids: false,
        you: false,
        history: false,
        playlists: false,
        yourVideos: false,
        watchLater: false,
        liked: false,
        downloads: false,
        clips: false,
        trending: false,
        movies: false,
        gaming: false,
        podcasts: false,
        premium: false,
        settingsEntry: false,
        reportHistory: false,
        help: false,
        feedback: false,
        explore: false,
        subscriptions: false,
        moreFromYouTube: false,
        signIn: false,
        footer: false,
        subAvatars: false,
        subDots: false,
        showMore: false
      },

      library: {
        avatar: false,
        history: false,
        watchLater: false,
        playlists: false,
        likedVideos: false,
        clips: false
      },

      channel: {
        hideBanner: false,
        avatar: false,
        name: false,
        metadata: false,
        tagline: false,
        links: false,
        subscribe: false,
        join: false,
        tabBar: false,
        tabHome: false,
        tabVideos: false,
        tabShows: false,
        tabPlaylists: false,
        featured: false,
        shelves: false,
        shortsShelf: false,
        grayscaleBanner: false,
        grayscaleAvatar: false,
        podcasts: false,
        community: false,
        live: false,
        shortsTab: false,
        store: false,
        liveSection: false,
        shortsSection: false
      }
    },

    /* A modesty filter, in the sense HaramBlur means it: covering imagery of
     * people so the eye is not caught by it. This is a self-applied filter —
     * it changes only what the person who switched it on sees, on their own
     * device, and nothing about it leaves the machine.
     *
     * It blurs imagery wholesale rather than classifying who is in it. That is
     * a deliberate limit, not an oversight: telling men from women needs a
     * face-detection and classification model running per frame, which means
     * megabytes of weights and continuous inference on a phone. See the note
     * in the settings text. */
    modesty: {
      video: 'off',      // off | blur | audio  — audio hides the picture entirely
      images: 'off',     // off | blur | hide   — thumbnails, avatars, banners
      strength: 16,      // px of blur, 4..40
      reveal: 'hover'    // hover | never — whether an image uncovers when pointed at
    },

    block: {
      keywords: [],          // title contains — text matching
      channels: [],          // channel name contains — text matching
      exactChannels: [],     // a channel id (UC…), an @handle, or a whole channel name
      regex: '',
      hideWatched: false
    },

    sponsors: {
      enabled: false,        // off by default — see App Store review note
      categories: ['sponsor', 'selfpromo', 'interaction'],
      showToast: true
    },

    summary: {
      enabled: false,
      pageButton: false,     // put a Summarize button next to Like and Share
      apiKey: '',
      model: 'claude-opus-5',
      language: 'auto'       // auto | ar | en
    },

    focus: {
      passwordHash: '',
      scheduleEnabled: false,
      scheduleFrom: '09:00',
      scheduleTo: '17:00',
      openDelay: 0,          // seconds before the page becomes usable
      blockUntil: 0,         // epoch ms — a block you started yourself
      entryConfirmation: false,
      sessionMinutes: 0,     // 0 = no session limit; otherwise pick before entering
      sessionEndsAt: 0       // epoch ms — set when a session starts
    },

    shortcuts: {
      speedUp: 'Shift+Period',
      speedDown: 'Shift+Comma',
      speedReset: 'Shift+Digit0',
      volumeUp: 'Shift+ArrowUp',
      volumeDown: 'Shift+ArrowDown',
      togglePanel: 'Shift+KeyC',
      screenshot: 'Shift+KeyS',
      cinema: 'Shift+KeyD',
      pip: 'Shift+KeyP',
      loopStart: 'Shift+BracketLeft',
      loopEnd: 'Shift+BracketRight',
      summarize: 'Shift+KeyM',
      bookmark: 'Shift+KeyB'
    },

    panel: { showButton: true, corner: 'bottom-right' },

    /* Modes you saved yourself, beside the four built in. Each holds only
       what differed from the defaults when it was saved — see MODE_SCOPE. */
    customModes: [],       // [{ id, name, patch, createdAt, updatedAt }]

    /* Per-channel preferences, keyed by the channel's stable id (UC…) or, when
       that is not on the page, its @handle. Never by display name alone: names
       collide and change. Each entry carries the parts it overrides — a
       speed, the sound settings, the watch-page clutter switches — and nothing
       else. See withChannel for how they combine with everything else. */
    channelPrefs: {}       // { [channelId]: { name, speed, audio, watch, updatedAt } }
  };

  const PROFILES = {
    recommended: {
      declutter: {
        shorts: 'hide',
        global: { infiniteScroll: true },
        watch: { related: true, endScreens: true },
        home: { chips: true }
      }
    },
    study:   { playback: { defaultSpeed: 1.5 }, declutter: { shorts: 'hide', watch: { comments: true, related: true }, home: { feed: true }, global: { infiniteScroll: true } }, sponsors: { enabled: true } },
    music:   { playback: { defaultSpeed: 1 },   audio: { normalize: true }, declutter: { watch: { related: false, comments: false } } },
    evening: { picture: { brightness: 85, saturation: 90 }, layout: { cinema: true }, declutter: { shorts: 'hide' } }
  };

  function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  /* Deep-merge stored values over defaults so a new release never
   * loses settings and never crashes on a key added later. */
  function merge(base, patch) {
    const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    if (!isPlainObject(patch)) return out;
    for (const key of Object.keys(patch)) {
      const b = out[key];
      const p = patch[key];
      out[key] = isPlainObject(b) && isPlainObject(p) ? merge(b, p) : p;
    }
    return out;
  }

  /* Model ids that were offered once and have since been renamed by the
     provider. Read forward here so a stored choice keeps working and the
     select in the popover still has something to point at. Ids are exact
     strings from Anthropic's model table — never built by hand. */
  const MODEL_ALIASES = { 'claude-haiku-4-5-20251001': 'claude-haiku-4-5' };

  function withDefaults(stored) {
    const out = merge(DEFAULTS, stored || {});
    if (out.summary && MODEL_ALIASES[out.summary.model]) out.summary = merge(out.summary, { model: MODEL_ALIASES[out.summary.model] });
    return out;
  }

  /* Every leaf path a patch touches. */
  function leafPaths(obj, prefix) {
    const out = [];
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      const path = prefix ? prefix + '.' + key : key;
      if (isPlainObject(value)) out.push.apply(out, leafPaths(value, path));
      else out.push(path);
    }
    return out;
  }

  /* The current values at those paths, shaped as a patch that would put them
     back. A diff, not a snapshot: only what the profile is about to overwrite,
     so nothing else rides along into storage or iCloud. */
  function pluck(source, paths) {
    return paths.reduce(function (acc, path) {
      const keys = path.split('.');
      const value = keys.reduce(function (o, k) { return o == null ? o : o[k]; }, source);
      if (value === undefined) return acc;
      const patch = keys.slice().reverse().reduce(function (inner, k) {
        const step = {}; step[k] = inner; return step;
      }, value);
      return merge(acc, patch);
    }, {});
  }

  /* Picking a profile used to be a one-way door. It overwrote speed, clutter
     and picture wholesale, and pressing the same profile again only cleared
     the label — every value it had changed stayed changed, with no way back to
     the configuration you had built. Someone tapping "Music" to see what it
     did lost their settings permanently.
     
     So a profile now records what it displaced, and deselecting restores it. */
  function applyProfile(settings, name) {
    const patch = modePatch(settings, name);
    if (!patch) return revertProfile(settings);

    // Switching straight from one profile to another keeps the *first* undo:
    // going back should reach what you had before any profile, not the last
    // profile's values.
    const displaced = pluck(settings, leafPaths(patch, ''));
    const before = merge(displaced, isPlainObject(settings.profileUndo) ? settings.profileUndo : {});

    return merge(merge(settings, patch), { profile: name, profileUndo: before });
  }

  /* ---- modes of your own -------------------------------------------------
   *
   * What a saved mode is about: the preferences that describe a way of
   * watching. Not the master switch, not credentials, not the focus lock or
   * schedule, not shortcuts, not where the panel sits — those are about the
   * device and the person, and a mode called "Lectures" has no business
   * changing them. The A–B loop is left out too: it belongs to one video. */
  const MODE_SCOPE = ['playback', 'audio', 'picture', 'layout', 'declutter', 'modesty', 'block', 'sponsors'];
  const MODE_SKIP = { 'playback.loop': true };

  function scopePaths() {
    return leafPaths(pluck(DEFAULTS, MODE_SCOPE.map((key) => key)), '')
      .filter((path) => !Object.keys(MODE_SKIP).some((skip) => path === skip || path.startsWith(skip + '.')));
  }

  /* pluck() works on leaf paths; a group name has to be expanded first. */
  function scopeOf(settings) {
    const groups = {};
    MODE_SCOPE.forEach((key) => { groups[key] = settings[key]; });
    const out = pluck(groups, scopePaths());
    return out;
  }

  /* Only the leaves that differ from the defaults, so a mode stays small and
     survives a release that adds settings: anything the mode does not name is
     "as shipped". */
  function modeDiff(settings) {
    const now = scopeOf(settings);
    const base = scopeOf(DEFAULTS);
    return pluck(now, diffPaths(base, now));
  }

  /* The full patch a mode applies: back to the defaults for everything in
     scope, then the mode's own values on top. Built-in modes are partial on
     purpose — Study says nothing about brightness — and stay that way. */
  function modePatch(settings, name) {
    if (PROFILES[name]) return PROFILES[name];
    const mode = customMode(settings, name);
    if (!mode) return null;
    return merge(scopeOf(DEFAULTS), mode.patch || {});
  }

  const CUSTOM_PREFIX = 'custom:';
  function customMode(settings, name) {
    if (!name || !name.startsWith(CUSTOM_PREFIX)) return null;
    const id = name.slice(CUSTOM_PREFIX.length);
    return (settings.customModes || []).find((mode) => mode.id === id) || null;
  }

  function modeId() {
    return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function cleanName(name) {
    return String(name || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  }

  /* Save what is on screen as a mode. Saving makes it the active mode with
     nothing to undo — it *is* the current configuration. Updating an existing
     mode (by id) keeps its name and identity. */
  function saveCustomMode(settings, name, id) {
    const modes = (settings.customModes || []).slice();
    const label = cleanName(name);
    if (!label) return settings;
    const patch = modeDiff(settings);
    const now = Date.now();
    const index = id ? modes.findIndex((mode) => mode.id === id) : -1;
    if (index === -1) {
      id = modeId();
      modes.push({ id, name: label, patch, createdAt: now, updatedAt: now });
    } else {
      modes[index] = Object.assign({}, modes[index], { name: modes[index].name, patch, updatedAt: now });
    }
    return merge(settings, { customModes: modes, profile: CUSTOM_PREFIX + id, profileUndo: null });
  }

  function renameCustomMode(settings, id, name) {
    const label = cleanName(name);
    if (!label) return settings;
    return merge(settings, {
      customModes: (settings.customModes || []).map((mode) => (mode.id === id ? Object.assign({}, mode, { name: label }) : mode))
    });
  }

  function duplicateCustomMode(settings, id) {
    const source = (settings.customModes || []).find((mode) => mode.id === id);
    if (!source) return settings;
    const now = Date.now();
    const copy = Object.assign({}, source, { id: modeId(), name: cleanName(source.name + ' 2'), createdAt: now, updatedAt: now });
    return merge(settings, { customModes: (settings.customModes || []).concat([copy]) });
  }

  /* Deleting the active mode leaves the settings exactly as they are: the
     definition is gone, not the configuration. Only the label clears. */
  function deleteCustomMode(settings, id) {
    const next = merge(settings, { customModes: (settings.customModes || []).filter((mode) => mode.id !== id) });
    return settings.profile === CUSTOM_PREFIX + id ? merge(next, { profile: 'default', profileUndo: null }) : next;
  }

  /* What applying a mode would change, before it does — the leaf paths. */
  function modePreview(settings, name) {
    if (!modePatch(settings, name)) return [];
    return diffPaths(settings, applyProfile(settings, name))
      .filter((path) => path !== 'profile' && path !== 'profileUndo');
  }

  /* ---- one channel, its own way --------------------------------------------
   *
   * Precedence, highest first:
   *   1. a temporary adjustment on the video being watched (a speed nudge);
   *      that lives in the playback module, not here;
   *   2. this channel's saved preferences;
   *   3. the active mode and global preferences.
   *
   * The master switch, credentials, the focus lock and the settings password
   * are not preferences and no override can reach them: withChannel touches
   * only the three groups a channel entry can carry. What comes back is a
   * plain settings object — safe to read, never to store. */
  const CHANNEL_WATCH_KEYS = ['comments', 'related', 'liveChat', 'endScreens'];
  const CHANNEL_AUDIO_KEYS = ['boost', 'bass', 'normalize', 'monoDownmix'];

  function channelPrefsOf(settings, channelId) {
    const prefs = channelId && settings && settings.channelPrefs && settings.channelPrefs[channelId];
    return isPlainObject(prefs) ? prefs : null;
  }

  function withChannel(settings, channelId) {
    const prefs = channelPrefsOf(settings, channelId);
    if (!prefs) return settings;
    const patch = {};
    if (Number(prefs.speed) > 0) patch.playback = { defaultSpeed: Number(prefs.speed) };
    if (isPlainObject(prefs.audio)) {
      patch.audio = {};
      CHANNEL_AUDIO_KEYS.forEach((key) => { if (key in prefs.audio) patch.audio[key] = prefs.audio[key]; });
    }
    if (isPlainObject(prefs.watch)) {
      patch.declutter = { watch: {} };
      CHANNEL_WATCH_KEYS.forEach((key) => { if (key in prefs.watch) patch.declutter.watch[key] = !!prefs.watch[key]; });
    }
    return merge(settings, patch);
  }

  /* A channel entry is written as a whole, and removed when nothing is left
     in it, so an empty entry never lingers as "this channel has preferences". */
  function setChannelPrefs(settings, channelId, name, patch) {
    if (!channelId) return settings;
    const current = Object.assign({}, channelPrefsOf(settings, channelId) || {});
    const next = Object.assign(current, patch, { name: cleanName(name || current.name), updatedAt: Date.now() });
    ['speed', 'audio', 'watch'].forEach((key) => { if (next[key] === null || next[key] === undefined || next[key] === 0) delete next[key]; });
    const all = Object.assign({}, settings.channelPrefs);
    if (next.speed === undefined && next.audio === undefined && next.watch === undefined) delete all[channelId];
    else all[channelId] = next;
    return Object.assign({}, settings, { channelPrefs: all });
  }

  /* The stable identity of a channel, from whatever the page offers:
     a /channel/UC… link is the id itself, an /@handle is stable enough
     and unique, and a bare name is not accepted. */
  function channelKey(href) {
    const path = String(href || '');
    const id = path.match(/\/channel\/(UC[\w-]{10,})/);
    if (id) return id[1];
    const handle = path.match(/\/(@[\w.-]{2,})/);
    if (handle) return handle[1].toLowerCase();
    return '';
  }

  function revertProfile(settings) {
    const undo = settings && settings.profileUndo;
    const cleared = merge(settings, { profile: 'default', profileUndo: null });
    // Settings stored before this existed have nothing to restore; clearing the
    // label is all that can honestly be done for them.
    return isPlainObject(undo) ? merge(cleared, undo) : cleared;
  }

  /* Where an A–B loop should send playback, or null to leave it alone.
   *
   * Pure on purpose: the three ways this goes wrong are all decisions, not DOM.
   *   - A loop is stored globally, so without the videoId check one set on a
   *     lesson would follow you to the next video and yank it back to 2:14.
   *   - Marking B before A leaves end < start, and "seek to start whenever we
   *     are past end" then fires forever — the video freezes.
   *   - A and B on the same frame is a zero-length loop, which freezes it too.
   */
  function loopTarget(loop, videoId, currentTime) {
    if (!loop || !loop.enabled) return null;
    if (loop.start === null || loop.end === null) return null;
    // An empty stored videoId means a loop from before this was recorded; let
    // it run rather than silently dropping it.
    if (loop.videoId && videoId && loop.videoId !== videoId) return null;

    const start = Math.min(loop.start, loop.end);
    const end = Math.max(loop.start, loop.end);
    if (end - start < 0.05) return null;

    if (currentTime >= end || currentTime < start - 0.5) return start;
    return null;
  }

  /* What may leave the device.
   *
   * Settings sync through the user's own iCloud, which for a Safari extension
   * means NSUbiquitousKeyValueStore — ordinary key-value storage, not the
   * Keychain. An Anthropic API key is a billable credential and has no business
   * being written there in clear text, so it stays on the device that typed it.
   * The focus password is a salted hash and does sync on purpose: a lock that
   * only holds on one device is not a lock. */
  const DEVICE_ONLY = ['summary.apiKey'];

  function forSync(settings) {
    return DEVICE_ONLY.reduce((acc, path) => {
      const patch = path.split('.').reverse().reduce((inner, key) => ({ [key]: inner }), '');
      return merge(acc, patch);
    }, settings);
  }

  /* The mirror image: what came back from iCloud, with this device's own
     secrets kept. Without this, syncing would quietly wipe the key you typed. */
  function fromSync(incoming, local) {
    return DEVICE_ONLY.reduce((acc, path) => {
      const keys = path.split('.');
      const value = keys.reduce((o, k) => (o == null ? o : o[k]), local);
      if (!value) return acc;
      const patch = keys.reverse().reduce((inner, key) => ({ [key]: inner }), value);
      return merge(acc, patch);
    }, withDefaults(incoming));
  }

  /* ---- the settings file ----------------------------------------------
   *
   * An export is an envelope, not the bare settings object: it says what it
   * is and which version wrote it, so a later release can migrate it and an
   * unrelated JSON file can be refused before it is merged into anything.
   * The device-only keys are stripped the same way they are for iCloud — a
   * settings file gets mailed, pasted and backed up, and a billable API key
   * has no place in it. Pure, so every rule can be checked without a browser. */
  const EXPORT_FORMAT = 'costum-settings';
  const EXPORT_VERSION = 1;

  function packageExport(settings, app) {
    return {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      app: app || '',
      settings: forSync(settings)
    };
  }

  /* Older releases exported the bare settings object. Wrapping it is the only
     migration so far; later versions slot in below it, each stepping the
     envelope forward by one. */
  function migrateImport(payload) {
    if (isPlainObject(payload) && payload.format !== EXPORT_FORMAT && isPlainObject(payload.declutter)) {
      payload = { format: EXPORT_FORMAT, version: 1, settings: payload };
    }
    return payload;
  }

  /* Walks the stored shape against DEFAULTS. A leaf whose type disagrees with
     the default is a corrupt or hand-edited file, and one bad value is enough
     to refuse the lot: an import either lands whole or not at all. Keys the
     defaults do not know are listed and dropped — they are usually a setting
     from a later release, and carrying them is harmless but pointless. */
  const OPEN_KEYS = { profileUndo: true };

  function checkShape(value, model, path, out) {
    for (const key of Object.keys(value)) {
      const here = path ? path + '.' + key : key;
      if (!(key in model)) {
        if (!path && OPEN_KEYS[key]) continue;
        out.unknown.push(here);
        continue;
      }
      const want = model[key];
      const got = value[key];
      if (isPlainObject(want)) {
        if (!isPlainObject(got)) { out.invalid.push(here); continue; }
        // An empty object in the defaults is an open map, keyed by the user.
        if (Object.keys(want).length) checkShape(got, want, here, out);
      } else if (Array.isArray(want)) {
        if (!Array.isArray(got)) out.invalid.push(here);
      } else if (want === null) {
        if (got !== null && typeof got !== 'number' && typeof got !== 'string') out.invalid.push(here);
      } else if (typeof got !== typeof want) {
        out.invalid.push(here);
      }
    }
  }

  /* Only known keys go forward; the unknown ones are reported, not carried. */
  function prune(value, model, top) {
    const out = {};
    for (const key of Object.keys(value)) {
      if (top && OPEN_KEYS[key]) { out[key] = value[key]; continue; }
      if (!(key in model)) continue;
      const want = model[key];
      out[key] = isPlainObject(want) && Object.keys(want).length && isPlainObject(value[key])
        ? prune(value[key], want, false) : value[key];
    }
    return out;
  }

  function validateImport(payload) {
    payload = migrateImport(payload);
    if (!isPlainObject(payload) || payload.format !== EXPORT_FORMAT) return { ok: false, error: 'not-costum' };
    const version = Number(payload.version);
    if (!Number.isInteger(version) || version < 1) return { ok: false, error: 'not-costum' };
    if (version > EXPORT_VERSION) return { ok: false, error: 'newer-version', version };
    if (!isPlainObject(payload.settings)) return { ok: false, error: 'not-costum' };
    const out = { unknown: [], invalid: [] };
    checkShape(payload.settings, DEFAULTS, '', out);
    if (out.invalid.length) return { ok: false, error: 'invalid-value', path: out.invalid[0], invalid: out.invalid };
    return { ok: true, version, exportedAt: payload.exportedAt || '', app: payload.app || '', settings: prune(payload.settings, DEFAULTS, true), unknown: out.unknown.sort() };
  }

  /* Every leaf path where two settings objects disagree — what an import or a
     mode is about to change, before it changes it. */
  function diffPaths(a, b) {
    const out = [];
    const walk = (x, y, path) => {
      const keys = new Set([].concat(Object.keys(isPlainObject(x) ? x : {}), Object.keys(isPlainObject(y) ? y : {})));
      keys.forEach((key) => {
        const here = path ? path + '.' + key : key;
        const p = x == null ? undefined : x[key];
        const q = y == null ? undefined : y[key];
        if (isPlainObject(p) && isPlainObject(q)) walk(p, q, here);
        else if (JSON.stringify(p) !== JSON.stringify(q)) out.push(here);
      });
    };
    walk(a, b, '');
    return out;
  }

  /* Shortcuts are stored as KeyboardEvent codes because that is what matching a
     keypress needs — but "Shift+BracketLeft" is not what a shortcut looks like
     on this platform. Apple writes them as symbols, in a fixed order
     (Control, Option, Shift, Command) regardless of the order they were
     pressed, so the same combination always reads the same way. */
  const MODIFIER_SYMBOLS = [['Ctrl', '\u2303'], ['Alt', '\u2325'], ['Shift', '\u21E7'], ['Meta', '\u2318']];

  const KEY_SYMBOLS = {
    ArrowUp: '\u2191', ArrowDown: '\u2193', ArrowLeft: '\u2190', ArrowRight: '\u2192',
    Enter: '\u21A9', NumpadEnter: '\u21A9', Escape: '\u238B', Backspace: '\u232B',
    Delete: '\u2326', Tab: '\u21E5', Space: 'Space', Home: '\u2196', End: '\u2198',
    PageUp: '\u21DE', PageDown: '\u21DF',
    Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", Backquote: '`',
    BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '='
  };

  function keyName(code) {
    if (KEY_SYMBOLS[code]) return KEY_SYMBOLS[code];
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit\d$/.test(code)) return code.slice(5);
    if (/^Numpad\d$/.test(code)) return code.slice(6);
    if (/^F\d{1,2}$/.test(code)) return code;
    return code;
  }

  function formatShortcut(combo) {
    if (!combo) return '';
    const parts = String(combo).split('+');
    const held = parts.slice(0, -1);
    const symbols = MODIFIER_SYMBOLS.filter(([name]) => held.includes(name)).map(([, sym]) => sym);
    return symbols.join('') + keyName(parts[parts.length - 1]);
  }

  /* Where "open somewhere other than the home page" turns into a rule.
   *
   * The filter has to be anchored at both ends. It was `||youtube.com/`, which
   * matches every path on the site — so switching the redirect on sent every
   * watch page, every search and every channel to the target as well, and the
   * site became one page. The trailing `|` pins it to the site root, which is
   * the only page this setting is about.
   *
   * The path is transformed rather than redirected to an absolute URL so the
   * host survives: m.youtube.com is where iPhone Safari actually is, and
   * sending it to www just bounces back through YouTube's own redirect.
   *
   * Pure, because all three ways this goes wrong are decisions rather than
   * network: too broad a filter, a redirect to the page being redirected, and
   * a query string smuggled into a path.
   */
  const HOME_RULE_ID = 1;

  function homeRedirectPath(settings) {
    const raw = String((settings && settings.declutter && settings.declutter.redirectHome) || '').trim();
    if (!raw) return '';
    const path = raw.startsWith('/') ? raw : '/' + raw;
    // Redirecting the home page to the home page is a loop the browser has to
    // break for us, and it breaks it by giving up on the navigation.
    return path === '/' ? '' : path;
  }

  function homeRedirectRule(settings) {
    const target = homeRedirectPath(settings);
    if (!target) return null;
    const cut = target.indexOf('?');
    const path = cut === -1 ? target : target.slice(0, cut);
    const query = cut === -1 ? '' : target.slice(cut);
    return {
      id: HOME_RULE_ID,
      priority: 1,
      action: { type: 'redirect', redirect: { transform: { path, query } } },
      // `|` at the end anchors to the end of the URL: the site root, nothing else.
      condition: { urlFilter: '||youtube.com/|', resourceTypes: ['main_frame'] }
    };
  }

  /* A 3x3 unsharp kernel. The centre carries the whole image plus what the
   * four neighbours are about to subtract, so the weights always sum to 1 and
   * the picture keeps its brightness — only edges gain contrast.
   *
   *      0   -k    0
   *     -k  1+4k  -k
   *      0   -k    0
   *
   * Pure so the arithmetic can be checked without a video.
   */
  function sharpenKernel(amount) {
    const k = Math.max(0, Math.min(100, Number(amount) || 0)) / 100 * 0.9;
    const centre = 1 + 4 * k;
    const edge = -k;
    return [0, edge, 0, edge, centre, edge, 0, edge, 0];
  }

  root.CostumDefaults = {
    DEFAULTS, PROFILES, withDefaults, merge, applyProfile, loopTarget,
    DEVICE_ONLY, forSync, fromSync, formatShortcut, sharpenKernel, revertProfile, pluck,
    HOME_RULE_ID, homeRedirectPath, homeRedirectRule,
    EXPORT_FORMAT, EXPORT_VERSION, packageExport, migrateImport, validateImport, diffPaths, leafPaths,
    MODEL_ALIASES, MODE_SCOPE, CUSTOM_PREFIX, customMode, modePatch, modePreview, modeDiff,
    saveCustomMode, renameCustomMode, duplicateCustomMode, deleteCustomMode,
    withChannel, channelPrefsOf, setChannelPrefs, channelKey, CHANNEL_WATCH_KEYS, CHANNEL_AUDIO_KEYS
  };
})(typeof self !== 'undefined' ? self : this);
