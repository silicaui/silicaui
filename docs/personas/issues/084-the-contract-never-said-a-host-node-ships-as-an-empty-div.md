# 084 — The contract never said a host node ships as an empty div

**Status:** fixed
**Severity:** high
**Found by:** P05 · Arvid Lindqvist · act 9, the other side
**Surface:** `docs/builder-contract.md` — §5 `renderHostNode`, and the missing §5.2
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 9 exports a plant page and serves it with nothing running. Quarrystone built
the whole embed from `docs/builder-contract.md` and nothing else — that is the
rule this persona runs under.

The contract does not mention publishing **at all**. Not `onPublish`, not
`PublishPayload`, not `RenderedPage` — the only way a host ever receives
production HTML is absent from the document that defines the seam. §10's
"minimal buildable surface" checklist does not list it either.

And `renderHostNode`, the hook the whole host-node feature hangs off, is
documented as:

```ts
// Live canvas preview of a host node — the host renders its real component.
// Absent (or returns null) → the engine draws a labeled placeholder.
renderHostNode?(node: HostNode, ctx: { preview: boolean }): ReactNode;
```

That is true and it is not the whole truth. `renderHostNode` is React; the HTML
projection is deliberately framework-free and never calls it. A host node reaches
the published page as this, and nothing else:

```html
<div data-sui-host="quarrystone.compliance-cert"
     data-sui-host-props="{&quot;plantId&quot;:&quot;plant-hoganas-angelholmsvagen&quot;}"></div>
```

The reasoning is sound and it is written down — in `to-html.ts`, in a source
comment an integrator has no reason to open:

> A host node is a live-widget MOUNT POINT … a host mounts its real component
> into this hook (client or SSR), the same posture as `rawHtml`/behavior
> markers, so the projection stays framework-free.

## Why it matters

An integrator who follows the contract, builds the three host nodes, sees them
render perfectly on the canvas and presses Publish gets a plant page with **three
empty divs** where the compliance certificate, the plant statistics and the lead
form should be.

It is the worst shape of failure this persona framework exists to catch:

- The page is valid HTML.
- The server returns **200**.
- The layout is intact — an empty `<div>` occupies no space, so the page does not
  even look wrong, it looks like a page that never had those blocks.
- Nothing logs, nothing warns, nothing throws.
- And the missing block is the one the host is **legally answerable for**.

This is "absence behaves like fine" on the single most consequential element on
the page.

## The second half: whose CSP is it

Quarrystone's first host-node components painted themselves with inline `style`
objects. On the canvas, and in `vite dev`, that is invisible — there is no
Content-Security-Policy in front of a dev server.

Served as a published page under a real policy:

```
Content-Security-Policy: … style-src 'self' …

Applying inline style violates the following Content Security Policy directive
'style-src 'self''. … The action has been blocked.   × 5
```

Every inline style dropped. The certificate rendered as naked text — correct
content, no card, no border, no spacing — with a clean 200 and no error a visitor
would ever report.

That is the host's own bug, and Quarrystone's components were rewritten onto
silicaui components and Tailwind utilities. But **nothing told them**: the
contract never says that what `renderHostNode` draws also lands on the published
page, under whatever policy that page is served with.

## Where it lives

[docs/builder-contract.md](../../builder-contract.md) — §5, new §5.2, §10

## The fix

A new **§5.2 Publish — the page a visitor gets**, covering the three things an
integrator has to know before they ship:

1. **`onPublish` exists**, with `PublishPayload` and `RenderedPage` written out,
   and the note that the Publish button is disabled until a host wires it.
2. **A host node ships as an empty mount point**, with a table of the two honest
   places to fill it — at publish time (no script needed on the page) or at run
   time (a script on every page, content absent until it runs) — and a preference
   stated plainly:

   > Prefer the first for anything a visitor must be able to read — a price, a
   > legal notice, a certificate. **A block that needs JavaScript to appear is a
   > block that does not appear** for a reader with scripts blocked, a slow
   > connection, or a crawler.

   Plus the countable check, because the failure is silent:

   > the number of `data-sui-host` occurrences in the HTML you were handed is the
   > number of blocks you owe.

3. **Your markup lands under the visitor's CSP, not the editor's** — why an
   inline `style` survives the canvas and dies on the published page, and that
   host-node markup should be built from classes so it is covered by the
   stylesheet the publish step already emits.

§5's `renderHostNode` comment now says **CANVAS ONLY** and points at §5.2, and
§10's checklist gains the publish row it never had.

## Confirmed by

Quarrystone's deploy step (`publish.mjs`) was written from the new §5.2 and does
exactly what it describes: fills every mount point at publish time by rendering
the same React components to static markup. The result, served with
`script-src 'none'`:

```
· Content-Security-Policy — "default-src 'none'; script-src 'none'; style-src 'self'; …"
✓ with scripts forbidden outright

2 — the host nodes' content is there
· our three blocks — {"cert":1,"stats":1,"form":1}
✓ the compliance certificate rendered
✓ ...with the real certificate number in it
✓ ...and its expiry
✓ the plant statistics rendered
✓ the enquiry form rendered
✓ no mount point was left empty — 0 empty

4 — no console error
· console errors — none
· failed requests — none
```

and, after the components moved off inline styles:

```
· the certificate card computes to — {"radius":"8px","bg":"oklch(0.98 0.003 250)","pad":"24px"}
✓ our card is really painted, not naked text
```

The `no mount point was left empty` check is the one that matters, and it is
written against the DOM rather than the source: it counts `[data-sui-host]`
elements with no children, so a deploy step that silently stopped filling them
fails it.

## Also recorded, not fixed

**The builder still cannot tell a host it shipped an unfilled mount point**,
because by then the HTML has left the builder — `onPublish` hands over a string
and the deploy is the host's. A lint in the host's own pipeline is the right
place for it and §5.2 now names the check. Recorded rather than pretended at: a
warning inside the builder would fire on every correct publish too, since a
run-time-mounting host legitimately ships empty divs.

## Rating effect

Not a screen. Affects the contract doc, which `rating.md` does not score.
