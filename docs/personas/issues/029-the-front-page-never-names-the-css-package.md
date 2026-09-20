# 029 — The front page of "The CSS-first Tailwind Component Library" never names the CSS package

**Status:** fixed
**Severity:** minor
**Found by:** P02 · Tomás Ferreiro · act 1
**Surface:** `apps/site` › `src/components/landing/sections.tsx`
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 1 is one question: **land on the front page and find evidence this works without
React.** Tomás has a Tailwind CLI, a Django project and no `node_modules` anywhere near it.

Measured off the rendered page, before the fix:

| | |
| --- | --- |
| `<title>` | "SilicaUI — **The CSS-first Tailwind Component Library**" |
| first code on the page (y=**583**, the hero) | `npm i @wizeworks/silicaui-react` |
| occurrences of `@wizeworks/silicaui-react` | **2** |
| occurrences of `@wizeworks/silicaui` | **0** |
| occurrences of "Django", "Rails", "PHP", "Go" | **0** |
| first HTML-with-classes code sample | y=**6,902** of a 10,466px page — **66% down** |

The page has exactly one section for him — **"The same components, with no framework at
all"**, at y=6,638, 63% of the way down. He never reached it on the terms he arrived with,
because that section is about the **node-tree** path: its two code panels are
`atom("Switch", …)` and the `toHtml()` output, which is a JavaScript authoring API and two
more packages.

**The path he actually wants — write the classes on your own markup — is not on the front
page at all.**

## What should have happened

The page's own title says CSS-first. The package that is the CSS should be findable from
the page that claims it.

## How to reproduce

1. Open `/`.
2. Search the rendered text for `@wizeworks/silicaui` not followed by `-react`. Nothing.
3. Read the only "no framework" section. It is the node tree, not the plugin.

## Why it matters

Small, and it is filed as minor for a reason: **getting-started one click away is good**,
with a "Without React" section that names Django, Rails, PHP and Go and shows
`<button class="btn btn-primary">`. Nothing is broken and nothing is unreachable.

What it costs is the first thirty seconds. This persona's stated fear is *"that
'framework-agnostic' is marketing and the real product is React with a CSS layer bolted on
underneath"*, and a front page whose only install command is the React one is that fear
rendered in HTML. The word **framework-agnostic** — the README line that brought him — does
not appear on the front page either.

## Where it lives

`apps/site/src/components/landing/sections.tsx` — the `NoFramework` section's paragraph.

## Do the siblings have it too?

**No, and that is what keeps this minor.** Checked on the same pass:

- **`/docs/getting-started/`** — has a "Without React" section, names the four server
  frameworks, gives the plain-HTML sample. Good.
- **The component pages** — lead with "Plain HTML — CSS classes" before React and print the
  class list. Good. (Their own separate defect is issue 028.)

So the gap is the landing page alone, not the docs.

## The fix

One paragraph, in the section that was already about doing this without a framework. It now
names the plain-HTML path **first**, because it is the simpler of the two, and the node tree
second as the answer for when that markup also needs behaviour:

> React is one output, not the product. Write the classes on your own markup in Rails,
> Django, PHP or Go — that is `@wizeworks/silicaui`, the Tailwind plugin, on its own. When
> that markup also needs behaviour, the node tree projects to plain HTML that a
> zero-dependency runtime hydrates …

No new section, no new component, no layout change — the section for this already existed
and was describing one of the two things it is about.

## Confirmed by

Read off the rendered front page after the change:

| | before | after |
| --- | --- | --- |
| `@wizeworks/silicaui` (bare) | **0** occurrences | **1**, at index 5987 |
| "Django" | absent | index 5959 |
| "Rails" | absent | index 5952 |
| `@wizeworks/silicaui-react` | 2 | 2, unchanged |

Seen as well as counted: screenshotted in dark at desktop width, the paragraph sits under
its existing heading with the package name in the page's own mono code style, and the two
code panels below it are untouched.

## Rating effect

The front page is scored in [rating.md](../rating.md) by this act.
