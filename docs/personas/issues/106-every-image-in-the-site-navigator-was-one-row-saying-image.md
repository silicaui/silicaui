# 106 — Every image in the site Navigator was a row saying "Image", and the email Navigator had already fixed it

**Status:** fixed
**Severity:** minor
**Found by:** P03 · act 10 follow-up, working P04's recorded-not-fixed list
**Surface:** `@wizeworks/silicaui-builder` — the site builder's Layers rail
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

P04 wrote this against the **email** builder during act 4:

> **Recorded, not fixed:** the Layers tree names every image `Image`. Selecting
> the lead cover meant counting past the masthead.

It fixed it in act 5 ([069](069-five-images-five-rows-all-called-image.md)), and the
comment it left behind quotes the rule from the **site** Navigator's own source
while doing so:

> `alt` is precisely that for an image, and this function never used it.

The site Navigator was never changed. Its rule is stated in as many words in
`node-display.ts`:

> The label for a Navigator row — the layer name if the author set one, else the
> words the node actually holds, else the name it declares, else its type.
> **Content leads** because that is what a person recognizes when scanning for
> "the Pricing link".

and `declaredName` — the "name it declares" step — read `aria-label` and nothing
else. An `<img>` has no text child and rarely has `aria-label`, so every image in
a tree fell through to its type and came out as one row saying `Image`.

Read off the running builder, the harness's own page:

```
Navigator rows          canvas images
  Page                    alt=""
  Section                 alt=""
  Ship your store in…     alt=""
  Everything you need…    alt="Product preview"
  Start free
  Book a demo
  Avatar group
  Avatar
  Avatar
  Avatar
  Trusted by 12,000+…
  Image                 <- the one with alt text, and it says nothing
```

Eleven rows naming their content, and the twelfth — the only one whose alt text
was written to say what it is — saying `Image`.

## Why it matters

It is the "a fix leaves its neighbour behind" shape, twice over: P04 recorded the
site half as out of scope, and the fix's own comment names the file it did not
touch.

And it defeats the thing the rail was rebuilt for. The Navigator was made
content-first on purpose — plain-English types, the author's words, the content
before the tag — so a non-technical author can find "the picture of the studio"
by reading rather than by counting. Images are the nodes that most need it,
because an image is the one kind of node whose content a text rail cannot show.

`minor` because nothing breaks and the author can still select on the canvas.

## Where it lives

[packages/silicaui-builder/src/site/node-display.ts](../../../packages/silicaui-builder/src/site/node-display.ts) — `declaredName`

## The fix

`declaredName` reads `alt` as well as `aria-label`, for elements and for
components alike — an `Image` macro and an `<img>` are the same thing to the
person scanning the rail.

`alt` **is** an image's accessible name, which is exactly the argument the
function's own comment already made for `aria-label`: *"Not a guess: `aria-label`
IS this element's name, to a screen reader and now to the author too."*

## Confirmed by

The same rail, on the same page:

```
before   "Image"
after    "Product preview"
```

**Two controls, because one direction proves nothing:**

```
CONTROL  image with alt "Product preview" -> a row names it: yes  ok
CONTROL  3 image(s) have no alt; rows falling back to a TYPE label: 3
CONTROL  no row came out blank: yes  ok
```

The second control was wrong on its first attempt and is recorded rather than
quietly replaced. It asserted that an alt-less image must still read `"Image"` —
but the three alt-less images on this page are **Avatar components**, whose
correct fallback is their own type label, `Avatar`. The check would have failed a
correct fix. It now asks the real question: does an image with no alt still fall
back to a type label, and is any row left blank.

## Rating effect

`Site builder › Layers (Navigator)` in [rating.md](../rating.md) — scored 7/7 in
P03's act 10, and this is one of the two things in its Ease gap.
