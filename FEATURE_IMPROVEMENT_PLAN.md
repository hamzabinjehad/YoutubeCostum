# Functionality improvement plan

**Written 2026-09-24.** The previous plan (2026-09-13) is finished; it is kept
at the end of this file. This one comes from reading the current tree and from
driving the extension in the iPhone 17 Pro and iPad Pro 11" simulators — the
first time it has been used end to end on both.

The short version: the feature list already matches or beats both competitors.
What is missing is not features. It is that **most switches have no mobile
selectors behind them, so on an iPhone they very likely do nothing** (inferred
from the selector counts below; the mobile probe in item 1 will measure it),
that **nobody finds out when YouTube breaks one**, and that **the product has
never run outside a simulator**. Fix those before adding anything.

## Work session, 2026-09-24 (about three hours)

Decisions taken for this session, using the recommendations below: hide
desktop-only switches on the phone (Customize keeps them, labelled); no remote
selector server yet; add an App Group for item 4.

Measured at the start: of the **160 page-hiding switches, 6 have any mobile
selector**. Search, cards, the Shorts player, header, sidebar, channel and
subscriptions have none.

- [x] **A. Mobile truth (item 1), ~75 min.** Done: 54 of 160 switches now
      verified on live m.youtube.com (from 6); desktop-only ones hidden on the
      phone and labelled in Customize; mobile channel-name blocking fixed. Probe live m.youtube.com (home,
      watch, search, channel, Shorts) with the selector probe. Record which
      switches work on mobile. Add `ytm-*` selectors the probe confirms. Hide
      desktop-only switches in the popup and panel on m.youtube.com; label them
      in Customize. Tests pin every confirmed mobile selector and the
      availability data.
- [x] **B. Health check (item 2), ~30 min.** Done: `deadSwitches` in css.js,
      checked 5 s after each page settles and confirmed once more; the panel
      and the popup name dead switches, Diagnostics lists them. Diagnostics counts matches for
      switches that are on and apply to the page; the panel names dead ones.
      Tests with stubbed DOM.
- [x] **C. First minute (item 5), ~25 min.** Done: one-time "Pick a starting
      point" card (four modes, Not now), remembered in extension storage; the
      popup's site-permission help names the right button on iPhone, iPad and Mac
      and says a one-day allowance expires. One-time "Pick a starting point"
      card in the panel; lapsed site access explained in the popup. Harness
      checks.
- [~] **D. App sees the extension (item 4), ~30 min.** Code done and building:
      App Group entitlements from package.sh, `extension.seen` heartbeat, the
      setup screen's "Costum is working" row. Waiting on a signed device build
      (Xcode needs an Apple ID) to see it work end to end. App Group written by the
      native handler, read by the setup screen: "Working" or "Not seen yet".
      Built and checked in the simulator.
- [~] **E. Weight (item 6), ~15 min.** Measured, not changed. The panel
      rebuilds its whole sheet on every navigation and settings change, even
      closed. Skipping that works, and was tried, but the feature suite drives
      the closed sheet and expects it current; changing both is worth doing
      only with numbers from a physical iPhone. Loading rarely used modules on
      demand needs the `scripting` permission. Both stay in item 6. Measure; build the panel on first open
      if it is not already.
- [x] **F. Verify and write up, ~15 min.** Logic suite 354/354, popup
      interaction suite 97/97, feature suite 42/42 (with normal timers; in a
      hidden browser pane timers run ten times slow and it fails at random).
      iPhone simulator, iOS Safari: the mobile panel offers only what works,
      and Hide comments, Hide related and Just the video each worked. The app
      is installed and running on a physical iPhone 11. Full test suite, iPhone and iPad
      simulator pass, README and DESIGN.md updated, this list ticked.

## Baseline and evidence

- 239 settings, 322 logic assertions, 41 feature cases; `./scripts/test.sh`
  passes.
- iPhone Safari is served **m.youtube.com**; iPad Safari is served desktop
  **www.youtube.com** (both observed in the simulator this week). They are
  different DOMs: desktop elements are `ytd-*`, mobile ones `ytm-*`.
