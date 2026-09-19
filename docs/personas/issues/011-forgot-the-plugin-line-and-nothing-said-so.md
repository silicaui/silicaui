# 011 — Dilnoza forgot one CSS line and nothing, anywhere, told her

**Status:** fixed
**Severity:** major
**Found by:** P01 · Dilnoza Karimova · act 4
**Surface:** `@wizeworks/silicaui-react` in a consuming app — any app whose `globals.css` is missing `@plugin "@wizeworks/silicaui"`
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** —

## What happened

She installed both packages, imported `Button` from `@wizeworks/silicaui-react`, wrote
`<Button color="primary">Get started</Button>`, and never added the `@plugin` line to
`app/globals.css`.

The page rendered the words **"Get started"** as bare text on a black page. No button.
Measured off the live DOM at `localhost:4099`:

| | With the plugin line | Without it |
| --- | --- | --- |
| `className` | `btn btn-primary` | `btn btn-primary` — identical |
| background | `lab(32.5 -3.3 -19.1)` | `rgba(0, 0, 0, 0)` |
| height | 40px | 24px |
| padding | `0px 16px` | `0px` |
| radius | `4px` | `0px` |

**Nothing reported it.** The browser console held exactly one message, `[HMR] connected`.
The dev server printed a clean `GET / 200`. There was no build error, no overlay, no
warning. Tailwind's own utilities (`p-8`) kept working, so the page looked *deliberate* —
just unstyled.

The component shipped its classes into the DOM and the CSS behind them did not exist.
Nothing in the system compared the two.

## What should have happened

Something should have said the sentence out loud. The React package is running in the
browser; it emits `btn btn-primary`; it is the one piece of the system in a position to
notice that its own classes resolve to nothing.

This is the repo's own standing rule — *always log silent degradations*. The plugin
already honors it elsewhere: act 3 recorded this exact message, which is a model of the
form, fired from the same plugin on the same project:

> `[silicaui] Theme colors background, foreground are declared in @theme but not
> registered with the plugin. Utilities like` bg-background `work, but component
> variants (`btn-background`, …) will NOT be generated and those elements will silently
> render in the default color. Fix: @plugin "@wizeworks/silicaui" { colors: …, background, foreground; }`

Problem, consequence, exact fix. The missing-plugin case deserves the same and gets nothing.

## How to reproduce

1. `npx create-next-app@latest --typescript --app --tailwind`
2. `npm i @wizeworks/silicaui @wizeworks/silicaui-react`
3. Do **not** add `@plugin "@wizeworks/silicaui"` to `app/globals.css`.
4. Put `<Button color="primary">Get started</Button>` on the page. `npm run dev`.
5. Every time, both themes, every width. Nothing is reported anywhere.

## Why it matters

This is the first five minutes of the product, and the failure is silent.

Dilnoza is evaluating a 0.x design system with one maintainer, in one afternoon, and is
reading for signs that somebody thought it through. An unstyled page with no explanation
reads as *"this library does not work"*, not as *"you missed a line"*. She has no thread
to pull: the class names are right, the import is right, the console is clean.

The cost is not a bug report. It is that she closes the tab.

## Where it lives

The gap is in `packages/silicaui-react/src` — no dev-time check exists that the CSS
layer is present. The plugin cannot do it: a plugin that was never loaded cannot warn.

## Do the siblings have it too?

**Yes — every path, and worse on two of them.**

- **Path 2, React (`@wizeworks/silicaui-react`)** — silent. This report.
- **Path 3, node-tree (`@wizeworks/silicaui-behaviors`)** — same shape. The runtime
  hydrates `data-sui-*` markers and has the same blind spot. **Worse**, because path 3's
  output is often a generated static page, so the person who sees the unstyled result
  is not the person who wired the CSS.
- **Path 1, CSS classes** — cannot be fixed this way. There is no JavaScript to run,
  which is the whole point of that path. Out of scope for a runtime probe.

Fixed once, in a shared sentinel the plugin emits, so all three paths test the same
thing rather than each inventing its own probe.

## The fix

Two parts, one mechanism.

1. **`packages/silicaui/src/theme.js`** — `buildBase()` emits one sentinel custom
   property on `:root`: `--sui-plugin: 1`. Custom properties are not affected by the
   `prefix` option (only class names are), so the sentinel is the same in every install.
2. **`packages/silicaui-react/src/lib/assert-plugin.ts`** (new) — a dev-only,
   browser-only, fires-once check that reads the sentinel off `:root` and
   `console.error`s a problem / consequence / fix message when it is missing. Called from
   the shared class helper so it covers every component, not just Button.

Stripped from production builds by a `process.env.NODE_ENV !== "production"` guard.

No published class name, token name or prop changed. `--sui-plugin` is a new emitted
token; the changeset says so.

## Confirmed by

**Re-ran P01 act 4 on Dilnoza's own app**, cold build (`rm -rf .next`), local packages
copied over `node_modules`, at `localhost:4099`.

**The quiet case first, because a false alarm would be worse than the silence it
replaces.** Correct `globals.css`, plugin line present: `--sui-plugin` read `"1"` off
`:root`, the button measured `lab(32.5387 -3.30366 -19.0915)`, 40px tall, `0px 16px`
padding, `4px` radius — the exact baseline — and the console held nine messages, all of
them Next's own `[HMR] connected` / `[Fast Refresh]`. **No `[silicaui]` line.** Silent
when it should be silent.

**Then the broken case.** Deleted the `@plugin` block, reloaded. One console error, fired
once, not once per component:

> `[silicaui] The @wizeworks/silicaui CSS plugin is not loaded, so every Silica class on
> this page resolves to nothing.`
> `  Components still render class="btn btn-primary", but no rules exist behind those
> names — the page renders unstyled, with no build error and a clean 200.`
> `  Fix: add the plugin to the CSS file your app imports (app/globals.css in a Next.js
> app):` … `  If that line is already there, check it is in the stylesheet your root
> layout imports — a plugin declared in a CSS file nobody imports is the same as no
> plugin.`

Problem, consequence, exact fix — the same shape as the plugin's existing
theme-colors warning, which is the message act 3 recorded as the model.

**Restored and re-measured.** `globals.css` byte-identical to the backup; button back to
`lab(32.5387 -3.30366 -19.0915)`, 40px, `0px 16px`, `4px`; sentinel `"1"`.

**Second confirmation (RULE #7 — the fix touched the plugin).** Reopened the earlier
surface in this same run, silicaui.com at `localhost:4011`, cold, and did the real job
from acts 2–3: read `/docs/getting-started/` the way Dilnoza did, in OS dark with no
stored theme. The sentinel read `"1"`, the page rendered, and **no `[silicaui]` line
appeared** — the new check stays quiet where the plugin is wired, on a second app, in the
other theme.

That reopening is also what found **issue 013**: with the stored choice cleared, the page
was running on Silica's dark ink over a background Silica had never painted. RULE #7 paid
for itself on its first use — the regression pass was not a formality, it was the only
place that defect could have surfaced.

## Rating effect

—
