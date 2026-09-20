# 051 — To link her nav to a page, she had to already know its address

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · act 8, publishing
**Surface:** Site builder › Inspector › Settings › Link
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

One of her named deliverables is **"Site nav: every page reachable, and the current
page obvious."** She had seven pages. The published site's nav looked like this:

```
SilicaUI   Product   Pricing   Docs   Company   Sign in   Get started
href="#"   href="#"  href="#"  href="#"  href="#"  href="#"  href="#"
```

Seven links, none of them hers, every one pointing at nothing.

So she selected a nav link and looked at the Inspector. Under **Settings › Link** there
was one field:

> **URL** — placeholder: `https:// or /page or #anchor`

A text box. Nothing on the screen named a single one of her pages, and nothing named a
single one of their addresses. Measured:

```
any <datalist> of her pages:              false
does anything on screen name one of her pages:  false
```

She was expected to type the address from memory. With
[050](050-every-page-she-made-had-the-address-page-5.md) still in place those addresses
were `/page-2` … `/page-7`, which she had never seen anywhere.

## What should have happened

The builder knows every page, its name and its address. It should offer them.

## How to reproduce

1. Open `http://localhost:5178/`, add a few named pages.
2. Switch to **Layout**, click a link in the header.
3. Open **Settings** in the Inspector, find **Link › URL**.
4. Before the fix: an empty text field and no mention of her pages anywhere.
5. Every time, both themes.

## Why it matters

This is the persona where a word only we use is a blocker. Here it is worse than a
word — it is a **value** only we know:

- **A guess produces a link that looks perfect and goes nowhere.** No error, no
  warning, correct styling, working hover. That is the exact shape of
  [034](034-plain-relative-urls-are-silently-deleted.md), reached from the other
  direction: there the code deleted a good URL, here the person supplies a bad one.
- **She cannot check her work.** There is no list to compare against.
- **It is the last step of the whole job.** Seven pages of real content are worth
  nothing if the nav does not reach them, and this is the step between her and
  finishing.

## Where it lives

[packages/silicaui-builder/src/site/react/Inspector.tsx](../../../packages/silicaui-builder/src/site/react/Inspector.tsx) — `LinkSection`.

```tsx
<Row label="URL">
  <CommitInput … placeholder="https:// or /page or #anchor"
    onCommit={(v) => editor.setAttr(id, "href", v || undefined)} />
</Row>
```

`usePages()` was already available in the same file's neighbourhood, returning exactly
`{ id, name, slug }` for every page. The Inspector simply never asked.

## Do the siblings have it too?

**Checked every field in the builder that takes an address or a name the author would
have to know.**

| | |
| --- | --- |
| Inspector › Link › URL | **the defect** |
| Wordmark's `href` (`element-props`, `label: "Link"`) | same shape, same fix would apply — **not** changed here, because it is a props-table entry rather than the Link section, and changing the shared props table to know about pages is a bigger seam than this issue needs. Recorded, not implied. |
| Data binding › "Fallback href" | correct as free text — it is a fallback for a host action, not a page link |
| email builder › link fields | **not applicable** — an email has no pages to link to |

## The fix

Offer her own pages, by address, with the page's name beside each one:

```tsx
<CommitInput … list={listId} placeholder="Pick a page, or type https:// or #anchor" … />
<datalist id={listId}>
  {pages.map((p) => <option key={p.id} value={p.slug} label={p.name} />)}
</datalist>
```

**The field stays free text on purpose.** A link may point anywhere — an external site,
an anchor, a phone number — so this removes the need to *know* an address without
removing the ability to type one. A `<datalist>` is the native control for exactly
that: it suggests, it does not constrain, and it is keyboard-navigable and
screen-reader-announced without any work.

`CommitInput` gained one optional `list` prop, so every other field in the Inspector is
untouched.

The placeholder changed from `https:// or /page or #anchor` to **`Pick a page, or type
https:// or #anchor`**, because a control that can be picked from should say so.

## Confirmed by

Driven as Marlene: seven pages created and named, then a nav link selected in Layout
mode with **Settings** open.

**What the field now offers her:**

```
/                        Home
/classes-timetable       Classes & timetable
/fees                    Fees
/term-dates-2026-27      Term dates 2026/27
/marlenes-story          Marlene's story
/find-us                 Find us
```

Every page, by address, with her own name for it beside it.

**Then the whole way through to the visitor.** She picked `/term-dates-2026-27`,
retyped the link's text to "Term dates", and published. The HTML the host received:

```json
{ "href": "/term-dates-2026-27", "text": "Term dates" }
```

and `/term-dates-2026-27` is a real page in the same payload — so the link resolves,
which is the thing a typed guess could not guarantee.

`pnpm verify` green across the builder. `e2e/collab-ops.spec.ts`,
`e2e/persistence.spec.ts` and `e2e/catalog.spec.ts` — 10 tests, all passing. Typecheck
clean.

**A note on what is still hers to do.** This fixes *finding* an address. The six other
nav links still say "Product / Pricing / Docs / Company" and point at `#` until she
edits them, because the seed frame is demo content and replacing it is authoring, not a
defect. What has changed is that the job is now possible without knowing anything she
was never shown.

## Rating effect

`Site builder › Inspector › Settings — Ease 5 → 8` in [rating.md](../rating.md).
