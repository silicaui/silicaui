---
"@wizeworks/silicaui": minor
"@wizeworks/silicaui-react": minor
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-behaviors": minor
"@wizeworks/silicaui-mcp": minor
---

A horizontal strip now says so when there is more of it off-screen — and `Tabs` does it on its own

`overflow-x: auto` on its own is a trap on anything that can be dragged narrow. The content stays
reachable, but the only thing announcing it exists is a scrollbar that overlay-scrollbar platforms
(macOS, iOS, Android) never draw until you are already scrolling. A tab strip that ends at
"Activity" with Documents and Details past the edge does not have those tabs, as far as the person
looking at it is concerned.

### `ScrollStrip`

```tsx
<ScrollStrip label="filters" trackClassName="gap-2">
  {filters.map((f) => <Badge key={f}>{f}</Badge>)}
</ScrollStrip>
```

Prev/next controls mount the moment the content stops fitting, and they are **in flow**, not
overlaid — an overlaid chevron covers the item at the edge, which is exactly the item you were
trying to read. At an end a control disables but keeps its footprint, so the strip never jumps
sideways.

That pairing is load-bearing rather than cosmetic: mounting a control narrows the scroller, which
can create the very overflow that justified it — remove it and the overflow goes, so it comes back,
forever. Overflow therefore decides whether the **pair** is mounted and position decides only
whether each is disabled.

Also handled: RTL (`scrollLeft` runs negative, and the glyphs turn around), `prefers-reduced-motion`
(owned in CSS, so the buttons inherit it with no branch in the JS), an opt-in `fade` that clears
itself at whichever end is not clipped, and a keyboard tab stop on the scroller **only** when
nothing inside it already has one.

New: `.scroll-strip` / `-track` / `-control` (+ the `xs`–`xl` ramp and `-faded`) in the CSS plugin,
a `ScrollStrip` macro and `scroll-strip` behavior for the framework-neutral layers, and a
`chevronLeft` glyph the bundled Lucide set was missing.

### `Tabs` carries it without a wrapper

`TabsList` gains `scrollable` (**default `true`**), so overflowing tabs announce themselves with no
change at any call site. Requiring every consumer to remember a wrapper is the papercut, not the fix.

The list itself becomes the scroller rather than gaining a div around it, so Base UI's moving
indicator keeps measuring against the same box. Two consequences worth knowing:

- **Layout.** An `inline-flex` list shrink-wraps its content and therefore can never detect that it
  overflows — a scrollable list has to be constrained by its parent, so the wrapper is block-level
  and fills the available width. The tabs still shrink-wrap and stay left-aligned, and the baseline
  rule still ends at the last tab. Pass `scrollable={false}` for a strip that must shrink-wrap its
  own box.
- **The indicator.** `overflow-x: auto` forces the other axis off `visible`, so a horizontal
  scroller necessarily clips vertically; the underline's deliberate 1px overhang is tucked flush in
  the scrollable case so it is not shaved to 1px tall.

On the vanilla side this is wired into the `tabs` behavior directly rather than by nesting a
`scroll-strip` root inside the list — part lookup stops at a nested behavior boundary, so every
`tab` would have resolved to the inner root and selection would have gone dead while the strip
scrolled beautifully.
