---
name: Costum for YouTube
description: Apple-native settings surfaces for a YouTube control extension; system stack, semantic ramps, grouped inset lists.
colors:
  accent: "#007AFF"
  accent-dark: "#0A84FF"
  accent-fill: "#0A6FDB"
  accent-text: "#006ADB"
  accent-text-dark: "#409CFF"
  accent-ink: "#FFFFFF"
  green: "#34C759"
  red: "#FF3B30"
  orange: "#FF9500"
  gray: "#8E8E93"
  label: "#1D1D1F"
  label-2: "#6E6E73"
  label-3: "rgba(60, 60, 67, .34)"
  label-dark: "#F5F5F7"
  label-2-dark: "#A1A1A6"
  fill-1: "rgba(118, 118, 128, .12)"
  fill-2: "rgba(118, 118, 128, .08)"
  fill-3: "rgba(118, 118, 128, .05)"
  switch-off: "rgba(120, 120, 128, .16)"
  separator: "rgba(60, 60, 67, .16)"
  hairline: "rgba(0, 0, 0, .08)"
  bg: "#F2F2F7"
  bg-raised: "#FFFFFF"
  bg-sunk: "#EBEBF0"
  bg-dark: "#1C1C1E"
  bg-raised-dark: "#2C2C2E"
  segment-thumb: "#FFFFFF"
  segment-thumb-dark: "#636366"
  sheet: "rgba(28, 28, 30, .94)"
  sheet-card: "rgba(58, 58, 60, .42)"
  sheet-dim: "rgba(235, 235, 245, .72)"
  sheet-line: "rgba(255, 255, 255, .08)"
  sheet-line-strong: "rgba(255, 255, 255, .14)"
  mark-red-top: "#FF4B4B"
  mark-red-bottom: "#D6202B"
typography:
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Helvetica Neue\", system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 590
    lineHeight: 1.45
    letterSpacing: "-.014em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Helvetica Neue\", system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "-.006em"
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Helvetica Neue\", system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: ".006em"
  section-heading:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Helvetica Neue\", system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 590
    lineHeight: 1.4
    letterSpacing: ".006em"
  arabic:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Arabic\", \"Geeza Pro\", system-ui, sans-serif"
  mono:
    fontFamily: "ui-monospace, \"SF Mono\", Menlo, monospace"
    fontSize: "13px"
rounded:
  input: "6px"
  control: "8px"
  segmented: "9px"
  sheet-card: "10px"
  list: "14px"
  sheet: "16px"
  pill: "980px"
spacing:
  xs: "2px"
  sm: "6px"
  md: "8px"
  row-gap: "12px"
  row-inline: "14px"
  panel-inline: "16px"
  section: "18px"
components:
  list:
    backgroundColor: "{colors.bg-raised}"
    rounded: "{rounded.list}"
  list-row:
    textColor: "{colors.label}"
    typography: "{typography.body}"
    padding: "9px 14px"
    height: "44px"
  list-row-hover:
    backgroundColor: "{colors.fill-3}"
  list-row-active:
    backgroundColor: "{colors.fill-2}"
  settings-row:
    backgroundColor: "{colors.bg-raised}"
    textColor: "{colors.label}"
    rounded: "{rounded.list}"
    padding: "9px 14px"
    height: "48px"
  button:
    backgroundColor: "{colors.fill-1}"
    textColor: "{colors.label}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "7px 14px"
  button-hover:
    backgroundColor: "{colors.fill-2}"
  button-filled:
    backgroundColor: "{colors.accent-fill}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "7px 14px"
  button-plain:
    textColor: "{colors.accent-text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "7px 6px"
  button-danger:
    textColor: "{colors.red}"
    typography: "{typography.body}"
  switch-track:
    backgroundColor: "{colors.switch-off}"
    rounded: "{rounded.pill}"
    width: "38px"
    height: "23px"
  switch-track-on:
    backgroundColor: "{colors.accent}"
  segmented:
    backgroundColor: "{colors.fill-1}"
    rounded: "{rounded.segmented}"
    padding: "2px"
  segmented-item:
    textColor: "{colors.label}"
    typography: "{typography.body}"
    rounded: "7px"
    padding: "5px 6px"
  segmented-item-selected:
    backgroundColor: "{colors.segment-thumb}"
    textColor: "{colors.label}"
  input-text:
    backgroundColor: "{colors.bg-raised}"
    textColor: "{colors.label}"
    typography: "{typography.body}"
    rounded: "{rounded.input}"
    padding: "5px 9px"
  input-search:
    backgroundColor: "{colors.bg-raised}"
    textColor: "{colors.label}"
    typography: "{typography.body}"
    rounded: "{rounded.segmented}"
    padding: "8px 11px"
  section-label:
    textColor: "{colors.label-2}"
    typography: "{typography.section-heading}"
    padding: "0 2px"
  toast:
    backgroundColor: "{colors.bg-raised}"
    textColor: "{colors.label}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  panel-sheet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.label-dark}"
    rounded: "{rounded.sheet}"
    width: "320px"
  panel-card:
    backgroundColor: "{colors.sheet-card}"
    rounded: "{rounded.sheet-card}"
  panel-row:
    textColor: "{colors.label-dark}"
    typography: "{typography.body}"
    padding: "8px 12px"
    height: "42px"
  chip:
    backgroundColor: "{colors.fill-1}"
    textColor: "{colors.label-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "7px 11px"
  tab-icon:
    backgroundColor: "{colors.gray}"
    textColor: "{colors.accent-ink}"
    rounded: "26%"
    size: "20px"
