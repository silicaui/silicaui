# 057 — She deleted a page and the links to it were left pointing at nothing

**Status:** fixed
**Severity:** minor
**Found by:** P03 · Marlene Okonkwo-Bright · the "wrong moves" standing check
**Surface:** Site builder › Pages panel — the delete confirm
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

The standing check is *"delete the timetable section that the home page summary points
at."* Driven on a copy of her real site:

```
CONTROL  links to /classes-timetable: 1   links to a made-up address: 0

what it asked: "Delete “Classes & timetable”? The page and everything on it is
                removed from the site. You can undo this. Cancel / Delete page"
does it mention the 1 link pointing here: NO

pages: 7 → 6
links still pointing at /classes-timetable, which is now nowhere: 1
```

The prompt is good. It names the page, it says undo is there, its backdrop is inert,
and one undo brought the page back. **The one thing it does not say is what breaks.**

## What should have happened

Tell her that something points at this page before she removes it.

## How to reproduce

1. Open `http://localhost:5178/`, make a second page, and point a nav link at it.
2. Switch to that page and press the trash icon in the Pages panel.
3. Before the fix: the prompt says nothing about the link.
4. Delete. The link stays, aimed at an address that no longer resolves.
5. Every time, both themes.

## Why it matters

Filed `minor`, honestly — nothing is lost, and undo covers it.

What makes it worth fixing anyway is the shape. This is **absence behaving like
fine**: after the delete, a link to a page that does not exist renders *identically*
to a working one. Same words, same underline, same colour. There is no state on the
screen that differs. She finds out when a parent phones to say the timetable link is
broken.

And the delete prompt is the one moment where the answer is free. At that instant the
builder is holding the whole site and can count in one pass what she would have to
check by hand across seven pages.

The narrower version of a thing already written down about this run: the published
artifact carries 28 links pointing at `#`, and
[its README](../artifacts/p03-bright-step-studio/README.md) notes that nothing counts
them. This is the same gap at the one point where it is cheap to close.

## Where it lives

[packages/silicaui-builder/src/site/react/PagesPanel.tsx](../../../packages/silicaui-builder/src/site/react/PagesPanel.tsx)

```tsx
const ok = await confirm({
  title: `Delete “${active.name}”?`,
  description: "The page and everything on it is removed from the site. You can undo this.",
  confirmLabel: "Delete page",
  color: "error",
});
```

A fixed string. It is a good fixed string — it just cannot know anything.

## Do the siblings have it too?

| | |
| --- | --- |
| Pages panel delete | **the defect** |
| deleting a NODE that a link points at | out of scope — an anchor targets a page or a URL, not a node |
| email builder templates | does not apply — email templates have no addresses and nothing links between them |
| `removePage` itself | correct — recorded, invertible, and it should not refuse; this is a thing to be told, not prevented |

## The fix

The engine gains the query, because the engine is what holds the site:

```ts
/**
 * How many links anywhere in the site point at `slug` — every page, the frame
 * and every symbol master, minus `exceptPageId` (the page about to be deleted,
 * whose own links go with it).
 *
 * An `href` lives on `attrs` for an element and on `props` for a component —
 * both are checked, because a nav built from Buttons and one built from `<a>`
 * are the same site to the person who made it.
 */
linksTo(slug: string, exceptPageId?: string): number
```

And the prompt says it, in her words rather than ours — no "inbound references", no
"orphaned":

> **One link** elsewhere on your site **points at this page. It will be left pointing
> at nothing.** The page and everything on it is removed from the site. You can undo
> this.

Two decisions:

**It counts, it does not block.** She is allowed to delete a page that something links
to; sometimes that is the point. The prompt's job is that she knows, not that she is
stopped.

**It says nothing when there is nothing to say.** A sentence that appears every time
is a sentence nobody reads, and the whole value here is that its presence means
something.

## Confirmed by

Driven as Marlene, on both kinds of page:

```
Classes & timetable  (/classes-timetable)
  links pointing at it: 1
  the prompt: "Delete “Classes & timetable”? One link elsewhere on your site points
               at this page. It will be left pointing at nothing. The page and
               everything on it is removed from the site. You can undo this."

Marlene's story  (/marlenes-story)
  links pointing at it: 0
  the prompt: "Delete “Marlene's story”? The page and everything on it is removed
               from the site. You can undo this."
```

The counter carries its own control — it is asked for a real address and for one that
was never made, and it must answer 1 and 0 before any reading from it is used.

`pnpm verify` green across the builder, whole e2e suite **199 passed**, typecheck
clean.

## Rating effect

`Site builder › Pages panel — Ease 8 → 9` in [rating.md](../rating.md).
