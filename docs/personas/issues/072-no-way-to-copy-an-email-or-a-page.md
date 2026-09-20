# 072 — There was no way to make a copy of an email, or of a page

**Status:** fixed
**Severity:** high
**Found by:** P04 · Reuben Halloway · act 7, the offer code that was wrong
**Surface:** Email builder › Templates, and Site builder › Pages
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 7 opens with a premise: *"he notices at the last minute that the offer code
is wrong, **after** he has already duplicated the email for the three shops."*

He could not get to the premise. Every control the template switcher offers,
read off the running screen:

```
=== every control on the template switcher ===
  button  "Current template"
  button  "Rename template"
  button  "Add template"
  button  "Delete template"

=== does the word 'duplicate' or 'copy' appear anywhere on screen? ===
  (none)
```

Rename, add, delete. "Add" opens the starter picker, which mints a blank email
or a stock layout — never a copy of the one he just spent an hour on. So the
only route to "the same email again, for Gloucester Road" was to pick a starter
and retype every word of it, three times, and then keep three hand-built emails
in step with each other for ever.

## What should have happened

He makes a copy and changes the shop name in it.

## Why it matters

One send per shop is not an edge case. It is the ordinary shape of the job — one
per shop, per region, per language, per list — and it is the reason a project
holds more than one template at all. A switcher that can hold three emails but
cannot produce the second one from the first is a roster with no way to fill it.

Every retyped copy is also a fresh chance to mistype the offer code, which is
exactly what act 7 then goes on to be about.

## The sibling it did not travel to

The same gap, control for control, in the **site builder's Pages panel**: rename,
add, delete, no copy. One page per class, one per location, one per clinician —
all of them the same page with different words in it, all of them rebuilt block
by block.

This is the "a fix leaves its neighbour behind" shape again, with the twist that
neither neighbour ever had it. Both were fixed together.

Worth naming: **both builders can already duplicate a NODE.** The Inspector's
toolbar has had a Duplicate button all along. The gesture existed, the word
existed, the icon existed — it just stopped at the block and never reached the
document.

## Where it lives

[packages/silicaui-builder/src/email/engine.ts](../../../packages/silicaui-builder/src/email/engine.ts) — `duplicateTemplate`
[packages/silicaui-builder/src/email/react/TemplatesPanel.tsx](../../../packages/silicaui-builder/src/email/react/TemplatesPanel.tsx)
[packages/silicaui-builder/src/site/engine.ts](../../../packages/silicaui-builder/src/site/engine.ts) — `duplicatePage`
[packages/silicaui-builder/src/site/react/PagesPanel.tsx](../../../packages/silicaui-builder/src/site/react/PagesPanel.tsx)

## The fix

**A Duplicate button in both switchers**, between Rename and Add, and a
`duplicateTemplate` / `duplicatePage` behind each.

Four decisions worth writing down, because each could reasonably have gone the
other way:

**1. Fresh node ids throughout.** The copy is new content, not a second
reference to the same blocks. Without this, an op addressed at a node in one
template could match a node in another, which is a collaboration defect waiting
for its first two-editor session.

**2. Locks are KEPT** — unlike `duplicate()` on a single node, which clears them.
The reasoning there is that copying one pinned block mints a second undeletable
one the author never asked for. Here the copy *is* the same email for another
audience, and a footer the host pinned into the original belongs in it just as
much. Same word, opposite answer, because the thing being copied is different.

**3. A page's address is derived from the new name, not copied.** Two pages
cannot share a route, so "Term dates" → "Term dates copy" → `/term-dates-copy`,
with `uniqueSlug` settling anything left over. An email has no address, so its
copy has nothing to resolve.

**4. Naming follows the copy**, exactly as it follows an add — the name field
opens with focus already in it. Renaming the copy is literally the next thing
anybody does, and the add-then-name flow issues/044 established is left
unchanged. The draft starts empty, so Enter keeps the generated "… copy".

## Confirmed by

Driven as Reuben, on the real screen, making the other two shops' emails from
the first:

```
=== making the second and third shop's version ===
  a "Duplicate template" control: yes
  the switcher now shows: "Dispatch — Bedminster"
  templates in the project: 4
```

E2e on both builders, each with the independence check that is the whole point —
edit the copy, switch back, the original is untouched:

```
  ✓ Duplicate makes a real copy of the email, and editing one never touches the other
  ✓ Duplicate makes a real copy of the page, with its own address, and the two are independent
```

The page test also proves the copy is a real copy structurally rather than by
eye: both trees are byte-identical with ids stripped, and their id sets are
**disjoint**.

Probe checks — 10 on the email side (inside the 7b section), 10 on the site side:

```
  ✓ duplicateTemplate adds a template and switches to it
  ✓ the copy is named from the original
  ✓ the copy carries the original's content
  ✓ the copy's nodes have FRESH ids — not a second reference to the same blocks
  ✓ editing the copy leaves the original alone
  ✓ a second copy of the same email is numbered, not named twice
  ✓ the copy carries the subject
  ✓ the copy carries the preview text
  ✓ duplicating an id that isn't there does nothing at all
  ✓ undo removes the copy in ONE step

  ✓ duplicatePage adds a page and switches to it
  ✓ the copy gets its OWN address — two pages cannot share a route
  ✓ the copy's address follows its new name
  ✓ the copy's nodes have FRESH ids
  ✓ editing the copy leaves the original alone
  …
```

**Deliberately broken to watch them fail** before restoring — the copy sharing
node ids, the copy sharing the original's address, the copy being a blank page,
and the Duplicate button wired to `addTemplate` instead:

```
  ✗ the copy's nodes have FRESH ids — not a second reference to the same blocks
  ✗ the copy gets its OWN address — two pages cannot share a route
  ✗ the copy's address follows its new name
  ✗ Duplicate makes a real copy of the email… (e2e, 2 failed)
              … restored …
  ✅ email engine: all checks passed / ALL BATCH PROBES PASSED / 206 passed
```

**Three existing tests needed narrowing and the new button is why.** They matched
`getByLabel("Duplicate")` loosely, which now also catches "Duplicate template".
Each is about the NODE toolbar's button, so each is now `{ exact: true }` with a
comment naming this issue. No behaviour changed.

`pnpm verify` exit 0 workspace-wide, builder e2e **206 passed**, typecheck clean.

## Rating effect

`Email builder › Templates` and `Site builder › Pages` in [rating.md](../rating.md).
