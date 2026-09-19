# P08 — Fatima Zahra El Amrani · Medina Field Guide

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

**Status:** not started
**Run:** —
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
| Acts completed | |
| Issues filed | |
| Issues fixed and confirmed | |
| Issues blocked, and on what | |
| Screens scored (in both themes at 360px) | |
| **Not checked** | |

### The numbers

| Record | Result |
| --- | --- |
| Could she find path three from the docs alone? | |
| React references anywhere in the generator or the output | |
| CSP violations in the console under the strict policy | |
| Interactive things that worked on the published page, of three | |
| Page weight and time to readable on throttled 3G | |
| Tags and attributes stripped by the allowlist, of those attempted | |
| Design-rule breaches found | |

---

## Run log

Written act by act **as you go**. Quote the exact words on screen — and quote the
generated markup where the markup is the finding.
