# 027 — `pnpm verify` goes red on a clean Windows checkout and blames a file that is correct

**Status:** fixed
**Severity:** major
**Found by:** P01 · during the re-pin, **not** by an act — see "How this was found"
**Surface:** `apps/site/scripts/gen-counts.mjs`, `apps/site/scripts/gen-catalog.mjs`
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** see below
**Blocked on:** —

## What happened

After `0.56.0` shipped and the artifact was re-pinned, `pnpm verify` was run once more to
close the run out. It failed:

```
gen-counts: apps/site/src/lib/counts.ts is stale.
  components 116 · behaviors 35 · packages 12
Run: node apps/site/scripts/gen-counts.mjs
```

**Every number in that message was correct.** `counts.ts` already said `116`, `35` and `12`.
`git diff` on the file was empty. Nothing had drifted.

The real cause is the line endings. This repo has `core.autocrlf=true`, so git rewrites
`counts.ts` to CRLF on checkout, while the generator writes LF. The check compared the two
byte for byte:

```js
if (current !== body) {   // CRLF file vs LF body — never equal on Windows
```

So the check fails on **every Windows clone, from the first `pnpm install` onward**, and
keeps failing: regenerating fixes it only until git next touches the file.

## What should have happened

A staleness check should report staleness. This one reported a correct file as stale and
printed the correct numbers underneath as the evidence, which sends the reader to compare
numbers that already match.

## How to reproduce

1. `git config core.autocrlf true` (this repo's setting), then a fresh clone or checkout.
2. `pnpm verify`.
3. `verify:counts` exits 1. `node apps/site/scripts/gen-counts.mjs` fixes it until git
   touches the file again, then it returns.

Deterministic, not intermittent, and invisible on Linux and macOS — including in CI, which
is why it survived.

## Why it matters

`pnpm verify` is the gate every other probe in this repo reports through. **A gate that is
red for a reason nobody caused teaches people to skip it**, and this run leaned on
`pnpm verify: exit 0` as the closing evidence for twenty-six fixes.

It is also the failure mode this framework has a row for — *one outcome, two causes*. "The
file is stale" covers both real drift and a line-ending mismatch, and the two have
completely different fixes.

## Where it lives

- `apps/site/scripts/gen-counts.mjs` — `current !== body`
- `apps/site/scripts/gen-catalog.mjs` — `current !== body || currentApi !== apiBody`

## Do the siblings have it too?

**Four generators in this repo have a `--check` mode. Two had the bug, two did not — and
one of the two that did not had already fixed exactly this:**

| generator | compares | verdict |
| --- | --- | --- |
| `gen-counts.mjs` | whole file, byte-exact | **had it** |
| `gen-catalog.mjs` | two whole files, byte-exact | **had it** |
| `gen-canvas-safelist.mjs` | `current.replace(/\r\n/g, "\n") !== body` | already correct |
| `gen-screens.mjs` | extracted row keys, not raw text | immune by design |

`.gitattributes` also carries the same lesson for a third file, in its own words:

> *line-ending normalization on checkout (Windows autocrlf) corrupts the comparison*

**So the knowledge was in this repo twice and still did not reach two of the four.** That
is the "a fix leaves its neighbour behind" row, and it is the reason this is filed as a
class rather than as one script.

## The fix

Both checks normalize both sides before comparing, the same way `gen-canvas-safelist.mjs`
already did, with a comment naming the cause so the next reader does not have to rediscover
it:

```js
const eol = (t) => t.replace(/\r\n/g, "\n");
…
if (eol(current) !== eol(body)) {
```

`gen-catalog.mjs` needed one extra care: it decides **which** of its two files to name in
the error from the same expression it tests with. That is lifted into `catalogStale` so the
message still names `catalog-api.ts` when that is the stale one, rather than always saying
`catalog.ts`.

Nothing generated changed. `git diff apps/site/src/lib/` is empty after the fix.

## Confirmed by

**Proved in both directions, because a check that cannot fail is not a check.**

| test | expected | result |
| --- | --- | --- |
| all three generated files rewritten to **CRLF** (a Windows checkout) | pass | `gen-counts` **exit 0**, `gen-catalog` **exit 0** |
| `COMPONENT_COUNT` edited `116` → `115` | fail | `gen-counts` **exit 1**, names `counts.ts` |
| a stray line prepended to `catalog-api.ts` | fail | `gen-catalog` **exit 1**, names **`catalog-api.ts`**, not `catalog.ts` |

The third row is the one that matters for the refactor: the error still names the right
file of the two.

Files restored, then `pnpm verify` across the workspace: **exit 0**.

## How this was found

Honestly, and not by a persona act. Act 10 reported that it found no twenty-seventh issue,
and that stands — it was true of act 10 and of the screens. This one surfaced afterwards,
during the re-pin, when `pnpm verify` was run one last time on a tree that had only had
markdown and a `package.json` edited.

It is filed rather than quietly fixed because the ledger should say twenty-seven, and
because the interesting part is not the bug — it is that the fix already existed twice in
this repo and did not travel.

## Rating effect

None — this is a build script, not a screen.
