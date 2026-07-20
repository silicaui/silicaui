---
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-behaviors": minor
---

**The OKLCH ColorPicker now works outside React** — the real editor, not a
stand-in.

The obvious shortcut was to lower to `<input type="color">`: it works without
JS, posts a value, and is fully accessible. It was rejected because it is a
**different control** — a native sRGB swatch dialog, not an OKLCH L/C/H editor.
Silica's entire token system is OKLCH, and a picker that can't express chroma
past the sRGB gamut isn't the same tool. Shipping it under this component's name
would have misdescribed what a consumer gets.

So the picker is real: three `role="slider"` tracks with live OKLCH ramps,
pointer drag with capture, full keyboard support (arrows / PageUp+Down / Home /
End) at **exactly** React's step sizes, a hex field that round-trips, and a
hidden input carrying the value for an ordinary form post.

### Two constraints shaped it

**No inline styles in static output.** `verify-csp` forbids `style` attributes,
but the track gradients are dynamic OKLCH ramps that depend on the current
color. So the macro emits structure only and the handler paints on hydrate —
following the precedent already set by `carousel` and `form`. An unhydrated page
renders the picker unpainted, which is correct degradation for an editor that
cannot function without JS, and the hidden input still carries the value.

**The math is duplicated, deliberately.** `silicaui-behaviors` is a
zero-dependency runtime; importing the React package to share `oklch.ts` would
pull React into every vanilla page that hydrates a picker. The same reasoning
already keeps `BehaviorType` duplicated across the two packages.

Duplicated *math* is a sharper risk than a duplicated string union, though: a
drifted union fails loudly the first time a marker doesn't match, while drifted
math keeps running and just returns slightly different colors — React and a
static page would report different hex for the same OKLCH input. So
`verify-oklch-parity.mjs` runs both implementations over ~1,070 cases and fails
on any difference.

That probe caught a hole in itself during negative testing: it originally
compared only functions, so a deliberately corrupted `MAX_CHROMA` still reported
"agree exactly" — the sweep bounded itself by the *other* copy's constant and
never exercised the drift. Exported constants are now compared too, and both
drift kinds are verified to fail.

Verified in a real browser as well as jsdom: dragging the hue track updates the
swatch, the hex readout, the form value, **and re-renders the L and C ramps for
the new hue** — the behavior that keeps the picker legible while editing, and
the one thing jsdom cannot check, since it has no layout for
`getBoundingClientRect`.
