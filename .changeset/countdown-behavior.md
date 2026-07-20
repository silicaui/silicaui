---
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-behaviors": minor
"@wizeworks/silicaui-react": patch
---

**`Countdown` works outside React**, via a new `countdown` behavior.

Reuse was checked first and rejected on the merits. The existing `counter`
behavior tweens text from 0 to a target once, when it scrolls into view. A
countdown is a recurring clock that stops at a deadline and formats time —
different trigger, different cadence, different stopping condition. Reusing
`counter` would have meant a handler that ignores most of its own parameters,
so `countdown` is a real addition to the vocabulary rather than a stretched
existing one.

Two details worth naming:

- **The macro never reads the clock.** `expand` must be pure, or two builds of
  the same tree differ and the golden fixture can't be pinned. The starting
  values come from an explicit `props.from`; without it the units render as
  placeholders the handler fills on hydrate.
- **The authored markup carries real values**, so a page that never hydrates
  shows a sensible (if frozen) countdown rather than empty boxes.

The handler writes only the units the markup actually authored — it never
invents or removes DOM — and skips its timer in preview, where a ticking clock
in an editing canvas is a distraction that also keeps a render loop alive per
countdown on the canvas.

Also fixes an SSR hydration mismatch in the React `Countdown`: its value is
computed from `Date.now()`, so the server and client legitimately disagree.
That's what `suppressHydrationWarning` exists for — the value is time-dependent
by definition, not a mismatch to reconcile. Without it every server-rendered
countdown logged a hydration error. Note this is a class the local
`no-dom-in-state-initializer` ESLint rule cannot catch, since `Date.now` is not
a DOM global.
