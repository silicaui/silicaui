---
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-behaviors": minor
"@wizeworks/silicaui-react": patch
---

**The Chat family and `Filter` are now authorable outside React.**

Thirteen Chat components landed as one unit — `Chat`, `ChatImage`, `ChatHeader`,
`ChatFooter`, `ChatBubble`, `ChatLayout`, `ChatLayoutMessages`,
`ChatMessageMetadata`, `ChatMessage`, `ChatSystemMessage`,
`ChatTypingIndicator`, `ChatToolCalls`, `ChatComposer`. Shipping half a family
is worse than shipping none: a consumer who finds `Chat` but no `ChatComposer`
hand-rolls the missing half in markup that then drifts from the React layer,
which is the exact failure the component registry exists to prevent.

Two of those reuse existing behavior rather than inventing new vocabulary:

- `ChatToolCalls` is structurally a collapsible, so it emits the existing
  `disclosure` behavior and the Collapsible part classes the CSS already
  targets.
- `ChatComposer` lowers to a real `<form>` with the existing `form` behavior,
  so a static page can actually send. React adds autoresize and Enter-to-send
  on top; without them it degrades to a normal textarea and submit button
  rather than to something broken.

**`Filter` turned out not to need a new behavior at all.** It was on the "needs
a behavior handler" list, but checking it against the existing vocabulary first
showed it *is* `toggle-group`: same single-select press semantics, same roving
focus, same `aria-pressed` buttons. The only delta was the reset control, which
is now an optional `close` part on that handler — the "one type, optional parts"
pattern, not a fork. Part names are scoped per behavior root, so `close` here
can't collide with a modal's. A plain toggle group with no reset is unaffected,
which is checked explicitly.

Every new interactive path is verified by driving it in jsdom — clicking the
tool-call disclosure open and shut, pressing chips, clearing them with the
reset, and confirming the reset hides itself when nothing is selected — not by
asserting a marker is present. All of it is locked in the byte-identical HTML
golden.

Also removes three `opacity-60` instances from the React layer (one live, two
in doc examples that were teaching the pattern) — the same RULE #3 defect the
CSS pass fixed, in a place a stylesheet sweep couldn't see.

Still deliberately absent from `-html`, each because it needs a genuinely new
`BehaviorType` rather than because it was overlooked: `Countdown` (a live clock;
the existing `counter` is a one-shot 0→target tween on scroll-in), `TagInput`
(text entry that emits removable tokens), and `PowerSearch` (faceted multi-term
query building, which `combobox` doesn't model).
