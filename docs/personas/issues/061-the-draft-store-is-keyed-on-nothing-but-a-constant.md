# 061 — The draft store is keyed on a constant, so the next author opens holding someone else's site

**Status:** fixed
**Severity:** minor
**Found by:** P03 · Marlene Okonkwo-Bright · the isolation standing check (RULE #7)
**Surface:** Site builder › local draft store · email builder › local draft store
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

The rule is that every persona tries **once** to see another customer's data. A
builder has no accounts, so the question is not "log in as someone else" — it is what
the local draft store is keyed on, and whether a document that is not hers can end up
in her editor.

Read out of the browser rather than out of the source:

```
site in the editor: 7 page(s) — ["Home","Classes & timetable","Fees"]
the host passed the same `document` prop either way (heroSplitCta, 1 page)

recovery banner: "Restored your last session (26 min ago). Start fresh"
draft keys in localStorage: ["silicaui-draft:silicaui-designer", "silicaui-draft:silicaui-designer:view", …]
draft keys in IndexedDB:    ["silicaui-designer", "silicaui-designer:view"]
```

The key is the string and nothing else. No site id, no document hash, nothing that
ties the saved draft to the document the host handed the builder. A seven-page dance
studio was restored over a one-page seed, and the store had no way to notice they are
not the same site.

## What should have happened

Nothing different **in this case** — that restore is exactly right, and it is what
[058](058-the-sentence-she-was-typing-when-the-tab-closed-was-gone.md) and
[049](049-she-reloaded-and-the-first-thing-she-saw-was-a-blank-page.md) exist to
guarantee. The problem is the case one step over.

## Why it matters, and what it is NOT

**Marlene is fine, and the builder behaves well for her.** It restores her work, it
*says* it restored her work, it says when, and it offers **Start fresh** to throw it
away. Nothing is hidden. That is the right design for crash recovery and it is not
being changed.

The finding is about the host contract underneath it. `persistKey` defaults to one
module constant:

```ts
const DEFAULT_PERSIST_KEY = "@wizeworks/silicaui-builder";
```

So a host that mounts `<Builder>` for **two different sites** without setting it gets
one shared store. The second author opens their editor holding the first author's
site — under a banner that calls it *"your last session"*, which is then a false
sentence about whose work it is. If they keep editing and press Publish, they publish
someone else's content into their own site.

Who that actually happens to is specific and real: an agency with several clients, a
shared machine at a library or a studio office, a family laptop, a support person
opening a customer's editor to help. Marlene's own niece, on Marlene's laptop, making
a site for her own thing.

Filed `minor` because it needs a multi-site host and a shared browser profile, and
because nothing is silent — the banner always fires.

## Where it lives

[packages/silicaui-builder/src/site/react/Builder.tsx](../../../packages/silicaui-builder/src/site/react/Builder.tsx)

```ts
/**
 * Local crash-recovery. When set (the default), every edit is autosaved to a
 * durable LOCAL store … under this key, and restored on the next load …
 */
persistKey?: string | null;
```

The doc describes the safety net and never mentions the one thing a host has to do to
keep it safe. A host reading this has no reason to think the key must vary.

## Do the siblings have it too?

| | |
| --- | --- |
| site builder `persistKey` | **the defect** |
| email builder `persistKey` | **the same** — a distinct default from the site builder's, which stops the two colliding on one page and does nothing about two projects |
| `:view` store (active page + selection) | same key plus a suffix, so it inherits the same scope — correct, it should follow the document it belongs to |
| the recovery banner | **correct, and it is the reason this is minor** — the restore is announced, dated, and undoable |

## The fix

**The builder cannot detect this, and it is worth being exact about why.** A `Site` is
`{ version, theme, pages, frame, symbols, savedThemes }`. There is no id on it. The
builder is handed a document with no identity, so it has nothing to compare a saved
draft against. Inventing one — hashing the seed, say — would break the actual feature:
the draft is supposed to differ from the document it was seeded from, because it holds
the edits.

So the only place the knowledge exists is the host, and the fix is to make the
contract say so where a host reads it:

> **GIVE EVERY SITE ITS OWN KEY.** The default is one constant, and the store is keyed
> on this string and NOTHING else — not the document, which carries no identity the
> builder could check. So a draft saved while editing one site is restored over
> whatever `document` the host passes next. On one site that is the whole point.
> Across two, the second author opens their editor holding the first author's site,
> under a banner that calls it "your last session".
>
> A host serving more than one site, or more than one person from one browser profile
> (an agency, a shared machine), must include the site's own id:
> `persistKey={`acme-cms:site:${siteId}`}`.

Both builders carry it, in their own words.

**Why a doc change counts as the fix here.** The framework's rule is to fix at the
single point of change, and for a defect whose cause is a host not knowing a
requirement, the requirement's absence *is* the single point of change. What would not
count is leaving the old text and writing this file instead — nobody integrating reads
the issue tracker of a design system.

## Confirmed by

Driven on Marlene's own profile, reading the keys out of `localStorage` and
`IndexedDB` in the live page rather than from the source:

```
draft keys in IndexedDB: ["silicaui-designer", "silicaui-designer:view"]
```

Neither carries a document identity, which is the claim. And the banner that makes it
survivable was read from the DOM, not assumed:

```
"Restored your last session (26 min ago). Start fresh"
```

`pnpm verify` green across the workspace, builder e2e **200 passed**, typecheck clean.

## Rating effect

None — the screens all behave correctly. This is a host contract, and it is recorded
in [rating.md](../rating.md)'s notes rather than as a deduction.
