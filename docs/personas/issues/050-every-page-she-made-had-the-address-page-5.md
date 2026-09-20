# 050 — Marlene's term dates page lived at `/page-5`

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · act 8, publishing
**Surface:** Site builder › Pages · `@wizeworks/silicaui-html` › `slugify`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

She made her seven pages and named every one of them. Then the site was published,
and the addresses were these:

| the page she named | the address it got |
| --- | --- |
| Home | `/` |
| Classes & timetable | **`/page-2`** |
| Fees | **`/page-3`** |
| Our teachers | **`/page-4`** |
| Term dates 2026/27 | **`/page-5`** |
| Marlene's story | **`/page-6`** |
| Find us | **`/page-7`** |

Nothing on any screen showed her an address, so there was no moment at which she could
have noticed.

## What should have happened

`brightstepstudio.co.uk/term-dates-2026-27`. The address is the part of a small
business's website that goes on a flyer, gets read out on the phone, and is what
Google indexes. `/page-5` is a URL that cannot be said out loud.

## How to reproduce

1. Open `http://localhost:5178/`.
2. Press **+**, type `Fees`, press Enter.
3. Publish, and read the slug the host receives.
4. Before the fix: `/page-2`. Every time.

## Why it matters

Her whole reason for being here is that her old host doubled the price and her niece
said to do it herself. The thing she is replacing has readable addresses. Beyond
looking amateur:

- **She cannot tell anyone where a page is.** "Go to bright step studio dot co dot uk
  slash page five" is not a sentence.
- **It compounds with [051](051-nothing-told-her-what-her-pages-were-called.md).** To
  link her nav to a page she had to type its address, and the address was a number she
  had never seen.
- **It is permanent.** Nothing re-derives it, so the site is like that forever.

## Where it lives

- [packages/silicaui-builder/src/site/engine.ts](../../../packages/silicaui-builder/src/site/engine.ts) — `addPage` and `renamePage`
- [packages/silicaui-html/src/site.ts](../../../packages/silicaui-html/src/site.ts) — `slugify`

`addPage()` with no argument calls the page `Page 5` and derives `/page-5` from that
label, which is right. `renamePage` then changed **only** `page.name`:

```ts
this.transact(["page"], true, () => {
  page.name = value;          // the label follows
  this.syncPages();           // the address does not
  this.record({ … kind: "page.rename", … });
});
```

So the address recorded the name the page had for the two seconds before she typed
over it.

## Do the siblings have it too?

| | |
| --- | --- |
| site builder › pages | **the defect** |
| email builder › templates | **not applicable** — a template has no address; `renameTemplate` renaming only the name is correct there |
| `setPageSlug` | already correct — normalizes and de-dupes; it was simply never called |

Checked both routes into a page: the **+** button (defective) and
`addPage("Fees")` with a name, which a host can call and which was always right. So the
defect only ever hit the route a person uses.

## The fix

**The address follows the name, but only while nobody has chosen an address.**

```ts
const wasDerived = page.slug === slugify(page.name);
…
page.name = value;
if (wasDerived && page.slug === slugify(previous)) this.setPageSlug(id, value);
```

The test for "nobody has chosen" is exact rather than a flag: the slug still being
`slugify(oldName)` means it was derived and never touched. Set an address by hand —
`/prices` on a page called "Fees" — and this leaves it alone, forever, because the two
no longer match.

It routes through the existing `setPageSlug`, so the new address is normalized and
de-duped against the other pages for free, and it emits its own `page.setSlug` op
rather than being folded into the rename, so a collaborating host sees the address
change as the distinct fact it is. Both land inside one `transact`, so it stays **one
undo step**.

**And `slugify` stopped turning an apostrophe into a word break:**

```
before:  "Marlene's story"  →  /marlene-s-story
after:   "Marlene's story"  →  /marlenes-story
```

`/marlene-s-story` reads as three words, one of which is the letter s. Both the
typewriter `'` and the typographic `’` are dropped, because a page named in a word
processor carries the curly one and nobody can see the difference.

## Confirmed by

Re-ran act 8's setup as Marlene — seven pages created with the **+** button and named
by typing, then published:

```
Home                 →  /
Classes & timetable  →  /classes-timetable
Fees                 →  /fees
Our teachers         →  /our-teachers
Term dates 2026/27   →  /term-dates-2026-27
Marlene's story      →  /marlenes-story
Find us              →  /find-us
```

`Term dates 2026/27` survives both the space and the `/`. `Marlene's story` keeps its
apostrophe in the page list, the picker and the Navigator while the address stays
clean — checked both apostrophe characters.

**The other half of the rule — that a chosen address is never clobbered — driven, not
assumed:**

```
1. named it Fees:                  Fees → /fees
2. she sets the address /prices:   Fees → /prices
3. she renames it:                 Prices and fees → /prices

her chosen address survived: true
```

`pnpm verify` green across the builder. `e2e/collab-ops.spec.ts` (which asserts what
ops a real UI edit emits), `e2e/persistence.spec.ts` and `e2e/catalog.spec.ts` —
**10 tests, all passing**, with the extra `page.setSlug` op in the stream. Typecheck
clean across both packages.

## Rating effect

`Site builder › Pages panel — Ease 8 → 9` in [rating.md](../rating.md).
