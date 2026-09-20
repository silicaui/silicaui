---
"@wizeworks/silicaui-builder": minor
"@wizeworks/silicaui-panels": patch
---

The builder threw away its own controls as the window narrowed, Publish first — at 1024px, which is a half-width browser window and not a phone

Found by P03's deferred 360px pass — Marlene Okonkwo-Bright, a dance teacher with a
phone, run as act 10 after the original nine acts were scored at 1280px in light.
Four defects, all fixed.

**The toolbar clipped its own right-hand end.** One flex row, no wrap, no
overflow, no width behaviour of any kind. Once the spacer between its two
clusters ran out the right cluster simply continued past the edge of the window
and was clipped by an ancestor. Nothing scrolled — a wheel event with deltaX 400
over it moved it 0px — and nothing said a control was gone:

```
1280px  lost 0
1024px  lost 1  Publish
 768px  lost 3  Light, Dark, Publish
 360px  lost 9  Undo, Redo, …, Publish, Settings
```

**And Publish is the only way to publish.** One call site in the package, and it
is that button. So the work was done and could not be shipped, with the screen
giving no reason: a control that was there at the last width and is absent at
this one reads exactly like a control that never existed.

Two changes, both at the shared point so both builders get them. `IconItem` now
collapses its label on a **container** query — the builder embeds, so its own box
is the right thing to measure and the viewport is not — with per-group priority,
because a sun and a moon need no caption and a box meaning "Component" does;
those four carry a tooltip naming the consequence instead. And the header
**wraps**, which is what makes "nothing is ever silently dropped" true at every
width rather than true down to a width somebody tested. `aria-label` carries the
word whether or not it is painted.

**Below 600px the canvas was 64px wide.** Two rails with pixel floors — 240px and
256px, put there deliberately because a percentage floor once made the left rail
164px and "Layers" rendered as "Lay" — against a canvas with no floor at all. The
rails' floors are right; what was wrong is that three panes stayed three panes at
every width, so the 496px came out of the page being edited. A 64px canvas is not
an error state or an empty state; it renders as a working screen.

Below 900px the rails now collapse and the canvas takes the width, with two
toolbar toggles bringing one back over the page. The rails keep their pixels and
stop taking them from the page:

```
          before     after
 768px     253px  ->  747px
 600px      85px  ->  579px
 360px      64px  ->  339px
```

Wide mode renders exactly what it rendered before, which is why the builder's 217
end-to-end tests keep testing the same thing.

**`ResizablePanel` documented an imperative `ref` it never forwarded.** Its own
comment listed `ref` among the passthroughs. It was a plain function component and
`PanelProps` never declared one, so on React 18 the ref was stripped and
`.collapse()` was a silent no-op, and on React 19 — where it would have worked —
the type checker rejected it. The peer range is `react: ">=18"`, so there was no
version on which the documented API could be used. Now `forwardRef`.

**And the site builder's toolbar printed a `⌘ /` hint with nothing listening.**
The email builder has Find and prints no hint; the site builder printed the hint
and has no Find. The claim is gone. The feature stays on the record where it
already was.
