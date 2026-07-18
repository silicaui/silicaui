# @wizeworks/silicaui-react

The React layer of **Silica UI**. Components are **thin wrappers** — they apply
[`@wizeworks/silicaui`](https://www.npmjs.com/package/@wizeworks/silicaui) classes and delegate
interaction behavior (focus management, keyboard nav, positioning, a11y) to
[Base UI](https://base-ui.com). No styling logic hides in JS: every visual
variant is a class string, so the CSS and React layers never drift apart.

[![Website](https://img.shields.io/badge/website-silicaui.com-8b5cf6?style=flat-square)](https://silicaui.com)
[![npm version](https://img.shields.io/npm/v/@wizeworks/silicaui-react.svg?style=flat-square)](https://www.npmjs.com/package/@wizeworks/silicaui-react)
[![npm downloads](https://img.shields.io/npm/dm/@wizeworks/silicaui-react.svg?style=flat-square)](https://www.npmjs.com/package/@wizeworks/silicaui-react)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@wizeworks/silicaui-react?style=flat-square)](https://bundlephobia.com/package/@wizeworks/silicaui-react)
[![license](https://img.shields.io/npm/l/@wizeworks/silicaui-react.svg?style=flat-square)](https://github.com/silicaui/silicaui/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/silicaui/silicaui/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/silicaui/silicaui/actions/workflows/ci.yml)

## Install

```bash
pnpm add @wizeworks/silicaui-react
pnpm add -D @wizeworks/silicaui tailwindcss
```

Wire the CSS once (see [`@wizeworks/silicaui`](https://www.npmjs.com/package/@wizeworks/silicaui)),
then:

```tsx
import { Button } from "@wizeworks/silicaui-react";

<Button color="primary" onClick={save}>Save</Button>
<Button color="secondary" variant="outline" size="lg">Learn more</Button>
<Button color="error" variant="ghost" loading>Deleting…</Button>
<Button color="brand" render={<a href="/docs" />}>Docs</Button>
<Button color="primary" shape="circle" aria-label="Add"><PlusIcon /></Button>
```

> The `render={<a … />}` line above works in a **Client Component**. In a
> Server Component, style the anchor directly instead — see
> [Server Components](#server-components).

## Server Components

**Every component in this package is a Client Component.** The main entry point
is published as a single `"use client"` module — components rely on state,
context, or Base UI under the hood, so there's no server-renderable subset.

You can still *use* them from a Server Component; React inserts the boundary
for you. The one thing that does **not** cross that boundary is the `render`
prop:

```tsx
// ❌ In a Server Component — the <a> is serialized across the "use client"
//    boundary and arrives without its props. Renders with no href, or throws
//    "Element type is invalid… got: undefined".
<Button color="brand" render={<a href="/docs" />}>Docs</Button>
```

`render` composes an element by cloning it, which needs the real element —
not the serialized reference a Server Component sends. For a link that merely
*looks* like a button, don't compose at all: apply the classes directly.

```tsx
// ✅ Works anywhere, including Server Components. No client boundary at all.
import { buttonClasses } from "@wizeworks/silicaui-react/server";

<a href="/docs" className={buttonClasses({ color: "brand" })}>Docs</a>
```

The `/server` entry point is dependency-free and has no `"use client"` marker:

| Export | Replaces |
| --- | --- |
| `buttonClasses(opts)` | `<Button render={…}>` |
| `badgeClasses(opts)` | `<Badge render={…}>` |
| `clickableCardClasses(opts)` | `<ClickableCard render={…}>` |
| `cx(...)` | class-name joining |

Reach for `render` only when the component is already `"use client"` — for a
router `<Link>` inside an interactive component, say. If you need Silica's
interactive components (`Dialog`, `Select`, …), mark your own component
`"use client"`; that's expected, not a workaround.

> **Importing from `"@wizeworks/silicaui-react"` in a Server Component hands you
> a client reference, not a function.** Always import the class builders from
> `"@wizeworks/silicaui-react/server"`.

## Components

**125 components**, covering everything from primitives to composite
interaction patterns:

| Category | Components |
| --- | --- |
| **Actions** | `Button` `DropdownMenu` `Swap` |
| **Data display** | `Accordion` `Avatar` `Badge` `Card` `Carousel` `Chat` `ChatComposer` `ChatLayout` `ChatMessage` `ChatSystemMessage` `ChatToolCalls` `ChatTypingIndicator` `Collapse` `Countdown` `Diff` `Kbd` `List` `MetadataList` `Meter` `MockupBrowser` `MockupCode` `MockupCodeLine` `MockupPhone` `MockupWindow` `PreviewCard` `Stat` `Table` `Timeline` `Timestamp` |
| **Data input** | `Autocomplete` `Calendar` `Checkbox` `CheckboxGroup` `ColorPicker` `Combobox` `DateInput` `DatePicker` `DateRangeInput` `DateTimeInput` `Field` `Fieldset` `FileInput` `FileUpload` `Filter` `Form` `Input` `InputGroup` `Join` `Label` `MultiSelect` `NativeSelect` `NumberField` `PasswordInput` `PhoneInput` `PinInput` `Radio` `RadioGroup` `Range` `Rating` `SearchInput` `Select` `SelectionList` `Slider` `Switch` `TagInput` `Textarea` `TimeInput` `Toggle` `ToggleGroup` `Validator` |
| **Navigation** | `Breadcrumb` `Dock` `Link` `Menu` `Menubar` `Navbar` `NavigationMenu` `Outline` `OverflowList` `Pagination` `Sidebar` `Steps` `Tabs` |
| **Feedback & overlay** | `Alert` `AlertDialog` `ContextMenu` `Dialog` `Drawer` `ImperativeAlertDialogProvider` `Indicator` `Lightbox` `Loading` `Overlay` `Popover` `Progress` `RadialProgress` `Skeleton` `Status` `ToastProvider` `Tooltip` |
| **Layout** | `AppShell` `Divider` `Footer` `Hero` `Mask` `ScrollArea` `Stack` |
| **Advanced / composite** | `Collapsible` `CommandPalette` `Dropzone` `EmptyState` `PowerSearch` `ThemeController` `Toolbar` `TreeView` `Wizard` |
| **Typography** | `Blockquote` `Display` `Heading` `Prose` `Text` `Typography` `Wordmark` |

Composite components with heavier engines are separate packages so this
package stays dependency-light — install them alongside `@wizeworks/silicaui-react` when
you need them:

| Package | Wraps |
| --- | --- |
| [`@wizeworks/silicaui-charts`](https://www.npmjs.com/package/@wizeworks/silicaui-charts) | Apache ECharts, auto-themed to Silica tokens |
| [`@wizeworks/silicaui-table`](https://www.npmjs.com/package/@wizeworks/silicaui-table) | TanStack Table — sort, select, paginate |
| [`@wizeworks/silicaui-editor`](https://www.npmjs.com/package/@wizeworks/silicaui-editor) | TipTap rich-text editor |
| [`@wizeworks/silicaui-dnd`](https://www.npmjs.com/package/@wizeworks/silicaui-dnd) | dnd-kit — sortable lists & drag primitives |
| [`@wizeworks/silicaui-panels`](https://www.npmjs.com/package/@wizeworks/silicaui-panels) | react-resizable-panels |

## `<Button>` props

A representative example — every component follows the same shape: semantic
`color`/`variant`/`size` props mapping straight to `@wizeworks/silicaui` classes, full
native-element prop passthrough, and a forwarded `ref`.

| Prop | Type | Default |
| --- | --- | --- |
| `color` | semantic name or any custom color | — (neutral) |
| `variant` | `solid \| outline \| soft \| ghost \| link \| dash` | `solid` |
| `size` | `xs \| sm \| md \| lg \| xl` | `md` |
| `shape` | `square \| circle` | — |
| `block` / `wide` / `active` | `boolean` | `false` |
| `loading` | `boolean` — spinner + `aria-busy` + non-interactive | `false` |
| `iconStart` / `iconEnd` | `ReactNode` | — |
| `render` | `ReactElement` — render as another element | — |

Plus all native `<button>` attributes and a forwarded `ref`.

## Links

- [silicaui.com](https://silicaui.com) — website & docs

- [GitHub repo](https://github.com/silicaui/silicaui)
- [Issues](https://github.com/silicaui/silicaui/issues)
- [`@wizeworks/silicaui`](https://www.npmjs.com/package/@wizeworks/silicaui) — the CSS layer this package styles with
