---
name: Costum for YouTube
description: "Studio" — a control-desk language for a YouTube control extension; warm graphite neutrals, one teal signal, rounded-square controls, the rounded system face.
colors:
  accent: "#0D9488"
  accent-dark: "#2DBFA9"
  accent-fill: "#0F766E"
  accent-text: "#0F766E"
  accent-text-dark: "#4FD1BD"
  accent-soft: "rgba(13, 148, 136, .12)"
  accent-soft-dark: "rgba(45, 191, 169, .16)"
  accent-ink: "#FFFFFF"
  danger: "#C2410C"
  danger-dark: "#FB923C"
  orange: "#D97706"
  label: "#1A1A1C"
  label-2: "#5F5D58"
  label-3: "rgba(26, 26, 28, .30)"
  label-dark: "#EDECE8"
  label-2-dark: "#A3A19B"
  fill-1: "rgba(26, 26, 28, .07)"
  fill-2: "rgba(26, 26, 28, .05)"
  fill-3: "rgba(26, 26, 28, .035)"
  switch-off: "rgba(26, 26, 28, .14)"
  separator: "rgba(26, 26, 28, .09)"
  hairline: "rgba(26, 26, 28, .10)"
  bg: "#F4F3EF"
  bg-raised: "#FFFFFF"
  bg-sunk: "#EAE8E3"
  bg-dark: "#141416"
  bg-raised-dark: "#1E1E21"
  sheet: "rgba(20, 20, 22, .95)"
  sheet-card: "rgba(255, 255, 255, .045)"
  sheet-dim: "rgba(237, 236, 232, .72)"
  sheet-line: "rgba(255, 255, 255, .08)"
  sheet-line-strong: "rgba(255, 255, 255, .13)"
  mark-red-top: "#FF4B4B"
  mark-red-bottom: "#D6202B"
typography:
  title:
    fontFamily: "ui-rounded, \"SF Pro Rounded\", -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    letterSpacing: "-.012em"
  body:
    fontFamily: "ui-rounded, \"SF Pro Rounded\", -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "-.004em"
  caption:
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: ".01em"
  eyebrow:
    fontSize: "11px"
    fontWeight: 650
    letterSpacing: ".07em"
    textTransform: "uppercase"
  arabic:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Arabic\", \"Geeza Pro\", system-ui, sans-serif"
  mono:
    fontFamily: "ui-monospace, \"SF Mono\", Menlo, monospace"
    fontSize: "13px"
rounded:
  segment: "7.5px"
  input: "8px"
  switch: "8px"
  control: "9px"
  segmented: "10px"
  list: "12px"
  sheet: "16px"
spacing:
  gutter: "14px"
  panel-gutter: "16px"
  row-inline: "14px"
  heading-to-card: "8px"
  section: "20px"
---

# Design System: Costum for YouTube

## Overview

**Creative North Star: "Studio"**

Costum is a control desk for YouTube, so its surfaces are drawn like one rather than like a system settings pane: a warm graphite page, cards edged by a single line instead of lifted, a bank of rounded-square switches, small tracked capitals naming each group of controls, and one teal signal colour that means *this is on*. The red app mark is the only brand colour; nothing else is red unless it destroys something, and destructive actions are drawn in burnt orange so they never read as the brand.

The rounded cut of the system face (`ui-rounded`, SF Pro Rounded on Apple platforms) carries the whole interface. It is never shipped: the OS provides it, and anywhere it does not exist the stack falls back to the plain system face.

Two surfaces share one system. The toolbar popup follows `color-scheme: light dark` and is a fixed 340x560 pane on macOS (full-height on a phone, 400x600 on an iPad). The in-page panel is a dark-only sheet over YouTube, carrying an inlined copy of the same tokens because it lives in a shadow root. `tests/style-slop.py` holds the two in step: the type scale must match, and both must name their groups the same way.

The containing app (`apple/App/ViewController.swift`) remains native SwiftUI and keeps the platform's own look; it is not part of this system.

**Key Characteristics:**
- One signal colour in three strengths, each chosen to clear contrast in its role.
- Cards are drawn by a 1px line, never by a shadow; only things that move cast one.
- Rounded-square switches and knobs (8px track, 5.5px knob) instead of pills.
- The selected segment is filled with the signal and carries white type.
- Group names in 11px tracked capitals; Arabic, which has no case, drops the tracking.
- Four type steps (11/13/15/22); nothing interactive below 13px.
- Motion only on transform, opacity and colour, on `cubic-bezier(.2,.8,.2,1)` at 160-220ms.

## Colors