- `css.js` and the modules reference roughly **15 distinct `ytm-*` elements
  against 100+ `ytd-*`**. Mobile handling exists only in a few places
  (`shorts.js`, `contentblock.js`, `homegrid.js`, one line of `declutter.js`).
- `scripts/probe.sh` already measures whether selectors match a live page, but
  only as a script pasted into a desktop console by hand.
- Every YouTube page loads **24 content-script files, 272 KB** (`panel.js`
  72 KB, `css.js` 35 KB, `defaults.js` 34 KB, `summary.js` 18 KB) whether or
  not those features are on.
- iCloud sync, the Claude summary path and sponsor skipping have never run on
  a signed build or a physical device.

## 1. Make the iPhone promise true — first priority

**Evidence:** see the selector counts above. The product is sold as "iPhone,
iPad and Mac for one purchase", and the iPhone gets the thinnest coverage.
A switch that does nothing on the phone breaks Product Principle 5 ("describe
capability truthfully") and is the most likely source of one-star reviews.

**Changes:**

- Give every setting in `spec.js` a `where` field — `desktop`, `mobile` or
  `both` — and fill it from evidence, not guesses: extend `probe.sh` to run on
  `m.youtube.com` (home, watch, search, channel, Shorts, subscriptions) and
  record which groups match.
- On `m.youtube.com`, the popup and the panel stop offering switches marked
  `desktop`. Customize keeps them, labelled "Desktop only", so the catalogue
  still reads the same on every device.
- Add `ytm-*` selectors group by group, most-used first: watch page (comments,
  related, end screens, action bar), home feed, Shorts, search, channel. Each
  selector a live probe confirms gets a test pinning it, the same rule the
  desktop groups follow.
- Keyword, channel and regex blocking must classify mobile cards
  (`ytm-video-with-context-renderer`, `ytm-rich-item-renderer`, lockups) as
  well as desktop ones.

**Acceptance:** on m.youtube.com, every switch the popup or panel shows visibly
changes the page, proved by the mobile probe; the per-group counts of mobile
coverage are listed in the README. No switch the phone offers is a no-op.

## 2. Know when YouTube breaks a switch — first priority

**Evidence:** the README records rename after rename (`yt-page-header-renderer`,
`yt-lockup-view-model`, "Posts" for "Community", `#published-time-text`). Each
was found by a person probing by hand. At runtime a dead selector is silent.
The original roadmap called for a way to fix selectors without waiting for App
Store review; nothing like that exists (`bg.js` fetches only SponsorBlock and
Claude).

**Changes:**

- **In the extension:** a selector health check inside `diagnostics.js`. For the
  switches that are on and apply to the current page, count matches after the
  page settles. A switch that is on, applies here, and matches nothing is
  reported in the panel ("2 switches aren't finding anything on this page")
  and in Diagnostics, with the switch names.
- **For the maintainer:** run the probe automatically against live YouTube on a
  schedule (desktop and mobile widths, signed out), diff against the last run,
  and file an issue when a group drops to zero. The browser harness and
  `probe-dump.js` are most of this already.
- **Decision needed — remote selector overrides.** Selectors are data, not code,
  so a small signed JSON of overrides, fetched at most daily, could fix a
  YouTube rename the same day without an App Store release. It is also the
  first server the product would depend on, which the "no server, no
  subscription" story has avoided so far. Recommendation: build the health
  check and the scheduled probe first, then decide with a few weeks of data on
  how often renames actually happen.

**Acceptance:** break a selector on purpose; the panel names the dead switch on
the next page load, and the scheduled probe files an issue within one run.

## 3. Run it outside the simulator — first priority

**Evidence:** the previous plan closed with "what remains is device
verification", and it still remains. iCloud sync needs a signed build with the
iCloud capability; summaries need a real key; audio processing and focus timers
need background/resume on real hardware; iOS kills extensions that use too
much memory, which a simulator does not.

**Changes:** a TestFlight build and a written matrix: macOS Safari, a physical
iPhone and iPad, Chrome and Edge; signed in and out; English and Arabic. Cover
sync between two devices (including a conflict), one real summary, sponsor
skip and undo, audio boost across background/resume, a focus session through
a lock and unlock, and one-day versus always-allowed site access expiring.

**Acceptance:** every row of the matrix passes, or has a written, user-visible
explanation of why it cannot on that platform.

## 4. Let the app see the extension working — next

**Evidence:** on iOS the setup screen cannot say whether setup succeeded,
because iOS has no API for a Safari extension's state. After this week's iPad
test that is the main open question in onboarding: the user follows three
steps, returns to the app, and it looks exactly as before. The native handler
(`apple/Shared/CloudSync.swift`) already receives the extension's messages.

**Changes:** share an App Group between the app and the extension. The handler
records when it last heard from the extension, the extension version and the
page type; the app reads that and shows "Working — last active on YouTube 2
minutes ago" or "Not seen yet", with the troubleshooting steps for the second.
Show iCloud availability there too (`CloudSync.available` already computes it).

**Acceptance:** a fresh install shows "Not seen yet"; after allowing Costum on
youtube.com and returning, the app shows it working, without a reload of the
app. Requires adding the App Group capability to both targets, as the iCloud one
is added today.

## 5. First value in the first minute — next

**Evidence:** after setup the user lands on YouTube with a round button that
opens 239 settings. The fastest way to feel the product is a mode
(Recommended, Study, Music, Evening), and nothing points to one. Site access
granted "for one day" lapses silently the next day.

**Changes:** a one-time welcome card at the top of the panel: "Pick a starting
point" with the four modes and "Just the video", each applied in one tap and
undoable; dismissed for good once used or closed. When site access has lapsed,
the popup's existing not-allowed state says so in plain words and points to the
Extensions button (iPad) or Page Menu (iPhone).

**Acceptance:** a new user reaches a visibly changed YouTube page in two taps
from opening the panel; the card never appears again after it is dismissed; a
lapsed permission is explained, not just shown as "off".

## 6. Load less on every page — after device numbers exist

**Evidence:** 272 KB of scripts on every YouTube page, much of it for features
that ship off (summaries, bookmarks, focus) or for the panel before anyone
opens it.

**Changes:** measure first on a physical iPhone (parse time, memory, observer
cost during infinite scroll). Then load rarely used modules only when their
setting is on, and build the panel's DOM on first open rather than at page
load. Keep the no-bundler rule; this is loading less, not transforming more.

**Acceptance:** a measured budget on a physical iPhone, met, and a test that
fails when the always-loaded set grows past it.

## 7. Finish what is half-shipped — follow-up

- **Theme recolouring** was left out because YouTube's `--yt-spec-*` variables
  sit inside Polymer styles. Re-probe; ship only if every surface recolours.
- **Subscriptions page rules** are written but have never been seen to match,
  because that page needs a signed-in session. Probe signed in.
- **Hardware keyboard shortcuts on iPad** exist in `shortcuts.js` but have
  never been tried with a Magic Keyboard.

## Candidates after that — decide later

Only once 1–3 pass. Each builds on something already in the tree:

- **Search inside a video's captions** and jump to the moment. The transcript
  pipeline behind summaries already fetches the captions; this needs no API key.
- **Time on YouTube today**, shown in the panel, built next to the focus
  module's session timer (which counts down a session; it does not yet keep a
  daily total).
