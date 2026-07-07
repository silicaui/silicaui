# silicaui-react

The React layer of **Silica UI**. Components are **thin wrappers** — they apply
[`silicaui`](https://www.npmjs.com/package/silicaui) classes and delegate
interaction behavior (focus management, keyboard nav, positioning, a11y) to
[Base UI](https://base-ui.com). No styling logic hides in JS: every visual
variant is a class string, so the CSS and React layers never drift apart.

[![Website](https://img.shields.io/badge/website-silicaui.com-8b5cf6?style=flat-square)](https://silicaui.com)
[![npm version](https://img.shields.io/npm/v/silicaui-react.svg?style=flat-square)](https://www.npmjs.com/package/silicaui-react)
[![npm downloads](https://img.shields.io/npm/dm/silicaui-react.svg?style=flat-square)](https://www.npmjs.com/package/silicaui-react)
[![bundle size](https://img.shields.io/bundlephobia/minzip/silicaui-react?style=flat-square)](https://bundlephobia.com/package/silicaui-react)
[![license](https://img.shields.io/npm/l/silicaui-react.svg?style=flat-square)](https://github.com/silicaui/silicaui/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/silicaui/silicaui/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/silicaui/silicaui/actions/workflows/ci.yml)

## Install

```bash
pnpm add silicaui-react
pnpm add -D silicaui tailwindcss
```

Wire the CSS once (see [`silicaui`](https://www.npmjs.com/package/silicaui)),
then:

```tsx
import { Button } from "silicaui-react";

<Button color="primary" onClick={save}>Save</Button>
<Button color="secondary" variant="outline" size="lg">Learn more</Button>
<Button color="error" variant="ghost" loading>Deleting…</Button>
<Button color="brand" render={<a href="/docs" />}>Docs</Button>
<Button color="primary" shape="circle" aria-label="Add"><PlusIcon /></Button>
```

## Components

**90 components**, covering everything from primitives to composite
interaction patterns:

| Category | Components |
| --- | --- |
| **Actions** | `Button` `DropdownMenu` `Swap` |
| **Data display** | `Accordion` `Avatar` `Badge` `Card` `Carousel` `Chat` `Collapse` `Countdown` `Diff` `Kbd` `List` `Mockup` `PreviewCard` `Stat` `Table` `Timeline` |
| **Data input** | `Autocomplete` `Calendar` `Checkbox` `CheckboxGroup` `ColorPicker` `Combobox` `DatePicker` `Field` `Fieldset` `FileInput` `Filter` `Form` `Input` `Join` `Label` `NativeSelect` `NumberField` `Radio` `RadioGroup` `Range` `Rating` `Select` `SelectionList` `Slider` `Switch` `TagInput` `Textarea` `Toggle` `ToggleGroup` `Validator` |
| **Navigation** | `Breadcrumb` `Dock` `Link` `Menu` `Menubar` `Navbar` `NavigationMenu` `Pagination` `Sidebar` `Steps` `Tabs` |
| **Feedback & overlay** | `Alert` `AlertDialog` `ContextMenu` `Dialog` `Drawer` `Indicator` `Loading` `Popover` `Progress` `RadialProgress` `Skeleton` `Toast` `Tooltip` |
| **Layout** | `Divider` `Footer` `Hero` `Mask` `ScrollArea` `Stack` |
| **Advanced / composite** | `CommandPalette` `Dropzone` `EmptyState` `ThemeController` `Toolbar` `TreeView` `Wizard` |
| **Typography** | `Typography` `Prose` `Wordmark` |

Composite components with heavier engines are separate packages so this
package stays dependency-light — install them alongside `silicaui-react` when
you need them:

| Package | Wraps |
| --- | --- |
| [`silicaui-charts`](https://www.npmjs.com/package/silicaui-charts) | Apache ECharts, auto-themed to Silica tokens |
| [`silicaui-table`](https://www.npmjs.com/package/silicaui-table) | TanStack Table — sort, select, paginate |
| [`silicaui-editor`](https://www.npmjs.com/package/silicaui-editor) | TipTap rich-text editor |
| [`silicaui-dnd`](https://www.npmjs.com/package/silicaui-dnd) | dnd-kit — sortable lists & drag primitives |
| [`silicaui-panels`](https://www.npmjs.com/package/silicaui-panels) | react-resizable-panels |

## `<Button>` props

A representative example — every component follows the same shape: semantic
`color`/`variant`/`size` props mapping straight to `silicaui` classes, full
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
- [`silicaui`](https://www.npmjs.com/package/silicaui) — the CSS layer this package styles with
