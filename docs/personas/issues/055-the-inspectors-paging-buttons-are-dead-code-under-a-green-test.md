# 055 — The Inspector's paging buttons are dead code, and a test was holding them up

**Status:** partly fixed — the test now tests the live control; the dead code is left for its owner
**Severity:** minor
**Found by:** P03 · Marlene Okonkwo-Bright · act 8, while widening the right rail
**Surface:** Site builder › Inspector tab strip · `shared/react/chrome.tsx`
**Filed:** 2026-09-19
**Fixed:** — (see **The fix**)
**Confirmed by:** see below
**Blocked on:** — (the dead-code removal belongs to whoever is mid-refactor in `chrome.tsx`)

## What happened

`e2e/host-seam.spec.ts` asserts that when the Inspector has more tabs than fit, paging
buttons appear:

```ts
const right = page.getByRole("button", { name: "Scroll tabs right" });
await expect(right).toBeVisible();   // ✗ element(s) not found
```

The buttons **are** there. They are labelled something else:

```json
"scrollButtons": [
  { "label": "Scroll tabs back",    "x": 1007, "w": 32 },
  { "label": "Scroll tabs forward", "x": 1218, "w": 32 }
],
"inspectorStrip": { "x": 1043, "w": 171, "client": 171, "scroll": 725 }
```

Those x-positions bracket the strip, so they are the Inspector's own. The reason the
words differ is that **there are two implementations, and the one the spec tests no
longer renders**:

| | label | renders |
| --- | --- | --- |
| `TabsList` → `ScrollStripControl` (`@wizeworks/silicaui-react`) | "Scroll tabs **back** / **forward**" | **yes** |
| `chrome.tsx` → `PageButton` | "Scroll tabs **left** / **right**" | **no** |

`TabsList` grew its own scrolling. `chrome.tsx` still computes
`const paging = overflow.left || overflow.right` against a scroller that no longer
overflows — because the inner `TabsList` is the thing that scrolls now — so `paging` is
always false and both `PageButton`s are unreachable.

## What should have happened

A test that says "the paging buttons mount" should fail when they do not. This one was
failing for a reason that had nothing to do with paging: a string.

## How this was found, and what it is NOT

It surfaced while re-running the suite after
[040](040-the-left-rail-can-be-dragged-narrower-than-its-own-tabs.md) widened the right
rail. **The failure is not caused by that change**, and the check was explicit:

```
git status --porcelain shared/react/chrome.tsx  scroll-strip.tsx  tabs.tsx
(no output — all three unmodified)
```

The mismatch is between two label strings, in two files neither of which this run
touched. Widening the rail changed *whether* the tabs overflow; it could not change
what the buttons are called. The spec would have failed on a clean tree.

Filed rather than quietly fixed because the honest finding is not "a string is wrong" —
it is **"a UI control has no callers and a test was making it look alive"**, which is
one of the failure modes this framework exists to catch, found in our own code.

## Why it matters

Small, and worth writing down:

- **Nobody is hurt today.** The arrows work; only their name changed. Marlene pages
  through the tabs fine.
- **The test was not testing what it claimed.** It has been red on a label, so whatever
  it was protecting has been unprotected for as long as that has been true.
- **`chrome.tsx` carries ~25 lines that cannot run**, including an `overflow`
  measurement and a scroll handler, which the next person to read that file will treat
  as live.

## Do the siblings have it too?

| | |
| --- | --- |
| Inspector tab strip (site builder) | **the defect** |
| left rail tab strip | same `chrome.tsx` component, same dead `PageButton` |
| email builder | same component again |
| `ScrollStrip` itself | correct — it is the one doing the work |

One component, three call sites, one dead branch in all of them.

## The fix

**Done here:** the spec now names the control that exists, with a comment saying why:

```ts
// The labels are `ScrollStrip`'s — "back"/"forward", not "left"/"right" — because
// `TabsList` grew its own scrolling and now supplies these controls. `chrome.tsx`
// still carries a `PageButton` pair labelled left/right, and it no longer renders:
// this spec was asserting the dead one and had been failing on that string alone.
const left = page.getByRole("button", { name: "Scroll tabs back" });
const right = page.getByRole("button", { name: "Scroll tabs forward" });
```

**Deliberately NOT done here:** deleting `PageButton` and the `paging`/`overflow`
machinery around it. That is a live refactor area — `TabsList` absorbing the scrolling
is recent — and removing a sibling's scaffolding while they are standing on it is how
two people undo each other's work. It is one commit for whoever owns that file, and
this issue is the note that it is waiting.

## A second, smaller thing fixed alongside

The same test needs the tabs to actually overflow, and after the rail gained its 256px
floor the demo host's **six** tabs fit. Two more (`Permissions`, `Integrations`) were
added to the demo host so the test still exercises overflow rather than passing because
there is nothing to page through — which would have been the same category of mistake
as the one above.

## Confirmed by

```
e2e/host-seam.spec.ts — 21 passed
```

Measured first, from the real DOM at the spec's own viewport (1280×720, `?host=demo`),
rather than adjusting the test until it went green: 8 tabs, a strip 171px wide holding
725px of content, and two controls bracketing it at x=1007 and x=1218.

## Rating effect

None — this is chrome the customer never names.
