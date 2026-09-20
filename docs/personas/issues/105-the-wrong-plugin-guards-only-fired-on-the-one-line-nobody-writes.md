# 105 — The "not a Tailwind plugin" guards only fired on the one line nobody writes

**Status:** fixed
**Severity:** major
**Found by:** P03 · act 10 follow-up, closing P01's last "not checked"
**Surface:** `@wizeworks/silicaui-html`, `-behaviors`, `-react`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

P01 filed [011](011-forgot-the-plugin-line-and-nothing-said-so.md) and
[012](012-b-is-not-a-function.md): name the wrong package in `@plugin` and
Tailwind dies inside its own minified code with `b is not a function`, a message
that names no package, no cause and no fix. The fix was a guard on each
non-plugin package — a default export that throws a real sentence with the real
remedy.

P01 then wrote this down, and it is the only reason this was ever found:

> **Not checked:** the `-html` and `-behaviors` guards were never driven to a
> real build overlay — same four lines, present in their built output, but only
> `-react` was seen on screen.

Driven to a real build overlay — the harness's own Vite + Tailwind pipeline, the
wrong package name put into `harness/styles.css` and `vite build harness` run for
real — the guards do not fire:

```
CONTROL  correct package, WITH options       build OK     guard silent
CONTROL  correct package, WITHOUT options    build OK     guard silent

silicaui-html       WITH options             build FAILS  guard silent  (tailwind's generic message)
silicaui-html       WITHOUT options          build FAILS  guard FIRED +fix
silicaui-behaviors  WITH options             build FAILS  guard silent  (tailwind's generic message)
silicaui-behaviors  WITHOUT options          build FAILS  guard FIRED +fix
silicaui-react      WITH options             build FAILS  guard silent
silicaui-react      WITHOUT options          build FAILS  guard silent
```

Two corrections to that table, made after the fact rather than left standing.
The `-behaviors` WITHOUT row first read `guard silent`: its guard had fired, and
my check asked for `is a …, not a Tailwind plugin` where that package says *"is
**the** browser runtime"*. A regex is not a reading. And both `-react` rows are
not a third broken guard — see below.

## Why it matters

Tailwind's own resolver, from `tailwindcss@4.3.2/dist/lib.mjs`:

```js
if (!options)                        return { plugins: [plugin] }            // call it
if ("__isOptionsFunction" in plugin) return { plugins: [plugin(options)] }   // call it with options
throw new Error(`The plugin "${path}" does not accept options`)              // never call it
```

A plain exported function has no `__isOptionsFunction`, so **it lands on the third
branch and is never invoked.** The guard's sentence is unreachable.

And the third branch is the one every real user hits. The options form is what the
docs write, what every starter writes, what the harness writes — and what **the
guard's own suggested fix tells you to write**:

```css
@plugin "@wizeworks/silicaui" {
  colors: primary, secondary, accent, neutral, info, success, warning, error;
}
```

So a guard built to replace an unhelpful message was, on the common path, itself
replaced by an unhelpful message. This is the "a screen over a dead function"
shape: the code is written, reviewed, shipped and present in the bundle, and
nothing calls it.

What the user got instead, with an options block, is Tailwind's generic
`The plugin "@wizeworks/silicaui-html" does not accept options` — better than
`b is not a function` because it names the package, and still no cause and no fix.

`major` because 011 and 012 are recorded as fixed and, for the way people write
that line, they were not.

## The one that looked worst and is not a defect

`-react` failed with something far uglier:

```
ParseError: G:\: Missing initializer in const declaration.
  packages/silicaui-react/src/button.tsx:58:69
```

That is **the harness aliasing workspace packages to source**, so Tailwind tried
to parse TSX. A consumer never sees it: all three packages publish
`"." -> ./dist/index.js`. Recorded here so the number above is not read as a
fourth defect — it is this repo's dev wiring, and it is why the `-react` half had
to be proved against `dist` instead of through the overlay.

## Where it lives

[packages/silicaui-html/src/index.ts](../../../packages/silicaui-html/src/index.ts)
[packages/silicaui-behaviors/src/index.ts](../../../packages/silicaui-behaviors/src/index.ts)
[packages/silicaui-react/src/index.ts](../../../packages/silicaui-react/src/index.ts)

## How this gets fixed

