# P08 — Fatima Zahra El Amrani · Medina Field Guide

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

**Status:** done
**Run:** started and finished 2026-09-18
**Customer:** developer
**Path:** `@wizeworks/silicaui-html` + `@wizeworks/silicaui-behaviors` — node tree → static HTML, **no React anywhere**
**Role in the roster:** structurally the earliest divergence after the spine

## Project

| Field | Value |
| --- | --- |
| Build lives at | `docs/personas/artifacts/P08-medina-field-guide/` — generator + generated `out/` |
| Framework | a Node script that builds a node tree and calls `toHtml`; output served as plain files |
| Theme | `dune` light · `obsidian` dark |
| Started from | an empty Node script — no React, no bundler, no framework |

## The person

**Fatima Zahra El Amrani, 39, she/her.** Documentation engineer at a heritage
foundation in Rabat. She builds static publishing pipelines: content in, HTML out, no
runtime. She has shipped three static generators and is fluent in the trade-offs.

**Technical level.** High, and **specifically about output** — she reads generated HTML
the way other people read source. She will notice an inline style, a non-semantic tag,
or an attribute that should not be there.

**What she is nervous about.** A "framework-neutral" layer that turns out to need a
React runtime to actually be interactive, leaving her with a pretty but dead page. And
a Content-Security-Policy that the output cannot satisfy, because the foundation's
hosting will not relax it.

**What made her look today.** The node-tree schema. If she can generate pages from her
content database and get real interactivity with a zero-dependency runtime, she can
retire a generator she has maintained for six years.

## The business

**Medina Field Guide** — a public heritage guide to the Rabat and Salé medinas,
published by the foundation in Arabic, French and English.

- 340 entries — buildings, streets, crafts, people
- Updated a few times a month from a content database
- **Inconvenient for the software:** the site must work with a strict CSP (no inline
  script, no `unsafe-inline` styles), it is read on very old Android phones on slow
  connections, and roughly half the content is **right-to-left Arabic** sitting beside
  left-to-right French in the same paragraph.

## Why she is here today

1. "Can I generate this without React being anywhere near it?"
2. "Will an accordion actually open on the published page?"
3. "Will it pass our CSP without an exception?"

## The data

