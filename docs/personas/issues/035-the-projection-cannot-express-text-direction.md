# 035 — The node tree could not express text direction or language at all, so mixed Arabic/French rendered backwards

**Status:** fixed
**Severity:** major
**Found by:** P08 · Fatima Zahra El Amrani · act 3
**Surface:** `@wizeworks/silicaui-html` › `src/element.ts`, the element floor
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** see below
**Blocked on:** —

## What happened

The guide is published in Arabic, French and English, and roughly half the content is
right-to-left Arabic **sitting inside a left-to-right French sentence** — in the same
heading, in the same paragraph. The correct markup for that is `dir`, plus `lang` for the
language and `<bdi>` to isolate a run whose direction is not known in advance.

Every one of them was stripped:

| authored | emitted |
| --- | --- |
| `<p dir="auto">` | `<p>` |
| `<p dir="rtl">` | `<p>` |
| `<p lang="ar">` | `<p>` |
| `<p translate="no">` | `<p>` |
| `<bdi>شالة</bdi>` | `<div>شالة</div>` |
| `<bdo dir="rtl">شالة</bdo>` | `<div>شالة</div>` |

`dir`, `lang` and `translate` were not in `GLOBAL_ATTRS` and not in any per-tag list, so they
were dropped. `bdi` and `bdo` were not in `RAW_ELEMENTS`, so they downgraded to `<div>`.

**There was no way to say "this line is right-to-left".**

## What should have happened

`GLOBAL_ATTRS`' own comment already draws the line these sit on the right side of:

> *"`aria-*` and `data-*` are handled separately, by PREFIX … both namespaces are safe by
> construction (inert metadata, never parsed as a URL or executed as code)"*

`dir`, `lang` and `translate` are the same category. None carries a URL, none is executed,
and the worst a hostile author does with them is misrender their own text. `<bdi>`/`<bdo>`
are pure text-layout elements with no script and no embedding surface.

## How to reproduce

```js
toHtml({ kind: "element", tag: "h1", attrs: { dir: "auto" }, children: ["باب الحد — Bab el-Had"] })
// → <h1>باب الحد — Bab el-Had</h1>
```

## Why it matters — measured, not asserted

The failure is **not** a blank. All the text renders; it renders in the wrong order.

Measured in a 360px box, the same Arabic-first string, reading each run's actual pixel
position off a `Range`:

| | where the Arabic sits | where the Latin sits |
| --- | --- | --- |
| no `dir` (inherits the page's LTR) | left **0 – 57** | left **57 – 233** |
| `dir="auto"` | left **303 – 360** | left **127 – 303** |
| `dir="rtl"` | identical to `auto` |

Without `dir`, the bidi algorithm takes the paragraph direction from the document — LTR — and
lays an Arabic sentence out left-aligned with its neutral characters (the em-dash, the slash,
the comma at the script boundary) on the wrong side. With it, the line is right-aligned and
reads correctly.

That is the expensive kind of broken: nothing is missing, nothing errors, and a reader who
cannot read Arabic will not notice. A reader who can sees a sentence assembled backwards.

## Do the siblings have it too?

**`lang` and `translate` were the same one-line absence** and are fixed together: a proper
noun that machine translation must leave alone (`Chellah`, `شالة`) had no way to say so
either, and a screen reader had no way to switch voice for the Arabic run.

Checked and **not** affected: the React path, which passes `dir`/`lang` straight through as
ordinary JSX attributes, and the CSS path, which is the author's own markup. This is
specific to the node-tree projection — the one path whose whole purpose is generated
documents, which is where multilingual content comes from.

## The fix

Three attributes added to `GLOBAL_ATTRS`, two tags added to `RAW_ELEMENTS`. Nothing else.

## Confirmed by

**A new probe, `verify-i18n-floor.mjs`, wired into `pnpm verify`**, and it pins both halves:

```
✅ i18n floor: direction and language are expressible, and nothing unsafe opened with them
```

- `dir` (`auto`/`rtl`/`ltr`), `lang` (`ar`, `fr-MA`), `translate="no"` all survive
- `<bdi>` and `<bdo dir="rtl">` render as themselves
- the mixed string passes through byte-for-byte — no normalisation, no escaping of the
  Arabic, no mangled em-dash
- **and** `style`, `onclick`, `onload`, `srcdoc`, `formaction` are still dropped, and
  `<script>`, `<iframe>`, `<object>`, `<embed>`, `<style>`, `<base>` still downgrade

That second group is the point of the file: a widening that also let `style` through would
pass the first half.

**Proved by breaking it:** `GLOBAL_ATTRS` reverted to its six original entries → **7 checks
go red**, naming each dropped attribute. Restored → green.

`golden.mjs` unchanged, `verify-csp.mjs` unchanged, `verify-url-floor.mjs` unchanged.

**On the guide it was found on:** an Arabic-first entry was added to the content —
`باب الحد — Bab el-Had, la porte du dimanche` — precisely because every other title happened
to start with Latin and so hid the bug. Served under the strict CSP, its heading now renders
right-aligned with the Arabic at the right edge, and `dir="auto"` appears 48 times across the
generated index.

## Recorded, not filed: webfonts under a strict CSP

`font-src 'self'` means a preset's Google-hosted type faces cannot load; they have to be
self-hosted. Nothing is broken — the stack falls back to generic `serif` — but a theme's
character is partly its type, so a CSP-strict consumer gets a theme's palette without its
face unless they host the fonts themselves. Measured and written down here rather than filed,
because it is a hosting decision, not a defect.

## Rating effect

None — this is the projection, not a screen.
