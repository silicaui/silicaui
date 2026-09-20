# 068 — An image with no source was sent as `src=""`, which fetches the message itself

**Status:** fixed
**Severity:** major
**Found by:** P04 · Reuben Halloway · act 4, while reading the exported HTML
**Surface:** the email projector — `renderImage`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Reading act 4's export to check the cover image, the masthead above it read:

```html
<img src="" alt="Your logo" width="160" style="display:block;width:160px;max-width:100%;margin:0 auto" />
```

An `<img>` whose author had not yet set a source projected as `src=""`.

`src=""` is not "no image". It is a **relative URL resolving to the current
document**, so a client that follows it fetches the message itself and tries to
draw the result as a picture. Every subscriber makes a pointless request, and
where the alt text should be there is a broken-image icon instead.

## The part that makes this a good find

**The same function refuses exactly this shape, two lines further down.** From
`renderLink`'s doc comment, already in the file:

> An empty/whitespace `href` distributes nothing — an author who has added the
> group but not yet the URL (or a `value` bind that resolved empty) gets plain
> unlinked content, **never `<a href="">`, which some clients resolve to the
> message itself.**

The hazard is named, the reasoning is written out, the guard is implemented —
and the `<img>` immediately above it did not have it. Not a different file, not a
different author's area: `renderImage` and `renderLink` are adjacent functions,
and `renderImage` itself already does the href half correctly:

```ts
const href = node.href || link;
return href ? `<a href="${esc(href)}" target="_blank">${img}</a>` : img;
```

Guarded on the next line. Unguarded on the one before it.

## What should have happened

An image with no source makes no request and shows its alt text.

## How to reproduce

1. `http://localhost:5178/?editor=email` → any template with an image the author
   has not filled in (every starter has one — a masthead logo).
2. Export. Before the fix: `<img src="" …>`.

## Why it matters

Half of this is a privacy and deliverability problem: a spurious fetch from
every recipient, to a URL that is whatever the client thinks the message's own
address is. Spam filters read image requests, and a message that makes a request
to itself is the kind of thing that moves a sender's reputation for no benefit.

The other half is that it happens by default. **Every starter ships a masthead
image with no source**, because a starter cannot know what a shop's logo URL is.
So the shape is not an edge case an author has to work at — it is what the
product does the first time anybody uses it and does not notice the logo.

## Where it lives

[packages/silicaui-builder/src/email/projector.ts](../../../packages/silicaui-builder/src/email/projector.ts) — `renderImage`

```ts
const img = `<img src="${esc(node.src)}" alt="${esc(node.alt)}" …`;
```

## Do the siblings have it too?

| | |
| --- | --- |
| `renderLink` / the group href | **correct** — guarded, and the reasoning is written down |
| `renderImage`'s own href | **correct** — `href ? … : img` |
| `renderImage`'s `src` | **the defect** |
| `renderVideo`'s `thumbnail` / `href` | checked: a video node requires both at authoring time and neither can be blank through the Inspector. Not the same case, and left alone |

## The fix

The attribute is omitted rather than emitted empty:

```ts
const src = node.src?.trim() ? ` src="${esc(node.src)}"` : "";
const img = `<img${src} alt="${esc(node.alt)}" width="${node.width}"…`;
```

**Dropping the whole `<img>` was considered and rejected.** The alt text is
content the author wrote, and an element that silently vanishes from the send is
this framework's **"absence behaves like fine"** — the email would look
plausible and be missing something nobody could see was missing. With no `src`
attribute, a client shows the alt text, which is exactly what an image with no
source should show, and is the same thing every subscriber with images turned off
sees anyway.

## Confirmed by

The real export from act 4, after the fix:

```
empty-src images in the whole document: 0
<img alt="Your logo" width="160" style="display:block;width:160px;max-width:100%;margin:0 auto" />
```

No `src`, alt text intact.

Three checks added to `probe-email.ts`, including a **control that a real source
is still emitted untouched** — a fix that dropped every `src` would pass the
first two:

```
  ✓ an image with no source emits NO src attribute
  ✓ ...and keeps its alt text rather than vanishing
  ✓ a real source is untouched
```

**Deliberately broken to watch it fail** before being restored:

```
  ✗ an image with no source emits NO src attribute
  ❌ 3 check(s) failed
          … restored …
  ✅ email engine: all checks passed
```

`pnpm verify` exit 0 workspace-wide, builder e2e **202 passed**, typecheck clean.

## Also recorded, not fixed

**Nothing tells the author the image is empty.** The builder knows — the node has
no `src` — and says nothing, in the Navigator, the Inspector or on export. It is
the same shape as [066](066-a-merge-token-nobody-resolves-is-delivered-as-typed.md):
information already in the component's hand that nothing draws. 066 fixed it for
merge tokens; the equivalent row for "this image has no source, and will arrive
as its alt text" is a deduction against `Email builder › Inspector`.

**The Layers tree calls every image `Image`.** Found while trying to select the
lead cover: with a masthead, a lead cover and three staff picks, an author sees
five identical rows named `Image` and has to count. Every text block shows its
own copy in the row; an image shows a type name, even though it has `alt` text
written specifically to describe it. Same shape as P03's
[051](051-nothing-told-her-what-her-pages-were-called.md). Recorded here, and
act 5 builds the three staff picks, so it is measured there rather than guessed
at here.

## Rating effect

`Email builder › Navigator` and `Email builder › Inspector` in [rating.md](../rating.md),
once the email screens are scored.
