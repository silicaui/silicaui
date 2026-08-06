---
"@wizeworks/silicaui-builder": minor
"@wizeworks/silicaui-html": minor
---

An email token silica can't parse now belongs to the host, instead of surviving as literal braces

Silica's inline merge-token pass matched exactly one thing: a bare dotted path, `[a-zA-Z0-9_.]+`. A
token carrying anything else — an ESP's documented fallback syntax, say
`{{customer.firstName ?? "there"}}` — didn't match, so the scanner never saw it. It rode through
projection untouched and rendered as raw `{{` `}}` in the canvas's Preview.

The send was fine, because a host that runs its own interpolation pass over the projected HTML
understands its own syntax. That is exactly what made this bad: the author edited an email that
looked broken, previewed an email that looked broken, and shipped an email that was correct. Preview
is supposed to be the answer to "what will they actually get" — and there was no seam to fix it
from outside, because text tokens never reached the host at all. Silica matched and substituted them
itself, or silently did nothing.

### The grammar was the wrong thing to widen

The obvious repair is to teach the regex about `??`. That answer is wrong twice over: it is `??`
today, a `|` filter next, a conditional after that, and each one makes silica the owner of an
expression language it has no business parsing — while still being wrong for the host whose syntax
differs from whatever got hardcoded.

So the token pass is now split into a **scanner** and a **grammar**. `TOKEN_RE` finds every `{{…}}`
an author typed, deliberately lenient about the contents. `TOKEN_PATH_RE` — byte-identical to the
pattern this file always matched — decides who owns it. A bare path still resolves through
`resolveBinding`, exactly as before. Anything else is an EXPRESSION and goes to a new optional hook:

```ts
interface EmailResolveHost {
  resolveExpression?(expr: string, scope: DataScope): Resolved | undefined;
}
```

The host receives the expression with its braces stripped and its outer whitespace trimmed, and
nothing else done to it — no tokenizing, no unquoting, no evaluation. A host that already evaluates
this syntax on the way out reuses that same evaluator here and gets an identical answer on the
canvas, which is the entire point: preview == production, structurally, without silica knowing what
`??` means.

It carries the same three-state contract as `resolveBinding`. `undefined` means "I don't speak this"
— the literal `{{…}}` stays exactly as authored and a diagnostic fires, the same keep-what-was-authored
rule as everywhere else. A known-but-empty resolution elides. Escaping is shared, so an expression's
value is escaped inside `TextNode.html` and is not double-escaped in a button label, subject, or
preheader.

`ResolveDiagnostic` gains **`unknown-expression`**, distinct from `unknown-ref` on purpose: a
misspelled field and a syntax nobody wired need different fixes, and an editor badging
`{{a ?? "b"}}` as an unknown reference would be lying about which one it is.

Additive in both directions. A host with no `resolveExpression` gets precisely the passthrough it
gets today, plus a diagnostic it is free to ignore. A host implementing only `resolveExpression`
works too. Edit mode still shows authored source for every token, path and expression alike — the
canvas edits the document, it does not resolve it, and that has not changed.

### `src=""` no longer survives the sanitizer

`isSafeUrl("")` returned true, so an empty URL attribute passed through. Not a security question — a
correctness one: the empty string resolves to the *current document*, so `<img src="">` makes the
client re-fetch the whole page and then draw a broken-image icon for it. It is never a value anyone
meant.

It was also already contradicted by the code around it. `canvasAttrs` substitutes a placeholder when
an Image has no `src`, so an unset image stays visible and selectable while authoring, and its
comment already claimed production markup omitted the attribute — which the empty-string carve-out
quietly made untrue. Now it does. An unset image gets the placeholder on canvas instead of a broken
icon, and the attribute is absent from output.

### Verified

`probe-email` gains fifteen checks covering the seam end to end: a `??` fallback resolving, the exact
string the host is handed, paths never reaching `resolveExpression`, escaping in both directions,
per-item scope inside a repeat, an unhandled expression keeping its literal source, both
backward-compatibility directions, and the resolved output of `toEmailHtml` — the surface where this
was actually reported.
