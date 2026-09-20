# 041 — The rail told Marlene she had put an "AvatarGroup" on her page

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · act 1, the first ninety seconds
**Surface:** Site builder › Navigator (and the component palette) · `@wizeworks/silicaui-html` component registry
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Marlene is 58, runs a dance studio, and has never seen a developer tool. In her first
ninety seconds she read the left rail out loud and got to words like:

> **AvatarGroup** · **AppShellSidebar** · **ChatLayoutMessages** · **NavigationMenu** ·
> **InputGroup** · **MockupBrowser** · **FieldsetLegend** · **BlockquoteCite**

These are not shortened words or jargon she could learn. They are **the registry's
internal keys**, printed on screen. Two words shoved together with a capital letter in
the middle is not something she has ever seen written down.

**33 components did this.** Measured, not estimated — see below.

The thing that makes it a `major` rather than a `copy` fix is that the builder's own
code already knows better. [memory `navigator-business-user-naming`] records a
deliberate design commitment to plain-English naming in this rail, and the Navigator's
own source comment says the rail *"is meant to hold none"* of the machine vocabulary.
The rail had a `humanize()` function. It sat **one package away** from the line that
broke the rule.

## What should have happened

Every row in the Navigator reads as English. `AvatarGroup` is "Avatar group".
`AppShellSidebar` is "App shell sidebar". This is not a nicety — it is the stated
contract of this rail, written down before this run started.

## How to reproduce

1. Open `http://localhost:5178/` with an empty document.
2. Open the component palette and scroll.
3. Read the entries. Before the fix, 33 of them were raw keys.
4. Insert any of them. The Navigator row showed the same raw key.
5. Every time, both themes, every width.

## Why it matters

Marlene's whole job here is to recognise her own page in a list. A row she cannot
pronounce is a row she cannot use:

- She cannot **search** for it — she would not type `AvatarGroup`.
- She cannot **ask about it** — she cannot say it on the phone to her niece.
- She cannot **trust it** — an unreadable word is how software tells someone they are
  in the wrong place.

It also silently taught her that this rail is not for her, in the first ninety
seconds, which is the exact moment this persona exists to observe.

## Where it lives

- [packages/silicaui-html/src/component.ts](../../../packages/silicaui-html/src/component.ts) — `elementDef`, which defaulted `label: name`
- [packages/silicaui-builder/src/site/node-display.ts](../../../packages/silicaui-builder/src/site/node-display.ts) — where a `humanize()` already existed, and was never reached by these

The registry has 237 components. Most carry an explicit hand-written label
(`SidebarTrigger` → "Sidebar toggle", `FilterItem` → "Filter chip", `TabsTab` →
"Tab"). The ones created through `elementDef` had no label at all, so the default
`label: name` shipped the key.

## Do the siblings have it too?

**This IS the sibling defect** — the eighth instance this run-series of *"the fix
already exists in a sibling and did not travel."*

The builder had the right function. The registry had the wrong default. The two never
met, because the label was decided in `silicaui-html` and the humanizing was done in
`silicaui-builder`, one layer too late to help the component palette at all.

Checked all four consumers of the registry:

| consumer | had the defect |
| --- | --- |
| site builder › component palette | yes — read `label` directly |
| site builder › Navigator | yes |
| email builder › palette | yes, same registry |
| `listComponents()` (public API) | yes — any host embedding the builder got the keys too |

## The fix

The label belongs where the component is declared, not in one of its four readers.
`humanize()` moved to `silicaui-html` as an exported `humanizeKey`, `elementDef` calls
it, and the builder re-exports the one copy rather than keeping a second:

```ts
export function humanizeKey(key: string): string {
  const words = key.replace(/[-_.]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").trim().split(/\s+/);
  return words.map((word, i) => {
    if (word === word.toUpperCase()) return word;   // keep PIN, SVG, URL
    return i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word.toLowerCase();
  }).join(" ");
}
```

```ts
// Prose, not the key. `humanizeKey` is a no-op for the ones already spelled
// as a single word, so this only ever repairs the compound names.
label: humanizeKey(name),
```

`silicaui-builder/src/site/node-display.ts` now holds `const humanize = humanizeKey;`
— one implementation, two names, no drift.

An explicit label always wins; `humanizeKey` is only the default. All 204 hand-written
labels are byte-identical after the change.

## Confirmed by

**Measured both states, by building the package twice** and diffing the emitted
labels, rather than by counting what I expected to see:

```
components in the registry:            237
labels a person could not read, before:  33
labels a person could not read, after:    0
labels containing camelCase, after:       0
hand-written labels changed:              0
```

All 33, before → after: `AvatarGroup → Avatar group`, `AppShellSidebar → App shell
sidebar`, `ChatLayoutMessages → Chat layout messages`, `NavigationMenu → Navigation
menu`, `FieldsetLegend → Fieldset legend`, `BlockquoteCite → Blockquote cite`,
`MockupBrowser → Mockup browser`, `InputGroup → Input group` … (full list in the run
log).

**On the screen it was found on:** re-ran act 1 in the real Chrome on
`http://localhost:5178/`. Dropped an Avatar group onto the empty page — the Navigator
row now reads **"Avatar group"**. The palette reads the same. Checked in dark and at
360px; the rail truncates long ones with an ellipsis and a tooltip, which is the rail
behaving.

`pnpm verify` exit 0, 35 green probes. Both packages typecheck.

## Rating effect

`Site builder › Navigator — Ease 6 → 9` and
`Site builder › component palette — Ease 6 → 9` in [rating.md](../rating.md).
