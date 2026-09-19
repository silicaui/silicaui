# 014 — Searching the catalog for "app shell" finds nothing, and the component is called AppShell

**Status:** fixed
**Severity:** major
**Found by:** P01 · Dilnoza Karimova · act 5
**Surface:** `@wizeworks/silicaui-mcp` › `search_docs`
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** P01 act 5, `packages/silicaui-mcp/verify.mjs` over real stdio

## What happened

Starting act 5 — build the console shell — the first question is *what does silicaui give
me for a shell?* Asked the catalog in the obvious words:

```
search_docs("sidebar navbar app shell layout")   → []
search_docs("app shell")                         → []
search_docs("data table")                        → []
```

Nothing. Not "no exact match" — an empty array, the same answer the catalog gives for a
component that does not exist.

`AppShell` exists. So does `AppShellSidebar`, `AppShellHeader`, `AppShellMain`,
`AppShellFooter`, the `app-shell` CSS family and the `app-shell-sidebar` class. Jam the
words together and all seven appear:

```
search_docs("appshell")   → 7 results
search_docs("datatable")  → 2 results
search_docs("sidebar")    → 31 results
```

The search wants the words with the space removed. A person types the space.

## What should have happened

`"app shell"` should find `AppShell`. The component's name IS those two words; the
CamelCase is a JavaScript identifier convention, not how anybody says it.

## How to reproduce

1. `search_docs({ query: "app shell" })` → `[]`
2. `search_docs({ query: "appshell" })` → 7 results.
3. Every time. Same for every two-word component: `DataTable`, `EmptyState`,
   `CommandPalette`, `TreeView`, `NumberField`, `SearchInput`, `PhoneInput`,
   `ThemeController` — the majority of the React surface.

## Why it matters

**This one is aimed at the wrong reader to shrug off.** The MCP server exists so an agent
can build on silicaui instead of hand-rolling. An agent that asks for "app shell" and gets
`[]` does not try again with the space removed — it concludes silicaui has no app shell
and writes its own `<div className="grid grid-cols-[240px_1fr]">`.

That is a RULE #1 violation manufactured by the tool whose entire job is to prevent it.
And it is invisible: the agent produces working code, nobody sees an error, and the
design system quietly loses a component's worth of adoption per occurrence.

The server's own description tells you to come here first — *"Don't know the name?
search_docs first."*

## Where it lives

`packages/silicaui-mcp/src/server.ts`, the `search_docs` handler. Every matcher is a
single literal substring test of the whole query:

```ts
const q = query.toLowerCase();
components.filter((c) => c.name.toLowerCase().includes(q) || …)
```

`"app shell".includes` never matches `"appshell"`. There is no term splitting and no
CamelCase or hyphen normalisation.

## Do the siblings have it too?

**Yes — ten of the thirteen result groups, and this is the third patch over the same
crack.**

Counted rather than estimated. Ten use the same whole-query `includes(q)`: components,
blocks, behaviors, classes, tokens, themes, data-bindings, node-kinds, email nodes, email
types. The other three are deliberate and stay as they are — `matchedTags` compares with
`===` because a tag name is exact, and the two concept blocks are synonym maps.

**The strongest evidence is already in the file, in two comments.** Both describe this
exact failure and both were fixed by bolting on a hardcoded keyword list rather than
fixing the matcher:

> *"Custom colors are a CONCEPT, not a literal name, so nothing above could ever match
> them … an agent reasonably concluded the 8 semantic roles were the whole set — then
> refused to write `badge-brand`."*

> *"Theming is a MECHANISM, not a literal name — the exact failure the custom-colors entry
> above was added for. 'dark mode', 'data-theme' … all matched nothing, so an agent asked
> to make a dark section concluded it had to write hex or its own CSS."*

Two people hit it, two people wrote "the exact failure above", and neither changed the
test that caused it. `COLOR_CONCEPT` and `THEME_CONCEPT` stay — they map genuine synonyms
that no amount of normalisation would reach — but they should not have been carrying this.

**Also found while checking, and NOT a defect:** the site's own ⌘K palette handles
`"app shell"` correctly and offers **App Shell** under *Layout*. It indexes the display
labels, which already have the space. Only the MCP is affected — the human surface is
fine and the agent surface is not.

**One more, fixed in passing:** `matchedEmail` tests `k.kind.includes(q)` without
lowercasing the haystack, so an email node kind with any capital never matched.

## The fix

One `matches()` helper, used by all ten, replacing every hand-written `includes(q)`:

- the query splits on whitespace into terms, and **all** terms must hit (AND);
- each haystack is indexed **both** as written and CamelCase/hyphen/underscore-split,
  so `AppShell` is findable as `appshell`, `app shell` and `shell`.

Fixing the helper rather than the component matcher is the point: a fix applied to one of
ten call sites is how this file got two keyword lists.

## Confirmed by

**Driven through a real MCP client over stdio**, not a re-implementation of the matcher —
`packages/silicaui-mcp/verify.mjs`, which spawns the built server the same way an agent
connects to it. Six two-word components, each asserted in **both** spellings so a later
"optimisation" cannot quietly drop either:

```
✓ search_docs finds AppShell by "app shell" as well as "appshell"
✓ search_docs finds DataTable by "data table" as well as "datatable"
✓ search_docs finds EmptyState by "empty state" as well as "emptystate"
✓ search_docs finds CommandPalette by "command palette" as well as "commandpalette"
✓ search_docs finds NumberField by "number field" as well as "numberfield"
✓ search_docs finds TreeView by "tree view" as well as "treeview"
✓ search_docs requires ALL terms, not any
```

**The last check is the one that stops the fix going too far.** Splitting a query into
terms invites the lazy version — match *any* term — which would turn `"app shell"` into
everything containing "app" and bury the answer. `"phone zzzznotathing"` must return
nothing, and does.

**The two existing concept checks still pass** — `"brand"` and `"custom color"` still
reach the custom-colors entry — so the keyword lists that were carrying this defect were
not broken by taking the weight off them.

**Not confirmed through this session's live MCP connection.** That server process started
before the rebuild and holds the old code in memory; it still returns `[]` and will until
it is restarted. The stdio run above is the real proof, and it spawns a fresh process from
the built output. Said plainly rather than reported as a pass.

## Rating effect

—
