# Costum for YouTube

A Safari web extension that combines what **Enhancer for YouTube** does for playback
with what **UnTrap** does for clutter — on iPhone, iPad and Mac, for one purchase
with no subscription.

Enhancer does not exist on Safari at all. UnTrap does, but never touches playback
and charges $35.99/year for sync and AI summaries. This project takes both halves.

## Layout

```
extension/          the web extension — plain JavaScript, no build step
  common/           settings model (defaults.js), CSS builders (css.js), storage
  background/       messaging, SponsorBlock, Claude API, iCloud bridge
  content/          boot (document_start), router, in-page panel
    modules/        one file per feature, each able to fail alone
    page/           bridge.js — the only code that runs in the page world
  ui/               options page and toolbar popup
apple/Shared/       CloudSync.swift — the native messaging handler
apple/generated/    Xcode project (generated, safe to delete and rebuild)
tests/              logic tests, run through macOS JavaScriptCore
scripts/package.sh  regenerates the Xcode project
scripts/test.sh     syntax + logic tests
scripts/harness.sh  runs the popup and settings page as plain web pages
scripts/build-chrome.sh  emits build/chrome/ for Chrome and Edge
```

There is deliberately no bundler. What is written here is what ships, which keeps
the extension small enough for Safari on iOS and makes App Store review readable.

## Building

```bash
./scripts/package.sh
open "apple/generated/Costum for YouTube/Costum for YouTube.xcodeproj"
```

Then in Xcode: set your development team on all four targets, and add the
**iCloud key-value storage** capability to both Extension targets (this is what
makes cross-device sync work without a server).

The generated project references `extension/` in place, so editing a module and
rebuilding in Xcode is enough — `package.sh` only needs re-running when the
manifest changes.

Verified: both schemes build clean, and the iOS app installs and launches on the
simulator with the extension payload correctly bundled inside the `.appex`.

If the iOS scheme reports `supportedRuntimes=[]`, the installed SDK build and the
downloaded simulator runtime build do not match. Point one at the other:

```bash
xcrun simctl runtime match set iphoneos26.5 23F77
```

Never `killall` CoreSimulatorService or delete a runtime image that reports itself
as a duplicate — duplicate records can share one asset file on disk, and deleting
the record deletes the 8.5 GB download out from under the working one.

## Chrome and Edge

```bash
./scripts/build-chrome.sh
```

Then `chrome://extensions` → Developer mode → Load unpacked → `build/chrome`.

Safari and Chrome want opposite things from one manifest key. Safari is happiest
with a background *page* (`background.scripts`); Chrome rejects that key in MV3
and refuses to load the extension at all. The shipped manifest carries both keys
and the build strips `scripts` for Chrome. Both paths run the same `bg.js`, which
pulls in `defaults.js` with `importScripts` when it finds itself in a worker.
A test asserts the two keys stay in sync, so removing one to tidy up breaks the
suite rather than the other browser.

## Testing

```bash
./scripts/test.sh
```

Seven checks. Every extension file parses. Every setting in the options spec is
declared exactly once (the same switch on two surfaces is a real bug — the copies
disagree on sight). The settings model and CSS builders behave, which is the
logic that decides behaviour before any DOM exists. Every setting is wired to
something — a selector in `css.js` under its own page, or a module that reads
it — because a switch the settings page draws and no code reads is worse than a
missing feature: it looks like it works. Every function that is called is
defined somewhere, which sounds like something the parser would catch and is
not: a bare call to a name that was never declared parses cleanly and throws
only when the line runs. And the UI contracts hold:
the agreements *between* a page's markup, its script and its copy decks — a
script reaching for an element id the HTML does not define, a string key used in
one language and missing in the other, a control type in the spec that no
renderer draws, a group heading colliding with a surface name. Each of those is
a mistake that was actually made here, and each fails silently in a browser
rather than throwing. It all runs on the JavaScriptCore that ships with macOS,
so there is nothing to install.

What it cannot cover: anything that needs a real page. Those parts are verified
in Safari by hand — except the two HTML surfaces, which have their own harness:

```bash
./scripts/harness.sh
```

`?lang=ar` and `?path=/results` seed the locale and the pretend active tab before
the page reads them, which is the only way to check the Arabic layout or a
page-scoped control without clicking through the UI to set it up first.

That serves the popup and the settings page as ordinary web pages with the
extension APIs stubbed, so their layout and logic can be checked without
installing into Safari and enabling an unsigned extension. Storage is in memory
and the "active tab" is a fake `/watch` URL, which is enough to exercise the
page-scoped controls.

### Icons

Each of the nineteen surfaces carries a tinted rounded square, in the popup list
and in the settings rail, from `extension/ui/shared/icons.js`. They are drawn
here rather than taken from SF Symbols: Apple licenses that font for use in app
UI on its platforms, not for redistribution inside an extension bundle, and web
content cannot reach the system symbol glyphs in any case. So they follow the
same drawing rules instead — a 24-unit square, one stroke weight, round caps and
joins — over the system colour palette. One list for both surfaces: they used to
keep their own, and only one of them had icons at all.

### Interaction tests

Behaviour is the part neither suite above can reach: whether drilling into a
surface and coming back puts you where you were, whether a group flip can
actually be undone, whether search escapes the tab you are looking at. Open the
popup or the settings page from the harness and, in the console:

```js
const src = await (await fetch('/ui-browser.js')).text();
(0, eval)(src);
await CostumUiTests.run();
```

