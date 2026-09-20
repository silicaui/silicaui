# 060 — Tab lands on the panel, `:focus-visible` matches, and nothing on screen changes

**Status:** fixed
**Severity:** minor
**Found by:** P03 · Marlene Okonkwo-Bright · the "without a mouse" standing check
**Surface:** **@wizeworks/silicaui** — `.tabs-panel` (every consumer, not just the builder)
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Tabbing through the builder chrome, keyboard only, recording what each stop looks
like. Two of the fourteen stops showed nothing at all:

```
  1. NO RING  div[tabpanel] "No selection · Select an element on t…"
 11. NO RING  div[tabpanel] "Home · Page · Section · Ship your store …"
```

Read off the computed style, on the element that actually had focus:

```
Tab  1 → {"cls":"tabs-panel","fv":true,"outline":"none 3px oklch(0.21 0.012 255)","ringVisible":false}
Tab 11 → {"cls":"tabs-panel","fv":true,"outline":"none 3px oklch(0.21 0.012 255)","ringVisible":false}
```

`fv: true` is `:focus-visible` matching. The element knows it is keyboard-focused. The
outline has a width and a colour and a style of **none**.

## What should have happened

Something visible. She pressed a key and the screen has to answer.

## How to reproduce

Not builder-specific — reproduced on the docs site, with no builder anywhere:

1. Open `http://localhost:4011/docs/components/tabs/`.
2. Tab until focus reaches the tab panel.
3. Before the fix: `tabindex="0"`, `:focus-visible` true, `outline-style: none`, no
   box-shadow. Two presses with no feedback.

## Why it matters

Filed `minor`, and it belongs in **@wizeworks/silicaui**, not the builder — every
consumer of `Tabs` has it.

Base UI puts `tabindex="0"` on the active panel so a keyboard user can reach panel
content that has no focusable children of its own. That is correct and useful. But a
focusable element with `outline: none` is a WCAG 2.4.7 (Focus Visible) failure, and
the lived version is worse than the rule sounds: Marlene presses Tab, nothing happens,
presses it again, nothing happens, and has no way to know whether the key is working,
whether the app is frozen, or whether she has skipped past the thing she wanted.

## Where it lives

[packages/silicaui/src/components/tabs.js](../../../packages/silicaui/src/components/tabs.js)

```js
[sel("-panel")]: {
  paddingTop: "1rem",
  outline: "none",
},
```

**And the rule was right, for the case it was written for.** The panel is focused
*programmatically* every time its tab is activated, and drawing a box around a whole
page of content on every tab click is noise. The bug is that `outline: none` is
unconditional, so it also covers the one case where the ring is the entire point.

## Do the siblings have it too?

The plugin has 20 `outline: "none"` rules. **Most of them are correct and are
deliberately left alone**, because they are a different case:

| | |
| --- | --- |
| `tabs-panel` | **the defect** — reached by **Tab**, by the person's own choice |
| dialog, drawer, popover, dropdown, lightbox, command-palette surfaces | correct — focus is moved *for* the person when the thing opens; a ring round the whole surface is noise, and the content inside carries its own |
| `field`, `number-field`, `segment-field`, `select-menu`, `range`, `slider` | correct — the outline is suppressed on a wrapper that draws its own focus treatment (border/ring), which is visible |
| `.ProseMirror` (rich text) | correct — the editor draws a caret, which is the indicator |

The line is whether a person **arrives by pressing Tab**. If they do, the ring is not
decoration.

## The fix

Keep the resting rule, restore the ring for keyboard focus only:

```js
[sel("-panel")]: {
  paddingTop: "1rem",
  // No ring at rest: the panel is focused programmatically whenever its tab is
  // activated, and a box drawn around a whole page of content every time someone
  // clicks a tab is noise.
  outline: "none",
  // But it IS in the tab order … `:focus-visible` is the whole point — it fires
  // for the keyboard arrival and not for the click, so this brings the ring back
  // for exactly the case the rule above was never meant to cover.
  "&:focus-visible": {
    outline: `var(--focus-width, 2px) solid ${ACCENT}`,
    outlineOffset: "-2px",
  },
},
```

Same shape as the ring `tabs-tab` already has two rules above it — this is the panel
being brought in line with its own tab, not a new invention. `outline-offset: -2px`
draws inside, so it never shifts layout or clips.

## Confirmed by

Both halves measured, because the whole fix is the distinction between them:

```
arrived by Tab:       {"cls":"tabs-panel","fv":true,"outline":"solid 2px oklch(0.42 0.055 252)","ringVisible":true}
after clicking a tab: {"cls":"tabs-tab",  "fv":false,"outline":"none 3px",                      "ringVisible":false}
```

`pnpm verify` green across the whole workspace (including silicaui's own 13 probes and
`verify:chrome-ink`), builder e2e **200 passed**.

**Two probe errors withdrawn on the way there**, both of which would have reported a
working fix as broken:

1. The reader asked for `[role="tabpanel"][tabindex="0"]` and read the **first** match,
   while focus was on the second. It now reads `document.activeElement`.
2. The CSS was stale. The harness dev server had been restarted — but the old process
   still held port 5178, so the "restarted" server came up on **5179** and the probe
   kept talking to the old one. The served stylesheet said so plainly
   (`curl .../styles.css | grep tabs-panel`), which is the check that settled it.
   This is the trap the memory note `css-changes-need-a-cold-next-build` describes,
   arriving by a different road.

## Rating effect

None directly — this is chrome under every screen rather than one of them. It is the
reason `Site builder › Inspector` and `› Navigator` keep their Ease scores rather than
losing a point for an invisible tab stop.
