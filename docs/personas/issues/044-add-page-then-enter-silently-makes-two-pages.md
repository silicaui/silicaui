# 044 — Marlene pressed Enter after "Add page" and got two pages

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · act 5, while making pages for her theme to reach
**Surface:** Site builder › Pages panel · and the email builder's Templates panel
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Marlene clicked **Add page**. A page appeared, called **"Page 2"**. That is not a
name, so she did the obvious thing — she pressed **Enter**, expecting to be typing a
name and confirming it.

She got **"Page 3"** and **"Page 4"**.

```
start:                          [ Home ]
after 1 click:                  [ Home, Page 2 ]
after 1 more click THEN Enter:  [ Home, Page 2, Page 3, Page 4 ]
```

**Add page** left focus on the Add page button. Enter on a focused button presses it
again. Nothing on screen said a page had been added, so she had two new pages, both
called nothing, and no reason to connect either to what she pressed.

## What should have happened

Naming the page is the next thing anybody does. Focus should be in the name field,
which also means Enter commits the name instead of firing the button a second time.

The **pencil** button beside it already does exactly this — `startRename()` swaps the
picker for an `autoFocus` `Input`. The behaviour existed, one button away, and adding
a page did not use it.

## How to reproduce

1. Open `http://localhost:5178/`.
2. Click **Add page** (the `+` at the top of the left rail).
3. Press **Enter**.
4. Open the page picker. There are two new pages, not one.
5. Every time, both themes, every width. Same in the email builder with **Add
   template**.

## Why it matters

This persona's stated fear, in her own words, is *"that I will break the site and not
know I have broken it."* This is that, on the second button she presses:

- The extra page is **silent** — no toast, no selection change she would notice.
- It is **named nothing**, so it does not stand out in a list of pages named nothing.
- She has **no model** connecting "I pressed Enter" to "there is an extra page", so
  she cannot undo it on purpose or describe it to anyone.

And the smaller harm underneath it: naming a page took **two separate discoveries** —
find `+`, then notice that a different button, the pencil, is how you name the thing
you just made.

## Where it lives

- [packages/silicaui-builder/src/site/react/PagesPanel.tsx](../../../packages/silicaui-builder/src/site/react/PagesPanel.tsx)
- [packages/silicaui-builder/src/email/react/TemplatesPanel.tsx](../../../packages/silicaui-builder/src/email/react/TemplatesPanel.tsx)

```tsx
<IconButton icon="plus" label="Add page" … onClick={() => editor.addPage()} />
```

`editor.addPage()` already returns the new id and makes it active. Nothing then moved
focus.

## Do the siblings have it too?

**Yes — the email builder's Templates panel is the same code with the nouns changed,
and it had the same defect.** Confirmed by driving it: `Add template` then Enter
produced two.

While checking it, the reverse also turned up — **the two panels each had a fix the
other was missing:**

| | site › Pages | email › Templates |
| --- | --- | --- |
| focus moves to the name field after Add | no | no |
| the rename `Input` has an accessible name | **no** | yes — `aria-label="Template name"` |

So the site builder's page-name field reached a screen reader as an unnamed text box,
while its twin had carried a name all along. That is the ninth instance this
run-series of *"the fix already exists in a sibling and did not travel"* — this time
in both directions at once.

## The fix

Adding opens the name field, in both builders:

```tsx
const addAndName = () => {
  editor.addPage();
  setDraft("");
  setRenaming(true);
};
```

The draft starts **empty**, not at "Page 4": she is naming the page, not editing a
placeholder. `renamePage` and `renameTemplate` both already ignore an empty value, so
pressing Enter or clicking away without typing keeps the generated name and nothing is
lost. That guard was already there; this just relies on it.

And the site builder's rename field gained `aria-label="Page name"`, matching its twin.

## Confirmed by

Re-ran the gesture as Marlene, in both builders:

```
===== site builder =====
start:                                        [ Home ]
focus after Add:      {"tag":"input","label":"Page name","value":""}
after Add then Enter:                         [ Home, Page 2 ]
after Add + typing "Marlene's story" + Enter: [ Home, Page 2, Marlene's story ]

===== email builder =====
start:                                        [ Email 1 ]
focus after Add:      {"tag":"input","label":"Template name","value":""}
after Add then Enter:                         [ Email 1, Email 2 ]
after Add + typing "Term dates" + Enter:      [ Email 1, Email 2, Term dates ]
```

**One click plus one Enter now makes one page**, and focus lands on a field that says
what it is. Naming a page is now a single gesture — click, type, Enter — instead of
two discoveries.

`Marlene's story` keeps its apostrophe through the new path, in the picker and in the
page list.

**RULE #7:** the email builder is P02's surface, so this was driven there as the same
job rather than assumed. `verify:email`, `verify:email-batch`, `verify:email-ops`,
`verify:email-frame` and `verify:email-lock` are all green, and `pnpm verify` is green
across the package.

## Rating effect

`Site builder › Pages panel — Ease 5 → 8` in [rating.md](../rating.md).
