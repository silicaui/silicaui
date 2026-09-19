# 010 — Dilnoza pasted the getting-started example and got a Next.js error screen

**Status:** fixed
**Severity:** major
**Found by:** P01 · Dilnoza Karimova · Peregrine Freight · act 3
**Surface:** silicaui.com › Docs › Getting started (`/docs/getting-started`)
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** every snippet on the page executed — the React one in the real app, the `atom()` one through node
**Blocked on:** —

## What happened

Act 3 is the whole point of this persona: follow getting-started **literally, adding
nothing**, against a `create-next-app` made five minutes earlier.

The page has exactly three steps, and its only code sample is:

```tsx
import { Button } from "@wizeworks/silicaui-react";

export function Example() {
  return <Button color="primary">Get started</Button>;
}
```

Pasted into `app/page.tsx` — the one place a person with a brand-new Next app puts
their first component — the result is:

> **Runtime Error**
> The default export is not a React Component in "/page"

`HTTP 500`. Reproduced from a cold request, every time.

The sample exports `Example` as a **named** export. The App Router renders the
**default** export. So the only runnable thing on the getting-started page does not run
in the framework the sample is written for.

The page also never says **where** the code goes. "Then use any component directly" is
the whole instruction.

## What should have happened

The one code sample on the page you land on from "Get started" runs when you paste it
where the page tells you to put it.

## How to reproduce

1. `npx create-next-app@latest myapp --typescript --app --tailwind`
2. `npm install @wizeworks/silicaui @wizeworks/silicaui-react`
3. Add the `@plugin` block from the page to `app/globals.css`
4. Paste the page's sample, verbatim, into `app/page.tsx`
5. `npx next dev` → open it → **500, "The default export is not a React Component"**

Reproduced on Next 16.3.5, React 19.2.8, `@wizeworks/silicaui@0.55.0` and
`@wizeworks/silicaui-react@0.55.0` installed from npm.

## Why it matters

It is the first thing a new user does, on the page the whole site funnels to — the hero
button, the nav, and the closing CTA all point at `/docs/getting-started`.

For this persona it is the worst possible first impression, and precisely the one she
came in worried about. Dilnoza is auditing a 0.x project with one maintainer for signs
it was thought through. She followed three steps exactly and got a red error screen; the
obvious conclusion is that the library is broken, when in fact **everything else worked**
(see below).

`major` rather than `blocker`: an experienced React developer recognises the error in
seconds and adds a default export. But "an experienced developer can work around it" is
not the bar for the getting-started page.

## Where it lives

- `apps/site/app/docs/getting-started/page.mdx` — the third code fence.

## Do the siblings have it too?

