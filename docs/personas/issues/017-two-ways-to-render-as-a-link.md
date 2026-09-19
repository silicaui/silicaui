# 017 — She wrote `render` on a sidebar row because she had just written it on a Button

**Status:** fixed
**Severity:** minor
**Found by:** P01 · Dilnoza Karimova · act 5
**Surface:** `@wizeworks/silicaui-react` — the polymorphism prop
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** P01 act 5, on `localhost:4099`

## What happened

Building the console nav, each sidebar row has to be a Next `Link`. She had just used
`render` on a Button, so she wrote the same thing:

```tsx
<SidebarItem render={<Link href={item.href} />} icon={item.icon}>Overview</SidebarItem>
```

```
app/console-shell.tsx(91,21): error TS2322:
  Property 'render' does not exist on type
  'IntrinsicAttributes & SidebarItemProps & RefAttributes<HTMLElement>'.
```

`SidebarItem` wants `as`:

```tsx
<SidebarItem as={Link} href={item.href} icon={item.icon}>Overview</SidebarItem>
```

Both props do the same job — *render this as a different element* — and the library ships
both, on different components, with nothing saying which is which.

## What should have happened

One name. The typecheck error tells her `render` is wrong but not that `as` is right, so
the answer came from opening `sidebar.tsx`.

## How to reproduce

1. `<Button render={<a href="/x" />}>` — compiles.
2. `<SidebarItem render={<a href="/x" />}>` — TS2322.
3. `<Heading render={<a href="/x" />}>` — TS2322. Every time.

## Why it matters

**Minor, and it is minor for a good reason: it fails at typecheck, loudly, before it can
ship.** Nothing renders wrong and nothing is silent.

What it costs is trust rather than time. The thing Dilnoza is here to evaluate is whether
this system is coherent — she has one afternoon and she is reading for signs somebody
thought it through. Two names for one concept is a small tell, and it is the kind she is
specifically looking for.

## Where it lives

`@wizeworks/silicaui-react`. Counted, not estimated:

| Prop | Components |
| --- | --- |
| `render` | `Button`, `Badge`, `Card`, `PowerSearch` |
| `as` | `SidebarItem`, `Text`, `BlockquoteCite`, `Wordmark` |

`render` is the intended house style, and `Button`'s own doc says so:

> *"Mirrors Base UI's `render` composition model."*

Since `@wizeworks/silicaui-react` **is** the Base UI layer, `as` is the outlier — four
components that did not get the memo, not a second sanctioned mechanism.

`render` is also the better of the two on its merits: `render={<Link href="/x" />}`
type-checks `href` against `Link`, while `as={Link}` plus a loose `href` on the parent
does not — `SidebarItemProps` has to widen to `React.AllHTMLAttributes` to let `href`
through at all, which is a comment in the source admitting the cost.

## Do the siblings have it too?

**The whole finding is a sibling count** — four and four, listed above, read from the
source rather than sampled.

**Checked and NOT affected:** every other component takes neither prop and renders one
fixed element. `AppShell`'s slots are a different mechanism (composition by child) and are
correct as they are.

## The fix

Give the four `as` components a `render` prop through `composeRender` — the shared
implementation `Button`/`Badge`/`Card` already use — and keep `as` working as a
deprecated alias so nothing breaks.

Then extend `verify-prop-vocabulary.mjs`, which exists for exactly this rule. Its header
already states it:

> *"A design system's value is that one prop name means one concept everywhere. `size`
> drifted into three…"*

That probe catches **one name, several concepts**. This is the mirror — **one concept,
several names** — and the same file is the right home for it, so the next component to
add polymorphism cannot invent a third spelling.

## Confirmed by

**Re-ran the line that failed.** The original `render={<Link href={item.href} />}` on
`SidebarItem` — the exact code that produced TS2322 — now typechecks, and Dilnoza's
console ships it.

**Confirmed by what reached the DOM, not by the compile.** All four nav rows:

| | |
| --- | --- |
| tag | `A`, `A`, `A`, `A` — real anchors |
| `href` | `/`, `/shipments`, `/customs`, `/consignees` |
| `aria-current` | `page` on the active row only |
| icon + label spans | present on all four |
| stray `type` attribute | `null` on all four |

That last row is the one worth having. `SidebarItem` adds `type="button"` when it owns
the element, and composing an `<a>` must not inherit it — so the composition path skips
it. Checked rather than assumed.

**Then clicked it.** `/` → `/shipments`: the URL changed, the `<h1>` became *Shipments*,
the navbar label followed and the active row moved. Real navigation through the composed
`Link`, not just a styled anchor.

**Probed, and the probe was proved to fail first.** `verify-prop-vocabulary.mjs` — the
file whose whole premise is *"one prop name means one concept everywhere"* — now also
checks the mirror. It finds 4 polymorphic components and requires `render` on each.
Removing it from `Wordmark`:

> `✗ wordmark.tsx: WordmarkProps declares as with no render beside it. Polymorphism has
> ONE name in Silica — render, the Base UI model that Button/Badge/Card use…`

Restored, green.

**`as` still works everywhere it did.** It is marked deprecated, not removed, so nothing
breaks; the console used `as={Link}` for an hour before switching and both paths rendered
the same DOM.

## Rating effect

—
