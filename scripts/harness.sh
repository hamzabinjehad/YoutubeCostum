#!/bin/bash
# Runs the extension's two surfaces — the popup and the in-page panel — as
# plain web pages, with the browser-extension APIs stubbed out.
#
# This is how they get checked without installing into Safari, enabling an
# unsigned extension, and clicking through a browser. Storage lives in memory
# and resets on reload, and the "active tab" is a fake /watch URL so the
# page-scoped controls have something to react to. The panel normally arrives
# as a content script, so panel.html stands in for the YouTube page and hands
# it the context boot.js would.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/.harness"
PORT="${1:-8765}"

rm -rf "$OUT"
mkdir -p "$OUT"
ln -s "$ROOT/extension" "$OUT/extension"
ln -s "$ROOT/tests" "$OUT/tests"
cp "$ROOT/extension/common/"{defaults.js,css.js,spec.js,store.js,lock.js,fields.js,bookmarks.js} "$OUT/"
cp "$ROOT/extension/ui/popup/"{popup.js,popup.css} "$OUT/"
cp "$ROOT/extension/ui/shared/"{apple.css,icons.js} "$OUT/"
cp "$ROOT/extension/content/panel.js" "$OUT/"
cp "$ROOT/extension/content/modules/focus.js" "$OUT/"
cp "$ROOT/extension/content/modules/diagnostics.js" "$OUT/"
# Linked rather than copied: a copy goes stale the moment a test is edited, and
# then the suite that runs is not the suite on disk. Served but not linked into
# the pages — it loads on demand from the console, so a surface can still be
# looked at by hand without tests running underneath it.
ln -sf "$ROOT/tests/ui-browser.js" "$OUT/ui-browser.js"
ln -sf "$ROOT/tests/ui-harness-runner.js" "$OUT/ui-harness-runner.js"