**This is the test data. Type it as written** (RULE #2).

### Entries — at least 24, so the index pages

| Entry | Type | Built |
| --- | --- | --- |
| Bab er-Rouah — باب الرواح | Gate | 1197 |
| Chellah / شالة — nécropole mérinide et ruines romaines de Sala Colonia | Site | 14th c. |
| Kasbah des Oudayas | Quarter | 12th c. |
| Zaouïa de Sidi Mohammed ben Abdellah | Religious | 1785 |
| Souk es-Sebat — dinanderie et travail du cuivre | Craft street | — |

Nineteen more. What it deliberately carries:

- **Arabic inline with French**, in the same heading and the same paragraph — the RTL /
  LTR boundary is the hardest thing in this data and it is in the title
- **`Chellah / شالة — nécropole mérinide et ruines romaines de Sala Colonia`** — 68
  characters, mixed script, with an em-dash
- **`—`** as a genuine "not known", which must not render as a value
- **24 entries** — enough that the index needs structure

### The entry body that wraps

> Élevée sous le règne de Yacoub el-Mansour, la porte s'ouvre sur un passage coudé dont
> la fonction défensive a survécu à sa fonction cérémonielle; les motifs de la façade
> sont parmi les plus fins de l'architecture almohade.

At 360px on an old phone that is five lines, under a mixed-script heading.

### The interactive things

Three, and all three must work on the published page with **no React and no inline
script**:

| Thing | Behavior |
| --- | --- |
| The visiting-hours panel | a disclosure that opens and closes |
| The entry-type filter | a tab strip |
| The photo strip | a scrollable carousel |

---

## The build

| Item | What it must have |
| --- | --- |
| Generator | a Node script building the node tree from the 24 entries — no React import anywhere in it |
| Index page | all 24 entries, grouped, with the mixed-script titles correct |
| Entry page | 24 of them, generated, each with the wrapping body and an honest `—` for unknowns |
| The three interactive things | working on the published page, hydrated by `silicaui-behaviors` |
| CSP | the whole site served under a strict policy with **no inline script and no `unsafe-inline` style**, and the policy written down |
| RTL | Arabic rendering right-to-left correctly, including where it sits inside a French sentence |

**Working end to end:** a visitor on an old Android phone, on a slow connection, under
the strict CSP, can open an entry, expand the visiting hours, filter by type and scroll
the photos — with the generator not running and no React on the page.

**The look.** A printed field guide: serif, generous, photographic, quiet. Nothing like
a dashboard.

**Also required, as on every one:** both themes, 360px, keyboard-reachable, on-system.

---

## The run

### Act 1 — Find the node-tree story in the docs

From silicaui.com, find out that path three exists and how to use it. She does not know
the words `node tree` or `projection` yet.

**Done when:** she has found it or recorded that she could not, with the words she
searched that failed. If the only route to path three is the MCP or the source, that is
a `major` — the docs are the product's front door.

### Act 2 — First page out

Build the smallest possible node tree and project it to HTML. Open the file.

**Done when:** a real HTML file renders correctly with no server and no bundler, and
the generated markup has been **read**, not just looked at — she will check the tags
and the attributes.

### Act 3 — The mixed-script data

Generate the index with all 24 entries, Arabic beside French.

**Done when:** every title renders correctly in both directions, the 68-character mixed
title holds at 360px, and any place the RTL boundary breaks is an issue.

### Act 4 — Absence, told honestly

Generate the entries where `Built` is genuinely unknown.

**Done when:** an unknown renders visibly differently from a known value — and if
`—` and a real date are indistinguishable in the markup or on screen, that is exactly
the defect class this framework exists for.

### Act 5 — Make it interactive without React

Add the disclosure, the tab strip and the carousel. Load `silicaui-behaviors` on the
published page.

**Done when:** all three work on a published file with no framework — or the specific
one that does not is an issue.

### Act 6 — The CSP

Serve the output under a strict policy: no inline script, no `unsafe-inline` style.

**Done when:** the site works with the policy on and there is **zero** CSP violation in
the console. Write the exact policy into the build's README.

### Act 7 — The thing that goes wrong for her

The content database gives her an entry with an unclosed `<em>` and a stray `<iframe>`
in a description field — content the editors pasted from a Word document years ago.

**Done when:** the allowlist holds, the page does not break, and it is recorded what
the output did with both.

### Act 8 — The old phone on a slow link

Throttle to slow 3G, 360px, an old Android user-agent. Read an entry.

**Done when:** it is usable — and the numbers (weight, time to readable) are written
down rather than described.

### Act 9 — The other side

Serve the built `out/` directory cold, with nothing else running, under the CSP, and
walk it as a visitor: index → entry → expand hours → filter → photos.

**Done when:** the whole journey works with no console error of any kind.

---

## What only this persona proves

**Static output with no React anywhere**: the node tree projected to HTML, hydrated by
the vanilla runtime, CSP-clean.

---

## Standing checks

**Wrong moves.** Generate the same page twice into the same output path. Put a node
kind in the tree that the projection does not know. Give a component macro a prop it
does not take. Run the generator with the content file half-written.

**Reload and deep link.** F5 with the visiting-hours disclosure open — does it stay
open, and should it? Then deep-link an entry with an anchor from a cold load under the
CSP.

**Dates.** `14th c.` and `12th c.` are not dates and must not be parsed as any. A real
one — an exhibition running to `31 December 2026, 23:59` — must be. **Record the
machine's timezone.**

**Contrast and token math at the edges.** `dune` and `obsidian` on an old phone's
screen, measured: body text, the `—` for unknowns (which is deliberately de-emphasised
and must still be legible as a mark), and the caption under a photo, which is the
smallest text in the build.

**The other side.** Act 9 — the visitor under the CSP with nothing running.

**Without a mouse.** Index → entry → expand hours → filter by type → scroll the photo
strip, keyboard only, on the published page.

**A boundary that should hold.** Act 7 is it: the `toHtml` tag and attribute allowlist
against pasted junk. Add a `<script>`, an `onclick=`, a `javascript:` href and an
`<iframe>`, and confirm every one is stripped — in the projection, not by the browser.

---

## Verification

| | Result |
| --- | --- |
| Acts completed | **9 of 9** |
| Issues filed | **3** — 033, 034, 035 |
| Issues fixed and confirmed | **3 of 3** |
| Issues blocked, and on what | none |
| Screens scored (in both themes at 360px) | **3** — `/docs/`, and the guide's own index and entry pages |
| **Not checked** | a real old Android device (weights measured exactly, transfer time COMPUTED from them, not observed on hardware); any browser but Chromium; a screen reader actually reading the Arabic; the 24 entries' photographs (SVG placeholders stand in — the carousel is what was under test) |

### The numbers

| Record | Result |
| --- | --- |
| Could she find path three from the docs alone? | **Only by leaving the docs.** `/docs/` had **118 links, 117 of them component pages**; no `<header>`; and ⌘K answered "No results found" for `static`, `html`, `no framework` and even `getting started`. **#033** |
| React references anywhere in the generator or the output | **Zero.** No `react`/`react-dom` anywhere in `node_modules`; both node-tree packages declare **no dependencies at all**; the published HTML contains one `<script type="module" src>` and nothing else |
| CSP violations in the console under the strict policy | **0**, across the whole journey. `default-src 'none'; script-src 'self'; style-src 'self'` |
| Interactive things that worked on the published page, of three | **3 of 3** — disclosure (real Enter), tab strip (real arrow keys), carousel (3 items, 2 controls) |
| Page weight and time to readable on throttled 3G | index **2.5 KB** gzipped, an entry **1.0 KB**, stylesheet **41 KB**, runtime **22 KB** → **64.7 KB** for a first visit ≈ **1.3 s** of transfer at 400 kbit/s |
| Tags and attributes stripped by the allowlist, of those attempted | **10 of 10** on the first pass — `<script>`, `<iframe>`, `onclick`, `onerror`, `style`, `javascript:`, `data:`, an unclosed `<em>` (escaped as text), and an unknown node kind. **Then 6 MORE that should NOT have been** — `dir`, `lang`, `translate`, `<bdi>`, `<bdo>`, and every plain relative URL. **#034, #035** |
| Design-rule breaches found | **0.** No hex, no inline style anywhere in 26 pages, no eyebrow. 161 text elements measured at 360px across both themes: **0 below AA** |

---

## Run log

### Act 1 — Find the node-tree story in the docs · **done**

She clicks **Docs**, because that is what it is called. `/docs/` is a heading, one sentence
and "Browse components". Counted off the page: **118 links, 117 of them component pages**,
the 118th the wordmark. **Zero** to Getting started. The docs shell has **no `<header>`
element at all**, so the landing page's "Get started" button does not follow her in.

So she uses ⌘K, which the page invites her to:

```
static          → No results found.
html            → No results found.
no framework    → No results found.
getting started → No results found.
```

The palette could not find the page **by its own title**. The one page documenting the
node-tree path was reachable by going back to the landing page or guessing the URL. **#033**,
fixed — a "Start here" group read by BOTH the sidebar and the palette, with keywords drawn
from the terms two personas have now typed and got nothing for.

**Recorded, not filed:** getting-started tells her path three exists and shows six lines of
`atom()`/`toHtml()`. The node kinds, the binding vocabulary and the `toHtml` allowlist live
in `get_node_schema` on the MCP and on no page of the site. Enough to start; not enough to
write a generator.

### Act 2 — First page out · **done**

```
npm i @wizeworks/silicaui-html @wizeworks/silicaui-behaviors
```

**25 packages, and not one of them is React.** Both node-tree packages declare
`"dependencies": {}`. The smallest tree projects exactly as documented:

```
<h1 class="text-3xl">Bab er-Rouah — باب الرواح</h1>
<button class="btn btn-primary" type="button">Ouvrir</button>
<p>Ouvert <strong>mardi</strong> à dimanche.</p>
```

**Then she read the attributes, which is the point of the act, and found #034.** Every plain
relative URL was gone:

| written | emitted |
| --- | --- |
| `href="entree/chellah/"` | `<a>` |
| `src="photos/chellah.jpg"` | `<img>` |
| `href="./entree/chellah/"` | **kept** |

`./photos/a.jpg` survived and `photos/a.jpg` did not — the same URL. The function's own
comment says *"A schemeless (relative/anchor/query) URL is always safe"*; the code
allow-listed four prefixes instead. Fixed, with the whitespace hole that widening would have
opened closed in the same change.

### Act 3 — The mixed-script data · **done**

**#035, and it is the one that would have stopped the project.** The projection could not
express text direction *at all*: `dir`, `lang` and `translate` were dropped, `<bdi>` and
`<bdo>` downgraded to `<div>`.

Measured, in a 360px box, on an Arabic-first line:

| | Arabic sits at | Latin sits at |
| --- | --- | --- |
| no `dir` | **0 – 57** | 57 – 233 |
| `dir="auto"` | **303 – 360** | 127 – 303 |

Not a blank — a **reversal**. Every character present, assembled backwards, and invisible to
anyone who cannot read the script. Fixed; `dir="auto"` now appears 48 times across the
generated index, and an Arabic-first entry was added to the content because every other title
happened to begin with Latin and so hid it.

### Act 4 — Absence, told honestly · **done**

`built: null` is six of the 25 entries. It renders as a marked em-dash, never as a value:

```
<span class="text-base-content" title="Date inconnue" aria-label="Date inconnue" data-unknown="true">—</span>
```

A screen reader says "date inconnue"; a sighted reader sees a dash that measures **15.15**
(dune) and **16.69** (obsidian) — legible as a mark, which is what act 4 asks. There is no
`0`, no empty string and no `1970` anywhere in the output. `14th c.` and `12th c.` are
carried as the strings they are and never reach a `<time datetime>`; the one real date, the
exhibition running to `31 December 2026, 23:59`, does.

### Act 5 — Make it interactive without React · **done**

**All three work on the published page.** Driven with real keys, not synthetic events:

| | |
| --- | --- |
| disclosure | Enter opens it, "Accès libre" appears, focus stays on the summary |
| tab strip | Right arrow moves selection 0 → 1, focus follows, one panel visible |
| carousel | 3 items, hydrated, 2 controls, next advances |

**The runtime does not start itself, and the docs do not say so.** `dist/index.js` exports
`hydrate` and has no `DOMContentLoaded` listener and no top-level call — so "Load
`@wizeworks/silicaui-behaviors` on the page" is not sufficient. Under a CSP with no
`unsafe-inline`, calling it needs a second authored module file. Written into the build's
README as the step it is.

**Twice I gave a macro a prop it does not take, and twice it rendered an empty element
without a word.** `atom("Tabs", "tabs", { items: [...] })` produced
`<div class="tabs"></div>`; `atom("TabsTab", "tabs-tab", { label: t })` produced a
`<button>` with no text. Both are containers — the content is CHILDREN. An unknown component
NAME, by contrast, **throws**: *"Unknown @wizeworks/silicaui atom: \"Wormhole\". Register it
in the atom registry."*

**Recorded, not filed.** The registry holds `expand(node)` functions and no declared prop
schema, so validating prop names is a change to the macro contract across ~200 components —
a design decision, not a fix to make mid-run. The asymmetry is worth writing down though: the
same class of typo fails loudly for a component name and silently for a prop, and `Collapse`
with wrong props goes further and invents a `<summary>Details</summary>`.

### Act 6 — The CSP · **done**

```
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:;
font-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none';
frame-ancestors 'self'
```

**Zero violations. Zero console messages of any kind**, across index, entry, disclosure,
tabs and carousel.

- `style=` in the served HTML: **0** across all 26 pages
- `<script>` in the served HTML: **1 per page**, `type="module" src="…/boot.js"`, never inline
- the 5 `[style]` attributes visible in the live DOM are written by the scroll-strip behavior
  through the CSSOM, which `style-src` does not govern — and the console confirms it

**The policy also blocked my own measuring iframe**, because `default-src 'none'` means
`frame-src 'none'`. That is the policy working. The 360px contrast pass was therefore run
against the same `out/` served without CSP on a second port, and said so — contrast and
layout do not depend on the policy, and the policy itself was tested on the real server.

### Act 7 — The thing that goes wrong for her · **done**

Word-pasted junk, straight into a description field. The allowlist held on all of it, in the
**projection** — not in the browser:

| pasted | emitted |
| --- | --- |
| `<script>alert(1)</script>` | `<div>alert(1)</div>` |
| `<iframe src="https://evil.example">` | `<div></div>` |
| `onclick="alert(1)"` | dropped |
| `onerror="alert(1)"` on an `<img>` | dropped, `src` kept |
| `href="javascript:alert(1)"` | `<a>` with no href |
| `href="data:text/html,…"` | `<a>` with no href |
| `style="color:red"` | dropped |
| an unclosed `<em>` in text | `&lt;em&gt;` — escaped, visible as text |
| `{ kind: "wormhole" }` | `<div>` |

### Act 8 — The old phone on a slow link · **done**

At an **asserted 360px**, both themes, every translucent ancestor composited:

| | dune | obsidian |
| --- | --- | --- |
| index — elements measured | 142 | 142 |
| index — **below AA** | **0** | **0** |
| index — worst | 13.79 | 12.93 |
| entry — measured / below AA | 19 / **0** | 19 / **0** |
| horizontal scroll | none | none |

Weight, measured as served and gzipped: index **2.5 KB**, an entry **1.0 KB**, stylesheet
**41 KB**, runtime **22 KB** — **64.7 KB** for a first visit, ≈ **1.3 s** of transfer at
400 kbit/s, and every page after that is ~1 KB plus cache.

The stylesheet is 63% of that and is the whole plugin surface rather than only what 26 pages
use. 41 KB gzipped for a complete design system is not out of line, and it is recorded as a
number rather than filed as a defect.

### Act 9 — The other side · **done**

Cold, under the strict CSP, nothing else running — the measuring server stopped and its port
asserted free first.

| step | result |
| --- | --- |
| index | 25 entries, 10 type tabs, the Arabic-first link present with its relative `href` |
| filter by type | Right arrow selects "Jardin", by keyboard |
| open an entry | `باب الحد — Bab el-Had…`, `dir="auto"`, right-aligned |
| expand the hours | real Enter, "Accès libre" |
| the photo strip | 3 images, all loaded, next advances |
| **console messages** | **0** |

### Standing checks · **done**

| Check | Result |
| --- | --- |
| Generate twice into the same path | **31 files both times, index byte-identical.** `build.mjs` clears `out/` first |
| A node kind the projection does not know | `<div>` — keeps its slot, loses nothing |
| A macro prop it does not take | silent empty element. Recorded above |
| The content file half-written | **fails loudly**, naming the file and the line; no half-built site is written |
| Reload with the disclosure open | closes. Native `<details>`, no state, and correct — the alternative is a URL or storage, and neither is free under this CSP |
| Deep link an entry, cold, under the CSP | works — `/entree/bab-el-had/` renders complete |
| Dates | `14th c.`/`12th c.` stay strings and never reach a `<time>`; the one real date does |
| **Machine timezone** | `Europe/Lisbon` in the Django sibling; this build emits `+01:00` explicitly and reads no clock |
| Contrast at the edges | the `—` for unknowns: **15.15** dune / **16.69** obsidian. The photo caption, the smallest text: above AA in both |
| Without a mouse | index → tab filter → entry → hours, all on real keys |
| The boundary | act 7, in the projection |

---

## What this run proves

**Static output with no React anywhere is real.** 25 packages installed, zero of them React,
both node-tree packages with no dependencies at all; 26 pages of semantic HTML with no inline
style and one module script; three interactive things working on a published file under a
policy that forbids inline everything; 161 text elements at 360px with nothing below AA.

**What it could not do was speak Arabic.** The two defects that mattered were both in the
projection's own floor and both silent: a relative link that vanishes, and a language that
cannot say which way it reads. Neither throws, both render, and both are invisible unless you
read the attributes — which is exactly what this persona was built to do.
