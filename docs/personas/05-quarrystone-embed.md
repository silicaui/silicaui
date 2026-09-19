# P05 — Arvid Lindqvist · Quarrystone

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

**Status:** not started
**Run:** —
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
| Acts completed | |
| Issues filed | |
| Issues fixed and confirmed | |
| Issues blocked, and on what | |
| Screens scored (in both themes at 360px) | |
| **Not checked** | |

### The numbers

| Record | Result |
| --- | --- |
| Steps in builder-contract.md that were assumed but not written | |
| Attacks on the locked node, and how many were refused | |
| Did local recovery work with the host store failing? | |
| Storage keys the builder wrote, and whether they were all given to it | |
| Ops replayed, and whether the documents matched exactly | |
| Design-rule breaches found | |
| Console errors and warnings during the run | |

---

## Run log

Written act by act **as you go**. Quote the exact words on screen.