---

# Design System: Costum for YouTube

## Overview

**Creative North Star: "The System Settings Pane"**

Costum's surfaces are drawn as if Apple had shipped them: the OS provides San Francisco, the palette is Apple's published system tints plus the semantic label / fill / separator ramps, and every control is a native primitive (switch, segmented control, grouped inset list, disclosure fold, thin sheet). Nothing is branded beyond a single red app mark. The visual identity is restraint; the product's character is utility, and the design's job is to get out of the way of 238 settings.

Two surfaces share one system. The toolbar popup follows `color-scheme: light dark` and is a fixed 340x560 pane on macOS (full-height sheet on a phone). The in-page panel is a dark-only thick blurred sheet floating over YouTube, carrying an inlined copy of the same tokens. Where the build had drifted between them (five type sizes in the panel, eleven in the popup) this pass collapsed both to the same four-step scale and the same tracking, and a test now holds the two in step.

The containing app (`apple/App/ViewController.swift`) is a third surface, and the one place the system is expressed in SwiftUI rather than CSS. It uses the platform's own primitives outright: a grouped `Form`, Dynamic Type text styles, semantic colours, SF Symbols, Liquid Glass buttons on iOS 26 and macOS 26, and default-action buttons on the Mac. It carries two things from this system: feature tiles use the same tint as the matching surface tile in the extension, and anything blue that carries white text uses `accent-fill`. On iPad it keeps a 600pt reading column rather than stretching the phone layout, and at accessibility text sizes its rows stack the icon above the text.

Density is settings-list density: 44px rows, 13px body, hairline separators indented to the label column, section headings in small grey caption above the card, and a trailing scope caption that says how far a section reaches.

**Key Characteristics:**
- System font, never shipped: `-apple-system` first, SF Arabic for `dir="rtl"`.
- Apple system blue as the control accent; a darker blue for filled buttons and a separate accent for blue text, each chosen to clear AA on its ground.
- One raised white/grey card per group, 14px corners, hairline ring instead of a border.
- Four type steps (11/13/15/28) with per-step tracking; nothing interactive below 13px.
- Motion only on transform, opacity and colour; the sheet curve `cubic-bezier(.32,.72,0,1)` at 180-240ms.
- Full accessibility rails: reduced motion, reduced transparency, increased contrast, focus rings drawn inside clipped lists.

## Colors

Apple's system palette as published, with three accent variants so the same blue never fails contrast in a new role.

### Primary
- **System Blue** (`accent`, dark: `accent-dark`): the control accent. Switch-on fill, segmented focus ring, caret, selection tint, `accent-color` on range sliders and checkboxes. Never used for words.
- **Accessible Blue Fill** (`accent-fill`): the fill of any button that carries text (`.btn.filled`), light and dark alike; white on it clears 4.5:1 where white on system blue does not.
- **Blue Text** (`accent-text`, dark: `accent-text-dark`): the accent used as a word: "On for this page" in the hero, the Customize back link, the "N settings on" counts, the tick in the mode picker, a modified slider readout, "More modes" summaries. Measured on the grouped background it sits on.