STUB='<script>
  /* Seed state before the page reads it, so a locale or a preset can be tested
     without clicking through the UI first: ?lang=ar, ?path=/watch. */
  const params = new URLSearchParams(location.search);
  const memory = params.get("lang")
    ? { settings: { locale: params.get("lang") } }
    : {};
  /* ?summaries=1 seeds two saved summaries for the library section. */
  if (params.get("summaries")) memory.summaries = [
    { key: "s1", at: Date.now(), videoId: "dQw4w9WgXcQ", title: "A kept talk", detail: "brief", language: "auto", text: "[00:05] Point." },
    { key: "s2", at: Date.now() - 86400000, videoId: "aaaaaaaaaaa", title: "Another", detail: "detailed", partial: true, text: "[00:09] Other." }
  ];
  /* ?locked=<password> seeds a real salted hash, which is the only way to reach
     the gate here: storage lives in memory and a reload takes it with it, so a
     password set through the UI never survives into the next open.
     The first read waits for it rather than racing the boot. */
  let seeding = null;
  const seeded = () => {
    if (!params.get("locked")) return Promise.resolve();
    // Lazily, because this stub is installed before lock.js loads.
    if (!seeding) seeding = self.CostumLock.make(params.get("locked")).then((hash) => {
      memory.settings = Object.assign({}, memory.settings, {
        focus: Object.assign({}, (memory.settings || {}).focus, { passwordHash: hash })
      });
    });
    return seeding;
  };
  const extensionApi = {
    storage: {
      local: {
        get: (k) => seeded().then(() => (memory[k] !== undefined ? { [k]: memory[k] } : {})),
        set: (bag) => { Object.assign(memory, bag); return Promise.resolve(); }
      },
      onChanged: { addListener() {} }
    },
    tabs: {
      created: [],
      create: (info) => { extensionApi.tabs.created.push(info.url); return Promise.resolve({ id: 2 }); },
      query: () => Promise.resolve(params.has("noTab") ? [] : [{ id: 1, url: "https://www.youtube.com" + (params.get("path") || "/watch?v=demo") }]),
      /* What the content script replies to the popup. ?dead=1 is a site Safari
         has not allowed yet: nothing answers, and the popup has to say so
         instead of "On for this page". No apostrophes in here: the stub is a
         single-quoted shell string. */
      sendMessage: () => params.get("dead")
        ? new Promise(() => {})
        : Promise.resolve({ alive: true, modules: 17, bridge: params.get("bridge") || "loaded" })
    },
    runtime: {
      getManifest: () => ({ version: "harness" }),
      /* The background desk, in miniature: settings writes, the import and
         reset paths with their backups, and a sync status that reads as
         iCloud on Safari and local-only on Chrome. ?sync=error seeds a failed
         push; ?sync=dirty seeds an unsent edit. */
      sendMessage: async (msg) => {
        await seeded();
        const D = self.CostumDefaults;
        const current = () => D.withDefaults(memory.settings);
        const backups = memory.backups || (memory.backups = {});
        const keep = (kind) => { backups[kind] = { at: Date.now(), settings: current() }; };
        if (msg.type === "settings.set") memory.settings = D.merge(current(), msg.patch);
        else if (msg.type === "settings.replace") memory.settings = D.withDefaults(msg.settings);
        else if (msg.type === "settings.reset") { keep("beforeReset"); memory.settings = D.withDefaults(null); }
        else if (msg.type === "settings.import") {
          const checked = D.validateImport(msg.payload);
          if (!checked.ok) return { ok: false, error: checked.error };
          keep("beforeImport");
          memory.settings = D.fromSync(checked.settings, current());
          return { ok: true, result: { settings: memory.settings, unknown: checked.unknown, version: checked.version } };
        }
        else if (msg.type === "backup.list") return { ok: true, result: Object.keys(backups).map((kind) => ({ kind, at: backups[kind].at })) };
        else if (msg.type === "backup.restore") {
          if (!backups[msg.kind]) return { ok: false, error: "no-backup" };
          const was = backups[msg.kind].settings; keep(msg.kind); memory.settings = D.withDefaults(was);
        }
        else if (msg.type === "sync.status") {
          if (params.get("browser") === "chrome") return { ok: true, result: { mode: "local", available: false } };
          const seed = params.get("sync") || "";
          return { ok: true, result: { mode: "icloud", available: seed !== "signedout", dirty: seed === "dirty",
            lastSuccessAt: seed === "never" ? 0 : Date.now() - 60000, lastError: seed === "error" ? "store-refused" : "" } };
        }
        else if (msg.type === "sync.refresh") return { ok: true, result: { mode: params.get("browser") === "chrome" ? "local" : "icloud", result: msg.force ? "stale" : "throttled" } };
        else if (msg.type === "summary.list") return { ok: true, result: (memory.summaries || []).filter((e) => !msg.videoId || e.videoId === msg.videoId) };
        else if (msg.type === "summary.delete") { memory.summaries = (memory.summaries || []).filter((e) => e.key !== msg.key); return { ok: true, result: true }; }
        else if (msg.type.startsWith("bookmarks.")) {
          const B = self.CostumBookmarks;
          const items = memory.bookmarkItems || (memory.bookmarkItems = []);
          if (msg.type === "bookmarks.list") return { ok: true, result: { items: msg.videoId ? B.forVideo(items, msg.videoId) : B.sort(items), count: items.length, limit: B.LIMITS.items } };
          if (msg.type === "bookmarks.add") { const e = B.normalize(msg.entry); if (!e) return { ok: false, error: "bookmark-invalid" }; items.push(e); return { ok: true, result: e }; }
          if (msg.type === "bookmarks.update") { const i = items.findIndex((b) => b.id === msg.id); if (i === -1) return { ok: false, error: "bookmark-missing" }; items[i] = B.normalize(Object.assign({}, items[i], msg.patch, { id: items[i].id })); return { ok: true, result: items[i] }; }
          if (msg.type === "bookmarks.delete") { const n = items.length; memory.bookmarkItems = items.filter((b) => b.id !== msg.id); return { ok: true, result: n - memory.bookmarkItems.length }; }
          if (msg.type === "bookmarks.clear") { memory.bookmarkItems = []; return { ok: true, result: true }; }
          if (msg.type === "bookmarks.export") return { ok: true, result: B.packageExport(items) };
          if (msg.type === "bookmarks.import") { const c = B.validateImport(msg.payload); if (!c.ok) return { ok: false, error: c.error }; const m = B.mergeImport(items, c.items); memory.bookmarkItems = m.items; return { ok: true, result: { added: m.added, duplicates: m.duplicates, refused: m.refused, skipped: c.skipped, count: m.items.length } }; }
        }
        else return { ok: false, error: "Unknown harness message" };
        return { ok: true, result: memory.settings };
      }
    }
  };
  /* The shared source chooses an API namespace at startup. The harness uses
     Safari by default; ?browser=chrome proves the Chrome recovery copy and
     API path without needing a second browser. */
  if (params.get("browser") === "chrome") self.chrome = extensionApi;
  else self.browser = extensionApi;