- **Per-channel speed, sound and clutter on the phone**, which today depend on
  desktop watch-page markup; they follow once item 1 covers mobile watch pages.

## Order and decisions

Order: **1 and 2 together** (the mobile probe is the health check's first
customer) → **3** → **4 and 5** → **6** → **7**. Each step lands with its tests,
as before.

Decisions needed from the product owner:

1. On the phone, hide desktop-only switches from the popup and panel (the
   recommendation) or only label them?
2. Remote selector overrides: yes, no, or decide after the health-check data?
3. Adding an App Group capability to both targets for item 4.

---

## Done — plan of 2026-09-13

**Status, 2026-09-13 (later the same day):** sections 1–6 below are implemented
and covered by `tests/features.html` (41 cases), `tests/logic.js` (322) and the
popup suite (79). Since then: Safari sync refresh with a documented conflict
policy, native failure reporting, versioned export/import with preview and
backups; custom modes and per-channel preferences; exact channel blocking with
per-card reasons and budgeted mutation work; bookmarks; summary coverage,
progress, request-count confirmation and a saved-summaries library. See the
README sections "Where the settings live", "Modes of your own", "Blocking,
precisely" and "Bookmarks". What remains is device verification — see
"Delivery and verification" at the end.

Reviewed 2026-09-13 against the current working tree, including existing uncommitted changes.