### The signal (teal)
- **Control accent** (`--accent`: `#0D9488`, dark `#2DBFA9`): the fill of things that carry no word: a switch that is on, a slider's run, the caret, the focus ring, `accent-color` on native checkboxes. 3.74:1 on white, over the 3:1 a control needs.
- **Fill** (`--accent-fill`: `#0F766E`, both themes): the ground under white words: `.btn.filled`, the selected segment in both surfaces. White on it is 5.47:1.
- **Text accent** (`--accent-text`: `#0F766E`, dark `#4FD1BD`): the signal as a word: the status pill when on, the Customize route, "on" counts, back links, modified slider readouts. 4.93:1 on the page, 5.47:1 on a card; 8.86:1 on a dark card.
- **Soft** (`--accent-soft`): a 12-16% wash of the signal behind a word in the text accent: the status pill, the "on" count badges, the pinned Customize row, the panel's welcome card, a pressed chip.

### Semantic
- **Danger** (`--danger`: `#C2410C`, dark `#FB923C`): destructive text only (`.btn.danger`, `.row-note.danger`). Burnt orange, not red, so it never reads as the brand mark.
- **Warning** (`--orange`): the not-yet-allowed state, as a 14% wash under the status pill and the in-flow `.announce.warn` strip; the panel's `.health` card uses the same amber.

### Surface tints
`--blue`, `--green`, `--red`, `--orange`, `--indigo`, `--purple`, `--pink`, `--teal`, `--gray`, `--brown` exist for surface tiles only. `icons.js` gives each surface a hex; the tile paints it at 15% behind the glyph drawn in the colour itself, lifted toward white in dark mode so deep hues stay legible. No two tiles in one Customize group share a colour.

### Neutrals
- **Label** (`#1A1A1C` / `#EDECE8`): primary text.
- **Secondary label** (`#5F5D58` / `#A3A19B`): captions, hints, scope captions, unmodified readouts, placeholders. 5.92:1 on the page; 6.44:1 on a dark card.
- **Tertiary** (`label-3`): decoration only (chevrons). Never text.
- **Fills 1/2/3**: a warm-ink ramp for tracks and hovers. Fill 1 is the segmented track and the off pill; Fill 2 and 3 are pressed and hovered rows.
- **Hairline / Separator**: the card edge (1px) and row dividers (1px, inset 14px to the label column).
- **Grounds**: page `#F4F3EF` (warm paper) / `#141416`; card `#FFFFFF` / `#1E1E21`; well `#EAE8E3` / `#0E0E10`.
- **Sheet** (panel): `rgba(20,20,22,.95)` over a 30px blur; cards are a 4.5% white wash with a 1px inner line; secondary text is `rgba(237,236,232,.72)`, which holds AA over either YouTube theme.

### Named Rules
**The Three Strengths Rule.** A control without a word takes `--accent`; a fill under a word takes `--accent-fill`; a word takes `--accent-text`. A test measures each against the grounds the sheet declares.

**The One Red Rule.** The app mark is the only red and the only gradient. Danger is burnt orange.

## Typography

**Face:** `ui-rounded` (SF Pro Rounded), falling back to the system face. **Arabic:** SF Arabic / Geeza Pro, switched on `dir="rtl"`. **Mono:** `ui-monospace` for the code field, at body size.

### Hierarchy
- **Display** (22px, -.02em): reserved for an onboarding or empty state; not used today.
- **Title** (15px, 700, -.012em): the popup name, the Customize and surface titles, the panel header, the gate.
- **Body** (13px, 400, -.004em, 1.45): every row, control, button, input and toast. Row labels that open something (`.settings-row`, the changes summary) take 560; selected or emphasised items take 650.
- **Eyebrow** (11px, 650, uppercase, .07em, secondary label): the name of a group above its card, in both surfaces. Its trailing scope caption ("Every video", "All of YouTube") is 500, sentence case and caption tracking, so it reads as a qualifier. In Arabic the tracking is removed.
- **Caption** (11px, 400, .01em, 1.4): sublabels, hints, counts, "where" lines under search results, the status pill (at 600).

### Named Rules
**The Caption Floor Rule.** Nothing interactive is set at 11px. Enforced by test.

**The Scale-Only Rule.** Outside `:root`, `font-size` is always `var(--t-*)`. Enforced by test.

**The Tabular Number Rule.** Speeds, counts and readouts use `tabular-nums` and `unicode-bidi: plaintext`, so "1.25×" stays "1.25×" in Arabic.

## Layout

The popup is a fixed pane with one scrolling region. Above it: the **header bar** (no card; 36px mark, title, status pill, master switch) and, in Customize, the search field. Below it on the Control Center: the **Customize YouTube** row, pinned behind a 1px rule so the route to every setting never needs a scroll. When content scrolls under the header, the scroll region's top edge draws the same rule.

One gutter: 14px in the popup, 16px in the panel; 14px row padding inside a card (12px in the panel), separators inset to the same column. 8px between a group name and its card, 20px between groups. Drilled surfaces add no inline padding of their own, so their cards sit on the Control Center's gutter. `.stack-row` (sliders, text, code under their label) shares the `.list-row` gutter and separator.

