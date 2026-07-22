---
"@wizeworks/silicaui-react": minor
"@wizeworks/silicaui-mcp": minor
---

`Heading` / `Display` / `Text` take `size` (with `visualLevel` deprecated)

Sizing a heading now uses the prop everyone reaches for first — `size` — instead of `visualLevel`:

```tsx
<Heading level={2} size={4}>…</Heading>        // an <h2> that looks like an h4
<Heading level={1} size="display-1">…</Heading> // hero
<Display size={1}>…</Display>
<Text size="lg">…</Text>                         // new: explicit body size
```

`size` on these typographic components is the **type/display scale** (an h-level `1`–`6`, a `display-1..3` step, or a `text-*` step on `Text`) — a deliberate, probe-sanctioned counterpart to the `xs`–`xl` control scale that `size` names on `Button`/`Input`/etc. The rule `verify-prop-vocabulary` enforces is unchanged in spirit — `size` always means "a step on a silicaui scale," never a raw length or arbitrary string — it just recognizes the typographic scale on typographic components. Heading/Display values keep the ramp's designed per-step weight and tracking, which a bare `text-*` size would drop.

`visualLevel` is **deprecated but still works** (`size` wins if both are set), so no one has to migrate on the spot; it will be removed in a future major. The common case is unchanged: a bare `<Heading level={2}>` still sizes itself — `size` is only for overriding.
