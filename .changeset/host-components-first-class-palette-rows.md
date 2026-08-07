---
"@wizeworks/silicaui-builder": minor
---

A host component is a first-class palette row, not a plug labelled with its own allowlist key

`hostComponentGroups` built its palette item from four fields of a `HostComponentDef` and dropped
the rest. Everything below lives in how the palette and inspector RENDER a def — which is why none
of it is visible to an assertion about trees or projected HTML, and why the whole class of it
survived a full render sweep. It was found by opening the Add palette.

### `icon` was declared and read nowhere

Every host row drew the same hardcoded plug. A host picks a registered icon name, writes it down,
and gets nothing — silently, because the honest outcome of an unimplemented field is a type error
and this was a fallback. `icon` is now read, with the plug as the FALLBACK it was always documented
to be. An unknown name warns once and names itself, the same loose-string contract `inspectorTabs()`
already has: the def crosses a package boundary, so `IconName` isn't enforceable at the type level
and a typo has to announce itself at runtime.

It reads through to the Navigator glyph and the Inspector's identity header too, not just the
palette. Fixing only the palette would have swapped one inconsistency for a worse one — the row you
clicked showing a map, the layer it inserted showing a plug.

### `hint` did not exist

So a host row got no tooltip (`ItemRow` renders `item.hint` as its `title`) and contributed nothing
to search, which ranks over label / key / hint / group. Catalog rows had four searchable fields;
host rows had two. `hint` is now a field on `HostComponentDef` and flows to both. The key is also
searched with its namespace stripped (`host:` as well as `block:`) — a prefix is routing metadata,
and leaving it in made every namespaced row a hit for the letters h-o-s-t.

### `category` is display copy, and now says so

It was used verbatim as the group's HEADING while its key became `hostcat:<slug>`, which nothing
documented — so a host passing what looks like a slug (`'media'`) got a second group rendering as
MEDIA directly beneath the builder's own Media group, because `mergeCatalog` only ever merges by
key. A category that names a built-in group — matched on key or heading, case- and space-insensitive
— now merges INTO it. Anything else opens its own group, labelled with the host's copy verbatim.

### The registered `label` never reached the node

`makeInsertNode` stamped `label` only for `block:` keys, so a placed host node had none and
`nodeName` fell through to the derived type name: the inspector header for `site.map` read
**`Site.map`** — the allowlist key, sentence-cased — while the label the host registered sat two
fields away in the same object. It is stamped now, keyed on the produced node's KIND rather than a
string prefix, so a host component contributed through `catalog().extend` gets it too.

Nodes a host authors programmatically never pass through the palette at all, so the display layer
resolves the same def as a fallback: `nodeName` / `nodeRowLabel` / `nodeIconName` / `nodeTypeLabel`
take an optional lookup, bound in React by `useHostDisplay()`. A lookup rather than a module-level
registry, because a shell can hold several editors on several hosts at once. And `humanize` now
treats `.` as a separator like `-`, so even an unregistered host node reads "Site map" rather than
"Site.map".

### The identity header called a host node an Outlet

`kindLabel`'s ternary had no arm for `kind: "host"`, so it landed in the `else`. A host node is a
region the host renders and that takes props; an outlet is the structural slot a page body lands in.
Different primitives, and the inspector told the author they were the same thing. It reads
**"Host component"** now.

### `hide` could not reach a host row

`catalogForHost` merged twice and only the first merge carried the hide set, so a `host:*` key could
never be in `hidden` at the moment it mattered. Every other palette row was suppressible; host rows
alone were mandatory.

That bites because a host core is frequently the raw INGREDIENT of a curated block rather than
something to place bare — the frame without the heading, or without the address as readable text
beside the picture. Hiding it is the right fix, and deregistering it isn't an alternative:
`hostComponents()` is also the render and prop allowlist, so removing the row removes the component.
The host groups now run back through `mergeCatalog` as its own base, which applies exactly the
item-key/group-key matching every other row already gets — including dropping a host group whose
last row was hidden.

### A search row lost its name before its group badge

Not host-specific. `ItemRow`'s badge was `shrink-0` and its label was a plain `truncate`, and
`truncate` sets `overflow: hidden` — which already zeroes a flex item's automatic minimum size. So in
a narrow dock a 19-character group ("Video, audio & maps") kept every pixel while the NAME truncated
to nothing: rows that are an icon, a category, and no answer to what the author just typed. It only
appears in SEARCH results, which is precisely when names are being read rather than sections scanned.

The label is `flex-auto` (it claims its real width) against a badge whose shrink factor is large
enough that flexbox's size-weighted distribution takes the deficit out of the badge first. The badge
collapses to nothing, and only then does the name begin to truncate. `flex-1` would NOT have fixed
it — a `0` basis means the label claims no width of its own and only ever gets what the badge leaves.
A host cannot restyle this row, and "make the panel wider" is not a fix when the panel is the host's
own dock.

### Verified

`probe-host` gains 22 checks over the def→row→node path (icon read, unknown-icon warning fired
exactly once, hint carried, category merged vs minted, label stamped, the display fallbacks with and
without a lookup, and `hide` reaching a host row, emptying its group, and still composing with a
built-in hide). Three e2e specs cover the same ground through the real chrome, including measuring
that a squeezed search row keeps its name and drops its category. `<Icon>` now emits `data-icon`,
because inline SVG path data is otherwise unassertable — which is how a hardcoded plug stood in for
a registered icon without any test noticing.
