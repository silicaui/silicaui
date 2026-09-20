# 059 — She named her page, pressed Enter, and the keyboard stopped working

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · the "without a mouse" standing check
**Surface:** Site builder › Pages panel · email builder › Templates panel
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

The standing check is *"creating a page, naming it, adding a heading and publishing —
keyboard only, with the ring visible the whole way."*

The first three-quarters is good. Tab reaches **Add page** with a ring on every stop
along the way, Enter opens the name field with focus already inside it, and typing a
name works. Then:

```
After Enter to commit the name:
  out  input "Page name"
                                 ← and nothing. No matching focus-in.
  {"active":"BODY — focus is nowhere"}
```

Focus is dropped on `document.body`. The same on Escape, and the same from the
**Rename page** button:

```
Rename page → Escape (cancel):
  IN   button "Rename page"
  out  button "Rename page"
  IN   input "Page name"
  out  input "Page name"
                                 ← nothing again
  activeElement: BODY — focus is nowhere
```

## What should have happened

Focus goes back to the button she pressed.

## How to reproduce

1. Open `http://localhost:5178/`. Tab to **Add page**, press Enter.
2. Type a name. Press Enter.
3. Before the fix: focus is on `document.body`. Tab starts over from the top.
4. Same with Escape, and same from the **Rename page** pencil.

## Why it matters

The name field **replaces** the switcher, so committing unmounts the focused element.
When a focused element is removed and nothing is told where focus should go, the
browser drops it on the body. For a mouse user this is invisible. For anyone else it
is the end of the interaction:

- **Keyboard only** — Tab restarts from the top of the document. She has just done
  the thing she came to do and is now further from her next step than before she
  started.
- **A screen reader** — loses its place entirely. There is no announcement, because
  nothing received focus to announce.

WCAG 2.4.3 (Focus Order) is the letter of it. The substance is simpler: she pressed
Enter and the keyboard stopped working.

It is worth saying what this is *not*. It is not the whole keyboard journey being
broken — measured end to end, the rest of it is genuinely good. Every real control
carries a visible ring and matches `:focus-visible`; **Add page** puts focus straight
in the name field, which is the thing
[044](044-one-click-and-one-enter-made-two-pages.md) fixed and which pays off twice as
much for someone who cannot point at it; the Insert panel opens with `ArrowRight` then
Enter on the tab strip (manual activation, the correct pattern); the Heading item is
reachable and Enter inserts it; Publish is reachable and works. One step in that chain
threw focus away.

## Where it lives

[packages/silicaui-builder/src/site/react/PagesPanel.tsx](../../../packages/silicaui-builder/src/site/react/PagesPanel.tsx)

```tsx
const commitRename = () => {
  if (active) editor.renamePage(active.id, draft);
  setRenaming(false);        // ← unmounts the focused <Input>. Nothing catches focus.
};
// …
onKeyDown={(e) => {
  if (e.key === "Enter") commitRename();
  else if (e.key === "Escape") setRenaming(false);   // ← same, on the way out
}}
```

## Do the siblings have it too?

| | |
| --- | --- |
| site Pages panel | **the defect** |
| email Templates panel | **the same defect** — it is a control-for-control twin, and its own header comment says so |
| the canvas's in-place text editor | correct — it blurs to a real element |
| the Inspector's fields | correct — they are not swapped out on commit |

Both panels are fixed here. It is the fourth time on this run that a rule held in one
place and not in its twin.

## The fix

Return focus to the control that opened the field, after the re-render:

```tsx
// The button's accessible NAME, not the element. React unmounts these buttons
// while the field is open and mounts fresh ones after, so a held element
// reference is always stale.
const cameFrom = React.useRef<string | null>(null);
const openNameField = () => {
  cameFrom.current = (window.document.activeElement as HTMLElement | null)?.getAttribute("aria-label") ?? null;
  setRenaming(true);
};
React.useLayoutEffect(() => {
  if (renaming || !wantFocus.current) return;
  wantFocus.current = false;
  const name = cameFrom.current;
  cameFrom.current = null;
  const back = name ? panel.current?.querySelector<HTMLElement>(`[aria-label="${name}"]`) : null;
  (back ?? switcher.current?.querySelector<HTMLElement>("button"))?.focus();
}, [renaming]);
```

Three things had to be right, and the first two versions each got one of them wrong:

**By name, not by element.** The first version stored `document.activeElement`. But
the rename/add/delete buttons are unmounted *while the field is open*, so by the time
focus is restored that reference points at a detached node — `isConnected` is false
every time and the fallback fires every time. Measured: focus went to the switcher,
never to the button she pressed.

**After the render, not in the handler.** A `useLayoutEffect` keyed on `renaming`,
because at the instant Enter is pressed the buttons do not exist yet.

**`preventDefault`, or the fix recreates issues/044.** Focus returns to **Add page**
while that same Enter keypress is still being processed — so without it, Enter lands
on the button and makes *another* page. The second version did exactly that:

```
After Enter to commit the name:
  IN   button "Add page"
  out  button "Add page"
  IN   input "Page name"          ← a second page, opened for naming
  {"page":{"name":"Page 3","slug":"/page-3"}}     ← her name went nowhere
```

**Blur deliberately does not restore.** `commitRename(restore)` is called with
`false` from `onBlur`: focus has already gone somewhere the person chose, and yanking
it back would be worse than dropping it.

## Confirmed by

Focus **events**, not sampled `activeElement` — that method already told me one lie
today (see below):

```
After Enter to commit the name:
  out  input "Page name"
  IN   button "Add page"
  {"active":"Add page","page":{"name":"Term dates 2026/27","slug":"/term-dates-2026-27"}}

Rename page → Escape (cancel):
  out  input "Page name"
  IN   button "Rename page"
  activeElement now: Rename page
```

Right button both times, correct name, no extra page.

Whole builder e2e suite **200 passed**, `pnpm verify` green across the workspace,
typecheck clean.

**A reading withdrawn.** The same pass reported *"one Tab press that lands on
nothing"* between the wordmark and the mode buttons. A `focusin`/`focusout` trace
showed no such stop, and enumerating the focusable elements showed the wordmark is the
**last** one in the document — so that Tab press leaves the page for the browser's own
chrome, which is what Tab is supposed to do at the end of a document. Not a defect.
The real one survived the same scrutiny, which is the point of applying it.

## Rating effect

`Site builder › Pages panel — Ease 9 → 10` in [rating.md](../rating.md).
