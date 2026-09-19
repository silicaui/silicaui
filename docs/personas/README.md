# Silica UI — the persona test roster

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

9 customers, 9 people, 9 full runs from "never heard of it" to a working build a
stranger can use. How to run one is in [CLAUDE.md](CLAUDE.md).

**A run produces four things, and none of them is a report at the end:**

| Artifact | What it holds |
| --- | --- |
| the persona file | the script, the log written into it act by act, and its standing-check results |
| [issues/](issues/) | one file per defect — **filed, fixed, and re-proved from the screen, inside the run** |
| [rating.md](rating.md) | a Design and an Ease score, 1–10, for **every screen opened**, in light and dark at 360px, with its gap to 10 |
| **a real build** | in `artifacts/P0N-slug/` — complete and working, the inventory in each persona file being its definition of done |

It is a repair pass judged by the customer, not a survey judged by a developer. The
question is never "is this implemented" — it is _could Dilnoza finish this job, and
would she come back tomorrow?_

**Every run also carries the standing checks** (CLAUDE.md): the wrong moves, a reload
and a deep link, the date boundaries, the contrast-and-token-math edges, the other
side of the delivery, one job without a mouse, and one deliberate attempt to cross a
boundary that is supposed to hold.

[discovery.md](discovery.md) is how the product was read before any of this was
written — the axes, the spine, the ports, and, at the bottom, **what could not be
found**. Read its "Not found" section before a run reports anything as a fact.

## Why 9, and why these 9

The count is not the point — the **allocation** is. Nine variations on "a developer
installs it" would re-walk the same `pnpm add` nine times and stop finding anything
after the third.

Silica UI is **one design system delivered through three paths** (CSS plugin, React,
node-tree HTML) and **two embedded builder surfaces** (site and email), on top of an
extensible token engine, with five opt-in composite packages and a host contract. Each
of those is real code that nothing else opens. So the roster allocates one persona per
path, per surface, per seam — and one for the edges:

- **Three delivery paths → P01 (React), P02 (CSS only), P08 (node-tree + behaviors).**
  These three never touch the same package. P02 is the **negative-space persona**: the
  customer who never installs `silicaui-react` at all, which is where "every doc page
  assumes React" surfaces. It runs second, on purpose, before eight other runs have
  quietly normalised a React-shaped product.
- **Two builder surfaces → P03 (site) and P04 (email).** Separate Canvas, Navigator,
  Inspector and Palette; separate projections. The email one has a constraint the site
  one does not: Outlook.
- **The seams nothing else reaches → P05 (host contract) and P06 (token engine).**
  P05 is the only persona who is silicaui's *integrator* rather than its *user*. P06
  is the only one who invents a color rather than picking one, which is the claim the
  N-color engine actually makes.
- **The opt-in packages → P07.** The only persona who installs anything outside core,
  and the only test of whether "kept out of core so it stays lean" is true in practice.
- **The edges → P09.** Keyboard-only, phone-only, dark-only, over a mature codebase
  being migrated off daisyUI. It needs the other eight to have shipped their fixes, so
  it goes last.

There is no tenth. Adding "another React developer" would re-walk P01's spine and
prove nothing — and each of the nine above has a sentence below that no other one has.

## The roster

| # | Persona | Customer | Path / surface | Status |
| --- | --- | --- | --- | --- |
| P01 | [Dilnoza Karimova](01-peregrine-ops-console.md) | developer | `silicaui-react` · Next.js App Router | not started |
| P02 | [Tomás Ferreiro](02-casa-ferreiro-menu.md) | developer | `silicaui` CSS plugin only · Django, no React | not started |
| P03 | [Marlene Okonkwo-Bright](03-bright-step-studio.md) | business user | site builder · page + layout + theme modes | not started |
| P04 | [Reuben Halloway](04-thornbury-dispatch.md) | business user | email builder | not started |
| P05 | [Arvid Lindqvist](05-quarrystone-embed.md) | integrator | `BuilderHost` — host nodes, locking, peers, persistence | not started |
| P06 | [Nia Adeyemi](06-nias-atelier-brand-kit.md) | designer-developer | token engine — custom N-colors, class prefix, theme islands | not started |
| P07 | [Hiroshi Tanabe](07-kaiho-freight-dashboard.md) | developer | composite packages — charts, table, editor, dnd, panels | not started |
| P08 | [Fatima Zahra El Amrani](08-medina-field-guide.md) | developer | `silicaui-html` + `silicaui-behaviors` — static export, no React | not started |
| P09 | [Gordon Pike](09-pike-tackle-migration.md) | developer | migration off daisyUI · keyboard-only · phone-only · dark-only | not started |

