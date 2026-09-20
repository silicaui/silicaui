# 028 — 57 component pages tell a CSS-only reader their component will be inert; it will not

**Status:** fixed
**Severity:** major
**Found by:** P02 · Tomás Ferreiro · act 3
**Surface:** `apps/site` › `app/docs/components/[slug]/component-api.tsx`
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 3 reads three component pages as somebody with no React, no bundler and no
`node_modules` in their project. All three did the important thing right: **"Plain HTML —
CSS classes" comes first**, before React; Django is named by name; and the class list is
printed so he can type it. That is issue 009's fix working, and it is worth saying before
the complaint.

Then the paragraph under that heading, on all three:

> *"**This path ships no JavaScript**, so a component that needs interaction is styled but
> inert. For behavior with no framework, use the node-tree path below."*

**On Collapse this is false.** Collapse is a native `<details>` disclosure. It opens and
closes on its own, with no JavaScript from anybody. The same page says so twice — its own
description reads *"A native `<details>` disclosure"*, and its **Hydrated by** field a few
inches lower reads *"nothing — this one is static markup"*.

It is false on Card, on Menu, on Table, on Breadcrumb, on Alert, on Stat, on Navbar — on
**57 of the 108** components that have a class list.

## What should have happened

Act 5 of this persona is "he wants the wine list to fold away — find out what the docs tell
someone with no React to do." **The docs tell him it will be dead and to go install two more
packages.** The right answer was on the same page: use the four classes, `<details>` does
the rest.

## How to reproduce

1. Open `/docs/components/collapse/`.
2. Read the paragraph under **Plain HTML — CSS classes**: *"styled but inert … use the
   node-tree path below."*
3. Scroll to **Hydrated by** on the same page: *"nothing — this one is static markup."*

The page contradicts itself, in two sections, about the same component.

## Why it matters

A CSS-only reader has exactly one question — *does this work without React?* — and this
paragraph answers "not really" for a majority of the library.

It costs in two directions:

- **He installs what he does not need.** The sentence points at the node-tree path, which
  is `npm i @wizeworks/silicaui-html @wizeworks/silicaui-behaviors` and a JavaScript
  authoring API, to fix a component that was never broken.
- **He believes the CSS path is the second-class one**, which is exactly the fear this
  persona arrived with: *that "framework-agnostic" is marketing and the real product is
  React with a CSS layer bolted on underneath.*

This is the **"a promise in copy is a contract"** shape, inverted: the copy under-promises
against code that already keeps the promise.

## Where it lives

`apps/site/app/docs/components/[slug]/component-api.tsx` — one hard-coded sentence in the
Plain HTML section, printed for every component regardless of the component.

## Do the siblings have it too?

**The data to get this right was already on the page, and already being rendered.**
`html.behaviors: string[]` drives the **Hydrated by** field lower down, and its own type
comment says what empty means:

> *Behaviors the vanilla runtime hydrates on it; empty means it is static.*

So the fact travelled as far as one `<dd>` and no further. Counted from
`apps/site/src/lib/catalog-api.ts`:

| | count |
| --- | --- |
| components with a CSS class list | **108** |
| of those, `behaviors: []` — need **no** JavaScript | **57** |
| of those, genuinely need a behavior | **37** |
| no node-tree entry at all, so unknowable | 14 |

**The getting-started page carries the same sentence** and is left alone deliberately.
There it is generic advice about the path in the abstract, with no component in hand, so
"a component that needs interaction is styled but inert" is true as written.

## The fix

The sentence asks the data it already had. Three cases, because there are three states and
the third is not the second:

| when | what it now says |
| --- | --- |
| `behaviors` is empty | **"This path is complete for Collapse"** — it needs no JavaScript, so the classes below are the whole story. |
| `behaviors` has entries | "…so Accordion is styled but inert: its behavior comes from `disclosure`. For that behavior with no framework, use the node-tree path below." |
| no node-tree entry | unchanged — we cannot tell, so the cautious original wording stays |

The middle case got better as well as narrower: it now **names** the behavior the reader
would be missing, instead of leaving them to guess what "interaction" meant.

## Confirmed by

Read off the rendered page in the browser, not off the source — the paragraph after each
**Plain HTML — CSS classes** heading:

| page | `behaviors` | what the page now says |
| --- | --- | --- |
| `/docs/components/collapse/` | `[]` | "**This path is complete for Collapse** — it needs no JavaScript, so the classes below are the whole story." |
| `/docs/components/accordion/` | `["disclosure"]` | "…so Accordion is styled but inert: its behavior comes from `disclosure`. For that behavior with no framework, use the node-tree path below." |
| `/docs/components/dropdown/` | none | "…so a component that needs interaction is styled but inert." (unchanged) |

All three branches render, and each one is the right branch for its component.

`pnpm --filter @wizeworks/silicaui-site typecheck`: **exit 0**.

## Rating effect

The three component doc pages this act opened are scored in [rating.md](../rating.md).
