---
"@wizeworks/silicaui": minor
"@wizeworks/silicaui-react": minor
"@wizeworks/silicaui-mcp": minor
---

The mockup browser's traffic lights are themed, and its toolbar actually lines up

The dot cluster was positioned by two hand-tuned magic numbers that were copied from the window
titlebar and never re-derived for the browser toolbar, which is a different height. Both were wrong,
and the arithmetic says so:

- **Vertically**, the dots sat at a fixed `top: 0.875rem` — correct for the 2.25rem titlebar, but
  the toolbar is 2.75rem, putting the address bar's centerline at 1.375rem and the dots' at 1.175rem.
  Off by 0.2rem, which is exactly the "the URL bar is not aligned" you can see in a screenshot
  without measuring anything.
- **Horizontally**, the cluster ends at `1rem + 2 × 1rem + 0.6rem = 3.6rem`, but the toolbar reserved
  `padding-inline-start: 3.5rem`. The address bar was overlapping the third dot by 0.1rem.

The geometry is now single-sourced — dot size, step, and inset are declared once, and both frames
derive their padding and centering from them, so the two can't drift apart again. The toolbar centers
its dots against itself (`top: 50%`) rather than against a constant, which also means custom
`toolbar` content that grows the bar keeps the dots on the address bar's centerline instead of
stranding them near the top.

### The dots carry theme color

Close / minimize / zoom now read `--color-error`, `--color-warning`, and `--color-success`. They were
previously three copies of `currentColor` at 30%, which is a muted default doing no work — the exact
thing soft is not supposed to be. Because they resolve through the token roles rather than literal
values, **a theme gets correct traffic lights for free**: no per-theme CSS, and they re-resolve on a
`data-theme` island the same as everything else. The single-element-plus-`box-shadow` trick still
holds, since each shadow carries its own color.

`.mockup-plain` restores the neutral, colorless dots for anyone who wants the old look:

```tsx
<MockupBrowser url="https://silica.ui" className="mockup-plain">…</MockupBrowser>
```

### The URL is readable

`.mockup-browser-input` faded its text to 65% ink on the grounds that it's fake chrome. But the
domain in a mockup is usually the whole reason the mockup is on the page, so it reads as real text
and gets real ink. The corresponding exemption in `verify-readable-ink` is gone rather than left
sitting there describing a rule the CSS no longer follows.