The landing page's hero and closing CTA both link here, so this is the single entry
point rather than one of several. No sibling page carries the same snippet — checked
`/docs` and the component pages, which now carry their own import/usage sections
(#008, #009) and do not repeat this one.

## What DID work, and should be said

Everything except the sample. Worth recording, because the issue title makes the page
sound worse than it is:

- `npm install @wizeworks/silicaui @wizeworks/silicaui-react` — clean, 11 packages, no
  peer warnings, no vulnerabilities.
- The `@plugin` block worked first time. `btn btn-primary` rendered a real themed
  button with a resolved OKLCH background — the CSS-first claim held with no config
  file, exactly as advertised.
- **The plugin's own warning is excellent.** create-next-app declares
  `--color-background` / `--color-foreground` in `@theme`, and silicaui said:
  > `[silicaui] Theme colors background, foreground are declared in @theme but not
  > registered with the plugin. Utilities like bg-background work, but component
  > variants (btn-background, badge-background, …) will NOT be generated and those
  > elements will silently render in the default color.`
  > `Fix: @plugin "@wizeworks/silicaui" { colors: …, background, foreground; }`

  It names the problem, the consequence **and** the exact fix, and it fires once. That
  is the opposite of the silent-failure class this run keeps finding, and somebody
  deliberately built it.

## Also observed, and NOT a silicaui defect

With the sample made runnable, the button rendered **full-bleed across the viewport**.
That is `create-next-app`'s own template — Next 16 scaffolds
`<body className="min-h-full flex flex-col">`, so any lone child stretches. Checked
`app/layout.tsx` before attributing it. Not filed against silicaui.

It is, however, the reason the sample should show where it goes: a reader who gets past
the 500 then sees a button that looks wrong and has no way to know it is the scaffold's
doing.

## The fix

Make the sample runnable and say where it goes:

- a **default** export, so pasting it into `app/page.tsx` works
- a one-line note naming the file
- a wrapper so the button is not full-bleed in the scaffold's flex body

Also worth adding, because act 3 found them missing and they cost real time: the page
never states that **Tailwind v4 is required** (the plugin is a v4 plugin and will not
work on v3), and never names the CSS entry point per framework.

## What was written

The page was rewritten with numbered steps, and — the rule applied throughout — **every
snippet on it was executed before it was published.**

- **Requires Tailwind CSS v4**, stated up front. The `@plugin` directive is v4 syntax
  and will not compile on v3; the page never said so.
- **Step 2 names the file.** "the file that already has `@import "tailwindcss"` — in a
  Next.js App Router app that is `app/globals.css`; with Vite it is usually
  `src/index.css`."
- **Step 3 has a default export**, names `app/page.tsx`, and wraps the button in
  `<main className="p-8">` — with a sentence saying the wrapper is not decoration and
  why (the scaffold's flex body).
- **A "Without React" section**, since the page's own metadata already promised "React
  or framework-neutral HTML" and the page showed only React — the same defect as #009,
  on the page that matters most.

### Three more wrong snippets were caught by running them, not by reading them

Fixing a false code sample with more false code samples was a live risk, and it very
nearly happened three times:

1. **`atom("Button", { color: "primary", text: "Get started" })`** — wrong twice over.
   The signature is `atom(component, cls?, props?, children?)`, so the **second
   argument is a class string**, and the props were landing in it. And `text` is not a
   prop; `label` is.
2. **Corrected to `atom("Button", undefined, { color: "primary", label: … })`** and run.
   Output: `<button type="button">Get started</button>` — **no `btn` class at all.**
   There is no `color` prop on this path; styling *is* the class string. A reader
   following that snippet would have got an unstyled button and no error.
3. **The printed `// →` output had the attributes in the wrong order** — the real
   projection emits `class` before `type`.

The same bug was live in the generated component pages from #009, which were printing
`atom("Accordion", [/* children */], { /* props */ })` on ~101 pages — children in the
class slot. Those now print the real root class, e.g.
`atom("Accordion", "accordion", { /* props */ }, [/* children */])`, with a sentence
saying styling on this path is the class string and there is no `color` prop.

**A fourth was caught by the page failing to compile:** the section heading was written
as `## Without React {#without-react}`, which MDX parses as a JSX expression —
`page.mdx:72:19: Could not parse expression with acorn`, HTTP 500. Replaced with an
explicit `<h2 id="without-react">`.

## Confirmed by

Re-ran P01 act 3 end to end, from a fresh `create-next-app` on Next 16.3.5 / React
19.2.8 with `@wizeworks/silicaui@0.55.0` from npm.

> Pasted step 3's sample verbatim into `app/page.tsx`. **HTTP 200** — was 500. The
> button renders at its natural size with padding around it, in the primary colour, not
> full-bleed.
>
> The `atom()` snippet was executed, not eyeballed: bundled with esbuild against
> `silicaui-html/src` and run in node. Output is
> `<button class="btn btn-primary" type="button">Get started</button>`, which
> **byte-matches the `// →` comment the page prints**, checked with an equality assert
> rather than by looking.
>
> The page itself compiles and renders: **HTTP 200**, all three paths present, read back
> from the rendered DOM.

`pnpm verify` exit 0; golden byte-identical; lint clean.

**Not checked:** the page at 360px, and the Vite/plain-HTML paths end to end — those are
P02's and P08's runs, not this one.

Not a regression risk to an earlier persona: P01 is the first run.

## Rating effect

`Docs › Getting started` — first score, in act 3. See [rating.md](../rating.md).
