# 033 — Inside `/docs/`, 117 of 118 links were component pages, and the palette could not find "Getting started" by its own name

**Status:** fixed
**Severity:** major
**Found by:** P08 · Fatima Zahra El Amrani · act 1
**Surface:** `apps/site` › `app/docs/docs-shell.tsx`
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 1 is one job: **from silicaui.com, find out that the node-tree path exists and how to use
it.** She does not yet know the words "node tree" or "projection", so she does what anyone
does — clicks **Docs**.

`/docs/` is a heading, one sentence, and "Browse components". Counted off the rendered page:

| | |
| --- | --- |
| links on `/docs/` | **118** |
| of those, component pages | **117** |
| the other one | the wordmark, back to `/` |
| links to `/docs/getting-started` | **0** |
| a `<header>` in the docs shell | **none** — `document.querySelector("header")` is `null` |

The home page's header carries a **Get started** button. The docs section has no header at
all, so that button does not follow her in.

**So she tries the ⌘K palette**, which the page invites her to. Typed, in order:

```
static          → No results found.
html            → No results found.
no framework    → No results found.
getting started → No results found.
```

That last one is the tell. **The palette could not find the page by its own title**, because
it was built from `componentLinks` and nothing else.

`/docs/getting-started` is the only page on the site that documents the CSS-only path and
the node-tree path. From inside the documentation it was reachable by going back to the
landing page, or by guessing the URL.

## What should have happened

The docs section should be able to reach its own guide. A reference that can only be entered
holding the name of a component serves people who already know the answer.

## How to reproduce

1. `/docs/` → read the sidebar. 117 component pages, no guide.
2. ⌘K → type `getting started`. **No results found.**

## Why it matters

This persona's brief says it plainly: *"If the only route to path three is the MCP or the
source, that is a `major` — the docs are the product's front door."* It was not quite that
bad — getting-started does document path three, and the landing page does link to it — but
the front door only opens from outside.

It also compounds the two issues before it. **#029** found that the landing page never names
the CSS package; **#028** found the component pages telling CSS-only readers their component
would be inert. The one page that would have corrected both was the one she could not reach.

## Do the siblings have it too?

**The sidebar and the palette are the same defect twice**, which is why the fix is one list
read by both. They were built from the same prop in two places, and a page added to one and
not the other is how this would come back.

**`CommandItem` has supported `keywords` and `description` all along** — the type declares
both, with the comment *"Extra terms to match against beyond the label/description."*
Nothing in the site passed either. So the palette matched titles only, on a component
catalogue where the title is the thing you already have to know.

Checked and NOT affected: the landing page's header (has the button), the component pages
themselves (each documents all three paths under "Using X").

## The fix

A `GUIDE_LINKS` list, read by **both** the sidebar and the palette, rendered as a
**Start here** group above the component groups — and with real keywords, every one of them
a term a persona actually typed and got nothing for:

```ts
keywords: ["install", "setup", "plugin", "tailwind", "@plugin",
           "theme", "themes", "data-theme", "dark mode", "prefersdark",
           "html", "plain html", "static", "static site", "no framework",
           "without react", "vanilla", "node tree", "toHtml", "generate",
           "django", "rails", "php", "go", "server", "css only"]
```

The `description` field is passed too, so the result reads *"Getting started — Install,
register the plugin, themes, and all three paths"* rather than a bare title.

## Confirmed by

Driven from a component page with real keys, after the change:

| typed | before | after |
| --- | --- | --- |
| `getting started` | No results found | **Start here › Getting started** |
| `static` | No results found | **Start here › Getting started** |
| `no framework` | No results found | **Start here › Getting started** |
| `node tree` | No results found | **Start here › Getting started** |
| links to getting-started on `/docs/` | **0** | **1**, in the sidebar |

`pnpm --filter @wizeworks/silicaui-site typecheck`: **exit 0**.

## Recorded, not filed: the schema still lives in the MCP

Getting started tells her path three **exists**, names its two packages, and shows
`atom()` / `toHtml()` in six lines. That is enough to know it is real, and it is what makes
this issue major rather than critical.

It is **not** enough to write a generator. The node kinds, the data-binding vocabulary, the
resolution contract and the `toHtml` tag/attribute allowlist are served by
`get_node_schema` on the MCP server and are on no page of the site. For an agent that is
fine; for a documentation engineer reading with a browser it is a gap.

Measured and written down here rather than filed as a second issue, because the fix is a
documentation page rather than a defect, and act 2 of this run will show how far the
six-line example actually gets her.

## Rating effect

`/docs/` is scored in [rating.md](../rating.md) by this act.
