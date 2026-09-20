# 034 — `toHtml` silently deleted every plain relative URL, so a static site's links and images vanished

**Status:** fixed
**Severity:** major
**Found by:** P08 · Fatima Zahra El Amrani · act 2
**Surface:** `@wizeworks/silicaui-html` › `src/element.ts`, `isSafeUrl`
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 2 is "project the smallest tree and **read** the markup." Reading it is what caught this.

A static generator writes relative paths: `photos/chellah.jpg`, `entree/chellah/`,
`chellah.html`. Every one of them came out with the attribute **gone**:

| written | emitted |
| --- | --- |
| `<a href="entree/chellah/">` | `<a>` |
| `<img src="photos/chellah.jpg">` | `<img>` |
| `<a href="chellah.html">` | `<a>` |
| `<img src="assets/img/a.png">` | `<img>` |

And the forms that *did* survive make the shape of the bug obvious:

| kept | dropped |
| --- | --- |
| `./photos/a.jpg` | `photos/a.jpg` |
| `../photos/a.jpg` | `chellah.jpg` |
| `/photos/a.jpg` | `entree/x/` |

**`./photos/a.jpg` and `photos/a.jpg` are the same URL.** One survived and one did not.

## What should have happened

The function's own comment says what the rule is meant to be:

> *"A schemeless (relative/anchor/query) URL is always safe — it can't leave the origin."*

That is correct, and the implementation did not do it:

```js
if (value.startsWith("/") || value.startsWith("#") || value.startsWith("?") || value.startsWith(".")) return true;
return SAFE_SCHEME.test(value);
```

Four literal prefixes, then a scheme test. A plain relative path matches neither, so it fell
through to the scheme test, failed, and was dropped.

## How to reproduce

```js
toHtml({ kind: "element", tag: "a", attrs: { href: "photos/a.jpg" }, children: ["x"] })
// → <a>x</a>
```

## Why it matters

**It fails silently, and the page still renders.** An `<img>` with no `src` draws a broken-image
icon; an `<a>` with no `href` still looks like a link, still has the link styling, and does
nothing when clicked. Nothing throws, nothing warns, and the generated HTML looks almost
right — you have to read the attributes to see it.

It lands hardest on exactly the path this package is for. A React app writes routes through a
router and a bundler rewrites asset URLs, so both tend to come out rooted. **A static
generator writes relative paths by hand**, because that is what makes an `out/` directory
movable — deployable to a subpath, openable from the filesystem. This persona's entire build
is 26 pages of them.

## Do the siblings have it too?

**No — `isSafeUrl` is the only URL check in the package** (`grep` for `SAFE_SCHEME`
/`isSafeUrl` returns one implementation, used from one place). `embed.ts` has its own,
stricter rule for third-party player URLs, which is correct for what it does and was left
alone.

## The fix

Ask the question the comment always described: **does this URL have a scheme at all?**

```js
if (!SCHEME_PREFIX.test(probe)) return true;   // schemeless ⇒ relative ⇒ cannot leave the origin
return SAFE_SCHEME.test(probe);
```

with `SCHEME_PREFIX = /^[a-zA-Z][a-zA-Z0-9+.\-]*:/` — RFC 3986's definition, which is why
`photos/a:b.jpg` reads as relative (the colon is inside a path segment) while
`javascript:alert(1)` does not.

**Widening the rule opened a hole that had to be closed in the same change.** The old code
was safe against whitespace tricks *by accident*: it dropped everything it did not recognise,
so `" javascript:alert(1)"` and `"java\nscript:alert(1)"` fell out with everything else. Once
schemeless values are accepted, those become schemeless-looking and would have been let
through. The URL parser strips tab/LF/CR from anywhere in a URL and trims C0-plus-space at
the ends, so both are `javascript:` URLs to a browser.

The test is therefore run against a copy with ASCII whitespace and control characters
removed. **The original string is what gets emitted** — the stripped copy only decides.

## Confirmed by

**A new probe, `verify-url-floor.mjs`, wired into `pnpm verify`.** 30 values × 2 attributes
(`href` and `src`), each asserted kept or dropped:

```
✅ url floor: 30 values × 2 attributes, all correct
```

**Proved by breaking it:** `isSafeUrl` reverted to the old version → **10 cases go red**, all
of them relative paths, and the probe names each one. Restored → green.

The dangerous half is pinned in the same file, because a fix that let relative URLs through
by loosening the scheme check would pass the first half and fail here:
`javascript:` (and mixed case), `data:`, `vbscript:`, `file:`, `a:b/c.jpg` (RFC 3986 allows a
single-letter scheme), the empty string, and six whitespace/control-character variants —
including `java\nscript:alert(1)`.

**One of my own expectations was wrong and the code was right.** The first run of the table
failed on `a:b/c.jpg`, which I had written down as "should be kept — a colon after a path
character is not a scheme." It is a scheme: RFC 3986 allows a one-letter scheme name. The
expectation was corrected, not the code, and the case is kept in the probe because it is the
one that looks relative and is not.

`golden.mjs` — the byte-exact projection fixture — is **unchanged**, so nothing that already
worked moved.

**On the build it was found on:** 26 generated pages, every `href="entree/<slug>/"` and
`src="../../photos/…"` present, and the whole journey walked in a browser — index → entry →
hours → filter → photos.

## Rating effect

None — this is the projection, not a screen.
