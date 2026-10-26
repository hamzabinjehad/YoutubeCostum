# UX and structure plan

**Written 2026-10-26**, after the Studio redesign (`claude/popup-ux-polish`).
`FEATURE_IMPROVEMENT_PLAN.md` covers *what the extension does* (mobile
selectors, health checks, device testing). This plan covers *how it is found,
understood and maintained*: the shape of the two surfaces, and the shape of the
repository. Nothing here adds a setting.

## Where things stand

Measured on the current branch:

| | |
|---|---|
| Settings | 251 paths across 19 Customize surfaces, none duplicated between surfaces |
| Largest surfaces | Watch page 46 rows, Sidebar 36, Player 30, Channel 28 |
| Smallest | Panel 3, Modesty 5, Subscriptions 5, Summary 6 |
| `popup.js` | 2,038 lines in one closure: 42 functions, 47 top-level bindings, the en/ar copy deck (lines 23–240) and every view |
| `panel.js` | 1,513 lines: its own copy deck (lines 14–128), ~490 lines of CSS in a template string, and the whole sheet |
| Tokens | Declared twice: `ui/shared/apple.css` and the `:host` block in `panel.js`; the test compares only the three type sizes |
| `README.md` | 1,344 lines mixing install and build steps, architecture, test notes and a long design-history log; still refers to a "settings page" that no longer exists |
| Root | Two plan files, `DESIGN.md`, `PRODUCT.md`, and `.impeccable/design.json`, which still describes the old Apple design |

The surfaces work and the tests are thorough (97 popup interaction tests, 354
logic assertions, 42 feature cases, 6 static suites). The problems are of
orientation, not function.

## Part A — UX

### A1. Split Customize into four destinations (first priority)

**Problem.** Customize is one long scroll that holds five different jobs: the
19-surface catalogue, modes (built-in, more, and your own), channel
preferences, the bookmark library, saved summaries, and the data footer
(sync, export, import, reset, restore). Someone looking for their bookmarks
scrolls past the whole catalogue; someone looking for Export has to know it is
at the very bottom.

**Change.** A segmented control under the Customize title with four
destinations, each its own scroll:

- **Settings**: search plus the catalogue (as now).
- **Modes**: built-in, other, and your own modes; "Save current settings as a mode".
- **Library**: bookmarks, saved summaries, channel preferences.
- **Data**: where settings live (sync), export, import, reset all, restore previous.

Search stays scoped to Settings. The last destination is remembered per viewer.

**Done when** each destination fits its job without scrolling past another,
the `footerLeaks` and "search belongs to the root" tests are rewritten for the
four destinations, and Arabic labels fit at 340px.

### A2. Regroup the catalogue by what people want, not by reach

**Problem.** The three groups ("All of YouTube", "By page", "Tools") sort by
reach, which is how the code thinks. Viewers arrive with intents: *make videos
play how I like*, *get rid of distractions*, *keep me from overusing YouTube*.
Within "By page", Watch page alone is 46 rows; Sidebar is 36. "Everywhere",
"Layout" and "Header" overlap in people's heads.

**Change.**
1. Regroup into **Playback** (Player, Keys), **Distractions** (Home, Watch
   page, Search, Shorts, Cards, Sidebar, Header, Subscriptions, Library,
   Channel, Everywhere), **Wellbeing** (Focus, Block, Modesty) and **Tools**
   (Summary, Panel, Layout). The scope captions keep saying how far each
   switch reaches, so nothing is lost.
