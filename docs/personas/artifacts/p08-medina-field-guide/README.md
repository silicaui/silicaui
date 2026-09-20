# Medina Field Guide

The P08 persona's build: a **static site generator** on `@wizeworks/silicaui-html`, hydrated
by `@wizeworks/silicaui-behaviors`. **No React anywhere** — not in the generator, not in the
output, not in `node_modules`.

## Build and serve

```
npm install
npm run build        # node build.mjs && npm run css
npm run serve        # out/ on :8030, under the real CSP
```

`npm run build` is one command on purpose: `build.mjs` clears `out/` before writing, so the
stylesheet has to be produced **after** it. Running them the other way round serves an
unstyled site, which is how this was first noticed.

## The policy it is served under

```
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:;
font-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none';
frame-ancestors 'self'
```

**Zero violations**, measured across index → entry → disclosure → tabs → carousel. No inline
script and no inline style: `style=` appears 0 times in 26 generated pages, and each page
carries exactly one `<script type="module" src="…/boot.js">`.

Two consequences worth knowing:

- **`font-src 'self'` means webfonts must be self-hosted.** A theme's Google-hosted faces
  will not load, so `dune` renders with its palette and a generic serif.
- **`default-src 'none'` implies `frame-src 'none'`**, so this site cannot be put in an
  iframe — including by a measuring harness.

## Why there is a `src/boot.js`

Loading the behaviours runtime is **not** enough. `@wizeworks/silicaui-behaviors` exports
`hydrate` and never calls it — there is no `DOMContentLoaded` listener in the bundle. Under a
CSP with no `unsafe-inline` you cannot call it from an inline `<script>`, so it needs a real
module file:

```js
import { hydrate } from "./behaviors.js";
hydrate();
```

## What the content deliberately carries

| | |
| --- | --- |
| Arabic beside French **in one heading** | including one Arabic-**first** title, which is the case that breaks without `dir="auto"` |
| `built: null` on six entries | renders as a marked `—` with `aria-label="Date inconnue"`, never as a value, never as `0` |
| `14th c.` / `12th c.` | strings, and never parsed as dates |
| one real date | `31 December 2026, 23:59`, in a `<time datetime>` |
| pasted junk | a `<script>`, an `<iframe>`, an `onerror`, a `javascript:` href and an unclosed `<em>` |

The photographs are SVG placeholders. The foundation supplies the real ones; what is under
test here is the carousel.

## Left to do before this ships

`package.json` points `@wizeworks/silicaui-html` at
**`file:../../../../packages/silicaui-html`** — a real symlink, so it is live and cannot go
stale, but it is not what a customer installs. It is there because issues **034** (relative
URLs deleted) and **035** (no `dir`/`lang`) are fixed in the workspace and not yet in a
published version.

**Re-pin to the published `@wizeworks/silicaui-html` once the changeset ships**, then rebuild
and check two things: that `href="entree/…"` still has its `href`, and that `dir="auto"` is
still on the headings.