### Secondary
- **System Red** (`red`): `.btn.danger` text, `.row-note.danger`. Destructive only.
- **System Orange** (`orange`): the not-yet-allowed warning: at 16% over transparent as the `.announce.warn` ground and as the hero status colour when the site is blocked. Warning only, never decoration.
- **System Green** (`green`) and the other tints (indigo, purple, pink, teal, brown): surface tile fills via `--tint` on `.tab-icon`, each surface keeping one colour across the rail, the list and the drill header.
- **System Gray** (`gray`): the default tile fill when no tint is set.

### Neutral
- **Label** (`label` / `label-dark`): primary text.
- **Secondary Label** (`label-2` / `label-2-dark`): captions, hints, section headings, unmodified slider readouts, placeholders. Solid values, not Apple's alpha, so 11px hints clear AA.
- **Tertiary Label** (`label-3`): decoration only: chevrons, the checkbox hover underline. Never text.
- **Fills 1/2/3** (`fill-1..3`): the tinted-grey control ramp. Fill 1 is a resting button or segmented track, Fill 2 a pressed row or hovered button, Fill 3 a hovered row or plain-button hover. Dark mode doubles the alphas.
- **Switch Off** (`switch-off`): the unlit switch track.
- **Separator** (`separator`) and **Hairline** (`hairline`): 0.5px row dividers and the card's outer ring.
- **Grouped Background** (`bg` / `bg-dark`), **Raised** (`bg-raised` / `bg-raised-dark`), **Sunk** (`bg-sunk`): the page, the card, and a recessed well.
- **Segment Thumb** (`segment-thumb` / `segment-thumb-dark`): the selected segment. In the dark it is the lighter grey, since a white thumb would be darker than its own track.
- **Sheet** (`sheet`), **Sheet Card** (`sheet-card`), **Sheet Dim** (`sheet-dim`), **Sheet Line / Line Strong**: the in-page panel's own dark material: a .94-alpha near-black sheet, translucent grouped cards on it, a .72-alpha secondary label that holds AA over YouTube's light theme, and two white hairlines.
- **Mark Red** (`mark-red-top` -> `mark-red-bottom`): the only gradient in the system, the app icon's vertical red. Not a palette colour for anything else. The same mark, three white sliders on rows at 28/50/72% with knobs at 71/37/59%, is the popover hero, the panel header, the FAB glyph, the Panel tile, and every shipped PNG. `scripts/icons.swift` draws the PNGs (extension, toolbar, iOS light/dark/tinted, macOS grid), with two sliders instead of three below 24px.

### Named Rules
**The Three Blues Rule.** A switch has no text, so its fill is system blue. A filled button has a word on it, so it uses `accent-fill`. Blue that is itself a word uses `accent-text`. Never substitute one for another; a test measures each pairing against its ground.

**The Decoration Grey Rule.** `label-3` draws chevrons and discs and nothing readable. Text stops at `label-2`.

**The One Gradient Rule.** The app mark carries the system's only gradient. Text is never gradient-clipped; no purple or violet gradient exists anywhere.

## Typography

**Display Font:** San Francisco via `-apple-system` (SF Pro Display named for the Chrome build; Helvetica Neue, system-ui fallback)
**Body Font:** San Francisco via `-apple-system` (SF Pro Text)
**Arabic Font:** SF Arabic (Geeza Pro fallback), switched on `body[dir="rtl"]`
**Label/Mono Font:** `ui-monospace` / SF Mono / Menlo, for the code textarea only; same 13px, never smaller

**Character:** the platform's own settings type: quiet, dense, tracked by size the way SF is meant to be. Semibold is 590 (SF's variable weight), never 700. Antialiased, `font-synthesis: none`, optical sizing left to the system.

### Hierarchy
- **Display** (28px, tracking -.02em): declared as `--t-display`; no shipped surface sets it. Reserved for a future onboarding or empty state, not a step in current use.
- **Title** (590, 15px, tracking -.014em): names a screen: the hero title, the Customize workspace title, the drill header beside its surface tile, the panel header, the gate title.
- **Body** (400, 13px, tracking -.006em, line-height 1.45): every row label, every control label, every button, every input, the toast. The floor for anything you operate.
- **Section Heading** (590, 11px, tracking .006em, `label-2`): the group heading above a card, sentence case, with the scope caption at 400 on its trailing edge. The panel's `.sec-label` sets it at 600 with .05em tracking, still sentence case.
- **Caption** (400, 11px, tracking .006em, line-height 1.4, `label-2`): secondary text you only read: row sublabels, hints, notes, counts, "where" lines under search results.

