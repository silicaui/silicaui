---
name: silica-component
description: >-
  Build or modify a Silica UI component — a CSS module in packages/silicaui plus
  a React wrapper in packages/silicaui-react — including Base UI integration,
  wiring, playground demo, and the mandatory browser-verification protocol. Also
  covers keeping the framework-neutral layers (silicaui-html's ComponentDef
  registry, silicaui-behaviors' vanilla hydration) and the silicaui-mcp catalog
  in sync so a component doesn't exist in React only. Use whenever creating,
  editing, or debugging a Silica UI component so the file shape, naming, token
  model, and (critically) the verify + sync steps stay consistent and we don't
  repeat past regressions.
---

# Building a Silica UI component

Silica UI ships as **four layers**, and a component isn't done system-wide
until all four agree (or a documented reason says one doesn't apply — see §7):

- **`packages/silicaui`** — the CSS layer, a Tailwind v4 plugin. Each component
  is `src/components/<name>.js` exporting a function that returns a CSS-in-JS
  object. Emitted via `addBase` (NOT `addComponents` — v4 tree-shakes
  addComponents against scanned content and a React lib builds class names
  dynamically, so it'd drop everything).
- **`packages/silicaui-react`** — the React layer, thin wrappers that apply the
  CSS classes and delegate behavior to **Base UI** for interactive components.
- **`packages/silicaui-html`** — the framework-neutral node-tree schema +
  `toHtml` projection, for non-React output (Sparx tenant sites, static pages).
  A `ComponentDef` macro per component, registered in `component.ts`.
- **`packages/silicaui-behaviors`** — the vanilla, zero-dependency runtime that
  hydrates `data-sui-behavior="type"` markers for non-React output — the
  counterpart to Base UI, which only runs inside React.

Sections 1-6 below build the first two (CSS + React) — start there for any new
component. **Section 7 covers the other two** (-html macro + -behaviors
handler) and the MCP catalog regen — read it before considering an interactive
component finished, since silently skipping it is exactly how the -html/
-behaviors layers drifted out of sync with -react for an entire session's
worth of components in the past.

Playground for dogfooding/verification: `examples/playground` (Vite). It aliases
`@wizeworks/silicaui-react` to source and consumes `@wizeworks/silicaui` from source, so **no package
build is needed** — edits are live in a fresh `vite build`.

Work in this order: **CSS module → React wrapper → wire both barrels → playground demo → VERIFY → -html/-behaviors sync (§7) → clean up.**

---

## 1. CSS module — `packages/silicaui/src/components/<name>.js`

Signature depends on whether the component has color variants:

- Colorless: `export function name(prefix = "") { ... }`
- Colored:   `export function name(colors, prefix = "") { ... }` (import `contentVar`)

Every module uses a local `sel` helper and returns a flat object keyed by full
selectors. Nesting uses `&` only (`&:hover`, `&::before`, `& > *`, `& svg`) —
NOT bare nested class selectors.

```js
import { contentVar } from "../lib/auto-content.js"; // colored only

export function widget(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}widget${suffix}`;
  const base = {
    [sel()]: {
      /* shape/layout; read tokens via var(--x, fallback) */
      color: "var(--widget-fg, var(--color-base-content))",
      backgroundColor: "var(--widget-bg, var(--color-base-200))",
      "& svg": { width: "1em", height: "1em", flexShrink: "0" }, // ALWAYS size icon slots
    },
    [sel("-sm")]: { /* size */ },
  };
  // Orthogonal color model: a color class ONLY sets --widget-* vars; base reads them.
  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--widget-bg": `var(--color-${name})`,
      "--widget-fg": contentVar(name),          // auto-derived legible foreground
      "--widget-accent": `var(--color-${name})`,
    };
  }
  return base;
}
```

Rules:
- **Orthogonal color**: color classes set `--<name>-*` custom props only; the
  base/variant selectors read them with `var(--x, fallback)`. Never hard-code a
  semantic color on the base class.
- **`contentVar(name)`** (from `../lib/auto-content.js`) = the legible fg for a
  color (explicit `-content` token, else auto-derived via OKLCH lightness).
- **Tints/shades**: `color-mix(in oklab, …)` — NEVER `in oklch` (oklch rotates
  hue toward 0° when mixing with white/black/transparent → everything goes pink).
- **Radius tiers**: `--radius-selector` (checkbox/badge), `--radius-field`
  (buttons/inputs), `--radius-box` (cards/modals/popups).
- **Density**: form-control heights = `calc(var(--size-field, 0.25rem) * N)`
  (all 40px-tall controls use `* 10`).
- **`@keyframes`** can be a top-level key in the returned object (keeps it
  self-contained). Respect `@media (prefers-reduced-motion: reduce)`.
- Canonical examples: **`badge.js`** (colored + sizes + variants),
  **`divider.js`** (colorless).

## 2. React wrapper — `packages/silicaui-react/src/<name>.tsx`

```tsx
import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens"; // if colored/sized