## What each one is the only proof of

| # | Nothing else in the roster covers this |
| --- | --- |
| P01 | **The spine, deeply.** Home → docs → getting-started → install → first themed component in a real Next.js build, verified step by step, including what a wrong `@plugin` import looks like |
| P02 | The **CSS layer standing alone** — no React, no bundler, a server-rendered template — and whether the docs can teach a non-React reader anything at all |
| P03 | The **site builder as a non-technical person**: can she find her page, name a section, and publish without being told what a node is |
| P04 | The **email builder's output in a real client** — merge tokens, link groups, the frame, and Outlook |
| P05 | The **embed seam**: host nodes, two-tier locking, inspector tabs, peers and local persistence, driven by the app that hosts the builder rather than the author inside it |
| P06 | A **colour that did not exist until she typed it** reaching every component identically to a declared one — the N-color claim, tested from the outside |
| P07 | The **five opt-in packages** — and whether core really stayed lean when you do not install them |
| P08 | **Static output with no React anywhere**: the node tree projected to HTML, hydrated by the vanilla runtime, CSP-clean |
| P09 | The **edges over a mature codebase** — a daisyUI migration, judged keyboard-only, at 360px, in dark, by someone who will not squint |

**This table is the test of the roster.** A persona with no unique line is a duplicate.

## Run order

**P01 first, P09 last.** In between, this sequence front-loads the structurally
different spines:

`P01 → P02 → P08 → P06 → P03 → P04 → P05 → P07 → P09`

- **P01, P02** settle the docs-and-install spine between them, from both ends: the
  fullest path and the thinnest.
- **P08** diverges earliest after them — no React, no bundler, no builder — so it
  finds the "everything assumes a React app" defects while they are still cheap.
- **P06** comes before the builder runs on purpose. The token engine is underneath
  every remaining persona, so its repairs are the ones with the widest reach; fixing
  them after five more runs means five re-confirmations under RULE #7 instead of one.
- **P03 → P04 → P05** work the builder outward: the author inside it, then the other
  surface, then the app hosting it. P05 needs the builder to be sound before the seam
  is worth judging.
- **P07** is the least shared surface, so it pays the least and is cheapest to run
  late.
- **P09** needs a mature tree under it and needs the other eight to have shipped their
  fixes, so it goes last and judges what is left.

Because defects are fixed inside the run that finds them, **the order also decides who
pays for what.** P01, P02 and P06 will absorb most of the shared repairs; by P07 a run
should be almost entirely about its own surface. **If P07 is still finding
getting-started defects, the earlier runs did not fix what they found.** That is a
signal about the process, not about P07.

## Screen coverage

The product ships **142 rateable screens** — 5 site pages, 116 component doc pages, the
playground, and 20 builder panes. Every one is a row in [rating.md](rating.md),
generated from the code by `node docs/personas/gen-screens.mjs` so the denominator is
real and cannot silently drift.

9 runs will not open all 142. Most of the component doc pages will never be opened by
anybody in this roster. **Those rows stay `—`, deliberately.** An unrated screen is
unrated; it is never assumed fine because a sibling scored well (CLAUDE.md RULE #4).
When the runs are done, the remaining `—` rows are themselves the answer to "what has
nobody ever looked at?"

## Coverage this roster deliberately does not have

Say these out loud rather than discovering them as gaps later.

- **112 of the 116 component doc pages.** The runs open the ones their builds actually
  need. Rating all 116 would be a different exercise — a sweep, not a set of runs —
  and pretending nine people would read them all is the kind of lie this framework
  exists to stop.
- **The 20 named themes beyond the ones the personas pick.** Between them the roster
  uses quartz, obsidian, and three custom ones. The other 17 stay unopened.
- **Load and performance.** Nine builds is a correctness exercise, not a benchmark.
  Nobody here renders a 10,000-node tree.
- **Real multi-machine collaboration.** P05 exercises `peers` and `applyRemoteOps`
  through the harness's demo host, not two people on two computers.
- **Real sends and real hosting.** P04 opens the email in a real client from a file;
  nothing is sent through a real ESP. P03 publishes to disk, not to a domain.
- **The downstream consumers.** sparx and piggles are not edited and not run. Where a
  run finds something that matters to them, it is written down here — not fixed there.
- **Browsers other than Chromium**, except where a run turns on bleeding-edge CSS, in
  which case CLAUDE.md requires a look in Brandon's own browser too.

An honest gap list is worth more than a roster that claims to cover everything.