### Named Rules
**The Caption Floor Rule.** Nothing interactive is set at caption size. A button, summary, input, chip or segment is body (13px) at minimum; a slider readout that becomes a reset button stays at body. Enforced by test.

**The Scale-Only Rule.** Outside `:root`, `font-size` is always `var(--t-*)`, never a pixel literal. Enforced by test.

**The Tabular Number Rule.** Counts, speeds and readouts set `font-variant-numeric: tabular-nums` and `unicode-bidi: plaintext`, so "1.25×" stays "1.25×" in Arabic and columns of counts do not wobble.

## Layout

The popup is a fixed pane: 340px wide, 560px tall, `overflow: hidden`, one scrolling region between a pinned header and a pinned footer. Hero card and search field sit above the scroll; the footer button below it, separated by a 0.5px rule. On a phone (coarse pointer, device width ≤480px) the pane becomes 100% x 100dvh; on an iPad (coarse pointer, wider device) it is a 400x600 popover, 600 being Safari's popover height cap. Both key on `device-width`, never the viewport: a popover's viewport is the popover, so a viewport rule is circular and collapsed the iPad popover to 130px. The in-page panel is a 320px sheet, `max-height: min(76vh, 620px)`, anchored to a configurable corner; at ≤430px it becomes a bottom sheet (`inset-inline: 0; bottom: 0; max-height: 82vh`, 14px top corners, a 36x5px grabber, safe-area padding).

The horizontal rhythm is a single gutter: 14px pane inset in the popup, 16px in the panel, 14px row padding inside a card (12px in the panel), and separators that start 14px in so they align with the label column. Vertical rhythm is 8px between a heading and its card, 8px between stacked cards, 18px between sections (14px between drill groups), 6px inside a folded group.

Rows are 44px minimum (42px in the panel, 48px for settings rows), 12px gap between label and control. A label and a segmented control share a line if they fit and the control wraps to its own full-width line if not; flexbox measures, no option-count threshold. Long-form controls (sliders, text, code) stack under their label in a `.stack-row` because at 340px nothing fits beside a label.

Touch: under `pointer: coarse` every control gets a 44px minimum height (48px rows), including the back button, the segment buttons, the search field and the slider readout button. The panel's close button grows from 26px to 36px, and its chips and segments reach 44px, on any coarse pointer, not only at phone width, so the iPad's floating sheet is finger-sized too.

Direction: Arabic flips through logical properties everywhere except the chevron, whose two physical borders are mirrored by a single rotation rule so RTL does not mirror twice.

## Elevation & Depth

A hybrid, mostly tonal. Cards are raised by colour (`bg-raised` on `bg`) and ringed by a 0.5px hairline shadow, not lifted. Real shadows are reserved for objects that are physically on top of something: a switch thumb, a selected segment, the toast, the floating sheet. The in-page panel adds material: `backdrop-filter: blur(30px) saturate(1.8)` under a .94-alpha sheet, disabled under reduced transparency.

### Shadow Vocabulary
- **Card ring** (`box-shadow: 0 0 0 .5px var(--hairline), 0 1px 1px rgba(0,0,0,.03)`; dark: ring only): every grouped list, settings row, hero, confirm card. A border that does not take layout.
- **Thumb** (`0 3px 8px rgba(0,0,0,.12), 0 1px 1px rgba(0,0,0,.04), 0 0 0 .5px rgba(0,0,0,.04)`; dark: `0 3px 8px rgba(0,0,0,.5), 0 0 0 .5px rgba(0,0,0,.3)`): the switch knob and the selected segment.
- **Sheet** (`0 24px 60px rgba(0,0,0,.22), 0 0 0 .5px rgba(0,0,0,.06)`; dark: `.6` / white ring): the popup toast; the in-page panel uses `0 24px 60px rgba(0,0,0,.55)` and its toast `0 10px 30px rgba(0,0,0,.45)`.
- **Tile gloss** (`inset 0 .5px 0 rgba(255,255,255,.28)`): the surface tile's top highlight, and the app mark's.

### Named Rules
**The Ring Not Border Rule.** A card's edge is a 0.5px hairline in the shadow stack. No card draws a `border`; only inputs, the panel sheet and chips (which sit on a translucent ground) carry a real 0.5px stroke.

**The Lifted Only If Movable Rule.** Drop shadows go on things that move or float: thumbs, toasts, the sheet, the FAB. Rows, cards and headers stay flat.

## Shapes