Rows are 44px minimum (48px for `.settings-row`, 42px in the panel). Under `pointer: coarse` every control reaches 44px. On a phone the popup is 100% x 100dvh and the panel becomes a bottom sheet (16px top corners, grabber, safe-area padding). Width rules key on `device-width`, never the viewport, for the reasons recorded in `popup.css`.

Direction flips through logical properties; chevrons are mirrored by a single rotation rule.

## Elevation & Depth

Flat. A card is `bg-raised` on `bg` with a 1px hairline (`--shadow-card: 0 0 0 1px var(--hairline)`), never a drop shadow. Shadows go only on things that move or float: the switch knob (`0 1px 2px`), the toast and the panel sheet (`0 18px 40px`). The panel adds material: `blur(30px) saturate(1.8)` under a .95 sheet, removed under reduced transparency.

## Shapes

Rounded squares throughout, nothing past 16px except the pinned pill radius token (unused by any component now). Segments 7.5px inside a 10px track; inputs 8px; switch tracks 8px with 5.5px knobs; buttons, chips and the panel close key 9-10px; cards 12px; the panel sheet 16px; the panel's floating button 14px; the app mark 10px (popup) / 7px (panel). Surface tiles are 30% of their size. Circles survive only in the status dot.

## Components

### Header bar (popup)
Mark, title, and a **status pill**: an inline 6px dot plus the state in words, 11px/600 in a 6px-cornered pill. On: text accent on the soft signal. Off: secondary label on Fill 1. Blocked: amber on a 14% amber wash. The mark greys out when the master switch is off.

### Switch (`.sw-track` / panel `.switch`)
40x24 rounded square, `switch-off` at rest, `--accent` when on; an 18px white rounded-square knob travels 16px. Drawn on a span with the input over it for hit-testing (Safari draws no pseudo-elements on inputs).

### Segmented control
Fill 1 track, 3px padding, 10px corners. The selected segment is `--accent-fill` with white 650 type, so the active speed reads at a glance. The panel's `.wrap` grid balances eight speeds into two rows of four.

### Buttons
- **Default** (`.btn`): card ground with the 1px hairline, 560 weight; hover tints toward the label.
- **Filled** (`.btn.filled`): `--accent-fill`, white, 650.
- **Plain** (`.btn.plain`): no ground, text accent.
- **Danger** (`.btn.danger`): default shape, danger text.

### Cards and rows
`.list`, `.settings-row`, `.confirm` and the changes summary are white (dark: `#1E1E21`) 12px cards with the hairline. Rows hover Fill 3 and press Fill 2. With nothing changed, "Your changes" is an empty slot: a dashed outline with quiet text. The pinned Customize row is the one tinted card: soft signal ground, title in the text accent.

### Counts
A surface or group with settings on shows its count as a badge: text accent on the soft signal, 6px corners. Counts with nothing on stay plain secondary text.

### Inputs
Card ground, 1px hairline, 8px corners. Focus: accent border plus a 3px soft-signal ring. The search field is 10px-cornered. The shortcut keycap has a 2px bottom edge, like a key.

### Chips (panel)
Fill 3 ground, 1px strong line, 10px corners, 560 weight, a 14px glyph. A pressed chip takes the soft signal and the text accent.

### Toast
Popup: a card-coloured pill with the sheet shadow above the pane's foot. Panel: the sheet material in a 12px rounded rectangle above the button.

### Panel
A 44px rounded-square floating button opens a 320px sheet: sticky header with the 24px mark, a 15/700 title and a 28px rounded-square close key; then eyebrow-named sections over line-edged cards. The welcome card uses the soft signal; the health warning uses amber.

### Surface tile (`.tab-icon`)
Soft tile: the tint at 15% behind the tint-coloured glyph, corners at 30% of the size, one `--icon` variable sizing both.

## Focus

A solid 2px `--accent` ring, 2px outside the control. Inside clipped cards the ring draws 2px inside instead.

## Do's and Don'ts

### Do:
- **Do** take every `font-size` from `--t-*` and pair it with its `--track-*`.
- **Do** choose the teal by role: `--accent`, `--accent-fill` or `--accent-text`.
- **Do** build a group as an eyebrow name (scope on the trailing edge) above one line-edged card.
- **Do** keep the popup and panel token blocks in step; the style test compares them.
- **Do** write "mode", never "profile", in user-facing copy.

### Don't:
- **Don't** set anything interactive at 11px.
- **Don't** lift a card with a shadow, or round one past 16px.
- **Don't** use red for anything but the app mark.
- **Don't** animate layout properties, loop an animation, or use an overshooting curve.
- **Don't** use `label-3` for text.
- **Don't** ship a font file.