</script>'

python3 - "$ROOT" "$OUT" "$STUB" <<'PY'
import sys, os
root, out, stub = sys.argv[1], sys.argv[2], sys.argv[3]
for src, dest in [('ui/popup/popup.html', 'index.html')]:
    html = open(os.path.join(root, 'extension', src)).read()
    html = html.replace('src="../../common/', 'src="')
    html = html.replace('href="../shared/', 'href="')
    html = html.replace('src="../shared/', 'src="')
    html = html.replace('  <script src="defaults.js"></script>', stub + '\n  <script src="defaults.js"></script>')
    html = html.replace('</body>', '<script src="ui-browser.js"></script><script src="ui-harness-runner.js"></script></body>')
    open(os.path.join(out, dest), 'w').write(html)
PY

cat > "$OUT/panel.html" <<'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Panel harness</title>
<style>
  body { margin:0; min-height:100vh; font:14px -apple-system, system-ui, sans-serif;
         background:#0f0f0f; color:#f1f1f1; padding:24px; }
  .fake { max-width:640px; }
  .fake h1 { font-size:18px; font-weight:600; }
  .fake p { color:#aaa; line-height:1.6; }
  .stage { background:#222; border-radius:12px; height:280px; display:grid;
           place-items:center; color:#666; }
</style>
</head>
<body>
  <div class="fake">
    <div class="stage">a stand-in for the video</div>
    <h1>Panel harness</h1>
    <p>This page stands in for a YouTube watch page so the in-page panel can be
       driven without installing the extension. The button is bottom-right.</p>
  </div>

  <script>
    // A real registry, so actions registered by modules can be found the way
    // the router finds them.
    self.Costum = { modules: [], register(m) { this.modules.push(m); return m; } };
    /* The extension storage a content script has, in memory. The panel keeps
       small flags of its own there (the one-time welcome); without this it
       found no storage and, correctly, skipped the welcome instead of nagging.
       ?welcomed=1 starts as someone who has already seen it. */
    (() => {
      const bag = new URLSearchParams(location.search).get('welcomed') ? { welcomed: true } : {};
      const pick = (keys) => {
        if (keys == null) return Object.assign({}, bag);
        const out = {};
        [].concat(keys).forEach((k) => { if (k in bag) out[k] = bag[k]; });
        return out;
      };
      self.browser = self.browser || { storage: { local: {
        get: (keys) => Promise.resolve(pick(keys)),
        set: (items) => { Object.assign(bag, items); return Promise.resolve(); }
      } } };
    })();
  </script>
  <script src="defaults.js"></script>
  <script src="css.js"></script>
  <script src="diagnostics.js"></script>
  <script src="panel.js"></script>
  <script>
    // The context boot.js would hand it: settings, a video, and the actions.
    let settings = self.CostumDefaults.withDefaults({});
    const video = { playbackRate: 1, currentTime: 0, duration: 600 };

    const patch = (p) => {
      settings = self.CostumDefaults.merge(settings, p);
      window.dispatchEvent(new Event('costum:settings'));
    };
    // Reachable from the console so panel state that the real extension drives
    // from a keypress can be driven here too.
    self.costumPatch = patch;

    const ctx = {
      settings: () => settings,
      patch,
      video: () => video,
      videoId: () => 'harness-demo',
      // Same formatting the router hands modules; the panel prints loop marks
      // with it, so leaving it out makes render() throw on any active loop.
      clock: (seconds) => {
        const total = Math.max(0, Math.floor(seconds || 0));
        const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), sec = total % 60;
        const pad = (n) => String(n).padStart(2, '0');
        return (h ? h + ':' + pad(m) : String(m)) + ':' + pad(sec);
      },
      toast: (m) => self.CostumPanel.toast(m),
      // Registered actions run for real; anything with no owner just reports
      // that it fired.
      action: (name) => {
        const owner = self.Costum.modules.find((m) => m.actions && m.actions[name]);
        return owner ? owner.actions[name] : () => self.CostumPanel.toast(name + '()');
      },
      meta: () => Promise.resolve({ videoId: 'harness-demo', title: 'Harness video', captionTracks: [] }),
      bridge: () => ({ injected: 'loaded', ready: true, gaveUp: false }),
      ask: (name, payload) => {
        if (name === 'settings.replace') {
          settings = self.CostumDefaults.withDefaults(payload.settings);
          window.dispatchEvent(new Event('costum:settings'));
        }
        if (name === 'settings.get') return Promise.resolve(settings);
        if (name === 'log.get') return Promise.resolve([]);
        return Promise.resolve();
      }
    };

    self.CostumPanel.init(ctx);
    // The router does this once the panel exists; diagnostics needs it.
    ctx.panel = self.CostumPanel;
    self.Costum.ctx = ctx;
  </script>
</body>
</html>
HTML

# The panel reads location.pathname to decide which contextual controls are
# useful. A second route beginning with /watch exercises the actual watch-page
# path rather than rendering the harness itself as "Everywhere".
cp "$OUT/panel.html" "$OUT/watch.html"

cat > "$OUT/focus.html" <<'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Focus harness</title>
<style>
  body { margin:0; padding:24px; background:#0f0f0f; color:#f1f1f1;
         font:14px -apple-system, system-ui, sans-serif; }
  button { font: inherit; padding: 8px 12px; margin: 0 6px 6px 0; border-radius: 8px;
           border: 1px solid #333; background: #1c1c1e; color: #f1f1f1; cursor: pointer; }
  pre { background:#1c1c1e; padding:12px; border-radius:8px; overflow:auto; font-size:12px; }
</style>
</head>
<body>
  <h1>Focus harness</h1>
  <p>The focus gates cover the page, so they get their own harness. Each button
     puts the settings into one state and re-applies the module.</p>
  <div id="controls"></div>
  <pre id="state"></pre>

  <script>
    // A real registry this time, so the module's hooks can actually be called.
    self.Costum = { modules: [], register(m) { this.modules.push(m); return m; } };
  </script>
  <script src="defaults.js"></script>
  <script src="focus.js"></script>
  <script>
    let settings = self.CostumDefaults.withDefaults({});
    const mod = self.Costum.modules.find((m) => m.name === 'focus');
    const ctx = {
      settings: () => settings,
      video: () => null,
      patch: (p) => {
        settings = self.CostumDefaults.merge(settings, p);
        show();
        return Promise.resolve();
      }
    };
    const show = () => {
      document.getElementById('state').textContent = JSON.stringify(settings.focus, null, 1);
    };
    const apply = () => mod.apply(settings, ctx);
    self.focusHarness = {
      set: (p) => { settings = self.CostumDefaults.merge(settings, p); show(); apply(); },
      apply, ctx, get settings() { return settings; }
    };

    const scenarios = {
      'expired session': { sessionMinutes: 15, sessionEndsAt: Date.now() - 60000 },
      'session running': { sessionMinutes: 15, sessionEndsAt: Date.now() + 600000 },
      'blocked now': { blockUntil: Date.now() + 600000 },
      'entry confirmation': { entryConfirmation: true, sessionMinutes: 0 },
      'clear': { sessionMinutes: 0, sessionEndsAt: 0, blockUntil: 0, entryConfirmation: false, openDelay: 0 }
    };
    const box = document.getElementById('controls');
    Object.entries(scenarios).forEach(([label, patch]) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.onclick = () => self.focusHarness.set({ focus: patch });
      box.appendChild(b);
    });
    show();
  </script>
</body>
</html>
HTML

echo "Harness built in .harness/"
echo "  popup:    http://localhost:$PORT/index.html"
echo "  panel:    http://localhost:$PORT/watch.html"
echo "  focus:    http://localhost:$PORT/focus.html"
echo "  features: http://localhost:$PORT/tests/features.html"
echo
echo "  interaction tests, in the popup's console:"
echo "    (0,eval)(await (await fetch('/ui-browser.js')).text()); await CostumUiTests.run()"
echo
# Caching off. A stale script silently turns a red test green: a deliberately
# broken build once passed the whole interaction suite because the browser was
# still running the previous copy, which is the one failure mode that makes a
# test suite worse than none.
cd "$OUT" && exec /usr/bin/python3 - "$PORT" <<'PY'
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        SimpleHTTPRequestHandler.end_headers(self)


ThreadingHTTPServer(('', int(sys.argv[1])), NoCache).serve_forever()
PY
