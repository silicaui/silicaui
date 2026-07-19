---
"@wizeworks/silicaui-behaviors": patch
"@wizeworks/silicaui-html": patch
---

Accessibility + CSP hardening across the vanilla runtime and static HTML projection.

- behaviors: hydrate no longer steals page focus (toggle-group, selection-list); tooltips are keyboard-reachable with hover persistence and generated `aria-describedby`; modal scroll-locks and inerts the background while open; CommandPalette and combobox convey the highlighted option via `aria-activedescendant` over generated ids; carousel off-screen slides are inert, dots use present-or-absent `aria-current`, and autoplay pauses on keyboard focus; overflow-list is a proper disclosure (`aria-expanded`, Escape, real accessible name); rating keeps `aria-checked` in sync; wizard marks the active step `aria-current="step"`; form submits announce success/error via a live region; menus close on Tab; `confirm()` initially focuses Cancel; dismiss parks focus before removing its root; marquee honors reduced motion; scroll-area viewports are keyboard-focusable. New `verify-a11y.mjs` probe (32 checks) locks these contracts.
- html: `DropdownMenuContent` gets `role="menu"`, `TabsList` gets `role="tablist"`, the calendar grid is an honestly-labeled group, slider thumbs and date segments carry default `aria-label`s, OverflowList's panel drops its incorrect `role="menu"`. Embed's iframe no longer uses an inline `style` attribute, making static output run under strict CSP (`style-src` without `'unsafe-inline'`) — enforced by a new `verify-csp.mjs` probe.
