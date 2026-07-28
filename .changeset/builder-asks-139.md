---
"@wizeworks/silicaui-builder": minor
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui": patch
"@wizeworks/silicaui-mcp": patch
---

Close the open host-seam asks: responsive authoring, per-page layouts, conditional
visibility, op inversion — and fix two house-rule breaches in the shipped blocks.

**Per-breakpoint authoring.** `Editor.setClassToken(id, group, value, prefix)` sets one
member of a class group at one container breakpoint without disturbing the others;
`classTokenAt` / `classTokenBreakpoints` read it back with the mobile-first cascade
resolved, so a control can show a value as inherited rather than set. The Inspector
gains a breakpoint selector (base / tablet / desktop) that follows the device toggle.
Writing a container variant now also guarantees a container context exists
(`Editor.ensureContainer`), on the tree root — where the query measures the page, the
width the device toggle actually sets.

**Viewport variants are rejected by default** in live documents
(`EditorOptions.viewportVariants`, `BuilderHost.viewportVariants`) — a policy a host
can lift, deliberately NOT part of the un-liftable security floor. `lintTree` reports
container variants with no container ancestor, the check a `ClassValidator` can't do
because it sees the string and not the tree.

**Per-page layouts.** `Page.frameId` picks the site default (absent), no frame at all
(`null` — the landing page that was previously unrepresentable), or a named frame from
the new `Site.frames`. `frameFor` / `frameDiagnostic` resolve it; a dangling id renders
bare and reports, rather than silently restoring the default header.

**Conditional visibility.** A new `{ kind: "visible"; ref; negate? }` data binding drops
a node and its subtree without consuming the node's content slot. Scope-aware (works
per item inside a collection), and an unknown ref KEEPS the node — a resolver typo must
never silently delete a section. Wired through both the site and email resolvers and
Inspectors.

**Op inversion.** `Editor.inverseOf(ops, before)` returns the ops that undo a batch, so
a host driving undo through `setHistoryDelegate` no longer has to re-derive them. This
closes the two that were impossible from outside: a `symbol.set` that creates (its
inverse needs a detach cascade of engine-minted ids — also available on its own via
`Editor.planSymbolDelete`) and `node.setText` over rich children, which now inverts into
the new `node.setChildren` op instead of flattening irrecoverably.

**Contrast-derived foreground ink.** `-content` tokens are now chosen by MEASURED
contrast (`deriveContent`, `resolveThemeTokens`, `contrastWarnings` in
@wizeworks/silicaui-html) rather than an OKLCH lightness threshold, which picked white on
seven role colors across the four shipped presets where black would have passed WCAG AA.
The CSS last-resort threshold moves 0.68 → 0.57 for colors no build step can see, and
the plugin's own `error-content` is fixed (4.26:1 → 4.66:1).

**Also:** `Editor.batch()` for one-undo-step multi-node edits (site + email);
`Builder` `initialMode` / `onModeChange`; keyboard arrows to navigate and reorder,
select-parent on Escape, `Cmd+X`, `Cmd+G`; `srcset`/`sizes` emission on Image plus a
quantized focal point; `resolveTree` now resolves a node's children after an
attr-targeted fill (a bound card could not previously contain anything bound).

**Blocks:** dropped the `eyebrow` part from "Content — prose section" and "Feature —
media split", and swept faded `/opacity` ink out of all shipped blocks. Both are now
enforced by the block linter (`no-eyebrow`, `no-faded-ink`), which runs at module load.
