# 025 — `search_docs("status history")` returned nothing, and Timeline was right there

**Status:** fixed
**Severity:** major
**Found by:** P01 · Dilnoza Karimova · act 9
**Surface:** `@wizeworks/silicaui-mcp` › `search_docs`
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 9's premise is that the component she wants is missing or hiding under a name she
would never guess. For **Timeline** the premise did not hold, and that is worth saying
first: `timeline` found it on the **first try, one word, one result**, and it is also
browsable in the sidebar under "Data display". The site's ⌘K palette and the MCP server
both answered immediately.

The gap is in the words *around* it. Searching the way a freight operator describes the
thing rather than the way the library names it:

```
search_docs("status history")  -> []
search_docs("activity feed")   -> []
search_docs("audit trail")     -> []
search_docs("history")         -> []
```

Forty-one phrases a person would actually type were run against a live server.
**Thirty-three worked.** Eight returned nothing while the component sat right there:

| typed | wanted |
| --- | --- |
| `status history`, `activity feed`, `audit trail`, `history` | Timeline |
| `snackbar`, `toast message` | Toast |
| `loader` | Skeleton / Spinner |
| `user picture` | Avatar |

Two different causes, and separating them mattered:

1. **True synonyms.** `snackbar` and `toast` share no substring, so no amount of
   normalisation reaches it.
2. **The AND was too strict.** `toast` returns 12 and `message` returns 22, but
   **`toast message` returns 0** — no single entry carries both words. Adding one
   ordinary descriptive word turns a working query into an empty one.

## What should have happened

An agent handed `[]` does not retry with different words. It concludes the thing does not
exist and hand-rolls one — the exact RULE #1 violation this server exists to prevent. The
file already says so twice, in comments above two concept lists added for the same reason:

> *"custom color", "register" and "@plugin" all returned empty and an agent reasonably
> concluded the 8 semantic roles were the whole set — then refused to write `badge-brand`.*

Both of those were patched one concept at a time. This is the third instance of the same
failure, so it gets a mechanism rather than a third special case.

## How to reproduce

1. `pnpm --filter @wizeworks/silicaui-mcp build`
2. Call `search_docs` with `status history`, `snackbar`, or `toast message`.
3. `[]` every time.

## Why it matters

Timeline is findable; the concept of a timeline is not. The person most likely to search
in concept words rather than component names is the one who has never read the catalog —
which is exactly who a searchable catalog is for.

Issue 014 fixed the first layer of this (a two-word query matching nothing because the
whole string was tested verbatim). This is the layer under it.

## Where it lives

`packages/silicaui-mcp/src/server.ts` — the `search_docs` handler.

## Do the siblings have it too?

**The site's own ⌘K palette is fine** — `timeline` opened the Timeline page from the docs
index in one keystroke sequence. This is an MCP-server issue, not a docs-site one, and the
distinction matters: a human retries with different words, an agent does not.

Checked both search paths for each of the eight failing phrases.

## The fix

**An alias table**, for words that share no substring with what this library calls the
thing. Fifteen entries, every one of them from the measured run rather than invented:

```js
const ALIASES = { snackbar: ["toast"], loader: ["loading", "spinner"],
                  history: ["timeline"], audit: ["timeline"], … };
```

**Relaxation instead of an empty result.** When no entry matches every term, the query
drops one word and runs again — keeping the AND, and therefore the precision.

**OR was tried first and rejected on measurement.** It "fixed" all eight, and made the
answers worse: `toast message` returned 34 entries with Toast **nowhere in the first
eight**, because every `Chat*` component matches "message" and nothing ranked them. A
result set that buries the answer is barely better than an empty one.

**Which word to drop is decided by specificity, not position** — and trying position
proved it has to be. Dropping the *first* word is right for `status history`
(→ `history` → Timeline) and wrong for `toast message` (→ `message` → 22 Chat entries).
Dropping the *last* is exactly the reverse. Taking the relaxation with the **fewest**
results gets both right, because the word that narrows most is the word carrying the
meaning.

**A relaxed search says so.** The first entry becomes a `search-note` naming the ignored
word. A silent relaxation is its own small lie: the caller asked for two words, got
results, and would have no way to know one was dropped — `phone zzzznotathing` would read
as "zzzznotathing is a real thing in this library".

## Confirmed by

Run against a live server over real stdio, before and after:

| | before | after |
| --- | --- | --- |
| phrases returning nothing | **8 of 41** | **0 of 41** |
| `status history` | `[]` | 10 results, **Timeline at index 0** |
| `toast message` | `[]` | 12 results, all toast |
| `snackbar` | `[]` | 12 results |
| `user picture` | `[]` | 2 results |

**Nothing that worked before changed.** `date picker` 11, `dropdown menu` 14, `modal` 5,
`popup` 26, `tooltip` 9, `carousel` 28, `wizard` 24 — all identical to the baseline run.
Only `loading state` (2 → 3) and `event log` (1 → 2) moved, both through an alias, both
correct.

**An existing check went red, and that was the fix working.** `verify.mjs` asserted
`search_docs("phone zzzznotathing").length === 0`. The relaxation broke it. Rather than
delete it, it was **replaced with a stronger test of the same intent**: empty was only ever
a proxy for "the tool did not quietly pretend the nonsense word matched", and the
`search-note` tests that directly. A third check asserts a query with *no* real word still
returns nothing.

Eight new checks assert each measured phrase finds its component **in the results** — not
merely that something came back, because `status history` returning 43 entries with
Timeline buried at index 30 is the same failure wearing a number.

`node verify.mjs`: **exit 0**. `pnpm verify` across the workspace: **exit 0**.

## Rating effect

None recorded — this is a server, not a screen.