Thirty-two assertions, and they run in either language — the queries and group names
are read off the page instead of written into the test, so `?lang=ar` exercises
the same paths rather than falling over on an English string. An early version
did hardcode them, and the Arabic run failed on the test rather than on the code.

Two things this suite taught, both worth keeping:

**Prove a test can fail before trusting it.** Each behaviour here was broken on
purpose in the `.harness` copy, with the real source untouched, to confirm the
right assertion goes red and says something useful (`0 vs 240`). One of them did
not — a green run against a knowingly broken build — because the browser was
still holding the previous copy of the script. The harness now serves everything
`no-store` for that reason. A stale asset that turns a red test green is worse
than having no test at all.

**A test that cannot fail is not coverage.** Returning from a search result
restores the scroll position on its own, because that path never empties the
list. Asserting it there would pass whether or not the code that does it exists.
It is left unasserted rather than counted.

### One surface

There is no settings page. The popover behind the toolbar icon draws all 238
settings, every control type included — text, lists, times, the keyboard
shortcut recorder, the sponsor-category checkboxes, the custom stylesheet, the
API key, the settings password. Eleven of them used to hand over to a separate
full page, which meant the popover was a shortcut to the product rather than the
product.

Two things inside the YouTube page used to open that page — the panel's footer
link and the summary's "no API key yet" path. An extension cannot open its own
popover from a content script, so both now say where to go instead of jumping
somewhere that no longer exists.

The password is set and removed in place: the old page opened a modal, and a
340px popover has nowhere to put one, so the fields appear under the button that
asked for them. The full cycle is verified — set, reject a wrong one, remove.

`tests/ui-contract.py` now fails if the spec declares a control type the popup
cannot draw. With nowhere to hand a setting off to, an unhandled type is a
setting with nowhere to be changed.

### Type scale

Four steps, declared once in `shared/apple.css` and used by name: caption
(11px), body (13px), title (15px), display (28px). The rule for choosing is
that caption is for text you only read, and anything you click, type in or
press is body at minimum — a control you have to squint at is a control you
get wrong.

Before this there were eleven sizes between 9px and 16px. Each was reasonable
where it was written and the set was invisible: a description was 11.5px in the
popup, 12px in one part of the settings page and 12.5px in another, doing the
same job. Steps that close are not a hierarchy, they are one size rendered
inconsistently. 11/13/15 are the system's own steps at this density rather than
a wider typographic ratio — this is a settings surface, and the platform sets
its dense UI exactly there.

