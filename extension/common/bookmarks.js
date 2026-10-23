/* Costum for YouTube — bookmarks and notes, the pure part.
 *
 * A bookmark is a moment in a video with a note: the video's id and title,
 * a time in seconds, and whatever was worth writing down. It lives in this
 * browser's own storage, under its own key, and is never synced or exported
 * with the settings. Saving one is deliberate; nothing here records what
 * was watched on its own.
 *
 * Shared by the background (which owns the writes), the popup (the library)
 * and the panel (save and jump). Pure, so the limits and the file format can
 * be checked without a browser. */
(function (root) {
  'use strict';

  const FORMAT = 'costum-bookmarks';
  const VERSION = 1;
  const LIMITS = { items: 500, note: 500, title: 200 };

  function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

  function id() { return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  /* One entry, tidied: seconds are whole and non-negative, text is clipped
     to the limits, and anything without a video id is not a bookmark. */
  function normalize(entry, now) {
    if (!isPlainObject(entry)) return null;
    const videoId = String(entry.videoId || '').trim();
    if (!/^[\w-]{1,64}$/.test(videoId)) return null;
    const at = Number(entry.at);
    if (!Number.isFinite(at) || at < 0) return null;
    now = now || Date.now();
    return {
      id: typeof entry.id === 'string' && /^[\w-]{1,40}$/.test(entry.id) ? entry.id : id(),
      videoId,
      title: String(entry.title || '').replace(/\s+/g, ' ').trim().slice(0, LIMITS.title),
      channel: String(entry.channel || '').replace(/\s+/g, ' ').trim().slice(0, LIMITS.title),
      at: Math.floor(at),
      note: String(entry.note || '').trim().slice(0, LIMITS.note),
      createdAt: Number(entry.createdAt) || now,
      updatedAt: Number(entry.updatedAt) || now
    };
  }

  /* Newest first, the way a library reads; a same-video list orders by time. */
  function sort(items) {
    return items.slice().sort((a, b) => b.createdAt - a.createdAt);
  }

  function forVideo(items, videoId) {
    return items.filter((item) => item.videoId === videoId).sort((a, b) => a.at - b.at);
  }

  /* Case-insensitive, across title, channel and note. */
  function search(items, query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return sort(items);
    return sort(items.filter((item) => [item.title, item.channel, item.note].some((field) => field.toLowerCase().includes(q))));
  }

  function link(item) {
    return 'https://www.youtube.com/watch?v=' + encodeURIComponent(item.videoId) + '&t=' + item.at + 's';
  }

  function clock(seconds) {
    const total = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return (h ? h + ':' + pad(m) : String(m)) + ':' + pad(s);
  }

  /* The file: its own envelope, separate from the settings file, so neither
     can be fed to the other's importer by mistake. */
  function packageExport(items) {
    return { format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), items: sort(items) };
  }

  function validateImport(payload) {
    if (!isPlainObject(payload) || payload.format !== FORMAT) return { ok: false, error: 'not-bookmarks' };
    const version = Number(payload.version);
    if (!Number.isInteger(version) || version < 1) return { ok: false, error: 'not-bookmarks' };
    if (version > VERSION) return { ok: false, error: 'newer-version' };
    if (!Array.isArray(payload.items)) return { ok: false, error: 'not-bookmarks' };
    const items = [];
    let skipped = 0;
    payload.items.forEach((entry) => {
      const clean = normalize(entry);
      if (clean) items.push(clean); else skipped++;
    });
    return { ok: true, items, skipped };
  }

  /* Merge a file into the library: an entry with the same id, or the same
     video and second, is the same bookmark and is not doubled. The limit is
     honoured by refusing the overflow rather than dropping older entries
     silently — what gets deleted is always the person's choice. */
  function mergeImport(existing, incoming) {
    const seen = new Set(existing.map((item) => item.id));
    const moments = new Set(existing.map((item) => item.videoId + '@' + item.at));
    const added = [];
    let duplicates = 0;
    let refused = 0;
    incoming.forEach((item) => {
      if (seen.has(item.id) || moments.has(item.videoId + '@' + item.at)) { duplicates++; return; }
      if (existing.length + added.length >= LIMITS.items) { refused++; return; }
      seen.add(item.id); moments.add(item.videoId + '@' + item.at);
      added.push(item);
    });
    return { items: existing.concat(added), added: added.length, duplicates, refused };
  }

  root.CostumBookmarks = { FORMAT, VERSION, LIMITS, normalize, sort, forVideo, search, link, clock, packageExport, validateImport, mergeImport };
})(typeof self !== 'undefined' ? self : this);
