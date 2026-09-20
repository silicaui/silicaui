# 069 — Five images, five rows, all of them called "Image"

**Status:** fixed
**Severity:** major
**Found by:** P04 · Reuben Halloway · act 5, while trying to select one of three staff-pick covers
**Surface:** Email builder › Layers
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

The Dispatch has five images: a masthead wordmark, the lead review's cover, and
three staff-pick covers. Opening Layers to select one:

```
rows named exactly "Image": 5, and they are 1 distinct name(s)
```

Five rows. One name between them. To reach the Piranesi cover rather than the
masthead, Reuben has to count.

**And every one of them already carries a sentence describing itself.** The
starter ships real `alt` text and he had written more — `Piranesi — the cover`,
`中国北方的情人 — the cover` — and the row showed none of it.

The same rail, at the same moment, named the text blocks by their own copy:

```
"More this week"   "The lead story headline"   "One line."
```

So content-first naming was already the rule. Images were simply not included in
it.

## What should have happened

A row says which image it is.

## How to reproduce

1. `http://localhost:5178/?editor=email` → Templates → **Newsletter**.
2. Open Layers. Before the fix: `Image` ×5.

## Why it matters

The Navigator is how you reach anything that is not currently visible, and in an
email — a single scrolling column with five pictures in it — it is the only
structural view there is. A rail where a fifth of the rows are the same word
makes the author fall back to clicking around the canvas and hoping, which is
exactly what a tree is for avoiding.

It also wastes information the product already asked for and already has. `alt`
is not a guess at a name: it is the sentence the author wrote to say what this
picture is, for every subscriber whose client blocks images. Using it as the row
label costs nothing and is more accurate than anything the builder could invent.

## Do the siblings have it too?

**No — the site builder gets this right, states the principle, and the email
builder never inherited it.** From `src/site/node-display.ts`:

> The label for a Navigator row — the layer name if the author set one, else
> **the words the node actually holds, else the name it declares**, else its
> type. **Content leads because that is what a person recognizes when scanning**
> for "the Pricing link"; the row's glyph already carries the type, so it is not
> repeated as text.

and, on reading an element's `aria-label` for controls that hold no text of their
own:

> An icon-only control holds no text, so without this a header's theme toggle and
> its menu toggle are two rows both reading "Button" — and the markup already
> answers which is which. **Not a guess: `aria-label` IS this element's name**,
> to a screen reader and now to the author too.

That is this defect, described in advance, in the twin. `alt` is to an image
exactly what `aria-label` is to an icon button. The email `nodeName` handled
`text` and `button` and fell through to the kind label for everything else.

This is the recurring **"a fix leaves its neighbour behind"** shape, and a
notably clear instance: not just the fix but the *reasoning* was already written
down, one directory across.

## The fix

[packages/silicaui-builder/src/email/node-display.ts](../../../packages/silicaui-builder/src/email/node-display.ts) — `nodeName`

```ts
if (node.kind === "image") return node.alt.trim() ? truncate(node.alt.trim()) : "Image";
if (node.kind === "link") {
  const href = node.href?.trim().replace(/^https?:\/\//, "") ?? "";
  return href ? truncate(href) : "Link";
}
```

**Link groups got the same treatment**, because act 5 turned the three picks into
them ([070](070-only-the-cover-of-a-staff-pick-was-clickable.md)) and a column of
rows reading `Link` is the identical defect one node kind over. A link holds no
words of its own, so its destination is the only thing that tells one from the
next. The scheme is dropped — it is the same on every row and costs eight
characters of a 32-character line.

**Truncation at 32 characters**, matching the site Navigator exactly, so the two
rails behave alike rather than drifting. Applied to text and button labels too,
which previously ran to any length.

**Every fallback is kept.** An image with no alt is still `Image`; a link with no
destination is still `Link`. The row never goes blank.

## Confirmed by

The same section of the same email, before and after.

Before:

```
"Columns" "Column" "Image" "First pick" "One line."
                   "Column" "Image" "Second pick" "One line."
                   "Column" "Image" "Third pick" "One line."
```

After, with his real content in:

```
"Columns"
"Column"  "thornburybooks.co.uk/shop/pirane…"  "Piranesi — the cover"
          "Piranesi — Susanna Clarke"          "£8.99 · Gloucester Road"
"Column"  "thornburybooks.co.uk/shop/die-ve…"  "Die Vermessung der Welt — the co…"
          "Die Vermessung der Welt — Daniel…"  "£11.50 · Clifton"
"Column"  "thornburybooks.co.uk/shop/zhongg…"  "中国北方的情人 — the cover"
```

Every row now says what it is, including the CJK title, which renders correctly
in the rail.

Five checks in `probe-email.ts`, including **both fallbacks and the truncation**
— a fix that only handled the happy path would pass a single assertion:

```
  ✓ an image row is named by its alt text
  ✓ an image with no alt still falls back to the kind label
  ✓ a link group is named by where it points, without the scheme
  ✓ a link with no destination yet still falls back to the kind label
  ✓ a long name is truncated to one scannable line
```

**Deliberately broken to watch it fail** before restoring:

```
  ✗ an image row is named by its alt text
  ❌ 4 check(s) failed
              … restored …
  ✅ email engine: all checks passed
```

`pnpm verify` exit 0 workspace-wide, builder e2e **202 passed**, typecheck clean.

## A reading that was withdrawn

While chasing this I reported that **a block inside a Link group loses its
Settings fields** — no Image URL, no Alt text. It was **false and is withdrawn**.
The probe walked `.tree-node` by index, and selecting a Link row re-renders the
tree, so the next index-based click landed on a different row; the Inspector was
correctly showing that other node. A control on the lead cover — an image *not*
inside a link group — is what exposed it. Both routes to an image inside a link
group work:

```
route A: clicking the pick's cover on the canvas
  selected: "First pick"      fields: ["Image URL","Link URL","Alt text","Unlocked"]
control: the lead cover, not inside a Link group
  selected: "Lead story image" fields: ["Image URL","Link URL","Alt text","Unlocked"]
route B: the Layers row
  selected: "First pick"      fields: ["Image URL","Link URL","Alt text","Unlocked"]
```

## Rating effect

`Email builder › Navigator` in [rating.md](../rating.md), once the email screens
are scored.