`tests/style-slop.py` keeps it: a raw pixel `font-size` anywhere outside the
`:root` declaration fails, as does caption size on anything interactive. It
also carries the subset of the [impeccable.style](https://impeccable.style)
detector vocabulary that applies to a settings surface and is decidable from
the stylesheet — the side-tab accent border, over-rounded cards, gradient text,
purple gradients, transitions on layout properties, easing that overshoots,
anything animating forever. The landing-page rules in that vocabulary (hero
eyebrows, italic serif display headlines, hero metric rows) have no counterpart
here and are not pretended at.

Its first run reported three findings and two were its own fault: it judged a
whole selector rather than the element the selector actually styles, so
`.list-row .row-label small` counted as interactive because a row is. It now
reads the subject of each selector.

### Contrast

The accent is two colours, not one. `--accent` fills a switch, which carries its
own contrast; `--accent-text` is the same idea adjusted for words, which do not.
The token existed and dark mode had not used it — it repeated the standard
system blue, which measures **3.82:1** on the raised surface, under the 4.5:1
that text this size needs. Light mode was **4.21:1** on the grouped background.
Both are now measured in `tests/style-slop.py` against the surfaces they
actually sit on.

That mattered more than a number: those two colours paint the line telling you
whether the extension is on, and the count telling you a surface has settings
running — the two most status-bearing strings in the popup were the hardest to
read in it. Three more places painted words with the control accent and now use
the text one; the test fails on any `color: var(--accent)` that is not a border
or an `accent-color`, which is a distinction it had to be taught, having first
flagged a range slider and a checkbox.

### What the critique changed

`/impeccable critique` scored the popover **26/40 — Acceptable**, and the three
P1s it named are fixed.

**A way back out.** Export, import and reset lived only in the settings page and
went with it, leaving 238 settings with no backup, no way to move them to
another machine, and no way to undo a configuration you regret. That was the
lowest score on the board — User Control and Freedom, 1 out of 4. All three are
at the foot of the root list now. Reset asks in place rather than in a modal, an
import that is not a settings file is refused rather than merged, and the result
is reported in the footer, because a popover that closes on a file dialog cannot
count on being open to report back.

Both landed with a defect the review had not looked for, because the review
predated them. The footer was a one-line hint before it held three buttons, and
`render()` had never hidden it — so "Your settings — Export, Import, Reset all"
sat under all nineteen surfaces and under every set of search results. Pinning
search created the second: the field was reachable from inside a surface, where
its results rendered into a hidden element, so it accepted typing and nothing
happened. A search field you can always see has to always work, so a query now
steps back out to the results. Both are assertions in the suite; the footer one
was proved by putting the leak back and watching it name four surfaces.

**Search was invisible.** It began 624px into a 486px viewport and sat
**eighteen tab stops** from the first focusable element: the fastest route to any
setting was the one thing you could neither see nor reach. It is pinned under
the header now — visible on open, **one tab stop** away. Both numbers are
assertions in the interaction suite.

**Eighteen options before the navigation.** Four profiles, six speeds, seven page
toggles and a master switch, all competing above the fold, against a
working-memory limit of four. Profiles are one recommendation now, with the
other three behind a disclosure that opens by itself when one of them is in
force, so the screen never hides the state it is in. Down to fifteen — the rest
is the speed row and the page list, both kept deliberately.

And the finding the critique turned up that nothing else had: **`blockNow` drew
a dead row.** "Block YouTube temporarily" rendered its own type name as a label
and the feature could not be used. The contract check had reported that every
declared control type had a renderer, because its regex was `[a-z]+` and could
not see a camelCase type name — the same blind spot in two places in the same
file. Both are fixed, the renderer is written, and the check now fails without
it.

### The polish pass

Run against [impeccable](https://impeccable.style)'s own playbooks — Operate
mode, where the tool should disappear into the task, and its craft floor. What
it found:

**The surfaces nobody draws.** Text selection and the caret shipped with browser
defaults that belong to no design system. Both are themed from the palette now;
the scrollbar already was. It is the cheapest tell that a page was assembled
rather than built.

**Motion above the range.** Product transitions belong in 150–250ms — a person
in a task should not wait for choreography. The base duration was 300ms.

**Controls without their states.** The keycap and the checkbox rows had no hover
and no active state at all; they were written in this session and the states
were simply skipped.

**An empty state that shrugged.** "Nothing matches that." is the exact phrasing
the guidance names as the failure. A search that finds nothing is the one moment
the reader is asking for help, so it now says what kinds of words work.

**Shouting section labels.** `PROFILES`, `SPEED`, `THIS PAGE` were tracked
uppercase — the pattern the craft floor bans outright as a kicker. They stay,
because a grouped-list header is a native affordance rather than a marketing
eyebrow, but in sentence case: that is both what the system itself does now and
what the ban is actually protecting against.

One thing it flagged that was not a defect: spacing. The rule is more room above
a heading than below it, and the first measurement said otherwise — because it
measured from a section box whose bottom padding swallowed the gap. Ink to ink
it is 18px above and 8px below, which was right all along. That measurement
nearly bought a fix for working code.

### The impeccable detector

`impeccable detect` runs over `extension/ui`. It reports four low-contrast
findings and all four are false: they pair light-mode token values — and the
`prefers-contrast: more` overrides — with dark-mode backgrounds, because it
reads the stylesheet as one flat set of colours rather than as themes. Three of
the four are `--separator`, which draws hairlines and is not text at all.

Rather than take either side on assertion, every text node on every surface is
measured in the browser in both themes, with alpha composited against what is
actually behind it: **zero failures**, in dark and in light. The vocabulary is
worth having; its static contrast rule cannot see a media query.

That exception is recorded in `.impeccable/config.json` with the reasoning and
the instruction to re-check by hand if the palette changes, so the detector runs
clean and a future finding means something.

### What the audits found

Three bugs, none of which any earlier test could see:

`syncAdRules(settings)` was called in three places in the background script and
defined in none. Every settings change and every startup threw a
`ReferenceError`, silently, in a context with no page to notice it — while the
"Block ad requests" switch sat in the settings page describing what it would
do. The static ruleset it was meant to enable is declared `"enabled": false` in
the manifest and nothing ever turned it on. It now uses `updateEnabledRulesets`,
which is the form Safari implements, and a test pins both that and the ruleset
id against the manifest.

`world()` was called inside the page bridge's `meta()` and never defined, so
every call for a video's title and caption tracks threw — which is everything
the summary feature runs on.

Hiding popups did not hide the consent wall. The selector assumed
`ytd-popup-container tp-yt-paper-dialog:has(ytd-consent-bump-v2-lightbox)`;
probed on live youtube.com the lightbox is a direct child of `ytd-app`, with
neither wrapper above it, so it matched nothing. Live counts after the fix: 1
against the bare tag, 0 against the wrapped form.

That live pass covered 24 selector groups — the header, the sidebar and the
global ones. The rest could not be reached from a signed-out session behind a
consent wall, and the consent dialog was left alone rather than dismissed. Of
the 24, none had broken syntax, ten matched, and the fourteen empty ones were
all explained by the page state except the consent wall above.

**Assertions about the DOM are not enough — nor about the DOM alone.** A
segmented control sized every button to the same width regardless of its label,
so "Show normally" was handed a 60px box and drew its text 39px across its
neighbour, while the row label beside it was squeezed to 19px and broke into
four lines. The suite reported nineteen passes through all of it: every
assertion was about which rows existed and what they were pressed to, and none
about where any of it landed. A control can be entirely correct and completely
unusable.

The cause was a threshold that had never been measured — the row stacked its
control onto its own line only when a setting had *more than three* options,
and three did not fit, nor did two. It is flexbox that decides now: the row
wraps, and a control that cannot share a line with its label takes the next one.
There is no number left to get wrong.

The suite now walks all nineteen surfaces and fails on any leaf whose
`scrollWidth` exceeds its box — which catches text overflowing its element and
text clipped to an ellipsis in the same check. It found eight more labels being
truncated across six other surfaces; settings labels wrap now rather than cut
off, because a row is 44px tall and a second line costs twelve of them, while
"Hide banners — New to you," with the rest missing costs the reader the ability
to know what the switch does.

**A member call is a call.** `Lock.check(...)` parses, satisfies every check in
the suite, and throws the moment the button is pressed — inside a listener,
where the exception reaches nobody and nothing appears on screen. The module is
`CostumLock` and it exports `verify`. `tests/undeclared.py` reads what each
`root.CostumX = { … }` publishes and now checks calls made through the module or
through a local alias bound to it. Its first version called `const clean =
self.CostumFields.parseNumbers(…)` an alias for the module; it wants the
reference to end there.

**Sleeping is not waiting.** The overflow sweep first cost thirty-eight
seconds and ran the suite past the runner's limit. The measuring was one
millisecond per surface; the cost was `await wait(90)` taking 999ms, because a
browser throttles timers in a hidden tab to about a second and the preview pane
is a hidden tab. Drilling into a surface renders synchronously — the title and
body are both there on the line after the click — so the sweep waits for
nothing at all now and the run went from timing out to ten seconds. The sleeps
were never buying anything; they were only paying for themselves.

**Assertions about the DOM are not enough.** An exception thrown inside an event
listener never reaches the code that dispatched the event — the browser catches
it, logs it, and carries on. A render function that called itself blew the stack
on every keystroke in the search field, and the suite reported eighteen passes,
because the rows had been appended before the overflow and were still there once
it unwound. The suite now listens for `error` and `unhandledrejection` for the
whole run and fails if the page raised anything at all.

## How a feature is wired

Every module registers itself and gets called by the router:

```js
Costum.register({
  name: 'playback',
  apply(settings, ctx) { },              // on load and whenever settings change
  onVideo(video, settings, ctx) { },     // when a new <video> appears
  onMutation(nodes, settings, ctx) { },  // batched, from the one shared observer
  actions: { speedUp(ctx) { } }          // bindable to a keyboard shortcut
});
```

Clutter settings are grouped by the YouTube page they act on — `watch`, `home`,
`search`, `sidebar`, `library`, `channel`, `global` — and `CostumCss.currentPages()` maps a
URL to its groups. The in-page panel uses that to show the controls for the page
you are actually on, so the list stays short instead of growing into forty
checkboxes you have to read past. A test asserts the selector table and the
settings defaults stay in sync in both directions.

Hiding Shorts is deliberately three layers, because one is not enough:

1. **CSS by tag name** at `document_start` — the fast path, no flash, for the
   tags we know today.
2. **A structural sweep** (`content/modules/shorts.js`) — anything linking to
   `/shorts` loses its surrounding card, whatever that card is called this month.
3. **A sweep by accessible name**, scoped to navigation containers — the mobile
   bottom bar's Shorts button is not a link at all, so nothing above catches it.

Plus an interception: with Shorts set to hide, visiting `/shorts` bounces back
instead of playing. Hiding the shelves is pointless if the door still opens.

The sweep's one hard rule: **never hide an element that contains other videos.**
An allow-list of container tags cannot keep up with YouTube's renaming — an early
version listed only the desktop `ytd-*` containers and blanked the entire mobile
search results page. The guard is behavioural instead: climb only while the
candidate holds no `/watch` links, so a list can never be mistaken for a card.
`tests/logic.js` pins this with a stand-in DOM.

Three rules hold the design together:

1. **Hiding is CSS, injected at `document_start`.** JavaScript hiding shows the
   element for a frame first. See `common/css.js`.
2. **One MutationObserver for the whole extension**, batched through a single
   animation frame in `content/router.js`. Per-module observers are what kill
   Safari on iOS.
3. **A module that throws gets logged and skipped**, never taking the rest down.
   YouTube reshuffles its DOM often; one broken selector should cost one feature.

## One-line bug worth writing down

The chevron is two borders rotated 45° into an arrowhead. The back button asked
for `rotate(180deg)`, which *replaced* that 45° rather than adding to it — so
the borders ended up on the opposite two sides and drew a corner, `└`, instead
of an arrow. The RTL rule had the same shape of mistake with `transform: none`.
A transform on a shape that is already rotated is another rotation of it, not a
flip of it: back is `rotate(-135deg)`, and `rotate(45deg)` in RTL.

## Undoing things

Applying a profile has always been undoable — `profileUndo` keeps what the
profile displaced, and keeps the *first* one when you switch straight from one
profile to another, so going back reaches what you had rather than the last
profile's values.

Flipping a whole group had none of that, though it displaces far more: thirty-three
sidebar entries in one press. It uses the same pair now — `pluck` what is about
to be overwritten, merge it back to restore — and the group's own button becomes
Undo until something else changes. Verified by hand as well as in the suite: two
entries set by hand, the group flipped to all twenty-two, then undo returning
exactly those two.

## Laying out the feed

YouTube sizes its own grid from custom properties, and they are readable from
the page — verified live, set and reverted:

    --ytd-rich-grid-items-per-row        4
    --ytd-rich-grid-content-max-width    calc(4*(700px + 16px) - 16px)
    --ytd-rich-grid-item-min-width       310px
    --ytd-rich-grid-row-margin           32px

So feed width, smallest card, column count and row spacing all work *through*
its layout engine rather than against it with widths of our own — which is what
makes this kind of setting survive a redesign instead of breaking on it.

Two things were inconsistent and are not any more. Columns applied to every grid
feed while rows only applied on the home page, so the same pair of controls
behaved differently depending on which feed you were looking at; both reach any
page that renders the grid now. And the watch page's related column is a list
rather than a grid, so its cap counts items instead of measuring where rows fall.

## Where the floating button sits

The panel button can live in any of the four corners, and the CSS already knew
that YouTube's masthead owns the top — the top corners start below it rather
than under it. Nothing said the same about the left, so a button parked at
top-left sat on YouTube's own guide rail and covered its labels.

The left inset now clears whatever rail is actually there, measured at runtime
because it is about 72px collapsed, about 240px open, and absent on the mobile
layout. `railWidth()` is pure and tested: a drawer that has slid off-screen
still has a box, but a negative left, and treating that as space to avoid would
push the button into the middle of the page.

## The popover is the product

Clicking the toolbar icon used to give a handful of quick controls and a link
that threw you into a separate page — which meant leaving the video to change
anything real. Minimal Theme for Twitter never does that: its popover *is* the
settings. Ours is the same now, with a second level, because nineteen surfaces
and two hundred and forty-five settings do not fit in one scrolling column the
way forty do. The root lists the surfaces; tapping one pushes it over the top,
with a back button, in the same popover.

That needed the settings spec to stop living inside the settings page.
`common/spec.js` holds it now — every setting's path, control type and label in
both languages — plus the surface names, which had been part of the page's own
copy deck. The popover had been guessing a surface's name from its first group
heading, which called the player "Speed" and gave two different surfaces the
same name, "The feed".

The popover is a fixed 340×560 pane with one scrolling region inside it, not a
document that grows. That is not a style choice: Safari sizes the popup window
to the tallest content it has ever rendered and never shrinks it again, so
letting the body grow left a transparent dead zone below the content as soon as
a shorter view was shown — the root list is tall, a small surface is not. A
fixed height with the header and the one action pinned outside the scroll region
is also simply how a macOS popover behaves.

The popover carries the same three things the settings page does, because at
nineteen surfaces none of them is optional: a search that cuts across every
surface and says which one each hit came from, a count on each surface row so
the list shows where you have switched things on, and a back button that returns
you to where you were in the list rather than to the top of it.

A handful of controls stay on the full page and say so: the CSS box, keyboard
shortcut capture, the password, the timed block. They need room or a keyboard,
and squeezing them into a 320px column badly would be worse than handing over.

## The two entry points

The **in-page panel** is the one that matters on iOS, where reaching the browser's
extension menu costs three taps. The **toolbar popup** is the one that matters on
macOS, where it is what the toolbar button opens. They carry the same controls and
the same design, and both show the switches for the page you are actually on
rather than all ninety at once.

### Two levels, not one long page

The settings page is a tab per **YouTube surface** — Player, Watch page, Home,
Search, Sidebar, Library, Channel — and inside each, collapsible groups with one
open at a time. That is what keeps the page a screen tall as the switch count
grows; a flat list stopped working somewhere around a hundred.

The spec is authored as one array per tab with `{ heading: true }` markers, and
`splitDeclutterIntoSurfaces()` turns the clutter list's page headings into tabs
of their own, because people arrive thinking "fix the watch page", not "open the
declutter category". A page that brings its own sub-headings keeps them and skips
the synthetic wrapper.

Two details that are easy to get wrong:

- Groups use `<details name>`, so the browser closes siblings for us. That same
  attribute makes it impossible to open several at once — which is exactly what a
  search needs — so the name is dropped while a query is active and restored
  after. Without that, a query matching four groups shows four headers with only
  the last one expanded.
- What the search opens is not a choice the reader made, so it is not remembered.
  Clearing the query puts back the group they had open themselves.

Search spans every tab at once, matching at word starts — anywhere-in-word
matching turns a query like "ad" into hits on "instead" and "already". Each group
also has one control that flips every switch in it, because "hide everything on
the watch page" is the common intent and doing it one row at a time is tedious.

## Why the UI is the way it is

UnTrap's popup is a 23-screen app. Eight of those screens — sign-in, sign-up,
account management, verification, delete account, reset password, the Plus promo,
the ecosystem page — exist to sell and manage a subscription, not to change
anything about YouTube. It ships 6.7 MB, including 137 KB of icon-font CSS.

Costum has none of those screens, because it has nothing to sell after the
purchase. That is the whole design brief: every row is a control. The panel opens
on the page you are already looking at — one tap, against three taps up into
Safari's extension menu — and it is 208 KB in total.

## Feature coverage

Everything in UnTrap's own settings list is covered, grouped the same way it
thinks about the problem — per page — with the switches it offers plus the
playback, audio and picture controls it has none of. Two of its features are
deliberately shaped differently here: sponsor skipping ships off by default and
is never called ad blocking, and video summaries run on the user's own API key
instead of a subscription.

## Borrowed from Minimal Theme for Twitter

That extension is MIT-licensed and solves the same problem on a different site,
so it is worth reading rather than guessing at. Three of its ideas are in here:

- **An escape hatch.** Its Advanced section carries a CSS editor. Two hundred and
  thirty-one switches still will not cover every page YouTube ships, and a text
  box costs nothing to carry — so `declutter.customCss` is appended last, after
  everything the switches produced, and wins. The field reports how many rules
  actually parsed, because CSS parsers recover from almost anything and a silent
  no-op is the worst outcome.
- **A slider with a mark per stop** instead of a dropdown for a small linear
  range. Home columns and rows were selects; the range they live in was invisible
  until you opened the menu. Zero reads as "Default" rather than as a number.
- **One switch for one task.** Their Zen Writer Mode reconfigures the whole page
  for a single activity rather than asking anyone to find six switches. `layout.zen`
  is the same idea for watching: header, both sidebars, the related column and
  everything below the player, gone together. It only applies on a watch page —
  off one it would take a header away and leave nothing in its place — and the
  attribute is re-decided per navigation rather than set once at boot.
- **A mode has to say what it costs.** Panel rows can carry a note now, because
  a switch called "Just the video" that silently removes your comments is a
  switch you turn on once.
- **Getting the tab title back.** They offer it for Twitter's unread badge; the
  YouTube equivalent is the `(3)` prefix, a notification badge in the one place
  notifications cannot be turned off. Stripping it is a pure function with seven
  tests, including the case that matters: `(Official Video) Song` is not a count.
- **A grid instead of a column.** Their left-navigation section is a grid of
  tappable icons, not fifteen rows of "Hide X". The sidebar's twenty-two entries
  are chips now: struck through means gone, and at the settings page's own width
  they occupy three rows rather than twenty-two. A group opts in with
  `{ heading: true, dense: true }`, and only plain switches with no explanatory
  hint qualify — a chip has nowhere to put a sentence.
- **Room to breathe.** Their rows are 44px with a 15px label; ours were 36px and
  13.5px, sized for density. At two hundred and forty-five rows density reads as
  a spreadsheet, so the rows and type now match theirs and the card radius went
  from 10px to 14px.
- **A short list of choices is visible, not hidden in a menu.** Four options or
  fewer render as a segmented control, so all of them can be read without
  opening anything. Eight quality levels stay a dropdown, because a segmented
  control that wraps is worse than a menu.
- **Two control shapes carrying meaning** — a switch turns a behaviour on, a
  checkbox ticks something off a list of removals. Ours are all switches, on
  purpose: Safari draws no pseudo-elements on form controls, so the drawn switch
  is what renders reliably there — so the removals are a tick *button* rather
  than a checkbox input, which sidesteps that limitation and keeps the
  distinction: a switch turns a behaviour on, a tick takes something off the
  page.

## Forcing a quality

`setPlaybackQualityRange()` is the API every guide names, and on its own it only
works in one direction. Lowering a cap is obeyed. Raising one is not: asking for
1080p left a live video at 480p with `hd1080` sitting in the available list,
because YouTube's adaptive algorithm is free to pick the bottom of the range and
does. `setPlaybackQuality()` is what pins it up.

The bridge now calls both — the single-argument one to move it, the range to stop
the algorithm drifting back down — and repeats for a few seconds until the player
reports the level it was asked for, because there are no quality levels at all
for the first moment after a navigation. It stops once it sticks rather than
polling forever, so someone who picks a quality by hand is not fought.

What this cannot do is reach a quality the account is not served. Premium
bitrates come as a separate stream that is absent from the player response
without a subscription; there is nothing there for a client-side call to select,
whatever the setting says.

## Ads

Three layers, all off by default, each doing what the layer above cannot:

1. **Network** — a static `declarativeNetRequest` ruleset (`extension/rules/ads.json`)
   blocks the ad and ad-tracking endpoints before they load. Safari implements
   static rulesets and `updateEnabledRulesets`, so this works there; the ruleset
   ships disabled and the background switches it on with the setting. A test
   asserts no rule can ever touch `/youtubei/` or a `media`/`main_frame` request —
   blocking those stops the ads and the video with them.
2. **In-player** — the sound goes off the instant `ad-showing` appears, because
   that is the part people mind and it costs nothing to do immediately; then the
   Skip button is pressed as soon as it exists; failing that the ad is run out
   both by seeking and at 16×, since either can be refused depending on the ad.
3. **Page** — the ad slots and the in-player promo chips are hidden by CSS.

Everything the second layer changes is put back, and that is the part with tests:
a viewer who was muted stays muted, a viewer at 1.25× gets 1.25× back rather than
1×, a second ad in one break does not overwrite what was held, and a tab closed
mid-ad does not leave the video silent. A muted video left behind is worse than
the ad was.

**Safari does not implement `updateDynamicRules`.** The home-page redirect used to
rely on it, so on the extension's main platform that rule never applied — the
redirect is carried by `content/modules/declutter.js` instead, and a test now
fails if that path disappears. Both paths resolve the destination through one
helper so they cannot disagree about what "/" means.

## The paid-feature stance

- **Sync** goes through `NSUbiquitousKeyValueStore` — the user's own iCloud, no
  server, so nothing to charge for.
- **Summaries** run on the user's own Claude API key, entered in settings and sent
  straight to Anthropic. Cents per video instead of $35.99/year.
- **Sponsor skipping** uses the public SponsorBlock database and ships **off by
  default**. It skips in-video sponsor segments; it is not an ad blocker, and it
  should not be described as one in App Store material.

## Status

Done: settings model and storage, document_start CSS pipeline, page-world bridge
(quality forcing, 60fps blocking, H.264 preference), playback, audio boost/bass/
normalize, video filters, layout and cinema mode, declutter, keyword/channel/regex
blocking, shortcuts, frame capture, SponsorBlock, AI summaries, scheduled focus
sessions and opening delay, the page-aware in-page panel, options page, popup,
Arabic and English throughout, Xcode packaging.

Verified by hand in Safari on the iOS simulator against `m.youtube.com`: the
extension loads, the panel renders and scrolls, settings persist across reloads,
the panel follows the page (watch, home and search each show their own controls),
and Shorts hiding removes the shelf, the chip, the bottom-bar button, and bounces
`/shorts` back to the feed.

The Shorts player is where the probe changed the plan rather than the selectors.
Its player carries **`ytp-hide-controls`**: the `.ytp-*` buttons — play, volume,
captions, settings, full screen — are simply not rendered inside Shorts on
desktop. So the eleven or so player-control switches a feature list would suggest
have nothing to act on, and shipping them would have shipped eleven switches that
do nothing. Nine overlay switches ship instead, each verified.

Appearance is half-shipped for the same reason. A **font** swap needs no
YouTube-specific hook and works, so it ships. Recolouring needs YouTube's own
`--yt-spec-*` theme variables, which are scoped inside Polymer styles this
extension cannot read from the page — a guess there recolours some surfaces and
not others, which looks broken rather than customised. It is left out until
there is a real theme system behind it.

The channel group (25 switches) turned up the biggest rename yet: the channel
header is **`yt-page-header-renderer`**, and `ytd-c4-tabbed-header-renderer` —
the name nearly every guide still gives — matches nothing. Two more:

- The **Community tab is called Posts** now. Both names ship, since older
  channels and other locales still show the old one.
- Subscribe and Join are unlabelled `button-view-model`s inside
  `yt-flexible-actions-view-model`; what separates them is the button *shape*
  class (filled vs tonal), which is the only language-independent handle.

One switch was deliberately merged rather than split: handle, subscriber count
and video count share one `yt-content-metadata-view-model` with no stable way to
address them individually, so they are one switch instead of three guesses.

The card, search and subscription groups (27 switches) were probed on a live
results page. Everything matched except the search sidebar: results do not live
in `ytd-browse`, so `ytd-browse[page-subtype="search"] #secondary` matched
nothing — it is `ytd-search #secondary`. Every selector a live check has
disproved once now has a test pinning the corrected form, so none of them can
quietly come back.

Subscription-feed rules are the exception in this group: that page needs a signed-in
session, so its four rules are written against the stable `page-subtype` attribute
but nobody has watched them match.

The watch-page group (40 switches) was built the same way, on a live video with
the comments scrolled into view. Two more names had moved:

- **Related videos are `yt-lockup-view-model`**, not `ytd-compact-video-renderer`.
  Keyword and channel blocking had quietly stopped applying to the watch page's
  sidebar — the list people scroll most — because the module only knew the old
  element.
- A comment's timestamp is `#published-time-text`; the `.published-time-text`
  class most guides still name matches nothing.

Left out on purpose: the player watermark. Nothing in the player carried a
`watermark` class on any video tested, so there was no honest selector to ship.

The header group (14 switches) was built from a live probe rather than from
memory, and the probe overturned two assumptions:

- **`ytd-searchbox` no longer exists.** It is `yt-searchbox` now, and the
  suggestion list is plain classes (`.ytSearchboxComponentSuggestionsContainer`,
  `.ytSuggestionComponentSuggestion`). The already-shipped "hide search
  suggestions" rule had been pointing at the retired element and did nothing; a
  test now fails if any rule mentions it again.
- **The logo is a single icon**, not markup with a separable wordmark. Hiding the
  word is a clip on `ytd-logo`, and disabling its link is `pointer-events`, so
  neither is a hide rule. `STYLE_ONLY` names them, and the coverage test treats a
  setting with an empty selector list as a bug unless it is declared there — an
  empty list emits a rule with no selector, which the parser drops in silence.

Desktop selectors were checked against live `www.youtube.com` (signed out).
Confirmed present: the Shorts shelf — which on the *desktop* site is
`grid-shelf-view-model` wrapping `ytm-shorts-lockup-view-model{,-v2}`, the mobile
tag names — plus `ytd-ad-slot-renderer`, `ytd-in-feed-ad-layout-renderer`,
`tp-yt-app-drawer#guide`, `ytd-mini-guide-renderer` and the thumbnail selectors.

The sidebar group (33 switches) was checked entry by entry with the guide drawer
open. Two selectors were dead and are now fixed from that evidence:

- the sidebar's **Shorts** entry has no `href` at all — its anchor carries
  `title="Shorts"`. The href-based rule matched nothing.
- `#guide-icon` no longer exists; the icons live in `yt-icon`.

Confirmed matching: home, subscriptions, You, history, the burger button, the
drawer, the mini guide, the sign-in promo, the footer, the More-from-YouTube
section, the subscription list, the icons, and Shorts by title.

Not exercised, because a signed-out sidebar does not render them: the library
entries (playlists, watch later, liked, downloads, clips), Explore and its
children, YouTube Music, Kids, Studio, settings, report history, help, feedback,
subscription avatars and the new-video dots.

Still unverified on desktop, because a signed-out session never renders them:
guide entries, the home chip bar, the continuation sentinel, mixes and playlists,
the notification bell, and search suggestions. They are written from the known
DOM but nobody has watched them match.

The extension has also never been run in Safari on macOS — only the payload was
checked inside the built `.app`. Doing that needs an unsigned extension enabled
in a real Safari, which is the user's call.

The panel's **Diag** button prints what the page looks like from inside the
extension — how the mobile bottom bar was identified. Safari gives an extension
almost no way to inspect its own host page, so this is how selector rot gets
diagnosed. Remove it from the panel before release, or move it somewhere less
prominent.

Not yet exercised end to end: the settings password. The dialog renders and the
hashing has unit coverage, but the full set → lock → unlock → remove cycle has
not been walked through on a device.

Six bugs came out of a read-through rather than a probe. None of them throws;
each just quietly does the wrong thing, which is why none had been noticed.

- **The home redirect took the whole site with it.** Its `declarativeNetRequest`
  rule filtered on `||youtube.com/`, which matches every path — so switching the
  setting on sent every watch page, search and channel to the target as well.
  It is anchored to the site root now (`||youtube.com/|`, where the trailing
  pipe is "end of URL"), and it transforms the path instead of redirecting to an
  absolute URL, so m.youtube.com stays where iPhone Safari already is. The rule
  is built in `defaults.js` so it can be checked without a browser, and the
  content-script fallback shares the same path helper.
- **Summaries read the wrong video's transcript.** Caption tracks come from the
  player response, and the bridge only ever kept the *initial* one — after any
  in-page navigation it still held the video the tab was opened on. The second
  video you summarised got the first video's transcript under the second one's
  title, which reads as a plausible summary of nothing you watched. The bridge
  now keeps the response from each navigation's player request.
- **Sponsor skipping went inert after a toggle.** Turning it off cleared the
  segments but not the video id they were fetched for, so turning it back on
  inside the same video matched that id and never refetched. Segments are now
  also dropped *before* the next fetch rather than after it, and checked against
  the id in the URL — otherwise the round trip is a window in which the new
  video is skipped against the old video's timings.
- **A focus session never ended.** `apply()` runs on load and on a settings
  change and nothing else, so a fifteen-minute session ran until the next
  navigation, which on a thirty-minute video is never — the one gate whose whole
  point is a clock was the one gate that had none. The same held for a schedule
  that began while a tab was already open, and for a block that expired behind
  its own veil. `nextGateAt()` says when the answer could change unprompted and
  the module sets a timer for it; the arithmetic is pure and tested, and all
  three cases were then watched happening in the focus harness.
- **The shortcut guard named a retired element.** `ytd-searchbox` again: the CSS
  table had been corrected, the guard against firing shortcuts while someone
  types had not. It is covered by the same test now.
- **The audio retry used stale settings.** Safari will not start an AudioContext
  without a gesture, so the module arms itself for the next one — closing over
  the settings it was armed with. The gesture that arrives is very often the
  boost slider that just changed them.

A second pass went after features that were shipped but not actually working.

- **The mini player was a switch wired to nothing.** `layout.js` had always set
  `costum-mini` on `<html>` when you scrolled past the player, and no stylesheet
  had ever read it — the module measured the scroll position and then did
  nothing at all. The rules are written now, and the awkward part is the
  placeholder: pinning `#player-container-outer` takes it out of the flow, its
  parent `#player` collapses, the page scrolls up, the player comes back into
  view and it un-pins on the next frame. So the module measures the player
  while it is still in flow, hands the height to CSS as `--costum-mini-hold`,
  and asks `#player` — the box still travelling — whether we have scrolled past.
  With no measurable height it declines to pin, which is what it did before.
  Driven on a stand-in page with the confirmed ancestry: it pins, stays pinned
  across repeated scroll events, and un-pins at the top.
- **The Search tab reached onto three other pages.** Its rules were written with
  bare element names, so "hide shelves" also emptied the channel page and the
  watch page's "more from channel", "hide playlists" took the home feed's
  playlists and mixes, and "hide chips" hid the home chip bar — an element that
  never appears on a results page at all. Every rule that can be is scoped to
  `ytd-search` now; a live results page confirms that everything search renders,
  it renders in there. The two suggestion rules stay unscoped on purpose, since
  that dropdown belongs to the header search box. A test walks the group and
  fails on any rule that escapes it.
- **"Hide watched" hid videos you had barely started.** The test for a full
  progress bar was `[style*="width: 9"]`, which matches `width: 90%` through
  `width: 99%` — and `width: 9%` with it. Each tenth is named instead; a
  substring cannot express a numeric range.
- **Three features re-scanned the whole document on every mutation batch.**
  The Shorts navigation sweep, the home-grid row clip and the ad sweep each ran
  on every batch, and YouTube produces batches several times a second for a
  whole session. The grid clip is the worst of them: it reads `offsetTop` on
  every card, which forces a layout. All three coalesce now — 500ms, 300ms and
  250ms — keeping the trailing edge, so the work still happens, just not
  repeatedly. Nothing here is faster than a person can see.

A pass over the settings page found most of its navigation was unreachable on a
phone — which is the platform this ships to first.

- **Nineteen sections, five screens of strip, nothing saying it scrolled.** Below
  the breakpoint the sidebar becomes a horizontal row, and with every section
  carrying its name that row measured 1929px inside a 351px viewport: 82% of the
  navigation was off-screen with no fade, no scrollbar and no other hint it was
  there. An unselected section is its glyph now and the selected one keeps its
  name, so you can still read where you are; the strip is 872px, fades at the
  edge, and snaps. The names are clipped rather than removed — they are the only
  thing telling a screen reader nineteen buttons apart.
- **Selecting a section did not bring it into view.** Reaching a section through
  search, or reopening the page on the one you were last in, left the strip
  parked on Player while the pane underneath showed Sidebar. It scrolls to the
  selection now, stopping short of the fade so the name is never half-covered.
- **The desktop sidebar's four clusters vanished on a phone.** Playback, Pages,
  Tools and Costum were simply hidden, since a row cannot carry headings. They
  come back as hairlines between the runs — the grouping without the words.
- **One badge, two meanings.** A group showed a bare `6` when none of its
  switches were on and `1 / 6` when one was, so a column read `1 / 6`, `3`, `2`
  and nothing said which of those was a total and which was a tally. The two
  halves were not even measuring the same thing: the `6` counted every row while
  the `1` counted only switches. It is `on / switches` throughout now, and a
  group with no switches in it says nothing rather than inventing a number.
- **The pitch went, the name stayed.** "One purchase. Every feature. No
  subscription." is worth saying on a wide window; in a sticky header on a phone
  it is two lines of marketing copy in the way of the controls on every scroll.

Checked at 375px, at 1180px, and with the layout flipped to Arabic — the fade
and the scroll padding are logical properties, so they follow the writing
direction rather than needing their own rules.

Known not working: the native Safari player. It needs a single combined stream,
and YouTube now serves audio and video separately for the videos tested, so it
does not engage. The toggle is under Experimental and says so; the code is
harmless when it cannot run. Removing it is reasonable if it never engages in
practice.

Next: a real iOS device pass (the simulator does not reproduce Safari's background
behaviour there), password-protected settings, and App Store assets.
