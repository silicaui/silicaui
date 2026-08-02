---
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-builder": minor
"@wizeworks/silicaui-mcp": patch
---

Five navbar layouts, and a block `name` is now the palette label

The Insert palette used to show two rows both reading the literal word **"Navbar"** — a real block
with a working mobile menu, and an inert `navbar-start`/`navbar-end` shell with no links and no
collapse. Picking between them was a coin flip.

**Five distinct layouts**, each responsive in three container-query tiers (narrow → hamburger,
`@sm:` → sign-in, `@md:` → full bar), each with a working `disclosure` mobile menu, and each
showcasing part of the system:

| | |
| --- | --- |
| **Navbar — Brand Left** | the everyday header; links cluster beside the brand (it was a `justify-between` row, which optically centered them) |
| **Navbar — Center Links** | equal `flex-1` flanks so the nav is genuinely centered; ghost **Sign in** + primary **Sign up** |
| **Navbar — Center Logo** | links split either side of a centered wordmark; collapses to a normal mobile header purely from DOM order |
| **Navbar — Mega Menu** | a full-width shelf of grouped links, plus search with a `⌘K` hint |
| **Navbar — Floating Pill** | a `sticky`, `glass` capsule with an account avatar — the signed-in flavour |

All five brand with the real `Wordmark` component (so a logo can be assigned through the Inspector's
one-control path) and carry a `theme-toggle` button. The primary action and sign-in now also render
inside the mobile menu, sharing one slot with their desktop twins — a header whose CTA disappears on
a phone was the previous behaviour, and it was a bug.

The mega menu's shelf is a second `disclosure` trigger/panel pair, **not** the `menu` behavior:
`menu` needs an absolutely-positioned panel, which a builder canvas force-reveals and which would
then blanket the top of the page. It is also the ARIA-correct pattern for a shelf of links
(WAI-ARIA APG's Disclosure Navigation Menu) rather than `role="menu"`, which is for commands.

### Breaking-ish for consumers

- **Every block's `name` changed.** A block's `name` is now the palette label verbatim — short,
  unique, `Family — Variant` — and the explanatory sentence lives in `description`, which hosts show
  as the row's hint. Previously the label was derived by truncating `name` at `" — "`, which is why
  a whole family collapsed to one row text. A host that renders `Template.name` will see new
  strings; `key` is unchanged for every existing block, so lookups, saved documents, and starters
  are unaffected. `verify.mjs` now fails on a duplicate or overlong name.
- **The bare `Navbar` primitive left the Insert catalog.** The `Navbar` component itself is
  untouched in `@wizeworks/silicaui`, `-html`, and `-react`; only the palette entry is gone. A host
  that hid it by key can drop that entry.

### Also fixed

`wordmark` and `glass` were missing from `COMPONENT_STEMS`, so a prefixed projection
(`toHtml(node, { prefix })`) emitted bare `wordmark`/`glass` classes that matched no CSS. The
palette has authored `atom("Wordmark", "wordmark")` since it shipped, so this was already live for
anyone running a class prefix.
