---
"@wizeworks/silicaui-mcp": minor
---

`get_node_schema` — the MCP now describes path 3's document schema, not just what goes in it.

The catalog could answer "what components and blocks exist" and nothing at all about the
shape of the tree they go into. So the **data-binding vocabulary** — how a generated
document draws live content, repeats over a collection, or hides itself when there is
nothing to show — lived in the source and in two hand-written docs and **nowhere an agent
could look it up**. The gap was found the honest way: a per-instance `limit` was added to
a collection binding, and the question "is the MCP updated?" had no mechanism behind it.

The new tool returns, all extracted from `@wizeworks/silicaui-html`'s own source:

- the four node kinds and their fields, and **which of them carry the shared metadata
  band** (an outlet does not, which is the kind of thing that is only ever learned by
  something not working);
- the typed system-metadata band itself — `data` / `slot` / `behavior` / `part` /
  `locked` / `instanceOf`;
- the full `DataBinding` union with every field and its real doc comment;
- the resolution contract a host implements, including the unknown-vs-empty rule the
  whole thing hangs on (`undefined` means "never heard of this ref" and keeps the
  authored content; `{ value: undefined }` means "known and empty" and renders empty);
- the raw-element/attribute allowlist `toHtml` enforces, per tag, read from the exported
  `RAW_ELEMENTS` map at generation time.

Path 3 fails **silently** where the other two fail loudly — an unlisted tag becomes a
`<div>`, an unlisted attribute is dropped, an invented binding field is not persisted,
and the output still looks plausible. The routing instructions now say so and point at
this tool first, and `search_docs` reaches bindings, node kinds and allowed attributes,
so "limit", "repeat" and "srcset" stop returning nothing.

Kept honest by construction: `verify.mjs` re-parses the real `DataBinding` union out of
`silicaui-html/src/schema.ts` and compares it field by field against what the server
publishes, both directions. Adding a binding option and forgetting the catalog now fails
the build instead of shipping a server that describes last release's schema. That check
earned its keep immediately — it caught the generator publishing `ResolveHost` as an
empty member list, because the parser only walked property signatures and every hook on
that interface is a method signature.
