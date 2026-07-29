---
"@wizeworks/silicaui-mcp": minor
---

Teach the MCP server that Silica has THREE delivery paths, and tell connecting
agents so before they write any code.

**A routing preamble at `initialize`.** The server now supplies MCP `instructions` —
the block clients surface ahead of the first tool call. Previously an agent received
ten tools in a bag and had to infer the architecture from their names; the path choice
(CSS vs React vs node-tree) is made *before* any tool runs, by which point per-tool
descriptions are too late to help. The preamble names each path, what you write on it,
whether it's interactive, which tool answers for it, and the wrong-path smells:
importing `@wizeworks/silicaui-react` into non-React output, hand-writing `data-sui-*`
markers, or shipping node-tree markup without `@wizeworks/silicaui-behaviors` and
wondering why nothing opens.

**The CSS path is a real component path now.** `@wizeworks/silicaui` had zero entries in
the catalog — it was reachable only through `list_classes`, which returns a flat bag of
class names: real, but silent about which class is the root, which are its parts, and
which are variants. So an agent writing plain HTML had to guess the markup, and
`get_component` could answer for two of three paths. All 109 class families are now
catalog entries carrying the module's own JSDoc, the derived `root` class, `classes`,
`colorVariants` (matched against the real semantic-color list), and the compound
selectors that reveal required structure (`.checkbox.card-selectable-indicator`).
Families with no bare root class — `dialog` is only ever `.dialog-popup` /
`.dialog-backdrop` / … — say so via `familyPrefix` and `rootNote`, since `root: null`
alone invites inventing `class="dialog"`.

**`get_component` answers every path at once.** A name spanning packages used to return
`isError` asking the caller to pick one — a round trip that demands a choice it can't
yet make, since how the shapes differ is exactly what it was asking. It now returns all
of them, CSS → React → HTML, with a note that they aren't interchangeable. Pass
`package` to narrow.

Two extraction bugs fixed on the way in: `button`'s description came from the
`buttonColorVars` helper that happens to sit above it in the file (first-JSDoc-wins),
and root derivation crowned `bg-info` the root of the 66 unrelated `color-utilities`
because it prefixes `bg-info-content`.
