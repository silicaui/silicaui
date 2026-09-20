# P05 — Arvid Lindqvist · Quarrystone

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

**Status:** done — 9 acts of 9, every standing check, 7 issues filed and fixed
**Run:** 2026-09-19
**Customer:** **integrator** — they embed the builder, they do not author in it
**Surface:** the `BuilderHost` contract — host nodes, two-tier locking, inspector tabs, peers, persistence, ops
**Role in the roster:** the seam between silicaui and the app that hosts it

## Project

| Field | Value |
| --- | --- |
| Build lives at | `docs/personas/artifacts/P05-quarrystone-embed/` — a small real app that embeds the builder |
| Driven at | their own app, plus `http://localhost:5178/?host=demo` to compare against the reference host |
| Contract | [docs/builder-contract.md](../builder-contract.md) |
| Started from | an empty Vite React app — not the harness |

## The person

**Arvid Lindqvist, 27, they/them.** Platform engineer at a four-person B2B SaaS in
Malmö. They own the integration layer: anything that goes between their product and
somebody else's library is theirs to make work and theirs to be paged about.

**Technical level.** Very high, and **adversarial by habit** — they will read the
contract doc, then try the thing the contract doc says not to do, because that is what
their customers will do at 02:00.

**What they are nervous about.** That the builder looks embeddable and is actually a
demo. They have integrated two "embeddable editors" before; one of them could not be
made to stop writing to `localStorage` under their key.

**What made them look today.** Their product needs a page editor. Building one is six
months. They have two weeks to find out if this is real.

## The business

**Quarrystone** — a B2B tool for quarry and aggregate operators. Their customers
publish plant pages: site address, opening hours, a product list, and a compliance
certificate block that **the customer must not be able to edit**.

- 90 customer accounts, each with 3–20 plant pages
- Two people from the same account can be in the same page at once
- **Inconvenient for the software:** the compliance block is legally theirs, not the
  customer's. If a customer can move it, retype it, restyle it or delete it, that is
  not a bug, it is a regulatory problem. And plant pages get edited from a laptop in a
  van on bad signal, so a lost connection must not lose an hour of work.

## Why they are here today

1. "Can I own a node the author can't touch?"
2. "Can I put my own panel in the inspector without forking anything?"
3. "If the tab closes on bad signal, is their work gone?"

## The data

