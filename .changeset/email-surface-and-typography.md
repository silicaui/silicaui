---
"@wizeworks/silicaui-builder": minor
---

Email: head injection, section cards, outline buttons, tinted auto-colors, section align, link color

Six gaps in the email vocabulary, each of which forced a workaround in real
template work. All are additive — a document that sets none of these projects
byte-for-byte the markup it did before.

**`<head>` injection.** `toEmailHtml` emitted a fixed `<head>` no caller could
reach, which put webfonts and any client-hack CSS out of reach entirely. The
second argument now also accepts `{ resolver, head }` (the bare positional
resolver still works and is not deprecated), where `head` carries `css`, `meta`,
and `raw`, all emitted last so a caller can override what we generate.

The two things nearly every sender wanted from that hook are **not** in it,
deliberately — they're schema, so they travel with the document and are editable
in the Inspector rather than living as strings at a render call site:

- `EmailBody.webFonts` — `@font-face` declarations, with the families prepended
  to the body font stack and `EmailBody.fontFamily` kept as the fallback. Emitted
  inside `@media screen` so Outlook's Word engine can't half-see a font it can't
  load and drop the whole email to Times New Roman. Reach is Apple Mail, iOS
  Mail, Outlook for Mac, and Samsung Mail; everywhere else falls back. Link a
  hosted file rather than embedding one — Gmail clips messages over ~102KB, and
  a data-URI font blows through that alone.
- `EmailBody.colorScheme` — emits the `color-scheme` /
  `supported-color-schemes` meta pair and the matching `:root` rule. Apple Mail
  and Outlook for Mac honour it; Gmail and Outlook.com invert on their own terms
  regardless, so dark mode is progressive enhancement, not a design to rely on.

**Section box decoration.** `SectionNode` gains `radius`, `borderColor` /
`borderWidth`, and `marginX` / `marginY`. Setting any of them promotes the
section from a bare `<tr><td>` to a nested-table card: the outer cell carries the
margin as padding (a `<td>` can't take real margin in Outlook) and the inner
table owns fill, border, and radius. Replaces hand-balancing a rounded `<div>`
across an open/close pair of raw `html` nodes. Corners are square in Outlook
desktop — the normal degradation for rounded email cards.

**Per-node auto-color roles.** Auto-tracked colors were pinned to one role per
node KIND, so anything but the blessed role had to be frozen to a literal hex —
which is why a tinted card or footer stopped following the tenant's theme. Each
auto field now takes a per-node role override (`bgRole`, `colorRole`,
`borderColorRole`, …) spanning all of `EmailColorDefaults`, so a `base200` card
and a `primary` hero band both keep tracking the palette. In the Inspector,
picking a theme swatch now **tracks that role**; only the custom picker freezes a
hex. An unknown role falls back to the kind default rather than repainting to
`undefined`.

**Button outline variant.** `ButtonNode.variant` plus `borderColor` /
`borderWidth`. An outline button drops the `bgcolor` attribute entirely (there is
no transparent `bgcolor` value) and paints `background:transparent`, so the
section behind shows through in every client including Outlook. Switching
variants repoints the label color between `primaryContent` and `primary` while
it's still theme-tracked, since white ink on a transparent button is invisible; a
hand-picked label color is never overwritten. Adds an "Outline button" palette
entry, so a secondary action no longer has to be demoted to a text link.

**`SectionNode.align`.** The projector hardcoded `align="center"` on every
section `<td>`, imposing a layout decision the schema couldn't express. Now
authorable, defaulting to `center`.

**Inline link color.** `TextNode.linkColor` (theme-trackable) paints `<a>`
elements, which otherwise take the client's default hyperlink blue that no
`<style>` rule reliably overrides. There is no link node — a link is inline
inside copy and the schema has no inline level — so the projector rewrites anchor
tags in `TextNode.html`, the one place it reads markup, and only because that
field is a constrained inline-safe subset. An existing `style` is merged with the
color prepended, so a hand-written `color:` still wins. `HtmlNode` is never
touched.

Canvas mirrors all of it — including loading declared webfonts and reusing the
projector's own anchor rewrite — so the editor can't show something different
from what sends. Covered by 64 new `probe-email.ts` checks and a new
`email-surface-and-typography` e2e spec.