2. Give every surface row a one-line description ("Comments, chat, related
   videos and the end screen" for Watch page) so the list can be scanned
   without opening anything.
3. Inside the two biggest surfaces, keep folded groups but open the one with
   the most switches already on, or the first.

**Decision needed:** whether to rename surfaces in user copy (for example
"Everywhere" → "Across YouTube"). Renaming is cheap in the copy deck, but it
changes the README and the screenshots.

### A3. Undo on every change

**Problem.** A toggle changes YouTube at once, and the only way back is to find
the switch again. "Your changes" lists them, but only as a count and a folded
list.

**Change.** The confirmation toast (popup and panel) becomes "Hide comments
on · Undo" for 5 seconds. "Your changes" rows get a per-row reset, matching the
slider-readout reset that already exists. Product principle 4 ("make changes
reversible") is the reason.

### A4. Make the Control Center's quick controls the viewer's own

**Problem.** The Control Center's page and site-wide rows are a fixed short
list. A viewer who always flips "Hide related" has to drill into Watch page
every time.

**Change.** A "Pin to Control Center" action on any switch row in a surface
(long-press on touch, a trailing ⋯ on desktop). Pinned rows join the page
section they belong to; the defaults stay as the starting set, and the
"intentionally short" test becomes a cap of 8.

### A5. One vocabulary across popup and panel

**Problem.** The same control has different names in the two surfaces:
"Cinema mode" in the popup and "Cinema" in the panel; the panel's "Playback
preferences" against the popup's "Playback". Each surface keeps its
own copy deck, so they drift.

**Change.** One shared copy module (see B2) for every string that names a
setting or a scope. A contract test fails when a setting has two labels.

### A6. First run in the popup too

**Problem.** The "Pick a starting point" card exists only in the panel. A
desktop viewer who only ever opens the toolbar popup never sees it.

**Change.** Show the same four-mode card at the top of the Control Center on
first open, dismissed once for both surfaces (shared storage flag).

### A7. Smaller polish, in one pass

- The Customize back link reads "Control Center"; in a drilled surface it reads
  "Back". Use the destination's name in both.
- The search field autofocuses and shows a focus ring on every open; focus it
  only for keyboard opens.
- An empty search result should offer the closest surface ("No match. Try
  Watch page →").
- Desktop-only switches on the phone are hidden in the popup but only labelled
  in Customize; make the label a visible "Desktop only" tag rather than caption
  text.

## Part B — Organisation

### B1. Split `popup.js` by view (first priority)

There is no bundler, and the content scripts already use a working pattern:
each file registers itself on a shared namespace. Apply the same to the popup:

```
extension/ui/popup/
  popup.html
  popup.css
  state.js          settings, messaging, the changed-settings diff
  views/control.js  Control Center
  views/customize.js  catalogue, search, destinations (A1)
  views/drill.js    a surface: groups, rows, typed controls
  views/modes.js    built-in and custom modes
  views/library.js  bookmarks, summaries, channels
  views/data.js     sync, import/export, reset, restore
  popup.js          boot, routing between views, render()
```

Move the code verbatim first, with no behaviour change, and keep the 97
interaction tests green at every step. `tests/undeclared.py` already catches a
function that was left behind. Update `scripts/harness.sh`, which copies
popup files one by one, and `scripts/build-chrome.sh`.

### B2. One copy deck, one token set

- **Copy.** Move both en/ar decks out of `popup.js` and `panel.js` into
  `common/copy.js`. The panel loads it as a content script like `spec.js`.
  Setting labels already live in `spec.js`; only UI chrome moves.
- **Tokens.** Move the panel's CSS out of the template string into
  `content/panel.css`, injected into the shadow root via
  `runtime.getURL` (listed in `web_accessible_resources`). Then extend
  `tests/style-slop.py` to compare **every** shared token between the two
  sheets, not only the type sizes.
- **Name.** Rename `ui/shared/apple.css` → `ui/shared/studio.css` now that it
  no longer describes Apple's system, and update the tests that open it by name.

### B3. Split the README

- `README.md`: what Costum is, install, build (Safari, Chrome/Edge), run the
  tests. Under 200 lines.
- `docs/ARCHITECTURE.md`: content scripts and modules, the router, how a
  feature is wired, the panel and the popup, storage and sync.
- `docs/TESTING.md`: the six suites, the harness, the feature suite, the probes.
- `docs/DECISIONS.md`: the design-history sections, kept as a dated log.
- `docs/plans/`: this file and `FEATURE_IMPROVEMENT_PLAN.md`.

Delete the stale "settings page" passages, or rewrite them in the past tense in
DECISIONS. Regenerate `.impeccable/design.json` from `DESIGN.md` with the
impeccable tool, or delete it if that tool is no longer used.

### B4. Name things for what they are

- `content/modules/` mixes features (sponsors, summary, bookmarks) with
  plumbing (diagnostics, capture). Group them as `modules/features/` and
  `modules/core/` only if B1's pattern proves useful; otherwise leave the
  directory flat. Do not move these for neatness alone, because the manifest
  and the Chrome build list every path.
- The `focus` surface key is also a module name; keep it, but document the map
  from surface key to module in ARCHITECTURE.

## Order

| Step | Work | Rough size | Depends on |
|---|---|---|---|
| 1 | B1: split `popup.js`, no behaviour change | half a day | — |
| 2 | B2: copy deck and panel CSS out | half a day | B1 |
| 3 | A1: Customize destinations | half a day | B1 |
| 4 | A5 + A3: one vocabulary, undo | half a day | B2 |
| 5 | A2: regroup and describe the catalogue | 2–3 hours | A1 |
| 6 | A6 + A7: first run in popup, polish | 2–3 hours | A1 |
| 7 | A4: pinned quick controls | half a day | A1, A3 |
| 8 | B3 + B4: docs split, naming | 2–3 hours | anytime; best last |

Structure comes first because A1, A3 and A5 each touch most of `popup.js` and
both copy decks; doing them in the current single files means doing the merge
work twice.

## How each step is checked

- `./scripts/test.sh` on macOS (syntax, Chrome build, spec, wiring, undeclared,
  UI contracts, style, logic), and the six Python suites anywhere.
- The popup interaction suite (`index.html?test=1` in the harness) stays at
  97/97, with new cases added for each UX change rather than old ones loosened.
- The feature suite for anything touching the panel.
- Before/after screenshots regenerated into `.impeccable/review/` for every
  step that changes a surface, in light, dark and Arabic.
- One pass on the iPhone and iPad simulators after A1 and A4, since both change
  touch targets.

## Decisions for the product owner

1. **A2 naming:** keep surface names as they are, or rename for intent?
2. **A4 pinning:** worth the extra state, or is the fixed short list enough?
3. **A1 default destination:** always open on Settings, or reopen the last one?
4. **B3:** is the design-history log worth keeping in `docs/DECISIONS.md`, or
   can most of it go?