**This is the test data. Type it as written** (RULE #2).

### Host-owned nodes — at least 3 kinds

| Host node | What it renders | Who may edit it |
| --- | --- | --- |
| `compliance-cert` | the plant's live certificate number, expiry and issuing body | **nobody in the builder** |
| `plant-stats` | tonnage, fleet count, last inspection date — read from their API | nobody |
| `price-enquiry-form` | their own lead form, posting to their backend | the author may move it, not edit it |

### A plant page's real content

| Field | Value |
| --- | --- |
| Plant | Höganäs Kross & Grus AB — Ängelholmsvägen anläggning |
| Certificate | `SE-AGG-2024-11847` · expires **31 December 2026** |
| Tonnage | 412,880 t/year |
| Contact | `+46 42 33 91 06` |

`Höganäs Kross & Grus AB — Ängelholmsvägen anläggning` is 52 characters with two
Swedish vowels and an em-dash, and it goes in a page title, a Navigator row and a
breadcrumb.

### Two editors at once

| Peer | Holds | Colour |
| --- | --- | --- |
| `Arvid` | the hero heading | — |
| `Pernilla` | the product list, claimed | — |

### The inspector tab they add

A **"Compliance"** panel, node-scoped to `compliance-cert`, showing the certificate's
expiry and a read-only link to their own admin. It must slot in as a **first-level
underline tab**, not a pill — memory note `inspector-tabs-panel-seam-shipped` is
explicit that a pill is a mode switch and a tab is a page.

---

## The build

| Item | What it must have |
| --- | --- |
| The host app | a real Vite React app with its own nav, embedding the builder on one route |
| Host nodes | all three rendered through `renderHostNode` / `hostComponents`, pinned and host-locked |
| Inspector tab | their Compliance panel, node-scoped, as an underline tab |
| Toolbar slots | something real in the actions slot **and** in the status slot |
| Persistence | their own `onChange` store **plus** the builder's local crash recovery, proved independently |
| Ops out | semantic ops with fractional `ord` captured and replayed through `applyRemoteOps` |
| A published plant page | exported and served with no builder running |

**Working end to end:** a second browser window replays the first one's ops and lands
on the same document; a customer cannot touch the compliance block from any surface;
and killing the tab mid-edit loses nothing.

**The look.** Their app's chrome, not silicaui's demo chrome. The builder should look
like it belongs inside Quarrystone.

**Also required, as on every one:** both themes, 360px, keyboard-reachable, on-system.

---

## The run

### Act 1 — Read the contract, then embed it

Follow [builder-contract.md](../builder-contract.md) and get the builder mounted in
their own app — not the harness.

**Done when:** it mounts, and every step the doc assumed but did not say is an issue.

### Act 2 — A node the author cannot touch

Add `compliance-cert` as a host node and lock it. Then attack it: move it, retype it,
restyle it, delete it, drag another node into it, undo into it, and do all of that
**from the Canvas and from the Navigator**.

**Done when:** every one of those is refused, in both renderers, and any that is not is
a `blocker` that stops the run.

### Act 3 — Their own inspector panel

Add the Compliance tab, node-scoped.

**Done when:** it appears only on `compliance-cert`, it is an underline tab not a pill,
and selecting a node it does not apply to falls back cleanly instead of leaving a blank
rail.

### Act 4 — Both toolbar slots

Put a real action in the actions slot and a real status in the status slot.

**Done when:** both are visible, both keyboard-reachable, and it is clear from the
screen which is which without reading the source.

### Act 5 — Two people in one page

Feed a second peer with a claim on the product list and try to edit it anyway.

**Done when:** the collision resolves the way the contract says, the peer overlay shows
who has what, and the fractional `ord` survives a concurrent insert at the same
position.

### Act 6 — The van on bad signal

Kill the tab mid-edit with unsaved work. Reopen. Then do it again with their own
`onChange` store deliberately failing, to prove the local recovery is genuinely
independent of the host.

**Done when:** the recovery banner appears, the work comes back, and it is proved that
it came back **without** the host store — memory note `builder-local-persistence` says
that independence is the point.

### Act 7 — The thing that goes wrong for them

Their API returns a certificate reference that no longer resolves. The host node has a
ref and nothing behind it.

**Done when:** the screen says so honestly — `undefined`, not a fabricated value, not
a silent blank (memory note `data-resolution-honesty-and-brand-mark`) — and the author
is not left thinking the block is empty because they deleted something.

### Act 8 — Ops out, ops in

Capture the ops from one window and replay them into a second through
`applyRemoteOps`.

**Done when:** both windows hold the same document, byte for byte, and any divergence
is an issue.

### Act 9 — The other side

Export a plant page and serve it with nothing running. Open it as a quarry customer's
customer.

**Done when:** it renders, the host nodes' content is there, the enquiry form posts,
and there is no console error.

---

## What only this persona proves

**The embed seam**: host nodes, two-tier locking, inspector tabs, peers and local
persistence, driven by the app that hosts the builder rather than the author inside it.

---

## Standing checks

**Wrong moves.** Mount two builders on one page. Pass a `hostComponents` map missing
one of the kinds the document uses. Change `persistKey` while a document is open.
Unmount the builder mid-edit.

**Reload and deep link.** F5 on their own route with the builder open and a node
selected. Then deep-link a plant page id their app does not own.

**Dates.** The certificate expiring `31 December 2026` — render the page on 30
December, on 31 December at 23:59, and on 1 January. **Record the machine's timezone.**

**Contrast and token math at the edges.** The builder mounted inside *their* app's
theme, which is not silicaui's — confirm the studio theme island contains itself and
their app's tokens do not leak in or out. Measure, do not eyeball.

**The other side.** Act 9 — the published page with nothing running.

**Without a mouse.** Mounting, selecting a host node, opening the Compliance tab and
triggering the toolbar action — keyboard only.

**A boundary that should hold.** This persona's whole act 2 is the boundary check, and
it is the strongest instance of it in the roster: a host-locked node must be
untouchable from **every** surface. Also confirm the builder writes nothing to storage
under a key they did not give it.

---

## Verification

| | Result |
| --- | --- |
| Acts completed | **9 of 9**, plus every standing check |
| Issues filed | **7** — [079](issues/079-the-contract-said-mount-it-and-left-out-everything-that-makes-it-work.md), [080](issues/080-two-builders-on-one-page-fought-over-one-rail-width.md), [081](issues/081-a-pinned-block-could-be-copied-restyled-and-offered-a-delete-that-did-nothing.md), [082](issues/082-the-hosts-own-toolbar-button-was-142-tab-presses-away.md), [083](issues/083-two-windows-on-the-same-document-did-not-hold-the-same-document.md), [084](issues/084-the-contract-never-said-a-host-node-ships-as-an-empty-div.md), [085](issues/085-the-layers-tree-moved-one-row-and-stuck.md) |
| Issues fixed and confirmed | **7 of 7.** Every one re-proved on the Quarrystone screen it was found on, and every fix deliberately broken first to watch the guard go red |
| Issues blocked, and on what | **none** |
| Screens scored (in both themes at 360px) | **0 — not checked.** P05's screens are the same builder screens P01 and P03 own, and their two-theme 360px pass is deferred. The one surface only this run has — the **published plant page** — was checked at 360px (0px overflow) but not in dark, because it is served by a static host with no theme switch |
| **Not checked** | The published page in dark. Screen-scoring for the builder panes (P01/P03's deferred pass). Whether a host that mounts host nodes at RUN time rather than publish time works — §5.2 names it as the other option and Quarrystone chose the publish-time one |

### The numbers

| Record | Result |
| --- | --- |
| Steps in builder-contract.md that were assumed but not written | **5.** React dedupe, the `@source` lines for `node_modules`, the studio theme, `extract()` on the handle (all [079](issues/079-the-contract-said-mount-it-and-left-out-everything-that-makes-it-work.md)) — and the entire **publish** seam, which is [084](issues/084-the-contract-never-said-a-host-node-ships-as-an-empty-div.md). The contract now carries §4.1 and §5.2 |
| Attacks on the locked node, and how many were refused | **13 attacks, 10 refused on the first pass, 3 got through** — Ctrl+D minted an unlocked copy, the Design tab restyled it to `hidden`, and Delete was offered live and did nothing. All three fixed; 13 of 13 after ([081](issues/081-a-pinned-block-could-be-copied-restyled-and-offered-a-delete-that-did-nothing.md)) |
| Did local recovery work with the host store failing? | **Yes**, and it was proved rather than assumed: our store was **empty at the moment the work reappeared**, so it cannot have been the source. The sentence recovered was uncommitted, with the caret still in the field |
| Storage keys the builder wrote, and whether they were all given to it | **3**, all derived from the `persistKey` we chose: `silicaui-draft:<key>`, `silicaui-draft:<key>:view`, `react-resizable-panels:<key>:rails`. Nothing under a name we did not give it |
| Ops replayed, and whether the documents matched exactly | **6 ops, 5 kinds, 6 applied, 0 dropped, documents byte-identical (14581 chars each).** Plus the harder case in act 5: two windows inserting at the **same position** both minted ord `a0V`, and both landed on the same order with nothing exchanged but the ops |
| Design-rule breaches found | **1, ours** — Quarrystone's host nodes painted themselves with inline `style` objects. Invisible in the editor; every one dropped by the published page's Content-Security-Policy, leaving the compliance certificate as naked text. Rewritten onto silicaui components and Tailwind utilities (RULE #1, with a measurement attached) |
| Console errors and warnings during the run | **0** in the editor across all nine acts and every standing check. **0** on the published page, including no failed requests |

---

## Run log

Written act by act **as you go**. Quote the exact words on screen.

### Act 1 — Read the contract, then embed it

**Done when:** it mounts, and every step the doc assumed but did not say is an
issue.

**Outcome:** done. Two defects, both fixed —
[079](issues/079-the-contract-doc-left-out-every-step-that-stops-it-mounting.md)
and [080](issues/080-the-builder-wrote-to-a-storage-key-the-host-never-gave-it.md).

A real Vite React app at `docs/personas/artifacts/p05-quarrystone-embed/`, with
Quarrystone's own nav, its own theme, and the builder on one route. An ordinary
`file:` install of the published packages — **no aliases into the silicaui source
tree**, because "works in the harness" is not the question being asked.

**It did not mount.**

```
  ✗ the builder's canvas mounted — 0 canvas element(s)
  · tabs on screen — []

console errors:
  Invalid hook call. […] You might have more than one copy of React in the same app
  PAGEERROR Cannot read properties of null (reading 'useMemo')
```

Four copies of React — the app's 19.3.0 plus one nested inside each linked
package. `resolve.dedupe: ["react", "react-dom"]` fixes it, and 647 lines of
contract never mention it. Nor does anything mention **CSS**: grepping the doc
for `tailwind`, `@source`, `@plugin` and `stylesheet` returns nothing, and
Tailwind v4 does not scan `node_modules`, so following the contract to the letter
gets you a fully working, completely unstyled builder.

Then the types:

```
error TS2459: Module '"@wizeworks/silicaui-builder/react"' declares
'HostComponentDef' locally, but it is not exported.
```

`HostComponentDef`, `HostPropDef` and `HostRenderCtx` are the entire host-node
seam — the reason this persona exists — and none is exported. The **inspector**
seam one interface away is, with a comment reading *"A host implementing either
needs these names, so both tiers are exported together."* The same reasoning, not
applied to its neighbour.

And two things the doc promises that are not there: `mountBuilder(el, …)`, which
was replaced by the React `<Builder>` and never shipped, and
`BuilderHandle.extract()`, which §10 lists as part of "the minimal buildable
surface". `onChange` only fires on CHANGE, so without `extract()` a host has to
mirror every change into its own state purely to have something to read.

Fixed: the three types exported, `extract()` added to **both** handles (the email
one too, rather than waiting for its own persona to find the same gap), and the
contract's §4 rewritten around the real API with a new **§4.1 Mounting it in your
app** carrying the dedupe line, the `@source` lines and the studio-theme
declaration.

After that, the embed:

```
  ✓ the app's own chrome is there
  ✓ the builder's canvas mounted — 1 canvas element(s)
  · tabs on screen — ["Layers","Insert","Design","Settings"]
  ✓ the compliance certificate renders through renderHostNode
  ✓ the plant statistics render
  ✓ the price enquiry form renders
  ✓ the real certificate number is on the canvas
  ✓ the 52-character Swedish plant name survived
  ✓ a .btn actually has button styling — padding 0px 12px, radius 6px
  · theme islands — ["quarrystone-studio","quarrystone"]
  · the app's own primary — oklch(58% 0.16 48)
  · the builder chrome's primary — oklch(45% 0.09 250)
  ✓ the builder chrome does NOT inherit our orange
  ✓ our action is in the toolbar
  ✓ our status is in the toolbar
  console errors: none
```

**And then the thing they were most afraid of.** Their standing check reads
*"confirm the builder writes nothing to storage under a key they did not give
it"*, and they wrote it because an "embeddable editor" had done it to them
before. Before a single edit:

```
  · localStorage keys — ["react-resizable-panels:silicaui-builder-site-rails"]
  ✗ nothing is stored under a key we did not give it
```

A hard-coded constant, in the host's origin, under a name the host has never
seen — and `persistKey={null}`, the prop whose whole job is "store nothing", did
not stop it. The same line sits in the email builder with a comment saying it is
the same mechanism; the mechanism travelled and the containment never did.

The rails key is derived from the host's `persistKey` now, and absent entirely
when that is `null`. Three e2e tests, **deliberately broken to watch three go
red** before restoring.

`pnpm verify` exit 0 workspace-wide, builder e2e **211 passed**, typecheck clean
in both the workspace and the Quarrystone app.

### Act 2 — A node the author cannot touch

**Done when:** every one of those is refused, in both renderers, and any that is
not is a `blocker` that stops the run.

**Outcome:** done, after one critical defect with three ways through —
[081](issues/081-a-pinned-block-could-be-copied-restyled-and-offered-a-delete-that-did-nothing.md).

Thirteen attacks on the compliance certificate, from the Canvas and from the
Navigator. **Ten were refused on the first pass. Three got through.**

**Ctrl+D defeated `pinned` entirely.** `HostComponentDef.pinned` stamps
`locked: "host"` — no unlock for the author, only the host clears it — and
`duplicate()` cleared it unconditionally, on the reasoning that "a duplicate is
author-owned". The spec's escape hatch for that reads *"a host that needs
duplicates pinned re-locks on insert"*, and **there is no insert hook to re-lock
from**: `pinned` stamps the lock inside the palette's own insert, nothing runs on
a duplicate, and `Editor` is not on `BuilderHandle` either. One keystroke put an
unlocked copy of a legally-owned block on the page.

A host lock survives duplication now; an author lock still clears, because that
one the author can set and clear themselves.

**The Design tab restyled it, and nothing could stop that.** The locking spec is
explicit that `setClass` is allowed — locking is structural, not editorial — and
that is the right line for a page builder. It is the wrong outcome for a
certificate: five presses centre, stretch and resize it, and `hidden` typed into
the class field takes it off the page while leaving it in the document.

The spec's answer is that a host wanting a read-only region *"withholds inspector
controls"*. It could not: `validateClass` had the signature `(cls: string)`, so a
host protecting one block could only ban `hidden` **everywhere or nowhere**, and
there is no `hide` on the inspector seams either. The door the spec pointed at
was not there.

`ClassValidator` receives the node now — optional, `unknown`, so no existing
validator changes and the type still does not depend on the node schema.
`setClass` passes it and `setClassToken` routes through `setClass`, so every
write path is covered at once. Quarrystone's whole policy is nine lines, and the
certificate is safe without banning a single class anywhere else on the page.

**And a Delete button that was offered, looked live, and did nothing.**

```
=== the node-chrome footer, on a HOST-LOCKED node ===
  Save as component: offered, disabled=false
  Duplicate:         offered, disabled=false
  Delete:            offered, disabled=false

=== clicking Delete on it ===
  → the block survived
```

The boundary held — the engine refuses `remove` — but an author cannot tell
*refused* from *broken*, and nothing on the screen ever said the word "locked".
The **email** builder already disables its un-duplicatable control and says why.
The sibling had the answer and it had not travelled.

Disabled now, with the reason on the tooltip:

> This block belongs to the app that hosts this builder, so it can't be deleted here

And the Design tab says the **host's own sentence** back rather than swallowing a
refusal:

> Quarrystone owns how this block looks — it has to appear the same on every plant page.

All thirteen, after:

```
1 — delete it
  ✓ held  Delete key, selected on the canvas
  ✓ held  Backspace, selected on the canvas
  ✓ held  Delete key, selected in the Navigator
  · the Inspector's Delete button — offered, disabled=true
  ✓ held  the Inspector's own Delete control
  ✓ held  ...and it is DISABLED, not a live button that does nothing
  ✓ held  cut (Ctrl+X)
2 — move it
  ✓ held  keyboard reorder shortcuts — 5 nodes, order unchanged
  ✓ held  dragging it on the canvas
  ✓ held  dragging its row in the Navigator
3 — retype it
  · anything became editable — no
  ✓ held  double-click and type on the canvas
4 — restyle it
  ✓ held  the hero IS restylable (so the controls really work)
  ✓ held  the certificate is NOT restylable — class stayed null
  ✓ held  ...and it SAYS why, instead of a control that does nothing
  ✓ held  typing `hidden` straight into the class field
  ✓ held  the certificate is still on the page and readable
5 — drag another node into it
  ✓ held  inserting into a host node
6 — undo into it
  ✓ held  undoing all the way back
  ✓ held  ...and it is still host-locked
```

**Retype was never possible and that is worth saying plainly**, because it looks
like a pass and is really an absence: a host node's content comes from
`renderHostNode`, so there is nothing on the canvas for an author to double-click
into. Nothing became editable, and nothing could have.

**Three readings in the first pass were vacuous and were redone.** The class
check compared `null` to `null` because our store had never been written — nothing
had successfully changed yet. The "Design tab field" it typed into was the
enquiry form's email input **on the canvas**, so the restyle attack never
happened. And "the Inspector's own Delete control" looked for
`[aria-label="Delete"]`, found no such button, and reported "held" having
attacked nothing. All three are named in
[081](issues/081-a-pinned-block-could-be-copied-restyled-and-offered-a-delete-that-did-nothing.md);
the corrected restyle run leads with the **unlocked hero as a live control**,
because "the class did not change" proves nothing if the controls were not
working at all.

Two e2e tests on the harness's own pinned `CheckoutWidget`, nine probe checks
across both lock owners, and both **deliberately broken to watch them fail**
before restoring. The locking spec's §B.2 is corrected on both points rather than
left describing behaviour that no longer holds.

`pnpm verify` exit 0 workspace-wide, builder e2e **211 passed**, typecheck clean.

### Act 3 — Their own inspector panel

**Done when:** it appears only on `compliance-cert`, it is an underline tab not a
pill, and selecting a node it does not apply to falls back cleanly instead of
leaving a blank rail.

**Outcome:** done, first time, no defects. The clearest pass of the run so far.

```
  · tabs with the certificate selected — ["Layers","Insert","Design","Compliance","Settings"]
  ✓ the Compliance tab appears
  ✓ it sits between Design and Settings, as `order: 5` asks
  ✓ our certificate number is in it
  ✓ our admin link is in it
  · its classes            — "tabs-tab whitespace-nowrap px-3"
  · Design's classes       — "tabs-tab whitespace-nowrap px-3"
  ✓ it wears exactly the same chrome as the built-in tabs
  ✓ it is not a pill (no pill radius on the tab itself) — 6px 6px 0px 0px
  · tabs with the hero selected — ["Layers","Insert","Design","Settings"]
  ✓ the Compliance tab is gone
  ✓ it fell back to a real tab rather than blanking the rail
  ✓ the rail is showing something
  ✓ no blank rail after the open tab disappeared
  ✓ and the panel it fell back to has content
```

**The tab wears the built-in chrome byte for byte** — the same class string as
Design. That is the thing worth naming: a host tab that looked even slightly
different would read as a different *kind* of control, and the memory note
`inspector-tabs-panel-seam-shipped` is explicit that a pill is a mode switch and
a tab is a page. It is a page, and it looks like one.

The fallback was checked twice, because there are two ways to lose a node-scoped
tab: selecting something else while it is closed, and selecting something else
**while it is open**. Both fall back to Design with content in it; neither blanks
the rail.

### Act 4 — Both toolbar slots

**Done when:** both are visible, both keyboard-reachable, and it is clear from
the screen which is which without reading the source.

**Outcome:** done, after one defect —
[082](issues/082-the-hosts-own-toolbar-button-was-142-tab-presses-away.md).

Both slots work and read correctly: the action is a real `<button>`, the status
is a `<span>` that is **not** pretending to be pressable, they sit in the same
toolbar row, and the status sits to the left of the action — status before the
thing that changes it.

Pressing the action proves `extract()`, added in act 1: it reads the current
document from a host that keeps no mirror of it.

> Sent 1 page(s) for compliance review.

**And then the keyboard.** The action was reachable — eventually:

```
from the app header:                      7 tab presses away
from the canvas, nothing selected:       52 tab presses away
with a node selected and Design open:   142 tab presses away
```

The Design tab alone cost **141 tab stops**, because every chip in every
mutually-exclusive group was its own. One Padding row was thirteen presses. A
colour row was twelve.

That is a seam problem, not just an ergonomics one: a host puts its most
important action in `toolbarSlot` because the contract says that is where host
actions go, and if the rail costs 141 stops to cross then the host's action is
unreachable in practice for anyone not using a mouse. The embed looks fine and
is not.

The builder's own **tab strips** already do the right thing — one stop, arrow
keys inside. One shared `RovingRow` wrapper now applies that to all six
components that render chip and swatch rows. 142 → **34**, and no group costs
more than one stop.

**The first reading of this check was wrong and said "not reachable at all".**
The walk started from wherever focus happened to be after act 3's clicking, which
was deep inside the right rail. Blurring first and walking further found it at
142 — the real number, and far more useful than "unreachable".

An e2e locks it in, including the control that matters: **pressing Enter on the
chip the keyboard landed on still applies it.** A fix that made the controls
unreachable would have passed every other assertion in that test.

`pnpm verify` exit 0 workspace-wide, builder e2e **213 passed**, typecheck clean.

**And the control-character check from P04 caught me writing this fix.** Hours
after [078](issues/078-two-regexes-that-could-never-match.md) shipped it,
`RovingRow`'s "which chip is active" read went in as
`/<U+0008>btn-primary<U+0008>|…/` — four literal backspace bytes where the
word-boundary escape was meant, from the same kind of scripted edit. The regex
could never match, so only `aria-pressed` was doing any work: `ChipGroup` sets
it and the tests passed, but the swatch and corner rows do not, so on those the
tab stop was the FIRST chip rather than the active one. A quiet, partial wrong
that nothing on screen would have shown. `pnpm verify` failed on it within a
minute, naming the file, the line and the code point.

### Act 5 — Two people in one page

**Done when:** the collision resolves the way the contract says, the peer overlay
shows who has what, and the fractional `ord` survives a concurrent insert at the
same position.

**Outcome:** done, after one high-severity defect —
[083](issues/083-two-windows-on-the-same-document-did-not-hold-the-same-document.md).

Quarrystone already runs presence — two people from one account are in a plant
page all day — so the interesting question was never "can the builder do
presence", it was **"can I hand it the presence I already have"**. `src/presence.ts`
is our existing store with the socket replaced by `push`, and `<Builder peers>`
takes its roster unchanged.

Pernilla Dahlgren joins and takes the product list.

```
· our own presence strip says — "I sidan nu  Arvid Lindqvist (du)  Pernilla Dahlgren — redigerar produktlistan"
· nodes the canvas marks as held — ["block-products","product-makadam","product-stenmjol","product-bergkross","product-singel"]
✓ the canvas greys the claim ROOT
✓ ...and every row inside it
✓ ...and nothing outside it
✓ the Navigator names the holder too
· the Inspector says — "Pernilla Dahlgren is editing this. Your changes here are paused until they move on."
```

Three surfaces name her and they agree: a filled dot on the canvas ring, the same
dot on the Navigator row, and the one place the editor writes her name in a
sentence. **The claim is flattened over the whole subtree**, so every row inside
it is marked — a marker only on the claim root would leave every child looking
free while every edit to it was refused.

Then edit it anyway. All refused: double-click does not even offer a caret,
Delete does nothing, Ctrl+D does not copy, the row is not draggable, and the
Navigator withdraws rename. And the **control in the same run** — the hero, one
node away, still edits:

```
· the hero, before then after — "Höganäs Kross & Grus AB — Ängelholmsvägen anläggning" -> "Kross & Grus — Strövelstorp"
```

That matters more than any of the refusals. A claim that froze the page would
have passed every refusal check above.

**And a claim never drops a remote op**, including the claim-holder's own:

```
· applyRemoteOps returned — {"applied":1,"dropped":[]}
✓ the op was applied, not dropped by the claim
```

Which is right — a claim is a courtesy between two people, never correctness
machinery. When she lets go, the grey comes off, the list edits again, and she is
still shown, now as a hollow dot: *"Pernilla Dahlgren is here"*.

**The probe was wrong twice before the product was.** Its edits committed with
Escape, which **cancels** — so the first run read a store that had never been
written and called the product broken. And its "control" asserted the hero
contained `Ängelholmsvägen`, a string the seed already had, so it passed without
the edit landing. Both redone to compare a before against an after.

#### The concurrent insert, and what it turned up first

Two windows, two browser contexts, the same document. **They did not hold the
same document.** Quarrystone's `Site` has no frame, so each window materialized
its own default one with minted ids — and a frame op relayed between them was
dropped while a page op from the same run landed. That is
[083](issues/083-two-windows-on-the-same-document-did-not-hold-the-same-document.md):
a default the editor conjures is not a node anybody created, so it gets the same
name in every window now. The same fix travelled to `replaceState`, which was
setting `this.site` without the two invariants the constructor establishes — and
with no frame, Layout mode silently shows the **page**.

With that fixed, the real test could run at all:

```
· A's insert op — {"parentId":"block-products","ord":"a0V","id":"475dd5b2-…"}
· B's insert op — {"parentId":"block-products","ord":"a0V","id":"846d5347-…"}
✓ both chose the same slot, which is the whole point of the test
✓ nobody's insert was lost
✓ both copies are present in both windows
✓ the two windows agree on the ORDER
✓ the original row was not displaced
✓ the untouched siblings kept their ords
✓ both windows hold the same document, byte for byte — 14901 vs 14901 chars
✓ a redelivered insert does not duplicate the row
```

Both windows minted the **identical** ord `a0V` for the same slot — the exact
collision an array index cannot survive — and the tie broke on node id, the same
way on both sides, with nothing exchanged but the ops. The three untouched
siblings kept their original ords, which is the other half of the claim: an
insert touches the inserted node and nothing else.

`pnpm verify` exit 0 workspace-wide, builder e2e green, typecheck clean in both
the workspace and the Quarrystone app.

### Act 6 — The van on bad signal

**Done when:** the recovery banner appears, the work comes back, and it is proved
that it came back **without** the host store.

**Outcome:** done, first time, no defects.

The tab is killed **mid-sentence** — with the caret still in the field and
nothing committed, which is how a phone dies, not how a person leaves a page.

```
✓ a first load shows no recovery banner
✓ the caret is still in the field
· our backend at this moment — has nothing
· the banner — "Restored your last session (just now). Start fresh"
✓ the recovery banner appears
✓ the sentence being typed when the tab died came back
```

The uncommitted sentence survived. That is `useCommitOnHide` doing exactly what
its comment says it is for: *"a closing tab never blurs the field, so without
this the sentence being typed right now is the one thing the crash-recovery
store cannot save."*

**Then the same thing with our own store failing every save**, which is the half
that matters to us. A recovery that quietly read Quarrystone's backend would
pass every "did the work come back" check and be worth nothing — our backend is
the thing that is down.

```
· our own save indicator says — "Not saved — no signal · 1 change"
✓ our app admits it did not save
· our backend now holds — nothing at all
✓ our backend genuinely has nothing to recover from
✓ the recovery banner appears again
✓ the work came back
· our backend, at the moment the work reappeared — nothing at all
✓ ...and it did NOT come from our backend
```

Our store was empty at the moment the work reappeared. It cannot have been the
source. That is the independence `builder-local-persistence` claims, measured
rather than assumed.

Every key on our origin, checked by name:

```
react-resizable-panels:quarrystone:plant-page:recovery:rails
silicaui-draft:quarrystone:plant-page:recovery:view
silicaui-draft:quarrystone:plant-page:recovery
```

All three contain the `persistKey` **we** gave it. A library prefix in front of
our own name is what a namespaced store looks like; nothing is written under a
name we did not choose, which is the thing Arvid has been bitten by before.

And coming out of the tunnel, the reconnect carries the **whole document**, not
just the keystroke that happened to be last:

```
· our save indicator now says — "Saved 16:06:36 · 1 change"
✓ our backend saves again
✓ and the work written with no signal is in that save
```

**One check of mine was wrong and was corrected**: it demanded every storage key
*start* with `quarrystone:`, which would have failed a correctly namespaced
store. The rule that matters is that every key contains a name we gave.

### Act 7 — The thing that goes wrong for them

**Done when:** the screen says so honestly — `undefined`, not a fabricated value,
not a silent blank — and the author is not left thinking the block is empty
because they deleted something.

**Outcome:** done, first time, no defects.

Our API is asked for `plant-broaryd-nedlagd-2019`, a plant decommissioned in
2019, on a page that still names it. The control runs first, on the live plant,
so "the block says something odd" cannot be confused with "the block is broken".

```
✓ the block is not silently blank
✓ it names the reference that failed — plant-broaryd-nedlagd-2019
✓ it says the block is not empty because anything was deleted
✓ it tells them what to do next
✓ and it does NOT fabricate a certificate
```

The host tab keeps its duty too — it stays on the block and says, in words,
*"This block does not name a plant, so there is nothing to show. Pick one on the
Settings tab."* rather than rendering an empty panel or a fabricated expiry.

#### The distinction that makes the honesty real

A bound field whose reference stops answering is the other half. Three rows,
three different answers, all on screen at once:

```
· the row bound to a reference that WORKS — "412 880 t/år"
· the row bound to a KNOWN but empty one — "Empty — drop something here"
· the hero, bound to one nothing answers to — "Höganäs Kross & Grus AB — Ängelholmsvägen anläggning"
· nodes flagged as holding an unresolved reference — ["hero"]
```

**"We have no remark" and "we have never heard of that field" are not the same
answer**, and the editor does not flatten them: the known-and-empty ref renders
empty, the unknown one keeps the author's own words and carries the marker. The
resolution contract states this and argues it better than my first guess did —

> an unknown ref keeps the node's AUTHORED content and reports a diagnostic; a
> KNOWN ref whose value is empty renders empty, which is a legitimate result.
> Without that distinction the walk cannot be honest — it blanks the node either
> way.

**My probe was wrong three times here and the product was not.** It read the
left rail's Layers list and called it the Compliance panel; it typed `{{ref}}`
merge tokens into a site heading, which is an **email** feature the site tree has
no pass for; and it asserted an unknown ref should print the word `undefined`,
which is the behaviour the contract deliberately rejects. Each was corrected to
measure what is actually promised.

A field that exists and is empty (`plant.anmarkning`) was added to Quarrystone's
own resolver on purpose and kept there: it is the only way to have one of each
state to compare.

### Act 8 — Ops out, ops in

**Done when:** both windows hold the same document, byte for byte, and any
divergence is an issue.

**Outcome:** done, first time, no defects.

Act 5 proved this for one op kind under contention. This is a whole session: an
hour of ordinary editing in one window, through the real controls, and every op
it produced replayed into a window that had seen none of it.

```
· ops A produced — 6
· op kinds in the stream — ["node.setText","node.setClass","node.setTag","node.insert","node.remove"]
✓ every op names its target scope
✓ every structural op carries a fractional ord, not an index
✓ the stream is JSON-clean - it can go down a socket unchanged

· applyRemoteOps returned — {"applied":6,"dropped":0}
✓ every op was applied — 6 of 6
✓ both windows hold the same document, byte for byte — 14581 vs 14581 chars
✓ and the canvas repainted - the screens agree too
```

And a replay is **not an edit**: B emitted no ops of its own, so nothing echoes
back down the socket, and B's Undo stayed disabled — a local undo cannot revert
the other author's work.

**Two of my own checks were wrong here and both were about chrome, not content.**
The canvas comparison first failed on the string `"Plant statistics"`, which is
the selection pill naming A's selected block; B had nothing selected. That is
local editor chrome and it is *right* that it does not travel — selection is not
a document fact. Escape then walked the selection **up to the parent** rather
than clearing it, so one press swapped it for `"Group"`. Walking it all the way
out made the two screens identical.

### Act 9 — The other side

**Done when:** it renders, the host nodes' content is there, the enquiry form
posts, and there is no console error.

**Outcome:** done, after one high-severity documentation defect —
[084](issues/084-the-contract-never-said-a-host-node-ships-as-an-empty-div.md).

The published plant page is served by `serve.mjs` from static files under

```
default-src 'none'; script-src 'none'; style-src 'self'; img-src 'self' data:;
font-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'
```

**`script-src 'none'`** — not a strict policy chosen to be impressive, the
literal claim being tested. A compliance certificate that needs JavaScript to
appear is a compliance certificate that does not appear.

```
1 — it renders
✓ the plant name is the heading
✓ the product list is there
· stylesheet rules that loaded — 3016 in 1 sheet(s)
· the certificate card computes to — {"radius":"8px","bg":"oklch(0.98 0.003 250)","pad":"24px"}
✓ our card is really painted, not naked text

2 — the host nodes' content is there
· our three blocks — {"cert":1,"stats":1,"form":1}
✓ ...with the real certificate number in it
✓ ...and its expiry
✓ the plant statistics rendered
✓ no mount point was left empty — 0 empty

3 — the enquiry form posts
· the lead our backend just received — {"plant":"plant-hoganas-angelholmsvagen","email":"inkop@skanska.se","enquiry":"400 t makadam 8-16 mm, leverans v.42, Ängelholm."}
✓ the submission went somewhere real
✓ ...and it names the plant it came from

4 — no console error
✓ no console error
✓ nothing failed to load
✓ no sideways scroll at 360px
```

#### What the contract did not say

A `host` node reaches the published page as an **empty `<div data-sui-host>`**.
That is a good design — the projection stays framework-free — and it is written
down in a source comment in `to-html.ts` that an integrator has no reason to
open. The contract does not mention publishing at all: not `onPublish`, not
`PublishPayload`, not `RenderedPage`, and `renderHostNode` is described as a
canvas preview with nothing said about what happens on deploy.

Follow the contract exactly and you ship a plant page with three empty divs
where the compliance certificate, the statistics and the lead form should be —
valid HTML, a clean 200, no warning, and the layout intact because an empty div
takes no space. That is
[084](issues/084-the-contract-never-said-a-host-node-ships-as-an-empty-div.md),
and the contract now has a **§5.2 Publish** that says all three parts of it.

#### And RULE #1, with a number attached

Quarrystone's first host-node components painted themselves with inline `style`
objects. Perfect on the canvas, perfect in `vite dev`, and on the published page:

```
Applying inline style violates the following Content Security Policy directive
'style-src 'self''. … The action has been blocked.   × 5
```

Every one dropped. The certificate rendered as **naked text** — right content,
no card, no border, no spacing — with a clean 200 and nothing a visitor would
ever report. Rewritten onto silicaui components and Tailwind utilities, it paints
under the same policy. The rule is not a house style; it is the difference
between a block that survives a Content-Security-Policy and one that does not.

#### The artifact

```
docs/personas/artifacts/p05-quarrystone-embed/
  publish.mjs   — their deploy step: fills every mount point at publish time
  serve.mjs     — static hosting + the one POST route the lead form needs
  out/          — the published plant page and one 335 KB stylesheet
```

Nothing in `out/` is typed by hand. `published.json` comes straight out of
`window.__quarrystone.lastPublish()`, which is what the builder's own Publish
button handed the host.

---

## The standing checks

### Two builders on one page

Quarrystone's **Två sidor** route: two plant pages side by side, which their
support people really do — copying opening hours from one site to another.

```
· canvases on the page — 2
✓ both editors mounted
✓ the edit landed in the one I typed in
✓ and the other one did not move
· storage keys — ["quarrystone:plant-page:a", "…:recovery:a:rails", "…:recovery:b:rails",
                  "silicaui-draft:…:recovery:a", "silicaui-draft:…:recovery:a:view"]
✓ the two editors do not share a store key
· what each editor calls selected — ["Compliance certificate", null]
✓ and the other editor still has nothing selected
```

Two editors, two `persistKey`s, two rail-width memories, two drafts — every one
derived from the key the host chose. **Nothing is global**, which is the only
reason two of them can share a page.

### A block the document uses and the map no longer ships

The document names `quarrystone.legacy-price-table`; `hostComponents()` has never
heard of it.

```
✓ the canvas says which block it does not know
✓ ...rather than leaving a hole
· Navigator rows — [… "Compliance certificate", "Quarrystone legacy price table", "Price enquiry form"]
✓ the Navigator still lists it
✓ the Inspector did not blank the rail
✓ and nothing threw
```

The Navigator gives it a **plain-English name derived from the key** —
"Quarrystone legacy price table" — rather than a blank row or a raw allowlist
string. An author can find it, see it, and delete it.

### Dates

**The machine: `America/Los_Angeles`, `en-US`, UTC-8.** Recorded because the
answer depends on it.

```
2026-12-30 — 30 december 2026  |  a bare Date(): 2026-12-29
2026-12-31 — 31 december 2026  |  a bare Date(): 2026-12-30
2027-01-01 — 1 januari 2027    |  a bare Date(): 2026-12-31
```

The certificate expires **31 December 2026** and says so. The right-hand column
is the trap: `new Date("2026-12-31")` is parsed as UTC **midnight** and rendered
in local time, which is the previous day anywhere west of Greenwich — a
certificate that expires the day before it expires. Our components append a time
for exactly this reason, and the check asserts the bare form is wrong so nobody
"simplifies" it later.

### Changing `persistKey` while the editor is open

An author moving from one plant page to another without the editor going away.

```
· draft keys before — ["silicaui-draft:…:recovery", "…:recovery:view"]
· draft keys after  — [… , "silicaui-draft:…:recovery:hoganas-norra", "…:hoganas-norra:view"]
✓ the editor writes to the NEW key
✓ and the old draft is untouched, not overwritten
✓ the old key still holds the OLD text
```

**The first version of this check was wrong**: it switched route (which
*remounts*, a different question) and demanded new draft keys appear with no edit
made — but an editor with nothing typed into it correctly writes no draft at all.

### Unmounting mid-edit

Navigate away with the caret in a field and the sentence uncommitted, then come
back.

```
✓ the editor unmounted without throwing
· after coming back, the heading reads — "…rivet och sedan bortnavigerat…"
✓ the sentence survived the unmount
```

### The theme island, measured

```
· our app header    — {"bg":"oklch(0.99 0.002 240)","theme":null}
· the builder chrome — {"bg":"oklch(0.97 0.004 250)","theme":"quarrystone-studio"}
· the canvas         — {"bg":"oklch(0.96 0.004 240)","theme":"quarrystone"}
```

Three surfaces, three palettes. Our chrome carries **no** `data-theme` because
our theme is declared `default: true` and applies at `:root` — measured by colour,
not by attribute, after the first version of this check looked for an attribute
and failed a correctly themed app.

Containment proved by changing the thing, not by looking at it: switch the
**document** theme to dark and the canvas goes to `oklch(0.135 0.01 255)` while
our header stays at `oklch(0.99 0.002 240)`, byte for byte.

### Isolation — reaching for another account's plant

Broaryd Sand & Grus is a second Quarrystone account with a real certificate,
`SE-AGG-2025-20913`, in the same process. A check with nothing to reach for
proves nothing.

```
✓ the control: our own certificate resolves
✓ the other account's certificate number is NOT on screen
✓ ...nor their plant name
✓ ...nor their tonnage
✓ ...nor their phone number
✓ and it says so, rather than going blank
✓ nothing of theirs is in the document we would save
· what the plant picker offers — ["plant-hoganas-angelholmsvagen|Höganäs Kross & Grus AB…"]
✓ the picker does not list the other account's plant
✓ as Broaryd, their own certificate resolves
✓ ...and OUR certificate is now the one that is gone
✓ every draft is namespaced by the persistKey we chose
```

Both directions, because a guard that refuses everyone is not a guard. And the
builder is never told who is signed in — authorization is entirely ours, which is
the correct seam and the reason this was nine lines to write.

### Without a mouse

The concrete instance: **mount, select the compliance certificate, open the
Compliance tab, press "Send for review"**.

It did not work, and the reason was a critical defect in a shipped component —
[085](issues/085-the-layers-tree-moved-one-row-and-stuck.md). Canvas nodes carry
no tab stop, so the Layers tree is the only keyboard route to a selection, and
the tree's arrow keys **moved one row and stuck**: a treeitem lives inside a
treeitem, the same handler was bound on every ancestor, and the parent's copy
moved focus straight back to the child we had just left. Rows 2 through 9 —
including the certificate — were unreachable by keyboard. A flat tree has no
ancestor row, which is how it survived every test it had.

After the fix, the whole path:

```
· canvas nodes with their own tab stop — 0
· the Layers tree reached after — 44 tab presses
· the row the arrows landed on — "Compliance certificate"
✓ the certificate block can be selected without a mouse
· the first tab strip reached after — 33 more — landed on "Design"
✓ the host's own tab is reachable with the arrows
✓ ...and opens with the keyboard
✓ ...showing our certificate
· the host's toolbar action reached after — 16 more
✓ the host action is reachable from the open Compliance tab
· pressing it says — ["Sent 1 page(s) for compliance review."]
```

**Two of my own checks were measuring nothing** and are named in 085:
`[data-sui-selected]` is an attribute the canvas has never carried, so "did
selection leak between the two editors?" counted zero of a thing that is always
zero; and a `role="tablist"` is a roving tabindex, so tabbing 120 times looking
for a tab named "Compliance" could never find it.

### Writes nothing under a key they did not give it

Done in act 6. Every key on the origin contains either our store key or our
`persistKey`; a library prefix in front of our own name is what a namespaced
store looks like.
