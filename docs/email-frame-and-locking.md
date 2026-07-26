# Email frame + node locking

Two ways a host keeps part of an email out of an author's hands. They look
similar and are not interchangeable — picking the wrong one costs you a
guarantee.

| | `EmailFrame` (the `frame` prop) | `EmailNode.locked` |
|---|---|---|
| Lives in the persisted document | **No** | Yes |
| Author can select it | No | Yes |
| Author can edit its content | No | Yes (only remove/move are refused) |
| Reflects the current brand | **Always** — re-supplied every mount + send | Only as of when it was authored |
| Travels in `onChange` | No | Yes |
| Survives the host forgetting to pass it | No — it disappears | Yes |

**Rule of thumb:** if the content must be *current* and *unremovable*, it's a
frame. If it's genuinely the author's document but must not be deleted by
accident (or by a careless collaborator), it's a lock.

---

## 1. The frame

```tsx
import { EmailBuilder } from "@wizeworks/silicaui-builder/email/react";
import type { EmailFrame } from "@wizeworks/silicaui-builder/email/react";

const frame: EmailFrame = {
  label: "Brand frame",              // shown on the canvas when you hover the region
  header: [brandBarSection(site)],   // ordinary SectionNodes
  footer: [legalFooterSection(site)],
};

<EmailBuilder project={project} frame={frame} onChange={save} />;
```

`header` and `footer` are plain `SectionNode[]` — the same kind the body holds,
so nothing new has to be rendered, projected, or resolved for them.

### What the builder does with it

- **Canvas** — renders both regions inside the body wrapper (same width, same
  content background, same font stack), at full fidelity, but inert: no
  `data-sui-id`, no selection, no drag, no inline edit, and drops over the
  region are refused rather than falling through. Hovering shows a dashed ring
  and a chip naming the owner.
- **Preview / Export HTML / Send test** — all project through
  `composeEmailDocument`, so every path a user can reach shows the framed
  email. The Preview button stops being the only framed view.
- **Persistence** — nothing. The frame is never written to the document, never
  in `onChange`, never on the undo stack, and the engine is never told it
  exists. There is no code path from a frame back into an `EmailDocument`.

### Why it's a prop and not a schema field

A platform that brands every tenant's mail needs two things to be true of its
chrome, and baking it into the persisted document breaks both:

1. **An author can't delete the compliance footer** — but a node in the document
   is a node an author can select and remove.
2. **The chrome reflects the tenant's *current* brand** — but a color stored in
   the document is a color frozen at authoring time, six months ago.

Keeping the frame outside the document gets both for free: there is nothing to
delete, and the host re-supplies it on every mount and every send.

This mirrors the site builder, where a `Frame` belongs to the `Site` rather than
to any `Page`, and the page canvas renders it as inert context around the
editable body.

### Use the same composition in your send path

```ts
import { toEmailHtml } from "@wizeworks/silicaui-builder/email";

// One call. Resolver + frame together — this is what the recipient gets.
const html = toEmailHtml(doc, { resolver: hostData, frame: frameFor(site) });
```

If you already compose the frame yourself, either pass it here instead or use
the exported `composeEmailDocument(doc, frame)` — the point is that the builder's
preview and your send path run the *same* composition, so they can't drift.
A host that keeps its own separate implementation gets the preview-vs-send split
back, which is exactly what the resolver seam was built to close.

Composition happens **before** resolution, so frame sections get the same data
bindings and `{{merge}}` tokens the body does — a brand bar can bind its wordmark
exactly the way a body image would.

---

## 2. Node locking

`EmailNode.locked?: "host" | "author"` — the same two-tier flag the site schema
carries (`silicaui-html`'s `NodeBase.locked`, host-nodes spec §B), reused rather
than reinvented, so a host that pins regions in both builders reasons about one
concept.

```ts
editor.setLocked(nodeId, "host");      // pin it
editor.setLocked(nodeId, undefined);   // release it
```

A locked node:

- **cannot be removed** — `remove`, `removeColumn`, and the Delete key all refuse
  it. Enforcement lives in the engine, so every path honors it at once; the
  Inspector's disabled buttons are only there so the refusal reads as
  unavailable rather than as a dead click.
- **cannot be moved** — `move` refuses it, and so does a sibling swap
  (`moveUp`/`moveDown`) from *either* side, since a swap moves both nodes. A
  legal footer dragged to the top is as broken as a deleted one.
- **stays editable.** The lock is structural, not editorial: fixing a typo in a
  pinned footer must stay possible, or hosts would pin nothing. Its children are
  ordinary nodes too — lock them individually if they need it.
- **duplicates *unlocked*.** The copy is the author's own content; otherwise
  duplicating a pinned block would mint a second undeletable one.

### The two tiers

- **`"author"`** — the author's own "don't let me fat-finger this". The
  Inspector's Settings → Structure → Lock toggle sets and clears it.
- **`"host"`** — set by whoever mounted the builder (a compliance block stamped
  into a seeded document, or a runtime `setLocked` call). The author UI shows it,
  explains it, and offers **no** unlock. `setLocked` itself is deliberately
  unguarded, so a host is never boxed out of releasing its own lock.

The Navigator marks both: a padlock for an author lock, a shield for a host lock.

### Collaboration

`node.setLocked` is a first-class op — it relays through `onChange` and applies
through `applyRemoteOps`, with `null` as the wire spelling of "unlocked" (JSON
drops `undefined`).

A remote `node.remove` or `node.move` is **not** re-adjudicated against the lock,
matching the site engine. Locks are an authoring policy the originating peer
already enforced; refusing a remote op here would leave two clients permanently
disagreeing about what the document contains, which is worse than honoring an
edit whose lock state this client may simply not have received yet.

### It never reaches the wire

`locked` is authoring metadata. `toEmailHtml` never reads it, so it cannot appear
in sent markup.

---

## 3. Verification

- `pnpm --filter silicaui-builder verify:email-frame` — composition order and
  purity, projection, frame-content resolution, and the guarantee that the
  document stays byte-identical after composing and projecting.
- `pnpm --filter silicaui-builder verify:email-lock` — every refusal above, both
  owners, both sides of a swap, undo/redo, and the op round-trip.
- `pnpm --filter silicaui-builder e2e email-frame` — the same rules through the
  real chrome (`?editor=email&frame=1` in the harness).
