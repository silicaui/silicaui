---
"@wizeworks/silicaui-mcp": minor
"@wizeworks/silicaui-html": minor
---

The catalog can finally describe a node-tree component

`Embed` gained nine providers and the MCP catalog still described it as a name and an icon. That
is not a stale-regeneration problem — there was nowhere for the answer to go.

Every one of the 236 `silicaui-html` components carried **no props, no description, no usage** —
only `name`, `label`, `icon`, `container` and a source path. All 132 React components carry full
props. So `get_component("Embed", "@wizeworks/silicaui-html")` had never told anyone which URLs
work, and a consumer asking the catalog what the node-tree layer can do got a list of names. A
capability that cannot be discovered looks exactly like a capability that is missing, which is
why it was reported as missing.

The generator skipped them for a real reason — these components have no prop interface to parse,
because props are read ad hoc inside `expand()`. But the prose was there all along, written above
each def. It is now extracted as `doc`, so descriptions come from the comment that already
explains the component rather than from a second field that would drift from it. 149 of 236 are
now documented, up from none.

The rest are one-line `elementDef(...)` factories, which had no prose because prose would add
nothing — so those state the one fact they carry, derived from the call: what tag they lower to.
That same factory shape was also invisible to the source-line lookup, which only ever searched
for `name: "X",`; 61 components pointed at the file with no line. All 236 now resolve to a line.

The 87 still undescribed are composite PARTS — `DialogTrigger`, `TabsPanel`, `LightboxSlide` —
whose parent component is documented and whose meaning is not separable from it.

### Embed publishes its provider list

Which URLs `Embed` frames is decided by an external allowlist, so unlike every other component it
cannot be inferred from its shape. `EMBED_PROVIDERS` is now exported from `@wizeworks/silicaui-html`
and carried into the catalog — name, kind (`video` / `audio` / `podcast` / `map`), a working
example, and `embedUrlOnly` for the providers whose player id is absent from a shareable link.
A host can render it as help text; an agent can read it before writing a URL into a document.

`verify-embed.mjs` checks it in both directions: every published example still resolves, and every
host the resolver can emit is named by an entry — so adding a provider without documenting it, or
documenting one that stopped working, fails the probe.

### Regenerating is no longer destructive

`gen-catalog.mjs` embedded whatever line endings the working copy had, so regenerating on a Windows
checkout rewrote every extracted usage example to CRLF and produced a 178-line diff of pure
line-ending churn — enough noise to bury the real change, and enough friction that the honest move
was to revert the regeneration instead of reading it. Output is normalized at the single point it
is written, so the catalog is now byte-identical across platforms.
