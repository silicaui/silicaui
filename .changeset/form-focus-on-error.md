---
"@wizeworks/silicaui-react": minor
"@wizeworks/silicaui-demos": patch
"@wizeworks/silicaui-mcp": patch
---

**Form: stop validation from stealing the caret mid-typing, and add `focusOnError`.**

Base UI's `Form` moves focus to the first invalid control and calls `select()`
on it, from two places: synchronously on an invalid submit, and from an effect
whenever `errors` changes after a submit that passed. The second fires on the
network's schedule — it lands while the user is typing in a different field,
yanks the caret out, and (thanks to `select()`) makes the next keystroke replace
what they had typed instead of appending to it. Upstream offers no opt-out.

Silica now narrows that move. By default it still focuses the first invalid
control on submit, but:

- it never selects the control's existing value — the caret goes to the end, so
  the next keystroke appends;
- a late `errors` update never takes focus from a text control the user is
  currently typing in; it scrolls the invalid field into view instead.

The new `focusOnError` prop softens it further — `"scroll"` reveals the field
without focusing, `false` leaves focus alone entirely:

```tsx
<Form focusOnError="scroll" errors={serverErrors}>…</Form>
<Form focusOnError={false} errors={serverErrors}>…</Form>
```

Covered by `verify-form-focus.mjs` (policy) and a new playground Playwright
suite (event-loop timing, which jsdom cannot reproduce).
