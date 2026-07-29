# Email link groups — per-item links inside a `collection`

How a repeated card in an email deep-links to *its own* record: a product rail
where each thumbnail opens its own PDP, a "more to read" grid where each card
opens its own article.

## The gap this closes

Every email node carries **at most one** `data` marker. Inside a `collection`
repeat that was enough for a per-item *value* but not for a per-item *card*:

- an `image` could bind its `src` (from `item.imageUrl`) **or** its `href`
  (from `item.url`) — never both, because that's two markers on one node;
- a `text` node has no `href` field at all. A link inside copy is authored as
  inline `<a>` markup, which is a literal string and therefore identical on
  every repeated item.

So a rail was either a wall of unclickable images or one section-level button
that sends everyone to the same landing page.

One marker per node stays the rule — it's what keeps a binding readable and
what every consumer of `node.data` is written against. The fix is
**composition**, the same move the site engine makes with its link box: a node
that holds the destination, so its `href` binds per item while each child keeps
its own marker for its own field.

## The node

```ts
interface LinkNode {
  kind: "link";
  href: string;             // bindable per item
  children: ContentNode[];  // e.g. an image + a title + a price
}
```

It is a `LayoutChild`, so it goes anywhere a content block goes — directly in a
`section` or inside a `column`. It holds **content only**: a nested `link` would
mean nested anchors, and a nested `columns` row would put block-level table
markup inside a group whose whole job is to lower into inline anchors. Both are
type errors, and `canHold` mirrors them at runtime.

Authoring: **Insert → Linked card** drops a group already holding an image, a
title, and a price. **Insert → Link group** is the empty one. On canvas a group
draws a persistent hairline boundary and a link glyph — it emits nothing in the
sent HTML, so without that mark an author can't tell a card's blocks are *inside*
the group rather than siblings after it, which is the one mistake that produces
a silently unlinked card.

## Binding it

`href` is the kind's only field and its default bind target, so these are the
same:

```ts
data: { kind: "value", ref: "product.url" }
data: { kind: "value", ref: "product.url", attr: "href" }
```

A whole rail, then, is three markers on three nodes:

```
section   data: { kind: "collection", ref: "products" }   ← repeats
└ link    data: { kind: "value", ref: "product.url" }     ← per-item destination
  ├ image data: { kind: "value", ref: "product.image" }   ← per-item src
  └ text  data: { kind: "value", ref: "product.title" }   ← per-item copy
```

Filling a container's bound field never strands the bindings inside it — the
resolver walks the children afterwards, so the link's `href` and the children's
own fields all resolve on the same pass.

## How it projects — and why not as one `<a>`

The obvious lowering is to wrap the card in a single anchor. **That is exactly
what fails in email.** An `<a>` around block-level content (a table, a `<div>`)
is invalid in the HTML dialect Outlook's Word engine parses, and Outlook drops
the link: the card renders, looks clickable, and does nothing. Nothing in the
markup or in a webmail preview reveals it.

So the group emits **no element of its own**. The projector distributes the
destination onto each child that can carry one:

| child | what it gets |
|---|---|
| `image` | wrapped in `<a href=…><img></a>` |
| `text` | its copy wrapped in `<a href=… style="color:inherit;text-decoration:none">` |
| `button`, `video`, `social` | untouched — they are links already |
| `divider`, `spacer`, `html` | untouched |

Both emitted forms are plain inline anchors: bulletproof in every client,
Outlook included.

**The trade, stated plainly:** the card's *content* is clickable; the padding
and gaps around it are not. That is the honest ceiling of email link support,
and it beats a whole-card hit area that evaporates in Outlook.

Two precedence rules, both "explicit beats inherited":

- a child with its own `href` keeps it — a "Buy now" button inside a card still
  goes where its own `href` says;
- copy that already contains an `<a>` is never re-wrapped (nested anchors are
  invalid, and the inner link is the one that would fire anyway).

An empty or whitespace `href` distributes nothing — never `<a href="">`, which
some clients resolve to the message itself. The children render unlinked, which
is also what an author sees before they've filled the URL in.

## Styling

The text anchor inherits its ink and drops the underline on purpose: a card
title that happens to be clickable is not a link inside a sentence, and email
clients paint any unstyled anchor their own hyperlink blue. An author who wants
it to *read* as a link sets the text color themselves. `TextNode.linkColor`
still applies to the author's own inline anchors and is applied before the
group wrap, so the two never fight.

## Verification

- `pnpm --filter @wizeworks/silicaui-builder verify:email` — structural rules,
  distribution, precedence, the empty-href case, and a full two-item repeat
  where each card links to its own URL while its image binds its own `src`.
- `e2e/email-collection-links.spec.ts` — the same rail built through the real
  UI, asserted against the **exported** HTML rather than the canvas.
