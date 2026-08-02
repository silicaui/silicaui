---
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-builder": minor
"@wizeworks/silicaui-mcp": patch
---

Three host asks: other editors on the canvas, a clickable status item, and a render-path `customColorCss`.

**Other editors (`<Builder peers>` / `editor.setPeers`).** Hand the builder whatever presence a
collaborative host already relays and it draws it: a dashed, named ring on the canvas in that
peer's color, plus a dot on the Navigator row. A peer may also carry a `claim` — node ids whose
subtrees they are holding — and the engine then refuses every local mutation inside one, drops the
canvas write affordances (drag, drop target, in-place edit), and names the holder in the Inspector.

A claim is the SOFT half of a lock and deliberately not `setLocked`: it lives in this editor's
memory, never touches the tree, records no op, and lands on no undo stack, so a host can expire it
on a timeout. It is not correctness machinery — per-node last-write-wins and the op log already keep
the document right — which is why `applyRemoteOps` ignores claims entirely, including the claim held
by the peer whose ops are arriving. Pinned by `verify:peers` and `e2e/peers.spec.ts`.

One list rather than the two separate `peerSelections`/`claims` props asked for: a claim with no
name and no color is a dead end, since the editor has to say WHO is holding a subtree.

**A status item may now disclose its own detail.** `statusBarSlot`'s non-interactive rule was one
case too broad — clicking "3 broken" to see which three is reading the same fact at more depth, not
a second action, and splitting the count from its trigger is what stops a status bar being one. New
`StatusItem` (both shells): a plain `<span>` without an `onClick`, a ghost `btn-xs` with one — 24px
inside the 28px strip, carrying `aria-expanded`/`aria-controls`. Anything that ACTS still belongs in
`toolbarSlot`.

**`@wizeworks/silicaui-html/theme` — a theme as CSS, off the render path.** `customColorCss(theme,
scope?)` emits every rule a build-time `@plugin "@wizeworks/silicaui" { colors: … }` registration
would have, for colors coined at RUNTIME by a tenant in a theme editor — which no build-time list can
carry. It was previously reachable only from the builder's canvas, so a page that previewed correctly
shipped with `btn-sunset` styling nothing. `themeTokenCss` emits the custom properties those rules
read (ship both, or they paint nothing). `scope` is opt-in: omit it when publishing, pass one for a
preview. New subpath because it is the only part of the package that needs `@wizeworks/silicaui`, now
an optional peer — the root import stays dependency-free.
