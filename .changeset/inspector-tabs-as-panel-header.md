---
"@wizeworks/silicaui-builder": minor
---

**The inspector rail's tabs are now its header — and a host can add tabs to it.**

Both builders stacked a fixed `Design` header bar on top of the Inspector's own
Design/Settings switcher. It duplicated the first tab's name and then contradicted
the second: open Settings and the rail still said "Design". The left rail already
did this correctly — its `PanelHead` *contains* the Layers/Insert toggle — so the
right rail now matches it. The header bar is gone; the tab strip is the header.

Those tabs are also no longer a segmented pill. A pill is a **mode switch** — a set
of options where one is armed — and at first level it read as one more row of chips
alongside the Editing / All sizes / Tablet controls right below it. A first-level
tab is a **page of the panel**, so the strip uses the `underline` Tabs variant: the
row carries the baseline rule, the active tab's indicator sits on that rule, and
tabs are natural-width and left-aligned rather than stretched edge to edge. The
rail's genuine mode switches stay pills, which is now a real distinction instead of
a coincidence.

`PanelTabs` owns the panel body as well as the strip, so the ARIA is real: Base UI
wires `role="tablist"`/`role="tab"` with `aria-controls` pointing at a panel that
exists. **Anything locating these tabs by `role="button"` / `aria-pressed` must move
to `role="tab"` / `aria-selected`.**

That makes a new seam possible. `host.inspectorTabs(node)` contributes **whole
panels** to the right rail as top-level peers of Design and Settings, which is a
different grain from the existing `host.inspectorPanels(node)` — a section *inside*
Settings. Both tiers stay; pick the one that matches the contribution.

A tab declares its scope, and the choice is not cosmetic:

```ts
inspectorTabs: (node) => [
  // Panel-scoped: about the document. Renders with NOTHING selected — which is
  // the point. Gets no node and no mutation ctx.
  { id: "history", label: "History", icon: "undo", scope: "panel",
    render: () => <ChangeHistory /> },

  // Node-scoped (the default, and what Design/Settings are). Return it
  // conditionally to make the tab node-specific; it gets the same mutation
  // primitives the built-in panels write through.
  ...(node?.kind === "element"
    ? [{ id: "seo", label: "SEO", render: (n, ctx) => <SeoPanel node={n} ctx={ctx} /> }]
    : []),
],
```

While a panel-scoped tab is open the rail hides its node chrome — the identity
header and the Duplicate/Delete footer — because both describe a selection that
tab isn't about.

Merge rules, each warning once when it drops something (a contribution that
silently never renders is indistinguishable from a builder bug): `design` and
`settings` are reserved and a host tab claiming one is rejected rather than
shadowed; duplicate ids keep the first; blank id/label and unknown icons are
rejected; `order` sorts against the built-ins (Design `0`, Settings `10`, omitted
lands last). A node-scoped tab that stops applying while open falls back to Design
instead of blanking the rail.

When the tabs outgrow the rail, the strip pages with explicit circle buttons that
take real layout space beside it — no horizontal scrollbar, and no overlay sitting
on top of the end tabs.

Same seam, same rules, same names on `EmailBuilderHost`. Covered by four new
`host-seam` e2e specs.
