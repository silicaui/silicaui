# @wizeworks/silicaui-behaviors

## 0.15.0

## 0.14.0

## 0.13.0

## 0.12.0

## 0.11.0

### Minor Changes

- 970bb4b: Add assignable element animations: `sui-animate-*` (on load), `sui-reveal-*` (on scroll), and `sui-hover-*` presets in `silicaui`, plus `sui-duration-*`/`sui-delay-*` modifiers — all reduced-motion aware. `silicaui-behaviors` gains a `reveal` handler (IntersectionObserver-driven, mirrors `counter`) for the scroll trigger, matched by a new `reveal` `BehaviorType` in `silicaui-html`. The site builder's Inspector (`silicaui-builder`) gets a new Animate section (Trigger/Preset/Speed/Delay) for assigning these to any element; the edit canvas shows the final state while editing, and scroll-triggered reveals actually play in Preview and the published site.

  `silicaui-mcp`'s catalog is regenerated to include the new classes and behavior. Along the way, fixed a latent bug in its generator-arg detection that silently produced wrong class names for any `(prefix)`-only component (`card`, `skeleton`, and now `animations`).

## 0.10.1

## 0.10.0

## 0.9.0

### Minor Changes

- e8bd507: Toolbar: add `size` ("sm"/"md"/"lg"), `variant` ("muted"), `dividers` ("top"/"bottom"/"both"), and a `ToolbarCenter` region for start/center/end layouts (e.g. centered tabs with actions on either side).

  Email builder: add a Navigator (layers) panel to the left rail, mirroring the site builder's tree view; text blocks gain a `fontWeight` control and the color palette now exposes the full set of semantic roles (secondary/accent/neutral/info/success/warning/error), not just primary/base.

## 0.8.0

## 0.7.0

## 0.6.0

## 0.5.2

## 0.5.1

## 0.5.0

## 0.4.0
