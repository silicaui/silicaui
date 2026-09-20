---
"@wizeworks/silicaui-html": patch
"@wizeworks/silicaui-behaviors": patch
"@wizeworks/silicaui-react": patch
---

The "you named the wrong package" guards only fired on the one line nobody writes

Name the wrong package in `@plugin` and Tailwind used to die inside its own
minified code with `b is not a function` — no package, no cause, no fix. Each
non-plugin package got a guard: a default export that throws a real sentence with
the real remedy.

Driven to an actual Vite + Tailwind build for the first time, **none of the three
fired.** Tailwind's resolver:

```js
if (!options)                        return { plugins: [plugin] }
if ("__isOptionsFunction" in plugin) return { plugins: [plugin(options)] }
throw new Error(`The plugin "${path}" does not accept options`)
```

A plain exported function has no `__isOptionsFunction`, so it lands on the third
branch and is **never invoked**. The guard's sentence was unreachable.

And that branch is the one everybody hits. The options form is what the docs
write, what every starter writes, and what the guard's own suggested fix tells
you to write:

```css
@plugin "@wizeworks/silicaui" {
  colors: primary, secondary, accent, neutral, info, success, warning, error;
}
```

So a guard built to replace an unhelpful message was, on the common path,
replaced by one: Tailwind's generic `The plugin "@wizeworks/silicaui-html" does
not accept options` — which names the package and still gives no cause and no
fix.

The fix is one property, and deliberately not an import:

```ts
notATailwindPlugin.__isOptionsFunction = true as const;
```

**None of these three packages takes a dependency on Tailwind to carry it**,
which is the whole reason they are separate packages.

Confirmed both ways round. Through the real build, the wrong package name now
produces the guard's own sentence with either call shape, while the correct
package still builds. And against the published `dist` each package actually
ships, all three are marked as options-taking and refuse with a message that
names themselves and gives the fix — while `@wizeworks/silicaui` itself, the
control, is marked and does **not** refuse, because it is the plugin.

A probe now guards it — `scripts/verify-plugin-guards.mjs`, in the root `verify`
chain — and it was shown able to fail before it was trusted: strip the marker from
a built package and it exits 1 naming the package and the fix. Nothing about the
source looked wrong for as long as this was broken, which is exactly why a comment
would not have been enough.

Found only because the run that shipped the guards recorded "not checked"
instead of "fixed". Both were present in their built output; the gap was between
*present* and *reached*.