Continuous Apple corners at four sizes: 6px on text inputs, 8px on buttons, chips and the drill's folded summary (10px), 9px on the segmented track with 7px segments inside, 14px on grouped lists and the hero, 16px on the in-page sheet. Nothing between 16px and the 980px pill; the pill is the switch track and the toast only. Circles are the switch knob, the FAB, the panel close disc.

Surface tiles are rounded squares whose radius is 26% of their size (20px rail, 21px drill header, 27px list row, 34px hero mark, 44px gate mark) with the glyph knocked out in white at 65%.

Joined shapes square their shared edge: an open settings row loses its bottom corners and the mode picker below it loses its top corners, with a 0.5px separator between; the panel's disclosure summary and its card do the same at 10px.

Chevrons are two 1.7-1.8px borders on a 6.5-7px box, rotated; a back arrow, a fold arrow and a disclosure arrow are all the same shape at a different rotation, and open state rotates rather than swaps.

## Components

### Buttons
- **Shape:** gently rounded (8px), body type, `7px 14px`.
- **Default (`.btn`):** Fill 1 ground, label text; hover Fill 2; active `scale(.97)`.
- **Filled (`.btn.filled`):** `accent-fill` ground, white text, weight 590; hover darkens 12% toward black. The confirm and gate primary.
- **Plain (`.btn.plain`):** no ground, `accent-text`, 6px inline padding; hover Fill 3. Reset and Cancel.
- **Danger (`.btn.danger`):** default shape with `red` text.
- **Small (`.btn.small`, `.mode-tools .btn`):** 32px min-height, 4px block padding, in tool rows.
- **Back (`button.back`):** text-only `accent-text` at body size with a leading chevron; the way out of Customize and of a drilled surface.
- **Focus:** 3px ring of the accent at 55% alpha, 1px outside; inputs use 45% and 0 offset.

### Switch (`.sw` / `.switch`)
- 38x23px pill track, `switch-off` at rest, system blue on; 20px white knob with the thumb shadow travelling 15px on `--dur`. Drawn on a span with an invisible input over it for hit-testing (Safari does not render pseudo-elements on inputs). Disabled: 40% opacity.

### Segmented Control (`.segmented`)
- Sunken Fill 1 track, 9px corners, 2px padding and gap; segments are 7px, body size, tabular numbers, `unicode-bidi: plaintext`. Selected segment is the `segment-thumb` with the thumb shadow and weight 590. Hover Fill 3, active `scale(.97)`. `.grid2` lays four choices as two rows of two; the panel's `.wrap` sets `--cols` so its rows balance (eight speeds are two rows of four; six or fewer stay on one line). Labels truncate with an ellipsis rather than overlap.

### Chips (panel only)
- Fill 1 ground, 0.5px `sheet-line-strong` stroke, 8px corners, `7px 11px` (10px 13px on phone), body text, a 14px inline SVG glyph at 85% opacity that goes fully opaque when pressed. Hover Fill 2, active `scale(.96)`. Every chip carries a glyph, so a row never mixes symbol and bare-text buttons, and chips grow to fill their row so a wrapped row does not end ragged. A loop is the repeat symbol, never opposed arrows.

### Cards / Containers
- **Grouped list (`.list`, panel `.card`):** `bg-raised` (panel: `sheet-card`), 14px corners (panel: 10px), card ring, `overflow: hidden`. Rows inside are 44px (42px) with a 0.5px separator inset to the label column; hover Fill 3, active Fill 2. Focus rings inside a clipped list draw at -3px offset.
- **Settings row (`.settings-row`):** a single-row card that acts as a button, 48px, with a title/sublabel stack and a trailing chevron. Opens the mode picker in place.
- **Hero:** the 60px status card: 34px app mark, title, status caption that turns `accent-text` and 500 weight when the master switch is on, grey while checking, orange when blocked; the mark desaturates to 55% when off.
- **Confirm card:** the in-place destructive confirm, `10px 12px`, ring, a hint and a two-button row.

### Inputs / Fields
- **Text / time / password / textarea:** `bg-raised`, 0.5px `separator` stroke, 6px corners, `5px 9px`, body size; hover stroke `label-3`; focus stroke accent plus the 45% ring. Code textarea is mono at the same size, 76px minimum, vertical resize.
- **Search:** same field at 9px corners and `8px 11px`, pinned under the header, placeholder in `label-2`.
- **Range:** native with `accent-color`; its readout is a `label-2` tabular number that becomes an `accent-text` dashed-underlined reset button once the value leaves default.
- **Keycap:** shortcut recorder, `bg-raised` with a hairline stroke, 32px, turns accent-stroked and `accent-text` while recording.
- **Select (panel):** Fill 1 with a strong hairline stroke, 7px corners.

