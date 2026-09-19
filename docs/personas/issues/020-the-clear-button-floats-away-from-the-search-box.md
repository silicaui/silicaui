# 020 — Giving the search box a width sent its clear button to the other side of the screen

**Status:** fixed
**Severity:** major
**Found by:** P01 · Dilnoza Karimova · act 6
**Surface:** `@wizeworks/silicaui-react` › `SearchInput`, `PasswordInput`
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** P01 act 6, on `localhost:4099`

## What happened

The shipments filter is a `SearchInput` sized the obvious way:

```tsx
<SearchInput className="w-full sm:w-96" … />
```

Typing into it puts the clear (×) button **718 pixels to the right of the field**, alone
against the far edge of the page, with nothing around it. Measured:

| element | left | right | width |
| --- | --- | --- | --- |
| `.input-group` (the wrapper) | 280 | **1414** | 1134 |
| `<input>` — where my class landed | 280 | 664 | 384 |
| the × button | **1382** | 1406 | 24 |

The rendered structure explains it exactly:

```html
<div class="input-group">                      ← full width; positions the affixes
  <input class="input … w-full sm:w-96">       ← my className landed HERE
  <div class="input-group-end"><button>×</button></div>
</div>
```

`className` goes to the inner `<input>`. The group — which is the thing that actually
lays out the search icon and the clear button — keeps its own width and the affixes stay
pinned to its edges.

## What should have happened

`className="w-96"` on a `SearchInput` should make the search input 96 wide. It is the
first thing anyone types, and it takes the component apart.

## How to reproduce

1. `<SearchInput className="w-96" />` in a container wider than 384px.
2. Type anything, so the clear button appears.
3. The × renders at the container's right edge, not the field's. Every time, both themes,
   any width where the container is wider than the class.

## Why it matters

Not cosmetic — it reads as a broken component, and the cause is invisible from the call
site. Dilnoza's own diagnosis was that `SearchInput` was buggy; it took reading the DOM to
see that her class had gone somewhere she did not put it.

It is also the one prop everybody uses. A component that mis-renders on `className` is
mis-rendering on its most common input.

## Where it lives

`packages/silicaui-react/src/search-input.tsx` and `password-input.tsx`. Both build
`classes` including `className` and hand it to the `<input>`, then wrap in a bare
`<InputGroup>` that receives nothing.

## Do the siblings have it too?

**Four components render an `InputGroup`. Two own the pattern, two have the defect.**

| | |
| --- | --- |
| `SearchInput` | **affected** — measured above |
| `PasswordInput` | **affected** — identical source shape: `className` → `classes` → `<input>`, `<InputGroup>` bare |
| `InputGroup` | not affected — it *is* the wrapper, and takes `className` correctly |
| `Field` | not affected — composes a group the caller assembles |

**`PasswordInput` is READ, not measured.** The source is the same three lines, but this
run has no password field on screen yet, and "the sibling has it too" is not a claim to
make from reading. The sign-in screen is on this persona's build inventory and both get
measured there before this issue is marked confirmed.

## The fix

Send `className` to the `InputGroup` — the component's actual outer box — and add
`inputClassName` for the rarer case of styling the field itself.

**Not `wrapperClassName`**, even though `Table` sets that precedent, and the difference is
worth stating. On a `Table` the `<table>` IS the component and the scroll `<div>` is an
implementation detail, so `className` on the table is right and the wrapper needs an
escape hatch. Here it is the reverse: the group is the visible control and the bare
`<input>` is the part nobody points at. A new opt-in prop would also only help the people
who already know — everyone else keeps breaking it silently, which is what makes this a
defect rather than a missing feature.

The move is a behaviour change, so it is called out in the changeset. In practice most
existing `className` uses are typography (`font-mono`, `text-center`), which inherit from
the group to the field and land the same either way.

## Confirmed by

**Re-ran the filter on the shipments table**, same markup, `className="w-full sm:w-96"`:

| | before | after |
| --- | --- | --- |
| `.input-group` | 280 → **1414** (1134 wide) | 280 → **664** (384 wide) |
| `<input>` | 280 → 664 | 280 → 664 |
| the × button | at **1382** | at **632** |
| distance from the field's right edge | **+718px** | **−32px, inside it** |

The group now takes the width class and the clear button sits in the field where it
belongs.

**The sibling claim was measured, not left as a reading.** `PasswordInput` needed a real
password field, so the sign-in screen from this persona's build inventory was built to get
one. Two attempts were needed to test it honestly:

1. `className="w-full"` in the `max-w-sm` sign-in column showed **no defect** — `w-full`
   cannot narrow anything, and the group was already the column's width. Reporting that as
   a pass would have been wrong.
2. The real condition is a **narrowing** class in a **wider** container. With the old
   routing reproduced exactly (`inputClassName`, i.e. class on the `<input>`, group bare)
   in a `max-w-4xl` column: group **896px**, input **384px**, show/hide toggle at 1263 —
   **480px adrift**, outside the field.

Same defect, same cause, now demonstrated rather than inferred. With `className` routed to
the group: group 384, input 384, toggle 8px inside the right edge.

**Restored afterwards** — the sign-in column back to `max-w-sm` and `className="w-full"`.

**One thing found while building that screen, and fixed:** sign-in was rendering *inside*
the console chrome, nav and all. Moved the console pages into a `(console)` route group
with their own layout so the sign-in screen stands alone — act 10's stranger would have
noticed a signed-out page showing the app's navigation.

## Rating effect

—