Scope assumption: “A+ features” means advanced functionality overall. There is no A+ feature group in the code. AI video summaries have their own workstream below so that scope can be narrowed easily.

### Baseline and evidence

The extension uses plain JavaScript with no bundler. Preserve that architecture and its Safari-first approach, with the generated Chrome/Edge build.

`./scripts/test.sh` passes: 30 JavaScript files parse, all 238 settings pass declaration/wiring checks, structural and style checks pass, and 262 logic assertions pass. This review did not exercise an installed extension on live YouTube or make paid AI requests. Findings below come from source inspection; browser-dependent failures need reproduction during implementation.

### 1. Make disabling the extension reliable — first priority

**Evidence:** `extension/content/router.js:124` returns immediately when disabled, without undoing module effects. Picture filters and blocked cards use inline styles. Existing loop, wheel, sponsor and focus timer handlers do not consistently check the master switch. Background ad-rule activation also checks its feature switch without checking the master switch (`extension/background/bg.js:203`).

**Changes:** Add an explicit module disable/cleanup lifecycle. Cancel pending work, clear focus overlays, restore owned styles and page attributes, stop loop/skip handlers, and reset bridge configuration. Route existing audio graphs through neutral settings; do not disconnect them and leave the video silent. Gate background request blocking on the master switch. Await initial settings before applying modules, and handle asynchronous hook failures.

**Acceptance:** Enable filters, audio processing, A–B looping, sponsor skipping and focus; switch Costum off without reloading. No new effects run, owned effects are removed, audio remains audible, and re-enabling creates no duplicate listeners or timers. Verify ad rules are disabled too.

### 2. Prevent lost settings and make sync consistent — first priority

**Evidence:** Popup writes use `extension/common/store.js:11`, while panel writes use `extension/background/bg.js:43`. Both independently read, merge and replace the settings object. Concurrent writes can overwrite one another. Popup writes also bypass `pushToCloud`; the background storage listener currently only updates redirect/ad rules.

**Changes:** Route popup and panel mutations through one serialized background writer. Include import/reset and cloud application in the same ordering strategy. Define the conflict policy, acknowledge successful local persistence, and consistently trigger Safari sync for local changes without echoing cloud writes back indefinitely. Keep the API key device-only.

**Acceptance:** Interleave popup and panel patches against different fields and preserve both. Verify rapid changes, failed storage writes, import/reset, Safari sync, and Chrome local persistence. Keep existing secret-exclusion assertions.

### 3. Repair playback controls and player transitions — next

**Evidence:** Volume actions in `extension/content/modules/audio.js` and the volume wheel path in `extension/content/modules/playback.js:45` directly call page-owned player methods from content scripts. The repository already provides `extension/content/page/bridge.js` for accessing those methods across JavaScript worlds. Native-player teardown removes its video but does not restore the original video's muted state (`extension/content/modules/nativeplayer.js:11`, `:67`).

**Changes:** Add narrow volume get/set bridge commands and an appropriate media-element fallback with explicit capability reporting. Preserve and restore original playback state when entering or leaving the native player. Make the active-video lookup consistent across playback, capture and PiP. Reject late native-player mount results after navigation or disable. Retain the experimental label until device tests demonstrate useful support.

**Acceptance:** Volume buttons and wheel change actual audible volume in installed Safari and Chromium extensions. Native-player enable/disable preserves mute state and playback position. Unsupported streams retain a usable YouTube player. Navigation during setup cannot mount the previous video.

### 4. Make AI summaries dependable — next

**Evidence:** `extension/content/modules/summary.js:37` has no request identity, cancellation, deduplication or cache. Results can arrive after navigation or overwrite a newer request. `extension/content/page/bridge.js:153` combines captions from the most recently intercepted response with the current player's identity without checking that the IDs match. Transcript text is silently cut at 120,000 characters (`summary.js:34`). Empty extracted transcripts are not rejected. The API request in `extension/background/bg.js:119` has no timeout and exposes raw API errors.

