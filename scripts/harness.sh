#!/bin/bash
# Runs the extension's three surfaces — the popup, the settings page and the
# in-page panel — as plain web pages, with the browser-extension APIs stubbed
# out.
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
cp "$ROOT/extension/common/"{defaults.js,css.js,store.js,lock.js} "$OUT/"
cp "$ROOT/extension/ui/popup/"{popup.js,popup.css} "$OUT/"
cp "$ROOT/extension/ui/options/"{options.js,options.css} "$OUT/"
cp "$ROOT/extension/ui/shared/apple.css" "$OUT/"
cp "$ROOT/extension/content/panel.js" "$OUT/"
cp "$ROOT/extension/content/modules/focus.js" "$OUT/"
cp "$ROOT/extension/content/modules/diagnostics.js" "$OUT/"

STUB='<script>
  const memory = {};
  self.browser = {
    storage: {
      local: {
        get: (k) => Promise.resolve(memory[k] !== undefined ? { [k]: memory[k] } : {}),
        set: (bag) => { Object.assign(memory, bag); return Promise.resolve(); }
      },
      onChanged: { addListener() {} }
    },
    tabs: { query: () => Promise.resolve([{ url: "https://www.youtube.com/watch?v=demo" }]) },
    runtime: { openOptionsPage() { location.href = "options.html"; } }
  };
</script>'

python3 - "$ROOT" "$OUT" "$STUB" <<'PY'
import sys, os
root, out, stub = sys.argv[1], sys.argv[2], sys.argv[3]
for src, dest in [('ui/popup/popup.html', 'index.html'), ('ui/options/options.html', 'options.html')]:
    html = open(os.path.join(root, 'extension', src)).read()
    html = html.replace('src="../../common/', 'src="')
    html = html.replace('href="../shared/', 'href="')
    html = html.replace('  <script src="defaults.js"></script>', stub + '\n  <script src="defaults.js"></script>')
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
echo "  settings: http://localhost:$PORT/options.html"
echo "  panel:    http://localhost:$PORT/panel.html"
echo "  focus:    http://localhost:$PORT/focus.html"
echo
cd "$OUT" && exec /usr/bin/python3 -m http.server "$PORT"