Mark each guard as options-taking, so Tailwind takes the second branch and calls
it:

```ts
notATailwindPlugin.__isOptionsFunction = true as const;
export default notATailwindPlugin;
```

A plain property, not an import — **none of these three packages takes a
dependency on Tailwind to carry it**, which is the whole reason they are separate
packages.

## Rating effect

None — this is a build-time message, not a screen.

## The fix

One property on each of the three guards, and no new dependency:

```ts
notATailwindPlugin.__isOptionsFunction = true as const;
export default notATailwindPlugin;
```

The doc comment above each now carries Tailwind's three-branch resolver and the
sentence that matters — that the branch the guard was written for is the one
nobody writes.

## Confirmed by

The same harness build, unchanged, with both controls still green:

```
CONTROL  correct package, WITH options       build OK     guard silent
CONTROL  correct package, WITHOUT options    build OK     guard silent

                              before                   after
silicaui-html       WITH      guard silent      ->     guard FIRED +fix
silicaui-html       WITHOUT   guard FIRED       ->     guard FIRED +fix
silicaui-behaviors  WITH      guard silent      ->     guard FIRED +fix
silicaui-behaviors  WITHOUT   guard FIRED       ->     guard FIRED +fix
```

As it now reads in the build overlay:

```
@wizeworks/silicaui-html is a node-tree schema and HTML projector, not a
Tailwind plugin. Only @wizeworks/silicaui is.
  Fix: in your CSS, name the plugin package instead —
    @plugin "@wizeworks/silicaui" {
      colors: primary, secondary, accent, neutral, info, success, warning, error;
    }
```

**`-react` could not be proved this way and was proved the other way.** The
harness aliases workspace packages to source, so Tailwind parses TSX and dies
before any export is reached — this repo's dev wiring, not a consumer's
experience. All three publish `"." -> ./dist/index.js`, so the built artefact was
tested directly against the two things Tailwind's resolver needs:

```
@wizeworks/silicaui-html        marked yes   refuses yes   names itself + gives the fix   ok
@wizeworks/silicaui-behaviors   marked yes   refuses yes   names itself + gives the fix   ok
@wizeworks/silicaui-react       marked yes   refuses yes   names itself + gives the fix   ok
@wizeworks/silicaui             marked yes   does NOT refuse — it IS the plugin           ok

all four behave as Tailwind's resolver requires
```

**The fourth row is the control and it is the important one.** A check that
reports "throws a helpful message" for every package is checking nothing. The
real plugin has to be marked as options-taking *and* not throw, and it is both.

**Two of my own checks were wrong on the way here**, both recorded rather than
quietly repaired:

- The first pass asked whether the message matched `is a …, not a Tailwind
  plugin`. `-behaviors` says *"is **the** browser runtime"*, so its guard read as
  silent when it had fired. A regex is not a reading.
- The same pass reported `-react` as a third broken guard. It is not; it is the
  harness's source alias. Chasing it is what turned up the `dist` test, which is
  the only one of the three that reflects what a consumer installs.

**Found only because P01 wrote "not checked" instead of "fixed".** Both guards
were present in their built output and both were reported as shipped. The gap was
between *present* and *reached*, and the honest note is what left it findable.

## And it is guarded from here on

[scripts/verify-plugin-guards.mjs](../../../scripts/verify-plugin-guards.mjs),
wired into the root `verify` chain right after `verify:packaging` because it
reads `dist` the same way. It asks each published artefact the two questions
Tailwind's resolver asks, and it checks the real plugin in the same pass — a run
that reports "refuses with a helpful message" for every package is checking
nothing.

**Shown able to fail before it was trusted.** The marker was stripped from
`silicaui-behaviors`' built file and the probe run:

```
✗ @wizeworks/silicaui-behaviors: default export is not marked `__isOptionsFunction`,
  so Tailwind refuses it with its own generic "does not accept options" and never
  calls it. Add `fn.__isOptionsFunction = true as const;`

❌ 1 problem(s). See docs/personas/issues/105.
exit 1
```

Restored by a rebuild, green again. This defect class cannot come back quietly:
nothing about the source looked wrong for as long as it was broken, which is the
entire reason the probe exists rather than a code comment.

`pnpm verify` — exit 0.  Builder e2e — **217 passed**.  `tsc --noEmit` — clean.
