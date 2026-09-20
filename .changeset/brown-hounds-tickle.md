---
"@wizeworks/silicaui": minor
---

`md` is 16px now. It meant 14px in a button, 13px in a toggle-group and 12px in a badge, and nobody chose that

**This changes how every sized component looks.** Read the migration note at the
bottom before upgrading.

Root `CLAUDE.md` RULE #3 says the body floor is 16px. Measured across every
component module, counting only DEFAULTS — the size you get without asking for
anything — **132 rules were under it, across 72 components**, including the base
rule of `.btn`, `.input`, `.select`, `.textarea`, `.table`, `.alert`, `.toast`,
`.badge`, `.tooltip`, `.tabs-tab`, `.menu` and `.label`. The system's default
control size was 14px.

And the ladders disagreed with each other. Sixteen components hardcoded their
own, and there were **nine different ladders** among them, so `md` meant
something different depending on which component you were looking at. Nothing
could see it: a font size is an ordinary literal in a module, and no two modules
are read together.

## What changed

One ladder, declared once in `src/component-type.js`:

```
xs  0.75rem   12
sm  0.875rem  14
md  1rem      16   ← the floor, and the default
lg  1.125rem  18
xl  1.25rem   20
```

146 rules across 56 components: 14 ladders re-based, 83 other rules raised to the
floor. `prose`, `pin-input` and `wordmark` keep their own ladders, by name and
with reasons, because theirs already start at or above the floor.

A probe holds it: every default must clear 16px, **and** every size variant must
match the shared ladder — because without the second rule `md` drifts back one
component at a time while the first still passes.

## Migrating

**Everything gets one step bigger by default.** If a screen was laid out around
14px controls, the fix is one prop:

```tsx
<Button>Save</Button>            // was 14px, is now 16px
<Button size="sm">Save</Button>  // 14px, as before
```

The same applies to `Input`, `Select`, `Textarea`, `Table`, `Alert`, `Badge`,
`ToggleGroup`, `FileInput`, `MultiSelect`, `SegmentField` and `TagInput`. Where
you relied on the old default, ask for `sm`.

If you had already written `size="lg"` to reach 16px, that is now 18px — drop the
prop.
