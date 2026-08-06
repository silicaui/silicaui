---
"@wizeworks/silicaui-builder": patch
---

The canvas stops logging React warnings for attributes it was handed correctly

Opening any site with a hero video filled the host app's console:

```
Invalid DOM property `autoplay`. Did you mean `autoPlay`?
Invalid DOM property `playsinline`. Did you mean `playsInline`?
```

Two errors per Video node, on every render. Nothing was actually wrong with the document. A node's
`attrs` carry real HTML attribute names because that is what `toHtml` has to emit — `<video autoplay
muted loop playsinline>` is the correct markup for a muted looping background video, and it is what
the `Video` component's own inspector authors, `playsinline` toggle and all. React wants
`autoPlay`/`playsInline`, so `canvasAttrs` translates on the way into `createElement`. Its table
listed fifteen names and neither of those.

### The shape of the bug is drift, not omission

`canvasAttrs` runs after `sanitizeElement`, so the universe of names that can reach it is exactly
`element.ts`'s allow-set. Those are two lists that have to agree, in two packages, with nothing
telling anyone editing one to look at the other. `video` gained `autoplay` and `playsinline`; the
canvas table did not follow. Nineteen hyphenated SVG presentation attributes — `stroke-width`,
`clip-path`, `stop-color`, `dominant-baseline`, `letter-spacing` — had never been listed at all, so
a pasted brand logo warned once per attribute per node.

Checked against React's own `possibleStandardNames`, 22 of the 117 allowed names rendered under a
name React rejects.

So the fix is not "add two entries". Hyphenated names now camelize **by rule** (`reactAttrName`),
which is exact for every hyphenated attribute React knows and keeps `SVG_PRESENTATION` correct here
for free as it grows; the explicit table is down to what it should always have been — the irregulars
whose React spelling can't be derived (`for` → `htmlFor`, `autoplay` → `autoPlay`, `datetime` →
`dateTime`). `data-*` and `aria-*` are excluded, since React wants those verbatim. Attributes are
rebuilt through the rule rather than renamed in place, so a name nobody thought about still arrives
correct.

### And a probe, because nothing else could see this

`probe-canvas-attrs` walks every attribute `element.ts` permits and asserts each one renders under
the name React wants — reading React's expectation out of the installed `react-dom` development
bundle rather than restating it, since a copied table is one more thing to drift. A console-only
defect is invisible to types, to lint, and to any assertion about what rendered: the element appears,
the builder looks fine, and the only symptom is red in someone else's console. Checking the two
broken attributes would have been worthless — the whole allow-set is checked, so the next attribute
added to `element.ts` fails here instead of in a host app.

Canvas-only throughout. `toHtml` and production markup are untouched — this only ever sees the
ephemeral render-time copy.
