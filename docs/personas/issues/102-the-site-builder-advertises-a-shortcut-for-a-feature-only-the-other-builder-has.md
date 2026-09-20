# 102 — The site builder's toolbar prints `⌘ /` and nothing is listening

**Status:** fixed
**Severity:** minor
**Found by:** P03 · Marlene Okonkwo-Bright · act 10, while counting what the toolbar holds
**Surface:** `@wizeworks/silicaui-builder` — the site builder's toolbar
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Counting the toolbar's controls for [101](101-the-toolbar-drops-publish-at-1024px-and-never-says-so.md)
turned up a `<Kbd>` between the status slot and the appearance toggle:

```tsx
<Kbd size="sm">
  <span className="inline-flex items-center gap-1.5">
    <Icon name="command" /> /
  </span>
</Kbd>
```

A keyboard hint, in the toolbar, printed as a fact. Nothing in the builder binds
that key.

A grep is not a screen, so the keys were pressed and the page watched:

```
CONTROL  Ctrl+Z (Undo)       dialogs 0->0  html 54345->65723   SOMETHING HAPPENED

Ctrl + /                     dialogs 0->0  html 65723->65723   nothing happened
Meta (Cmd) + /               dialogs 0->0  html 65723->65723   nothing happened
plain /                      dialogs 0->0  html 65723->65723   nothing happened
```

The control matters: an edit is made first so Undo has something to undo, then
`Ctrl+Z` moves 11kB of DOM. The watcher can see a bound shortcut work. It sees
nothing for `/` in any of its three forms.

## Why it matters

It is the "a promise in copy is a contract" shape, at its smallest and most
avoidable. A `Kbd` is not decoration — it is the product telling you a key does
something. Pressing it and getting silence teaches a keyboard user that the
builder's hints cannot be trusted, which is expensive out of all proportion to
one glyph.

**And it points at the exact feature the site builder does not have.** The email
builder has Find — a rail page, `{ id: "find", label: "Find", icon: "search" }`
— and prints **no** hint for it. The site builder prints the hint and has no
Find. [073](073-twelve-places-and-no-way-to-find-any-of-them.md) already recorded
that gap in its own closing note:

> **The site builder has no Find either.** The same argument applies to a site with…

So the two builders are exactly the wrong way round: the one that can search does
not say so, and the one that says so cannot.

It is `minor` rather than `major` because nothing is lost and no work is blocked —
but it is the cheapest possible fix, and leaving a false hint on screen while
the real gap is already filed is worse than either alone.

## Where it lives

[packages/silicaui-builder/src/site/react/Builder.tsx:422](../../../packages/silicaui-builder/src/site/react/Builder.tsx) — the `Kbd`
[packages/silicaui-builder/src/email/react/EmailBuilder.tsx:63](../../../packages/silicaui-builder/src/email/react/EmailBuilder.tsx) — the Find page that has no hint

## How this gets fixed

**Remove the hint, not by building Find to justify it.** Site Find is real work
with a real design question behind it (what is a "place" in a site — a page, a
node, a class?) and it is already on the record in [073](073-twelve-places-and-no-way-to-find-any-of-them.md).
Shipping a rushed Find so that a `Kbd` stops lying is the tail wagging the dog.

What is wrong TODAY is the claim. The claim goes, and 073 keeps the feature.

## Rating effect

`The builder's toolbar` in [rating.md](../rating.md) — chrome, so it is an issue
row rather than a screen row.

## The fix

The `Kbd` is gone from
[the site builder's toolbar](../../../packages/silicaui-builder/src/site/react/Builder.tsx),
and the import with it — it had no other use in the file.

**Site Find was not built to justify the hint.** It is real work with a real
design question behind it — what is a "place" in a site: a page, a node, a class?
— and it is already on the record in
[073](073-twelve-places-and-no-way-to-find-any-of-them.md). Shipping a rushed Find
so that a `Kbd` stops lying is the tail wagging the dog. What was wrong today is
the claim. The claim went; 073 keeps the feature.

## Confirmed by

From the rendered toolbar at 1440px:

```
toolbar reads: "Theme Layout Page Component Desktop Tablet Mobile
                Not published yet Light Dark Demo host UI Publish"
kbd elements in the toolbar: 0
```

**The control here is the selector, and it needed checking.** `0 anywhere on the
page` could mean the hint is gone or could mean the query is wrong, and those are
not the same result. `Kbd` renders

```tsx
<kbd className={cx(sc("kbd"), …)}>
```

so `kbd, .kbd` matches it by **tag and by class** — two independent ways, both of
which would have to fail together for a present hint to read as absent.

And the reading that started this is unchanged, because it was never about the
key working:

```
CONTROL  Ctrl+Z (Undo)   html 54566 -> 65944   SOMETHING HAPPENED
Ctrl + /                 html 65944 -> 65944   nothing happened
Meta (Cmd) + /           html 65944 -> 65944   nothing happened
plain /                  html 65944 -> 65944   nothing happened
```

`/` still does nothing, and that is now honest rather than advertised.

**And the probe was made to go red on purpose.** A `kbd` was put back into the
toolbar, the same probe run, and then it was taken out again:

```
with a kbd restored   toolbar reads: "… Light Dark PROBE Demo host UI Publish"
                      kbd elements in the toolbar: 1     still there
after removing it     kbd elements in the toolbar: 0     the false hint is gone
```

A check that has only ever said "0" has not been shown to be able to say
anything else.

`pnpm verify` — exit 0.  Builder e2e — **217 passed**.  `tsc --noEmit` — clean.


---

**And the feature exists now.** The `⌘ /` hint was removed here because it
pointed at nothing. Site Find was built on 2026-09-19 —
[111](111-the-site-builder-had-no-find-and-a-site-hides-text-in-three-places.md)
— as a page in the left rail, the same tab and icon and place as the email
builder's. **No hint went back.** Neither builder advertises a shortcut for it,
which is the consistency this issue was really about: the two shells now say
the same thing, and what they say is true.
