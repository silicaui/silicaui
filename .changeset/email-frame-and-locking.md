---
"@wizeworks/silicaui-builder": minor
---

Email: a host `frame` (fixed chrome around the body) and two-tier node locking

Two ways a host keeps part of an email out of an author's hands. Both additive —
an `EmailBuilder` that passes neither behaves exactly as before, and a document
that sets neither projects byte-for-byte the markup it did.

**`<EmailBuilder frame>`.** A platform that brands every tenant's mail composes a
brand bar and a legal footer at send, outside the editable body, for two reasons:
an author must not be able to delete the compliance footer, and the chrome must
reflect the tenant's *current* brand rather than whatever was current when the
email was drafted. Baking those sections into the persisted document breaks both
guarantees — a node in the document is a node an author can remove, and a color
in the document is a color frozen at authoring time. So the frame lives outside
the document entirely:

```tsx
<EmailBuilder project={project} frame={{ header: [brandBar], footer: [legal] }} />
```

`header`/`footer` are ordinary `SectionNode[]`. On the canvas they render inside
the body wrapper at full fidelity but inert — no `data-sui-id`, no selection, no
drag, no inline edit, and drops over them are refused rather than falling through
— with a dashed ring and an owner chip on hover. They are never persisted, never
in `onChange`, never on the undo stack; the engine is not told they exist.

Preview, Export HTML, and Send test all project through the frame, so the framed
view stops being one button. `toEmailHtml(doc, { resolver, frame })` and the
exported `composeEmailDocument(doc, frame)` are the same composition the canvas
uses, so a host's send path and the builder's preview can't drift — the frame
extension of the guarantee the resolver seam already gave bound content.
Composition runs *before* resolution, so frame sections get the same data
bindings and `{{merge}}` tokens the body does.

**`EmailNode.locked?: "host" | "author"`.** For content that genuinely belongs to
the saved document but must not be deleted or moved — the same two-tier flag the
site schema carries, reused rather than reinvented. A locked node refuses
`remove`/`removeColumn`/Delete and refuses `move`, including a sibling swap from
either side (a swap moves both nodes; a legal footer dragged to the top is as
broken as a deleted one). It stays *editable*: the lock is structural, not
editorial, so fixing a typo in a pinned footer still works. Duplicating one
produces an **unlocked** copy — otherwise duplicating a pinned block would mint a
second undeletable one.

A `"host"` lock is shown and explained in the Inspector but offers the author no
unlock; an `"author"` lock is theirs to toggle. `setLocked` itself is unguarded,
so a host is never boxed out of releasing its own lock. The Navigator marks both
(padlock / shield). `node.setLocked` is a first-class op that relays and applies
remotely; a *remote* remove/move is not re-adjudicated against the lock, matching
the site engine — refusing there would leave two clients permanently disagreeing
about what the document contains.

`locked` is authoring metadata: `toEmailHtml` never reads it, so it cannot reach
sent markup.

New probes `verify:email-frame` / `verify:email-lock` and an `email-frame` e2e
spec cover both; full docs in `docs/email-frame-and-locking.md`. The MCP
catalog's `silicaui-builder` entry now names the email host seam, the frame, and
node locking, so an assistant querying `list_packages` learns they exist.
