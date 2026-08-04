---
"@wizeworks/silicaui": minor
"@wizeworks/silicaui-react": minor
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-behaviors": patch
"@wizeworks/silicaui-builder": patch
"@wizeworks/silicaui-mcp": patch
---

`marquee` — an infinitely-looping ticker, in all four layers

The `marquee` **behavior** already shipped: registered in `silicaui-behaviors`, named in the
`BehaviorType` union, documented in the architecture spec and the MCP catalog. There was no marquee
**component** anywhere — no CSS, no React, no `ComponentDef` — so the handler paused an animation
that nothing in the library defined. It could only ever do something for a consumer who hand-wrote
their own keyframes and then dropped our marker on top. Our own landing page did exactly that,
under a comment reading "Tailwind has no infinite-marquee utility". Neither did we.

### The loop distance is not `-50%`

Every marquee recipe on the web renders the content twice and animates to `-50%`. That is correct
only with no gap between items. With gap `G` and `R` copies the track measures `R·group + (R−1)·G`,
so `-100%/R` lands `G/R` short of a whole cycle — the strip snaps back a fraction early, once per
loop, forever. Small enough to look like a rendering glitch, big enough to see.

The exact cycle is `group + G`:

```css
@keyframes silica-marquee {
  to { transform: translateX(calc((-100% - var(--marquee-gap)) / var(--marquee-copies))); }
}
```

Carrying `R` as a variable instead of baking in `-50%` also turns the copy count into a knob. The
other failure mode of a marquee is content too narrow to overflow its container: one pass runs out
before the loop returns and the tail of each cycle is blank. That is not fixable in CSS by
measurement, but it is fixable by repetition — hence `repeat` (2–6, and the CSS is a var-setter
class per count so `toHtml`, which refuses inline `style` on principle, can emit it too). The
landing-page wall needed `repeat={3}`; it had been running two copies with a blank tail.

### New

- **`.marquee`** (clipping viewport) › **`.marquee-track`** (what travels) › **`.marquee-group`**
  (one copy). Colorless — it moves things, it doesn't paint them.
- Variants: **`-vertical`**, **`-reverse`**, **`-slow`/`-normal`/`-fast`** (80s/40s/20s),
  **`-fade`**, **`-pause-on-hover`**, **`-copies-2`…`-6`**. Speed and gap are custom properties
  (`--marquee-duration`, `--marquee-gap`, `--marquee-fade`) so any value is reachable inline
  without fighting specificity.
- **`<Marquee direction speed pauseOnHover fade repeat>`** in React.
- A **`Marquee`** `ComponentDef`, and a palette entry in the site builder.

### Duplicated content is hidden twice over

Every copy past the first is `aria-hidden` **and** `inert`. `aria-hidden` alone leaves the
duplicate tabbable while announcing as nothing — tab into copy #2 of a logo wall and focus lands
somewhere a screen reader insists is not there. In the node tree the extra copies are also
id-stripped: ids are globally unique by contract, so a duplicate carrying the original's id makes a
builder click land on whichever copy the DOM query hit first. `inert` joins `GLOBAL_ATTRS` in
`silicaui-html` for this — it sits next to `hidden` for the same reason both are safe, in that it
only ever removes capability and carries no URL or script surface.

In React neither spelling of the prop survives both supported majors — React 18's types don't know
`inert` and drop `inert={true}` as a non-boolean attribute, React 19 knows it as a boolean and
drops `inert=""` — so it is set on the node through a ref callback instead. Server-rendered markup
therefore carries `aria-hidden` but not `inert` until hydration.

### The behavior handler was pointing at the wrong element

It set `style.animationPlayState` on the behavior root. The animation lives on the `track` part, so
the moment a real component existed the root would never have seen it. It now toggles
`data-sui-paused` and lets the stylesheet decide, which keeps play-state with exactly one owner and
means the handler never has to know which descendant is animated. Pause-on-hover is CSS in both
paths; what is left for JS is the editor-canvas freeze, plus honouring `params.pauseOnHover` for
hand-authored markup that carries the marker without the class.

`prefers-reduced-motion` is deliberately **not** handled in JS. The CSS stops the animation and
hands the strip back as a plain scroller — freezing a clipped strip strands everything past the
first viewport behind `overflow: hidden`, which for a ticker of announcements or links is worse
than the motion was. Decorative walls opt back out with `overflow-hidden`, as the landing page
does. That rule needs two selectors, not one: every rule that *assigns* an animation is two classes
deep (`.marquee-vertical .marquee-track`) and a media query adds no specificity, so a bare
`.marquee-track` loses and the vertical variant keeps moving.

### Dogfooding

`apps/site/app/globals.css` loses its entire hand-rolled marquee block — keyframes, three speed
classes, the reduced-motion override and the edge mask — and the hero wall is three
`<Marquee direction="up">`. The file's only remaining custom rule is `.mono`.

Covered by 17 structural `toHtml` checks, 10 jsdom hydration checks driving the real pause flag, and
a browser pass asserting the strip actually travels, that hover actually stops it, and that reduced
motion actually stills it in both orientations — the vertical-specificity bug passed every
structural assertion right up until something measured a moving pixel.
