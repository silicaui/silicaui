---
"@wizeworks/silicaui-builder": minor
"@wizeworks/silicaui-mcp": minor
---

Per-item links inside an email `collection` repeat — a `link` group node — and MCP
coverage for the email schema.

**`{ kind: "link"; href; children: ContentNode[] }`.** Every email node carries at most
one `data` marker, so inside a repeat an `image` could bind its `src` **or** its `href`,
never both, and a `text` node has no `href` at all — a link inside copy is inline `<a>`
markup, a literal string identical on every item. A rail of product cards was therefore
either unclickable images or one CTA sending everyone to the same page. One marker per
node stays the rule; the fix is composition, the same move the site engine makes with its
link box: the group holds the destination, so its `href` binds per item while each child
keeps its own marker for its own field.

`href` is the kind's only field and its default bind target, so a whole rail is three
markers: `collection` on the section, `value → item.url` on the group, and each child's
own. It holds content only — a nested `link` would mean nested anchors, and a nested
`columns` row would put table markup inside a group whose job is to lower into inline
anchors. Both are type errors, and `canHold` mirrors them.

**It does not project as one `<a>`.** An anchor around block-level content is invalid in
the HTML dialect Outlook's Word engine parses, and Outlook drops it: the card renders,
looks clickable, and does nothing, with no symptom in the markup or a webmail preview. So
the group emits no element at all and distributes the destination onto each child's own
inline anchor — an image becomes `<a><img></a>`, a text block's copy is wrapped with
`color:inherit;text-decoration:none` (a card title that happens to be clickable is not a
link inside a sentence). Both forms are bulletproof everywhere. The trade is stated rather
than hidden: the card's content is clickable, the padding around it is not. Explicit beats
inherited in both directions — a child with its own `href` keeps it, and copy that already
contains an `<a>` is never re-wrapped. An empty `href` distributes nothing, never
`<a href="">`.

Insert → **Linked card** drops a group already holding image + title + price; **Link
group** is the empty one. On canvas a group draws a persistent boundary and link glyph,
because it is invisible in the output and "children inside it" versus "siblings after it"
otherwise looks identical — the one mistake that produces a silently unlinked card.
`canHold` and `EMAIL_BINDABLE_FIELDS` are now exported: both are contracts a host
building its own drag layer or binding UI would otherwise have to re-derive, differently.

**MCP: `list_email_nodes` / `get_email_node`.** The catalog covered the three delivery
paths and said nothing about the email builder's document schema — the one surface with no
other source of truth, where an invented kind or an illegal nesting is dropped silently
with no error to read. Both tools are generated, never described: fields and doc comments
from the TypeScript AST, the nesting matrix by calling the real `canHold` on every
(parent, child) pair, the bind allowlist from `EMAIL_BINDABLE_FIELDS`, the presets from
`EMAIL_PALETTE` with each `make()` actually invoked. `search_docs` reaches node kinds and
the document envelope, and the routing preamble now says email is a separate surface
rather than a fourth path.