export interface WidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: SilicaColor;
  size?: SilicaSize;
}
export const Widget = React.forwardRef<HTMLDivElement, WidgetProps>(
  function Widget({ color, size, className, ...rest }, ref) {
    const sc = useSilicaClass(); // prefix-aware class builder
    return (
      <div
        ref={ref}
        className={cx(sc("widget"), color && sc(`widget-${color}`), size && sc(`widget-${size}`), className)}
        {...rest}
      />
    );
  },
);
```

Rules:
- `useSilicaClass()` → `sc("widget")` applies the active `<SilicaProvider prefix>`.
- **`sc()` returns `string | false | null | undefined`** — a bare `sc("x")`
  assigned to `className` fails typecheck. ALWAYS wrap: `className={cx(sc("x"))}`.
- Compose conditionals inside `cx(...)`: `color && sc(\`widget-${color}\`)`.
- **Controlled/uncontrolled: accept `value`/`defaultValue` + `onValueChange`,
  and use the shared `useControllableState` hook** (`./lib/use-controllable-state`)
  rather than hand-rolling the `value !== undefined ? mirror : own state` dance:

  ```tsx
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange: onValueChange });
  ```

  **The callback is `onValueChange`, NOT `onChange`.** `onChange` is reserved for
  the native DOM handler passing through on components that wrap a real form
  element (`Input`, `Checkbox`, `Textarea`, …) — declaring your own `onChange`
  shadows it, which is why every component that did has an
  `Omit<…, "onChange">` sitting in its props type paying for the collision. If
  you find yourself writing that `Omit`, you picked the wrong name.
- Canonical examples: **`divider.tsx`** (simple), **`rating.tsx`** (interactive
  state + keyboard), **`accordion.tsx`**/**`tooltip.tsx`** (Base UI).

## 3. Interactive components — wrap Base UI

Base UI (`@base-ui-components/react@1.0.0-rc.0`) is a regular dependency of
@wizeworks/silicaui-react; tsup already externalizes it (`/^@base-ui-components\//`). Base
UI owns behavior; Silica owns the CSS surface attached via `className`.

**Before writing, inspect the real component in the pnpm store** (names/attrs
change between components):
```bash
base=$(find . -type d -path "*@base-ui-components/react" -not -path "*/esm/*" | head -n1)
grep -oE 'exports, "[A-Za-z]+"' "$base/<part>/index.parts.js" | grep -oE '"[A-Za-z]+"'   # parts
grep -rhoE "data-[a-z-]+|--[a-z-]+" "$base/<part>/" | sort -u                             # data-attrs + css vars
sed -n '1,60p' "$base/<part>/root/*Root.d.ts"                                             # Root props
```

Pattern:
```tsx
import { Widget as BaseWidget } from "@base-ui-components/react/<part>";
type Styled<T extends React.ElementType> = Omit<React.ComponentPropsWithoutRef<T>, "className"> & { className?: string };
const asRender = (el: React.ReactElement) => el as React.ReactElement<Record<string, unknown>>; // React19 vs Base UI cast
```
- Compose behavior via the **`render` prop**, not `asChild`. A trigger that
  wraps one child element: `<Base.Trigger render={asRender(children)} />`.
- **`render` vs `as` is a real distinction, not two spellings of one idea.**
  `render` takes an **element** and clones it (composition — `<Button
  render={<a href="/x" />}>`); `as` takes a **tag name or component type** and
  only decides what's rendered (`<Text as="span">`). Pick by what the component
  actually needs: composing with a caller's element → `render`; swapping the
  tag → `as`. Do NOT "standardize" an `as` component onto `render`: `render`
  needs the real element, so it breaks across a `"use client"` boundary, while
  `as="span"` is a string that crosses it fine. Existing `render` components:
  `Button`, `Badge`, `ClickableCard`. Existing `as`: `Text`, `BlockquoteCite`,
  `Wordmark`, `SidebarItem`.
- **`size` ALWAYS means the `xs`–`xl` token scale** (or a documented subset the
  CSS actually emits). A prop that means a CSS length or an index is not a
  `size` — give it its own name (`diameter`, `visualLevel`), or it type-checks
  into silently-broken output. Enforced by
  `packages/silicaui-react/verify-prop-vocabulary.mjs`.
- **Enter/exit animation**: style `[data-starting-style]` / `[data-ending-style]`
  (+ `transform-origin: var(--transform-origin)` for popups). Menus/items use
  `[data-highlighted]`, `[data-disabled]`; selected varies by component (Tabs use
  `[data-active]`, Select uses `[data-selected]` — VERIFY per component).
- Portalled popups (Dialog/Popover/Menu/Select/Toast) render to `document.body`;
  their content only mounts when open (accordion/toast panels UNMOUNT when
  closed).
- Gotchas seen: Accordion single-open is **`multiple={false}`** (not
  `openMultiple`). Toast: `<ToastProvider>` wraps app + maps
  `useToastManager().toasts` into `Toast.Root` in a `Toast.Portal>Viewport`;
  fire with `toast.add({title, description, type, timeout})`.
- **A menu `GroupLabel` MUST be inside a `Group`** — `Menu.GroupLabel`
  (and the ContextMenu/Menubar aliases) throw "MenuGroupRootContext is missing"
  the moment the menu opens if used bare. Wrap `<XLabel>` + its items in `<XGroup>`
  (see the DropdownMenu demo). ContextMenu/Menubar re-export the Menu family, so
  they inherit this — and their `Separator` is the generic `Separator`, not
  `MenuSeparator`. NavigationMenu is the odd one: Root›List›Item[Trigger+Content |
  Link], and a shared `Portal›Positioner›Popup›Viewport` hosts the active Content
  (it exposes `--popup-width/height` so the popup animates its resize between panels).

## 4. Wire both barrels

- **`packages/silicaui/src/index.js`**: add `import { name } from "./components/<name>.js";`
  and an `addBase(name(colors, prefix))` (or `name(prefix)` if colorless) call.
  Keep new components grouped before the Base-UI CSS block; pass `colors` iff colored.
- **`packages/silicaui-react/src/index.ts`**: `export { Component } from "./<name>";`
  and `export type { ComponentProps, ... } from "./<name>";`

## 5. Playground demo — `examples/playground/src/app.tsx`

Add the import(s), any demo `useState`, and a `<section>`. Show every axis
(colors, sizes, states, variants) and for interactive components wire real
handlers. **Dynamic Tailwind utility classes (`bg-${c}`) won't be generated** —
the v4 scanner needs literal strings; use inline `style={{ backgroundColor: \`var(--color-${c})\` }}`
instead. This file is the user's; adding demos is expected, but don't gut it.

## 6. VERIFY — the part that prevents regressions

This is non-negotiable and where every past mistake happened. Do NOT touch the
user's running `pnpm dev` or its `.vite` cache — verification uses a fresh
`build` + a throwaway server.

```bash
pnpm --filter playground typecheck          # must be clean
pnpm --filter playground build              # regenerates real CSS + bundles Base UI
cd examples/playground/dist && python -m http.server <PORT> >/dev/null 2>&1 &  # pick an unused port
```
Then Playwright: navigate to `http://localhost:<PORT>/`, and:

1. **Screenshot WHOLE SECTIONS in context, never isolated elements.** Isolated
   `.locator('.foo').screenshot()` hid the footer void, the collapsed timeline
   icon, and the too-subtle stack peek. Tag the section (`h2.closest('section').id = …`)
   and screenshot that; scrutinize surroundings + spacing, not just the widget.
2. **Test the interaction** for anything interactive — click controls, open the
   overlay, cycle the deck, fire the toast — and assert state changed. (Portals
   commit async: a same-tick `querySelectorAll` after a click can be empty — wait
   a tick; toasts auto-dismiss in ~5s so use a full-viewport `page.screenshot()`
   right after firing, not an element screenshot that waits for stability.)
3. **Check light AND dark**: `document.documentElement.dataset.theme = 'dark'`.
   Confirm surfaces invert and contrast holds.
4. If layout looks wrong, inspect the **generated CSS** — extract FULL rules
   (`grep -oE '[^{}]*\.<class>\{[^}]*\}' "$css"`); the clipping pattern
   `grep -o '\.<class>[^{]*{…}'` drops ancestor prefixes and will mislead you.

**Clean up every time**: stop the server (`Stop-Process` by port), then
`rm -rf examples/playground/dist .playwright-mcp <screenshot pngs>`. Leave the
repo clean.

## 7. Sync the -html macro + -behaviors handler + MCP catalog

A component built via §1-6 exists in React only until this section is done
too. This is not optional polish — it's how Sparx tenant sites (which render
via `@wizeworks/silicaui-html`, not React) and any AI assistant querying
`@wizeworks/silicaui-mcp` find out the component exists at all.

### The -html macro

Add a `ComponentDef` to `BUILTIN_COMPONENTS` in
`packages/silicaui-html/src/component.ts`: `name` (matches the React export),
`category`, `label`, `icon`, `container?` (true if it holds children), and
`expand(node)` — a PURE function lowering the authored node to an element
(sub)tree via the local `lower()` helper (carries the source node's class +
system metadata through automatically). If the component is interactive, its
expansion sets a behavior marker: `out.behavior = { type: "modal" }` (see
`Dialog`'s def for the canonical shape).

### The -behaviors handler (only for a NEW interactive pattern)

`packages/silicaui-behaviors` hydrates `data-sui-behavior="type"` markers for
non-React output. If the component's interaction pattern already has a
`BehaviorType` (most do — see composition patterns below), wire the macro to
it and you're done; no new handler needed.

For a genuinely new pattern: add the type to the closed vocabulary in BOTH
`silicaui-html/src/schema.ts`'s `BehaviorType` union AND
`silicaui-behaviors/src/types.ts`'s (duplicated ON PURPOSE — the contract is
the STRING value in the `data-sui-*` attribute, not shared TS identity), write
a handler in `silicaui-behaviors/src/behaviors/<type>.ts`, and add it to the
`HANDLERS` dispatch table in `registry.ts`. Verify with BOTH a structural
`toHtml` assertion AND a real jsdom `hydrate()` interaction test — the
structural one alone misses real bugs (wrong DOM scope, missing runtime DOM
mutation, stale element references across a re-render) that only show up when
you actually click/type/press-key through it.

**Check these composition patterns before adding a new `BehaviorType`** — the
vocabulary staying closed and small is deliberate, not an oversight:
- **One type, optional parts** — layer extra `part`s onto an existing root
  instead of forking (Lightbox/CommandPalette both reuse `modal` with extra
  parts).
- **Nested behavior roots compose for free** — `ownParts()` already stops at
  nested `[data-sui-behavior]` boundaries, so e.g. a `calendar`-type root
  nested inside a `popover`-type root's panel (DatePicker) needs zero new
  code.
- **Reuse with a new param, don't fork** — check whether the real delta is a
  `params.xxx` flag on an existing type (ContextMenu reuses `menu` +
  `params.trigger: "context"` instead of duplicating item-roving-focus logic
  `popover` doesn't have).
- **Independent sibling roots, documented** — when bar-wide coordination
  (Menubar/NavigationMenu "only one open") can't be modeled because sibling
  behavior roots can't see each other, ship each item as its own root and say
  so in the handler's doc comment — don't silently drop the feature or
  silently pretend it works.

### When a component genuinely doesn't need all four layers

Some components legitimately skip -html/-behaviors — document why, same as
these confirmed cases: pure status display that only ever swaps a
`data-status` attr + text in response to already-computed host state needs no
behavior code at all (a vanilla host sets the attribute directly); a genuinely
imperative API (`toast.add()`) can't be a `data-sui-behavior` marker (there's
no pre-existing DOM node for the marker to attach to before `add()` runs) and
needs its own small standalone helper module instead.

### Regenerate the MCP catalog

`packages/silicaui-mcp` ships a queryable catalog of all four layers for AI
coding assistants. It's generated, not hand-authored, but the generator still
has to be re-run after any of the above:

```bash
pnpm --filter @wizeworks/silicaui-html build      # -html catalog reads dist, not src
pnpm --filter @wizeworks/silicaui-mcp gen         # regenerates src/data/*.json
pnpm --filter @wizeworks/silicaui-mcp verify      # real MCP client round-trip
```

- **-html macros and -behaviors types are fully auto-discovered** (the
  generator calls the real `listComponents()` / reads the real `HANDLERS`
  table) — a new `ComponentDef` or `BehaviorType` just appears on the next
  regen, nothing to hand-edit in the generator.
- **-react components are discovered from `silicaui-react/README.md`'s
  component table** (curated on purpose — category grouping needs a human's
  judgment call, not just an export scan). Add a row for any new top-level
  component, or `pnpm gen` prints a loud warning naming the undocumented
  file — it won't silently disappear from the catalog's coverage, but it WILL
  be missing from the actual data until the row is added. Base-UI-style
  sub-parts sharing a file with an already-documented root (`DialogTrigger`
  next to `Dialog`) don't need their own row.
- **A name can exist in both `-react` and `-html`** (most do, by design — same
  concept, two output layers) — `get_component` requires a `package` argument
  to disambiguate when this happens; it errors rather than guessing which one
  you meant.
- Commit the regenerated `src/data/*.json` diff alongside the component
  work — it's a real, git-tracked catalog, not a disposable build artifact.

## 8. Dependency-heavy components → an opt-in SIBLING package

When a composite needs a real third-party engine (charts, rich text, DnD, a
table engine), DON'T add the dep to `@wizeworks/silicaui-react` — the core stays lean. Wrap
best-in-class in its own unscoped package `packages/silicaui-<engine>/` (shipped:
`@wizeworks/silicaui-charts`=ECharts, `@wizeworks/silicaui-table`=TanStack Table). Pattern:

- `dependencies`: the engine only. `peerDependencies`: `react`, `react-dom`,
  `@wizeworks/silicaui-react`. `devDependencies`: `@wizeworks/silicaui-react: workspace:*` + tsup/ts.
- Import `{ cx, useSilicaClass }` FROM `@wizeworks/silicaui-react` (the barrel now exports
  `cx`) so the package shares the SAME `SilicaProvider` context — never re-create
  the config context.
- tsup `external: ["react","react-dom","@wizeworks/silicaui-react", /^<engine>/]`; tsconfig
  `paths: { @wizeworks/silicaui-react: ["../silicaui-react/src/index.ts"] }` (typecheck vs
  source, no core build needed).
- CSS still goes in the `@wizeworks/silicaui` plugin (`data-table.js`, `chart.js`, …) — one
  design system.
- Playground consumes from source: add BOTH a `vite.config.ts` alias AND a
  `tsconfig.json` `paths` entry (tsc ignores vite aliases), plus a `workspace:*`
  dep; then `pnpm install`. Verify each package's own `typecheck` + `build` too,
  not just the playground.

## Gotchas checklist (all learned the hard way)

- [ ] Before calling an interactive component done: did §7 happen (-html
      `ComponentDef` + `data-sui-behavior` wiring, `pnpm --filter @wizeworks/silicaui-mcp gen`)?
      Shipping -react only is exactly how the other two layers (and the MCP
      catalog that indexes them) silently fell behind for a whole session's
      worth of components — it's cheap to catch here, expensive to catch later.
- [ ] Any icon slot sizes its `& svg { width; height }` — an unsized `<svg>`
      collapses/balloons differently per browser (it vanished in the user's).
- [ ] Tints use `color-mix(in oklab, …)`, not oklch.
- [ ] Emitted via `addBase`, colored gets `colors`, prefix threaded through.
- [ ] `className={cx(sc("x"))}` — never bare `sc("x")`.
- [ ] Verify in the USER's terms: a scroll-snap strip is a "list" not a
      "carousel" (needs controls); a static stack "does nothing" (add interaction).
      Match the mental model, not just daisyUI's CSS-only version.
- [ ] Bleeding-edge CSS (text-box-trim, etc.) can render fine in Playwright's
      Chromium but differ in the user's browser — prefer broadly-supported
      primitives; confirm in their browser for anything cutting-edge.
- [ ] Editing plugin JS does NOT hot-reload a running dev server — but you verify
      via `build`, so this only matters to the user's `pnpm dev` (never clear its
      `.vite`).
- [ ] A **Base UI error in the production `build` is a bare code** ("Base UI error
      #NN") — undecodable. To read the real message, run a throwaway `vite` dev on
      a spare port (`npx vite --port <p> --strictPort`), reproduce, and read the
      console; dev builds emit the full text. Stop that dev server by exact PID
      afterward. (This is how the GroupLabel-in-Group bug was found.)
- [ ] Stop throwaway servers by the **exact PID on the port** (`netstat -ano | grep :<port>`
      → `taskkill //PID <pid> //F`). NEVER kill by a broad CommandLine match — a
      wildcard once nuked Chrome + shell processes.
- [ ] **Base UI Slider** thumb `<div>` is `tabindex="-1"`; the real focus/keyboard
      target is a hidden `<input type="range">` INSIDE each thumb. To verify arrow-key
      behavior, focus that inner input (`.slider-thumb input`), not the thumb div.
      Multi-thumb (range) = render one `<Slider.Thumb>` per value in
      `value`/`defaultValue` (derive the count from the array length).
- [ ] **Base UI Switch** Root renders a `<span>` + hidden `<input>`; state is
      `[data-checked]`/`[data-unchecked]` (NOT `:checked`). Drive the thumb's
      `translate` off the ROOT's `[data-checked]` via a descendant selector, so it's
      robust regardless of which parts get the attr.
- [ ] **Base UI AlertDialog** reuses the Dialog surface (`.dialog-*`), but its
      backdrop is inert (`data-base-ui-inert`): outside-press does NOT dismiss —
      Escape still cancels (ARIA alert-dialog pattern). Test dismissal with REAL
      Playwright input (`page.keyboard.press` / real click); synthetic `dispatchEvent`
      returns a stale open-state and misleads.
- [ ] **Base UI Collapsible** panel height var is `--collapsible-panel-height`; the
      panel UNMOUNTS when closed (no `keepMounted` by default). `defaultOpen` works,
      but inspecting the FIRST cold paint of the big playground can momentarily read
      closed (initial-commit race) — reload and it's stably open; not a real defect.
- [ ] **Base UI Select** trigger label comes from the Root `items` map
      (`{value: label}` / `[{value,label}]`) — `<Select.Value/>` with no children
      resolves it; WITHOUT `items` it renders `String(value)` (raw id). The TRIGGER
      itself carries `[data-placeholder]` when empty (style the placeholder off it —
      no `:has` needed). Popup width tracks the trigger via `--anchor-width`; a closed
      Select popup stays MOUNTED (hidden), so several can coexist in the DOM.
- [ ] **Base UI Combobox / Autocomplete** filter via `<List>`'s render-prop
      `(item, index) => node` — Base UI passes the already-FILTERED items; pass the
      full set as the Root `items`. Combobox `value` = the selected item; Autocomplete
      `value` = the input STRING (free text), and it has NO `ItemIndicator` part.
      `Combobox.Clear` is a `<button>` that self-disables when empty (`&:disabled{display:none}`).
      The popup/items REUSE `.select-popup`/`.select-item`, so scope Playwright
      queries to `.select-popup[data-open]` (multiple `.select-popup` coexist).
- [ ] **Reusing a native field for a Base UI trigger** (Select trigger reuses
      `.select`; Combobox/Autocomplete input reuses `.input`) gets color/size/parity
      free — override the caret/padding in a `-trigger`/`-input` sub-class, and make
      sure that module's `addBase` runs AFTER the native one so the override wins.
- [ ] **Calendar is from scratch** (Base UI has no calendar in rc.0) — all behavior
      lives in the React layer. Use native `Date` (no date lib) but always go through
      `startOfDay`/`startOfMonth` day-granular helpers (a calendar has no clock);
      `Date.now()`/argless `new Date()` are fine in COMPONENT code (only banned in
      Workflow SCRIPTS). Roving `tabIndex=0` sits on the focused day; move DOM focus in
      an effect ONLY after keyboard nav (a `shouldFocusRef` flag), and on prev/next
      keep the focus target inside the visible month so a tabbable day always exists.
      Render 42 cells (6 weeks) for stable height; stamp state as data-attrs
      (`data-today/-selected/-range-start/-range-end/-in-range/-outside/-disabled`)
      and paint a continuous range bar by giving in-range cells 0 gap + square tint,
      endpoints solid accent. DatePicker = the calendar inside a Base UI `Popover`
      (control `open` so you can close on select). Verify keyboard with real
      `page.keyboard.press` after focusing the `[tabindex="0"]` day.
- [ ] **A slot prop that shadows a native HTML attr must be `Omit`ted** — e.g.
      `EmptyState` takes `title?: ReactNode`, but `HTMLAttributes` already has
      `title?: string`, so `extends Omit<React.HTMLAttributes<…>, "title">` (else
      TS2430 "incorrectly extends"). Same trap for any `color`/`content`/etc. slot.
- [ ] **ECharts (@wizeworks/silicaui-charts)** bakes its theme in at `init()` and reads plain
      color strings, not CSS vars — so `buildSilicaEChartsTheme(el)` resolves the
      live `--color-*` tokens via `getComputedStyle` and the `<Chart>` re-inits
      (MutationObserver on `<html>` `data-theme`/`class`/`style` + `matchMedia`
      dark) whenever the theme flips, so charts track light/dark. Give the
      container a height (ECharts can't measure a 0-height box) and register a
      per-instance theme name (`React.useId`) so concurrent charts don't clobber.
      Verify canvases exist with non-zero `.width`/`.height`, then re-screenshot
      after a `data-theme='dark'` flip to confirm the re-theme.
- [ ] **DataTable (@wizeworks/silicaui-table)** = TanStack Table (headless) + `.table`/
      `.data-table` CSS. It's a GENERIC function component (not `forwardRef`) to
      keep the `<TData>` param clean. Type columns as `DataTableColumn<T>[]` and
      read `row.original` (fully typed) in cells rather than `getValue()` (unknown).
      Row selection across pages fires `onSelectionChange`; assert state in a
      SEPARATE Playwright call (synchronous `.click()`s in one `evaluate` don't let
      React commit between them — reads come back stale).
- [ ] **ColorPicker is OKLCH-native** (SilicaUI's tokens are OKLCH): three L/C/H
      sliders whose tracks are live `linear-gradient(... in oklch, …)` — 1-D ramps
      are accurate; a 2-D chroma×lightness area can't separate L and C in oklch, so
      don't fake one. All OKLab↔sRGB math (hex read/write, gamut clamp) lives
      dependency-free in `lib/oklch.ts` (`oklchToHex`/`hexToOklch`/`formatOklch`/…) —
      reuse it, don't reach for a color lib. The custom slider is `role="slider"` +
      pointer (`setPointerCapture`) + Arrow/Home/End keys; the emitted value is
      always exact OKLCH even if the painted track only approximates.
- [ ] **A stepper/segmented rail drawn with `:not(:first-child)::before` breaks if
      each item is wrapped in its own element** — the pseudo matches position among
      an item's OWN siblings, so every wrapped item is a `:first-child` and NO
      connectors render (hit in Wizard with `<li>` wrappers). Render the step
      buttons as DIRECT flex children of the track (use `role="list"`/`"listitem"`
      for semantics instead of `<ol><li>`).
- [ ] **A ⌘K CommandPalette is just Base UI Dialog** (Portal/Backdrop/Popup) — no
      new dep. Dialog has no positioner, so CSS-place the popup near the top; bind
      the global hotkey with a `document` keydown listener (⌘/Ctrl + key); and DON'T
      `preventDefault` Escape in the search input — let it fall through so the Dialog
      closes. Filter/group/arrow-nav is your own state over the `items` array.
- [ ] **Reading a `data-*` toggled by a synthetic event** (a `dragenter` for a
      Dropzone's `data-dragging`, a `click`, etc.) in the SAME `browser_evaluate`
      returns the pre-commit value — React hasn't re-rendered yet. Dispatch in one
      tool call, read in the next. (Same root cause as the DataTable note above.)
- [ ] **TipTap (@wizeworks/silicaui-editor)**: `useEditor({ immediatelyRender: false })` so it's
      SSR-safe (Sparx SSRs — else a hydration mismatch). Controlled value in =
      `editor.commands.setContent(value, false)` (the `false` skips emitting an
      update → no loop) and ONLY when `value !== editor.getHTML()` (else the cursor
      jumps). `onUpdate` emits `editor.getHTML()`. StarterKit **2.x does NOT bundle
      Link** — add `@tiptap/extension-link` separately (3.x DOES bundle it → adding
      it again throws a duplicate-extension error). Toolbar buttons need
      `onMouseDown={e => e.preventDefault()}` to keep the editor selection. Placeholder
      CSS: `.ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder) }`.
      `@tiptap/core` is NOT a direct dep — import its types via `@tiptap/react` (which
      `export *`s all of core). Verify by typing + a toolbar command (Undo reverts):
      Playwright `.fill()` on a contenteditable REPLACES the text (wipes marks), so
      assert `onValueChange` fired + the controlled round-trip survived, not the mark.
- [ ] **dnd-kit (@wizeworks/silicaui-dnd)**: `SortableList<T>` is a generic function component.
      dnd-kit's `attributes` + `listeners` types don't line up with React's handler
      unions — merge them into the `handleProps` you hand consumers with ONE localized
      `as React.HTMLAttributes<HTMLElement>` cast (no `any` leak). `PointerSensor`
      `activationConstraint: { distance: 4 }` so a click isn't swallowed as a drag;
      add `KeyboardSensor` + `sortableKeyboardCoordinates` for a11y. Verify reorder via
      KEYBOARD (focus handle → Space to pick up → Arrow to move → Space to drop) and
      assert `onReorder` updated state — deterministic, unlike synthesizing a pointer drag.
- [ ] **react-resizable-panels (@wizeworks/silicaui-panels)**: thin passthrough wrappers around
      `PanelGroup`/`Panel`/`PanelResizeHandle`. The group carries
      `data-panel-group-direction` (`horizontal`/`vertical`) — drive handle orientation
      off the group ancestor (`.resizable-group[data-panel-group-direction="horizontal"] > .resizable-handle`),
      one rule set for both axes. Handle state = `data-resize-handle-state`
      (`inactive`/`hover`/`drag`). Handles are keyboard-resizable `role="separator"`
      (focus + ArrowLeft/Right ≈ 10% step, `aria-valuenow` tracks the leading panel) —
      verify that + `data-panel-size` changes. A panel needs a sized parent (the group
      is `height:100%`, so give the wrapper a height).

## Canonical files to copy from
- CSS colored: `packages/silicaui/src/components/badge.js` · colorless: `divider.js` · Base-UI-CSS: `accordion.js`, `carousel.js`
- React simple: `packages/silicaui-react/src/divider.tsx`, `tag-input.tsx`, `empty-state.tsx` · interactive: `rating.tsx`, `carousel.tsx` · Base UI: `tooltip.tsx`, `accordion.tsx`, `drawer.tsx` · from-scratch behavior (no Base UI part): `calendar.tsx` (date math + roving-tabindex keyboard grid)
- Opt-in dependency package (wraps a lib, shares the core context): `packages/silicaui-charts/` (ECharts: `chart.tsx`, `theme.ts`), `packages/silicaui-table/` (TanStack: `data-table.tsx`), `packages/silicaui-editor/` (TipTap: `rich-text-editor.tsx`), `packages/silicaui-dnd/` (dnd-kit: `sortable-list.tsx` — generic component), `packages/silicaui-panels/` (react-resizable-panels: `resizable-panels.tsx` — thin passthrough)
- OKLCH color math (dependency-free OKLab↔sRGB, hex I/O): `packages/silicaui-react/src/lib/oklch.ts` (used by `color-picker.tsx`)
- Helpers: `lib/auto-content.js` (contentVar), `lib/config.tsx` (useSilicaClass), `lib/cx.ts`, `lib/tokens.ts`
