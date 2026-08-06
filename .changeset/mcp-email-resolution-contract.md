---
"@wizeworks/silicaui-mcp": minor
---

The catalog publishes the email host contract, which it never had at all

Path 3's `schema.json` has always carried a full `resolution` block — the hooks a host implements,
the unknown-vs-empty honesty rule, the `Resolved` shape. The email schema carried none of it. An
agent could call `list_email_nodes`, get every kind, every typed field, and the whole nesting matrix,
then have no way to learn how live data actually reaches the document it just authored.

Worse, it had no way to learn that **inline `{{ref}}` merge tokens exist**. `bindingNote` describes
the `data` markers and stops there, so the second substitution surface — the one that matters most
in practice, because prose is where merge fields actually live — was invisible. The only mention of
merge tags anywhere in the catalog was on the `html` kind, saying they pass through untouched, which
is true of that kind and misleading about every other.

`email.json` now carries `resolution`, parsed from `email/resolve.ts` with the same AST discipline
the rest of the file already used — so the hooks are the real signatures, not a description of them,
and a hook added later shows up without anyone remembering to write it down. That required moving
`parseTypes` above the email section; it now serves three sections instead of two.

Alongside it, a `tokens` note stating the part a host cannot guess: which fields are substituted
(`text.html`, `button.label`, `subject`/`preheader`), which deliberately are not (`html`, raw
passthrough), and that silica's token grammar is exactly one production — a bare dotted path.
Anything else is an expression handed to `resolveExpression` verbatim, so an ESP's fallback syntax is
the host's job rather than a silica bug. `get_email_node` carries the note per kind, since whether a
prose field is substituted is a local fact about the kind you're looking at.

`schema.json`'s diagnostic union picks up `unknown-expression` on its own, being generated.

`verify.mjs` gains six checks over the new block — every hook present, real signatures rather than
prose, the honesty rule, the path-vs-expression split, and the per-kind note.
