---
"@wizeworks/silicaui-html": patch
---

Fix the element floor: plain relative URLs survive, and text direction is expressible

Found by the P08 persona run — a documentation engineer generating a static heritage guide
in Arabic, French and English, with no React anywhere. Two defects in `toHtml`'s security
floor, both silent, both landing hardest on the path the package exists for.

**Every plain relative URL was deleted.** `isSafeUrl` allow-listed four literal prefixes
(`/`, `#`, `?`, `.`) and dropped everything else, so `./photos/a.jpg` survived while
`photos/a.jpg` — the same URL, and the form a static generator writes — did not. Nor did
`chellah.html` or `entree/x/`. The attribute vanished and the page still rendered: an `<img>`
with no `src`, an `<a>` that looks like a link and goes nowhere. The function's own comment
had always described the correct rule — *"a schemeless (relative/anchor/query) URL is always
safe — it can't leave the origin"* — so the check now asks that question directly, with RFC
3986's scheme definition.

Widening it opened a hole that is closed in the same change: the old code was safe against
`" javascript:alert(1)"` and `"java\nscript:alert(1)"` only by dropping everything it did not
recognise. The URL parser strips tab/LF/CR from anywhere in a URL, so the safety test now
runs against a copy with ASCII whitespace and control characters removed. The original string
is what gets emitted.

**`dir`, `lang`, `translate`, `<bdi>` and `<bdo>` were all stripped**, so the projection could
not say which way a line reads. That is not a blank — it is a reversal: measured in a 360px
box, an Arabic-first line put its Arabic run at x=0–57 without `dir` and at x=303–360 with
`dir="auto"`, with the neutral characters (the em-dash, the slash) landing on the wrong side.
Every character present, assembled backwards, and invisible to a reader who cannot read the
script. All five are inert metadata — no URL, no script surface — the same category as the
`aria-*`/`data-*` prefixes the floor already allows by construction.

Two new probes wired into `pnpm verify`, each watched fail before being trusted:

- `verify-url-floor.mjs` — 30 URL values × `href` and `src`. Reverting `isSafeUrl` turns 10
  red. The dangerous half is pinned in the same file (`javascript:`, `data:`, `vbscript:`,
  `file:`, a one-letter scheme, and six whitespace/control-character variants), so a fix that
  let relative URLs through by loosening the scheme test fails here.
- `verify-i18n-floor.mjs` — the five i18n forms survive **and** `style`/`on*`/`srcdoc` are
  still dropped and `<script>`/`<iframe>`/`<object>`/`<style>`/`<base>` still downgrade.
  Reverting `GLOBAL_ATTRS` turns 7 red.

`golden.mjs` is byte-identical throughout, so nothing that already worked moved. No class
name, token name, prop or public export changed.
