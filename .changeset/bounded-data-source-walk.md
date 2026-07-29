---
"@wizeworks/silicaui-builder": patch
"@wizeworks/silicaui-html": minor
---

Bound the binding picker's walk over a host's `DataSource` catalog, so no host data
can hang or crash the editor.

`flattenSources` and `findSource` both recursed over the host-supplied catalog with no
cycle guard and no ceiling, and both hazards were reachable from ordinary host data:

- **A cycle** — `post.author → author.posts → post`, the everyday shape of a CMS schema
  with a back-reference — overflowed the stack in ~3ms. Thrown mid-render, so it
  surfaced as the whole editor tripping its error boundary rather than as anything
  identifiably about data binding.
- **Sharing without a cycle** is the subtler one, and needs no cycle at all: a handful
  of content types embedding the same few sub-shapes is finite and small to author but
  exponential in paths through it. Measured, 51 distinct authored sources produced 1.86M
  options in 779ms; 55 produced 16.7M in 7.7s — each one destined to become a real
  `<option>` element.

`findSource` now memoizes globally per search (whether a shape contains a ref doesn't
depend on the route taken to reach it), making it linear in distinct sources instead of
exponential in paths. `flattenSources` guards against the current path only — a shape
reachable two ways is genuinely two options, so a global seen-set would wrongly drop the
second — and short-circuits on `MAX_SOURCE_DEPTH` (6) and `MAX_SOURCE_OPTIONS` (500).
Both are bounds on work done, not slices of work already done.

Truncation is **reported, never swallowed**: `flattenSources` now returns
`{ options, truncated }`, and where the list is incomplete the Inspector says so and
restores the raw reference field the picker replaced. A field missing from a picker must
never be indistinguishable from a field the host never offered.

The email builder's `flattenEmailSources` and its private `findSource` were hand-copied
from the site versions and carried the same defect on a hotter path — the merge-token
autocomplete flattens while the author types. They are now a re-export of the shared
bounded walker rather than a second implementation free to drift again.

`flattenSources`, `findSource`, `truncationMessage` and both ceilings are exported from
`@wizeworks/silicaui-html`; `verify-data-sources.mjs` pins the guards with wall-clock
budgets, since a fix that returns the right list in 8 seconds is still the bug.
