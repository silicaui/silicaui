# 070 — Only the cover of a staff pick was clickable, not its title

**Status:** fixed
**Severity:** major
**Found by:** P04 · Reuben Halloway · act 5, the staff picks
**Surface:** `src/email/starters.ts` — the newsletter starter
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 5 is *"Three cards, three real links."* Reuben filled in his three picks,
gave each one a product URL, and this is what was delivered:

```html
<div class="sui-col" data-col="0" …>
  <a href="https://thornburybooks.co.uk/shop/piranesi" target="_blank">
    <img src="…/piranesi.png" alt="Piranesi — the cover" width="160" … />
  </a>
  <div style="…font-weight:600…">Piranesi — Susanna Clarke</div>
  <div style="…font-size:14px…">£8.99 · Gloucester Road</div>
</div>
```

**One anchor per card, around the cover only.** The title and the price are plain
`<div>`s. Measured across all three:

```
Piranesi                   anchors: 1
Die Vermessung der Welt    anchors: 1
中国北方的情人               anchors: 1
```

People click titles. In a three-column row of book covers at 160px, the title is
also the largest text and the obvious target — and it did nothing.

## What should have happened

The whole card points at the book.

## How to reproduce

1. `http://localhost:5178/?editor=email` → Templates → **Newsletter**.
2. Select one of the three picks' images, set its Link URL, export.
3. Before the fix: only the `<img>` is wrapped in an anchor.

## Why it matters

This is what the "three picks" section of a bookshop newsletter is *for*. Every
pick is a product with a URL, and the click is the only thing the section is
measured on. A card where the picture works and the name does not loses clicks
silently — nothing errors, nothing looks wrong, and the click-through data just
comes back lower than it should with no explanation in it.

**And it was my own defect, from act 1.** The starter I wrote built each pick as
a bare `[image, text, text]`, so the only link an author could set was the
image's own.

## The part that makes it worse

**The palette has shipped exactly the right thing the whole time.** From
`src/email/palette.ts`:

```ts
{
  key: "link-card",
  label: "Linked card",
  hint: "Image + title + price, all pointing at one URL — the product/article card",
  …
  // The shape a `link` group exists for, pre-assembled. Inserting the bare
  // group and then three children in the right order is the same document,
  // four steps later — and getting the nesting wrong (children as SIBLINGS of
  // the link rather than inside it) is the one mistake that produces an
  // unlinked card with no visible symptom on canvas.
```

"Image + title + price, all pointing at one URL" is a description of a staff
pick. The component existed, its doc comment named the exact failure — *"an
unlinked card with no visible symptom on canvas"* — and the starter did not use
it. The starter reproduced the documented mistake by hand.

## The fix

[packages/silicaui-builder/src/email/starters.ts](../../../packages/silicaui-builder/src/email/starters.ts)

A `linkedCard` builder, and the newsletter's three picks now use it:

```ts
const linkedCard = (id, c, alt, title, line): LinkNode => ({
  id: id(), kind: "link", href: "",
  children: [
    image(id, alt, 160),
    text(id, c, title, { fontWeight: "semibold" }),
    text(id, c, line, { fontSize: 14, lineHeight: 20 }),
  ],
});
```

`href` is deliberately empty — a starter cannot know a shop's URLs, and an empty
href links nothing at all rather than emitting `<a href="">`, which is the same
rule [068](068-an-image-with-no-source-fetches-the-message-itself.md) applies to
`src`.

**The projection stays Outlook-safe, and that is the whole reason a `link` group
works this way.** `renderLink` distributes the href onto each child as its own
inline anchor rather than wrapping the group, because an anchor around block
content is invalid in the dialect Word parses and Outlook drops the link
entirely — rendering a card that looks clickable and does nothing. So making the
whole card clickable does **not** introduce the very failure act 5 asks about.

**It also makes the author's job one step, not three.** The destination is set
once on the card instead of per block.

## Confirmed by

The same three picks, built as Reuben, after the fix:

```
Piranesi                   anchors: 3   wraps a block element: false
Die Vermessung der Welt    anchors: 3   wraps a block element: false
中国北方的情人               anchors: 3   wraps a block element: false
anywhere in the document, an anchor around block content: false
```

Three anchors each — cover, title, price — and **no anchor anywhere in the
document wraps a block element**, which is the assertion act 5 actually turns on.

And the rest of act 5's target, measured at the same time:

```
=== 中国北方的情人 in the builder ===
  on the canvas: true
  in the Layers tree: true

=== 中国北方的情人 in the composed HTML ===
  present as real characters:  true
  mangled to entities/escapes: false
  the document declares:       <meta charset="utf-8" />
```

Four checks in `probe-email.ts`, including one that sets a URL on the shipped
starter and counts the anchors end to end:

```
  ✓ the newsletter starter ships three linked picks
  ✓ ...each holding its own cover
  ✓ a pick's whole card is clickable once a URL is set (three anchors, no block wrapper)
```

**Deliberately broken to watch it fail** before restoring:

```
  ✗ the newsletter starter ships three linked picks
  ✗ ...each holding its own cover
  ✗ a pick's whole card is clickable once a URL is set (three anchors, no block wrapper)
  ❌ 4 check(s) failed
              … restored …
  ✅ email engine: all checks passed
```

`pnpm verify` exit 0 workspace-wide, builder e2e **202 passed**, typecheck clean.

## Not checked

**The three mail clients.** Act 5's "done when" includes the CJK title rendering
"in all three clients", which cannot be validated on this machine by agreement.
The builder and the composed HTML are confirmed above; the clients are **not
checked**, not passed.

## Rating effect

`Email builder › Insert` and the email output in [rating.md](../rating.md), once
the email screens are scored.
