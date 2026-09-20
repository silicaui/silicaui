# 078 — Two regexes that could never match, one of them inside a test

**Status:** fixed
**Severity:** medium
**Found by:** P04 · Reuben Halloway · while fixing [076](076-the-email-projector-emitted-any-url-it-was-handed.md)
**Surface:** `probe-email.ts`, and a shipped verifier in `@wizeworks/silicaui`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Writing [076](076-the-email-projector-emitted-any-url-it-was-handed.md)'s fix, the
new probe check failed and the code looked right:

```ts
return html.replace(/<a\b([^>]*)>/gi, …)
```

It is not right. Read as bytes:

```
"return html.replace(/<a\b([^>]*)>/gi, …"
                          ^^ one character, U+0008
```

A **literal backspace**, where `\b` — the word-boundary assertion — was meant. A
scripted edit had written the escape sequence as the byte it names. `<a`
followed by U+0008 matches nothing, in any input, ever.

Which raised the obvious question: where else?

## What the sweep found

Scanning every `.ts`, `.tsx`, `.mjs` and `.md` in the repo for C0 control
characters outside the normal three, and ignoring vendored `node_modules`:

| File | What was in it |
| --- | --- |
| `probe-email.ts` | **two** literal backspaces, inside a live test assertion |
| `packages/silicaui/scripts/verify-readable-ink.mjs` | one, in a **shipped** verifier's pattern |
| `src/email/react/Inspector.tsx` | a raw NUL where an escaped U+0000 was meant |
| `src/site/react/Navigator.tsx` | the same |
| `packages/silicaui-html/verify-url-floor.mjs` | the same |

The last three are harmless — a raw NUL inside a string literal is the same
*value* as an escaped U+0000, just unreadable in source and liable to upset a tool that
reads the file. The first two are not.

## The one that matters

`probe-email.ts`, in the link-groups section:

```ts
return anchors === 9 && !/<a\b[^>]*>\s*<(div|table|tr|td)\b/.test(html);
```

Both `\b`s were backspaces. So the regex never matched, `.test()` was always
`false`, `!false` was always `true`, and **half of that assertion was decoration.**
The check read as though it proved the projector never wraps block content in an
anchor — the exact defect the link-group design exists to avoid, and the reason
the one-`<a>`-wrapper projection was rejected in the first place. It proved
nothing.

It went green every run, which is the whole problem.

## Why it matters

This framework's second rule is *never present absence as measurement*. A check
that cannot fail is absence wearing a tick. It is worse than no check, because
no check leaves a visible gap and this one fills it.

It is also the second one this run. Act 6 had
`check("the subject line resolves against the same scope", true)` — a literal
`true`, a placeholder I wrote and then deleted. Same shape, different cause: one
was a stub I forgot, this one was an editing accident nothing could see.

## Where it lives

[packages/silicaui-builder/probe-email.ts](../../../packages/silicaui-builder/probe-email.ts)
[packages/silicaui/scripts/verify-readable-ink.mjs](../../../packages/silicaui/scripts/verify-readable-ink.mjs)

## The fix

Every one replaced with the escape it was meant to be. Then the repaired
assertion was checked for the thing it was supposed to check:

```
matches a block-wrapping anchor:            true
ignores an inline anchor:                   true
the BROKEN version matched a block anchor:  false
```

The verifier one is worth naming separately because it ships. Its pattern lists
the class-name fragments that mean "this is decoration, not text":

```js
const PROBABLY_NOT_TEXT = /icon|glyph|arrow|chevron|caret|divider|separator|-sep\b|handle|…/
```

`-sep\b` was `-sep` plus a backspace, so that alternative was dead and any class
ending `-sep` was **not** being exempted. It was over-reporting, not
under-reporting — the safe direction — but it was still not doing what it said.

## Confirmed by

```
  ✓ an unsafe anchor inside a text block loses its href     (076's check, now live)
  ✅ email engine: all checks passed
```

The repaired link-group assertion still passes, so the projector was right all
along — it simply had not been asked. And the sweep now reports clean:

```
packages/silicaui-builder/src/email/react/Inspector.tsx   clean
packages/silicaui-builder/src/site/react/Navigator.tsx    clean
packages/silicaui-builder/probe-email.ts                  clean
packages/silicaui/scripts/verify-readable-ink.mjs         clean
packages/silicaui-html/verify-url-floor.mjs               clean
```

## The class is closed, not just the instances

A one-off sweep finds the ones that exist today.
`scripts/verify-no-control-chars.mjs` is now the second thing `pnpm verify` runs.
It fails on any C0 control character outside tab, newline and carriage return in
any source file, and names the file, the line and the code point.

It earned its place immediately. Run for the first time, it found **two more**
the hand sweep had missed:

```
  packages/silicaui-react/src/command-palette.tsx:215  U+0000
    …<div key={groupKey ?? " "} className={cx(sc("command-palette-gr…
```

A raw NUL in a **shipped React component's** React key. Harmless — the key is a
sentinel for "this group has no name" and the value is right — but it is the
same accident in the same week, in a package every consumer imports.

And it found one **in itself**. The first version wrote its own pattern as a
character class of unicode escapes, and those escapes were written as the bytes
they name: the exact defect, inside the file built to catch it, on the day it
was written. It builds the test from code points now, with a comment saying why.

## Also recorded, not fixed

**Vendored and built output is skipped by design** — a minifier emits control
bytes legitimately, so `node_modules`, `dist`, `.next` and the persona
artifacts' own dependency trees are not walked. The skip list is at the top of
the script and is the place to look if something ever seems un-caught.

## Rating effect

None — this is test integrity, not a screen.
