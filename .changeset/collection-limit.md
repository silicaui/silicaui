---
"@wizeworks/silicaui-builder": minor
"@wizeworks/silicaui-html": minor
---

Per-instance `limit` on a collection binding, and a canvas that draws the count.

**`{ kind: "collection"; ref; omitWhenEmpty?; limit? }`.** A `DataSource` catalog says
what a source **is**; `limit` says how much of it **this instance** wants. Those are
different questions and until now they shared one field — the ref — so only the first
could be asked, and the count was whatever the host chose when it fetched, uniform per
source across a whole site. One catalog can now feed a strip of 4 above the fold, a full
grid at `/shop` and a rail of 12 on the product page.

Encoding it in the ref (`products|limit=4`) is not an alternative: `resolveTree` never
parses a ref, but `scopeAt` **does** — it narrows a descendant's bindable fields by
matching an ancestor's `data.ref` against a catalog `key`, so a ref that isn't exactly a
key matches nothing and the author silently gets an empty field list on the card inside
the repeat. The ref is load-bearing and cannot double as an options bag.

`limit` caps how many items **load**, not how many are visible at a time — a carousel
showing 4 of 12 is layout (`basis-1/4` on a snap rail), and the class model already does
that. It must be a positive integer; anything else is ignored, so a malformed limit
renders the whole collection rather than nothing. `applyCollectionLimit(items, limit)` is
exported so a host narrowing its own pre-fetch shares the engine's clamp instead of
re-deriving it.

**The canvas now previews the true count.** `resolveTree`'s editing walk still refuses to
expand a collection — a clone carries its template's ids, and selection, overrides and
React keys are all keyed off those. The count is a rendering concern, so the canvas
answers it there: copy 0 is the authored template, selectable and editable exactly as
before, and copies 1..n-1 render through the same inert `preview` path the context layer
already uses (no ids, no handlers, no decorations). A block that will ship 12 cards no
longer lays out as one. Capped at 24 drawn copies so an uncapped source can't stall the
editor; the Inspector's preview row states the real number either way ("12 items",
"4 of 12 items — limited").

Both builders get the control: a "How many" field beside the source picker in the site
and email Inspectors, blank meaning all. The email resolver honours `limit` through the
same clamp, so a count means the same thing in a campaign as on the page it links to.
