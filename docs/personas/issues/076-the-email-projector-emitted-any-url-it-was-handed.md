# 076 — The email projector emitted any URL it was handed, including `javascript:`

**Status:** fixed
**Severity:** critical
**Found by:** P04 · Reuben Halloway · standing check, "a boundary that should hold"
**Surface:** the email projector, and the canvas's Link button
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

The standing check is *"put `<script>`, `onerror=` and an `<iframe>` into a merge
token's value and into a rich-text field. Confirm the host sanitizer eats them."*

Typed as text, all three are escaped on entry and arrive as inert characters —
`&lt;img src=x onerror="…"&gt;`. That boundary holds, and holds properly.

The one that does not is the realistic one. `document.execCommand("createLink")`
— what the formatting bar's **Link** button calls — does not escape anything. It
builds a real anchor out of whatever URL it is handed:

```
the formatting bar's Link button, handed a javascript: URL
  ✓ nothing ran in the builder
  ✗ the projected email carries NO javascript: anchor
        — <a href="javascript:window.__pwned=99">
  · is it in the stored document — yes
```

Into the document, and out the other end into the composed email.

## What should have happened

The projector refuses to write a URL it would not follow itself, and the Link
button says so while he can still fix it.

## Why it matters

In an inbox this is close to harmless — no mail client runs a `javascript:`
href. The harm is one hop further on, and it is the hop every newsletter makes:
the **"view in browser"** page. That is the sender's own domain, rendering the
same composed HTML in a real browser, where `javascript:` on a click is live
script against whoever is signed in.

And the same projector output is what a host stores, re-serves and archives.

## The sibling it did not travel to

`@wizeworks/silicaui-html` has had the right answer all along, and it is a
careful one:

```ts
function isSafeUrl(value: string): boolean {
  // Test against a copy with ASCII whitespace and C0/DEL control characters
  // removed. The URL parser strips tab/LF/CR from anywhere in a URL […] so
  // `"java\nscript:alert(1)"` and `" javascript:alert(1)"` are `javascript:`
  // URLs to a browser even though neither looks like one to a naive
  // `startsWith`.
```

Every `href`, `src`, `srcset`, `cite` and `poster` the **site** projector writes
goes through it. It was `function`, not `export function` — so the email
projector, in a different package, could not reach it, and grew its own weaker
answer instead:

```ts
`<a href="${esc(node.href)}" …>`
```

`esc` stops a value breaking **out** of the attribute. It does nothing about the
value **being** dangerous. Two projectors, one guard, and only one of them
could see it.

## Where it lives

[packages/silicaui-html/src/element.ts](../../../packages/silicaui-html/src/element.ts) — `isSafeUrl`, now exported
[packages/silicaui-builder/src/email/projector.ts](../../../packages/silicaui-builder/src/email/projector.ts) — `safeUrl`, `stripUnsafeAnchors`
[packages/silicaui-builder/src/email/react/Canvas.tsx](../../../packages/silicaui-builder/src/email/react/Canvas.tsx) — the Link button

## The fix

**1. `isSafeUrl` is exported**, so there is exactly one answer to "is this a URL
we will emit" and both projectors ask it.

**2. Every URL the email projector writes goes through it** — a button's href, a
link group's href, an image's `src` and its own href, a social icon's url, a
video's thumbnail and href, and a section's VML background image. Nine call
sites, one helper:

```ts
function safeUrl(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v && isSafeUrl(v) ? v : undefined;
}
```

An unsafe URL is **dropped**, which is what `sanitizeElement` already does and
the same reasoning `renderImage` uses for an empty `src`.

**3. Anchors the author wrote inside a text block are checked too.** The href
comes off; **the words stay.** Deleting a sentence because one link in it was bad
is this framework's own "absence behaves like fine".

**4. The Link button refuses one, in his words**, rather than letting him believe
he made a link that quietly is not one:

> `"javascript:window.__pwned=99"` is not a web address this can link to.
>
> Links in an email can be a web address (https://…), an email address (mailto:…)
> or a phone number (tel:…).

## Confirmed by

The same boundary check, re-run:

```
the formatting bar's Link button, handed a javascript: URL
  ✓ nothing ran in the builder
  ✓ the projected email carries NO javascript: anchor
  · is it in the stored document — no
```

21 probe checks, and the negative half matters as much as the positive:

```
  ✓ a button href of "javascript:alert(1)" is dropped
  ✓ a button href of " javascript:alert(1)" is dropped
  ✓ a button href of "java\nscript:alert(1)" is dropped
  ✓ a button href of "JaVaScRiPt:alert(1)" is dropped
  ✓ a button href of "data:text/html;base64,PHNjcmlwdD4=" is dropped
  ✓ a button href of "vbscript:msgbox(1)" is dropped
  ✓ a button href of "https://shop.test/x" still goes out
  ✓ a button href of "mailto:hi@shop.test" still goes out
  ✓ a button href of "tel:+441179460000" still goes out
  ✓ a button href of "/relative/path" still goes out
  ✓ a button href of "photos/a:b.jpg" still goes out
  ✓ an unsafe image src is dropped, and the alt text survives
  ✓ an unsafe anchor inside a text block loses its href
  ✓ ...but keeps its words — the sentence is not deleted
  ✓ ...and a safe anchor beside it is untouched
  ✓ a hostile value delivered through a merge token is escaped, not executed
  ✓ a hostile URL delivered through a BIND is dropped too
  ✓ the guard changes nothing about an ordinary email
```

`photos/a:b.jpg` is in there on purpose: it contains a colon and is **not** a
scheme, and a guard that ate it would break every relative image path in the
product. That case is the reason this had to be the shared function and not a
new one.

**Deliberately broken to watch three fail** before restoring.

`pnpm verify` exit 0 workspace-wide, builder e2e **208 passed**, typecheck clean.

## What nearly hid this, and is worth its own paragraph

The first version of `stripUnsafeAnchors` did nothing at all, and the probe said
so immediately:

```
  ✗ an unsafe anchor inside a text block loses its href
```

The regex read `/<a\b([^>]*)>/gi` in the editor and contained a **literal
backspace character** where `\b` was meant — a scripted edit had written the
escape as a byte. `<a` followed by U+0008 matches nothing, ever.

That is the same class of defect as a check that always passes, and it led
straight to [078](078-two-regexes-that-could-never-match.md), which is the one
that was already in the tree.

## Also recorded, not fixed

**`HtmlNode` is still raw passthrough**, by design — it is the documented escape
hatch and its contract says the host sanitizes it. Unchanged here, and named so
nobody reads this issue as "all email HTML is now guarded".

**The site builder's `rawHtml` has the same contract** and the same note.

## Rating effect

`Email builder › Canvas` and every email output row in [rating.md](../rating.md).