### Navigation
- Three levels, one grammar: Control Center (root) -> Customize (catalogue grouped by reach) -> a drilled surface. Each deeper level has a sticky head on `bg` with a 0.5px bottom rule: back button on the leading edge, title at 15/590 with the surface's 21px tile, and on a drilled surface a per-surface Reset (small plain button) whose confirm card appears beneath the head. Section headings carry a trailing scope caption in regular weight: "This video", "Every video", "Every watch page", "All of YouTube".
- Disclosure folds (`details.group`, `#more-profiles`, `#changed`, `.panel-disclosure`) hide the marker, set the summary at body size in `label`, and rotate the chevron on open; a fold with nothing in it renders as quiet grey text with no card.
- The mode picker is a grouped list with `role="radiogroup"`: the chosen row carries an 18px stroked tick in `accent-text` and a 590 label; unchosen rows keep the tick's space so labels align.

### Toast (`.announce`, panel `.toast`)
- A pill (980px) of `bg-raised` with the sheet shadow, body text, centered, absolutely positioned 12px above the pane's foot so nothing under the finger moves; enters with `toast-in` (4px rise, fade) over `--dur-fast`. The panel's toast is the blurred sheet material with a strong hairline, weight 500, above the FAB. Both are live regions. The warning variant (`.announce.warn`) is static, orange-tinted, caption size, in the flow under the header.

### In-Page Panel (signature)
- A 44px circular FAB in the sheet material opens a 320px sheet of `sheet` over `blur(30px) saturate(1.8)`, 16px corners, 0.5px strong hairline, sheet shadow; enters with `sheet-in` (8px rise, `scale(.97)`, fade) on the sheet curve and arrives settled on rebuilds. Sticky blurred header with the 22px mark, a 15/590 title and a 26px Fill 1 close disc. Sections are `.sec-label` + `.sec-scope` over one `.card`. At ≤430px it becomes the bottom sheet described in Layout.

### Surface Tile (`.tab-icon`)
- A rounded square of one system tint with a white SVG glyph, sized by a single `--icon` variable so the corner (26%) and the glyph (65%) scale together. Styled once in apple.css; the icon set is shared between the rail, the catalogue and the drill head (enforced by test). No two tiles in one Customize group share a tint; a colour may repeat only across groups.

## Do's and Don'ts

### Do:
- **Do** set every `font-size` through `--t-caption` / `--t-body` / `--t-title`; the scale is the only source of sizes.
- **Do** pair every step with its tracking token (`--track-*`); SF is tracked by size, not left at `normal`.
- **Do** choose the blue by role: `--accent` for controls, `--accent-fill` under white text, `--accent-text` for words.
- **Do** build a group as caption heading (with scope on the trailing edge) above one ringed card of 44px rows, separators inset to the label.
- **Do** keep transitions on `background`, `color`, `border-color`, `box-shadow`, `transform`, `opacity` and `filter`, on `--ease` at `--dur` (240ms) or `--dur-fast` (180ms).
- **Do** give every control a 44px target under `pointer: coarse` and a visible 3px accent ring on `:focus-visible`.
- **Do** write "mode", never "profile", in user-facing copy; name the levels Control Center, Customize and the surface's own name; use `arCount` (one / two / 3-10 / 11+) for every Arabic count.
- **Do** keep the popup and the panel token blocks identical when either changes; the style test compares them.

### Don't:
- **Don't** put anything interactive at 11px.
- **Don't** round a card past 16px; only the switch track and the toast are pills.
- **Don't** draw a thick (≥3px) border down one side of anything, or a `border` on a card; the hairline ring is the edge.
- **Don't** animate width, height, padding, margin or offsets; don't loop an animation; don't use an easing whose y control points leave 0..1.
- **Don't** clip text to a gradient or introduce any gradient beyond the app mark.
- **Don't** use `label-3` for text, or Apple's raw .6-alpha secondary label for 11px hints; the solid `label-2` values exist because the alpha fails AA at this size.
- **Don't** shout section headings: sentence case, no `text-transform: uppercase`.
- **Don't** ship a font file; the system stack provides SF, and the Arabic deck switches the stack rather than the size.