**Changes:**

- Associate player metadata, transcript and result with one validated video ID. Reject mismatched caption responses; clear or label an old result on navigation.
- Track each summary job. Deduplicate repeated clicks, cancel local work, propagate cancellation where possible, and discard late replies after navigation, replacement or disable.
- Distinguish missing captions, bridge failure, empty transcript, expired caption URL and network failure. Match regional language codes and retain the selected track's language metadata.
- Replace silent truncation with timestamp-preserving chunks and a final synthesis, subject to an explicit input/cost budget. Show partial coverage when that budget prevents summarizing the full video.
- Add bounded timeouts and actionable errors for invalid credentials, unavailable models, rate limits and service failures. Verify the configured model IDs against official provider documentation during implementation; model availability was not checked in this review. Avoid automatic retries that could duplicate paid generation.
- Read credentials in the background for generation. Keep credentials out of caches and diagnostics. Treat transcript text as source material, not instructions.

**Acceptance:** Exercise rapid double clicks, A→B navigation, reversed completion order, disabled summaries, missing/empty captions, long videos, timeout, invalid key, unavailable model and rate limiting. No wrong-video output or unintended duplicate request is accepted. Most cases should use mocked provider responses; live checks should be deliberate.

### 5. Make summaries useful while watching — after reliability

**Evidence:** `extension/content/panel.js:937` renders summary output as plain text, ignores the supplied title, and does not make timestamps actionable. Its settings rerender preserves text but converts every carried state into `done` (`:903`, `:921`).

**Changes:** Keep structured summary state outside the DOM: video identity, title, loading/error/done state, source coverage and points. Render validated timestamp buttons that seek only the matching video, with copy, retry and cancel actions. Add a bounded local cache keyed by video, caption identity, language, model and prompt version; provide clear-history controls. Offer brief/detailed summaries after the main flow is stable. Localize recovery messages in English and Arabic and announce loading/results accessibly.

**Acceptance:** A timestamp seeks to a valid point in the correct video. Changing speed or another setting preserves summary state. Cached results avoid a new API call, and changed model/language/transcript invalidates the cache. Copy, retry, keyboard use and RTL work.

### 6. Improve filtering and sponsor recovery — follow-up

**Evidence:** `extension/content/modules/contentblock.js` handles desktop card tags and scans added elements, but does not re-evaluate their containing card when child metadata arrives later. Invalid regexes are silently ignored. In `extension/content/modules/sponsors.js`, a failed request leaves `loadedFor` set, preventing a same-key retry on later applies.

**Changes:** Re-evaluate affected ancestor cards and recycled metadata, with deduplication and bounded work. Add mobile selectors only after observing actual mobile markup. Validate regexes where they are entered. Offer a way to reveal a blocked card and explain the matched rule. Give SponsorBlock explicit failed/loading/loaded states, bounded recovery, and an undo-skip action that temporarily exempts that segment from immediate re-skipping.

**Acceptance:** Delayed card titles and reused cards are classified correctly; removing a rule reveals affected cards. Invalid rules receive feedback. SponsorBlock recovers after a transient failure, and undo does not immediately skip again.

### Delivery and verification

Implement in this order: lifecycle → settings writer → player controls → summary correctness → summary conveniences → filtering and sponsor recovery. Keep each step independently reviewable and include regression coverage with the fix.

Extend the existing harness with actual feature modules and controlled browser/API stubs; structural wiring checks alone cannot prove a feature works. Cover enable/disable, player replacement, rapid navigation, concurrent settings writes and reversed async completion order. Then run a compact installed-extension matrix: macOS Safari, physical iPhone/iPad Safari, Chrome/Edge; desktop/mobile YouTube; signed-in/out where relevant; English/Arabic. Include device background/resume tests for audio and focus timers.

Completion means the acceptance cases above pass and any unsupported browser/video combination is reported clearly. Expanding the settings catalog should wait until the existing core actions pass this matrix.
