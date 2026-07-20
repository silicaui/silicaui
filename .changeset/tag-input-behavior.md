---
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-behaviors": minor
---

**`TagInput` works outside React**, via a new `tag-input` behavior.

Reuse was checked first, as with `Countdown`. `selection-list` and
`toggle-group` both choose among items that already exist in the markup; this
one *creates* them from typed text. That's a different contract, not a
parameter, so it warranted a new type.

**New chips are cloned from a `template` part, not constructed in JS.** This is
the load-bearing detail. A handler that built `<span class="tag-input-chip">`
itself would emit unprefixed class names and render unstyled in exactly the apps
that opted into a `SilicaProvider` prefix — a failure that only appears in
prefixed builds, which is the hardest kind to notice. Cloning keeps every class
name in the authored markup. The golden fixture and a jsdom check both pin it
(the cloned chip must match the authored chip's `className`).

The value travels on a real `input[type=hidden]`, so the field submits with a
normal form post and the `form` behavior needs no special case. Chips are
comma-joined, matching what the React component posts.

### `<template>` moved onto the raw-element allowlist

Emitting a `<template>` revealed the sanitizer was downgrading it to a `<div>`,
which rendered the blueprint as a visible empty chip. `template` had been sitting
in the exclusion list beside `script`, `iframe`, and `object` — a different
category entirely: those execute or embed, while `template` is inert by
construction (its content parses into a detached fragment that never renders and
never executes), and its children still pass through `sanitizeElement`.

Because that widens the security floor, it is now asserted rather than assumed:
`verify.mjs` checks that a `<script>`, an `<iframe>`, and an `on*` handler placed
*inside* a template are still downgraded and stripped.

A `hidden` chip was considered as an alternative and rejected — an author
`display:inline-flex` on `.tag-input-chip` beats the UA `[hidden]{display:none}`
rule, so the blueprint would become visible under exactly the CSS this library
ships.

Also fixes a React-parity bug found while writing the probe: React's `addTag`
clears the field *before* its dedupe/max checks, so a rejected duplicate still
empties the input. The handler cleared only on success, which made the two
layers behave differently for identical input.
