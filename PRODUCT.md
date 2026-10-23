# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Inferred pending product-owner validation: everyday YouTube viewers who want a
calmer, controllable viewing experience without learning a large settings
catalogue; and returning power users who need fine-grained control.

## Product Purpose

Costum changes YouTube playback, layout, clutter, shortcuts, and page behavior
through a Safari-first web extension with a generated Chrome/Edge build.
Success is a viewer making a useful, understandable change quickly while still
being able to reach advanced customization when needed.

## Positioning

Inferred from the repository: one extension joins playback enhancement with
distraction reduction, including a Safari-native iCloud bridge rather than a
separate subscription service.

## Operating Context

People use Costum while already on YouTube. They enter through the browser
toolbar popup for quick control or through an in-page panel while watching.
Settings affect a current video, a YouTube page type, or all of YouTube.

## Capabilities and Constraints

- The extension is plain JavaScript with no bundler and exposes 238 settings.
- It must ship as a Safari web extension and as a generated Chrome/Edge MV3
  build.
- Safari has an optional native iCloud bridge; Chrome/Edge settings remain in
  the browser profile until a real cross-browser sync service exists.
- Permission, unavailable-page, lock, loading, and degraded-service states
  must be understandable and actionable.
- These requirements are inferred from source and README evidence because the
  user asked to start without answering the product-discovery question.

## Brand Commitments

The name is Costum. Preserve factual product capabilities and the extension's
utility-first tone; the visual language is deliberately open for this redesign.

## Evidence on Hand

- [README.md](README.md) documents product scope, browser builds, and test
  harnesses.
- `extension/ui/popup/` is the toolbar surface and `extension/content/panel.js`
  is the in-page control surface.
- No externally validated customer research, analytics, or brand system is
  currently in the repository.

## Product Principles

1. Make the most likely viewing action immediate.
2. Show scope and consequence before a setting changes YouTube.
3. Keep expert capability discoverable without putting it in everyone’s way.
4. Make changes reversible and current state legible.
5. Describe browser-specific capability and sync limits truthfully.

## Accessibility & Inclusion

Preserve keyboard operation, screen-reader labeling, RTL layouts, reduced
motion support, high-contrast semantic states, and touch targets appropriate
for mobile Safari.
