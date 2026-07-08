# @wizeworks/silicaui

The CSS layer of **Silica UI** — a Tailwind CSS v4 plugin that ships semantic,
themeable component classes (`btn`, `btn-primary`, `card`, `dialog`, …) built on
an extensible OKLCH color-token engine. CSS-first: no `tailwind.config`, just a
single `@plugin "@wizeworks/silicaui"` line. Framework-agnostic — pair it with
[`@wizeworks/silicaui-react`](https://github.com/silicaui/silicaui/tree/main/packages/silicaui-react)
or use the classes directly in any HTML.

[![Website](https://img.shields.io/badge/website-silicaui.com-8b5cf6?style=flat-square)](https://silicaui.com)
[![npm version](https://img.shields.io/npm/v/@wizeworks/silicaui.svg?style=flat-square)](https://www.npmjs.com/package/@wizeworks/silicaui)
[![npm downloads](https://img.shields.io/npm/dm/@wizeworks/silicaui.svg?style=flat-square)](https://www.npmjs.com/package/@wizeworks/silicaui)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@wizeworks/silicaui?style=flat-square)](https://bundlephobia.com/package/@wizeworks/silicaui)
[![license](https://img.shields.io/npm/l/@wizeworks/silicaui.svg?style=flat-square)](https://github.com/silicaui/silicaui/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/silicaui/silicaui/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/silicaui/silicaui/actions/workflows/ci.yml)

## Install

```bash
pnpm add -D @wizeworks/silicaui tailwindcss
```

```css
/* your globals.css */
@import "tailwindcss";
@plugin "@wizeworks/silicaui";
```

That's it — every class below is now available anywhere in your markup.

## Colors

Silica ships eight semantic color pairs — `primary`, `secondary`, `accent`,
`neutral`, `info`, `success`, `warning`, `error` — each with a `-content`
foreground token, plus `base-100/200/300` and `base-content`. Toggle themes with
`data-theme="dark"` on any ancestor; themed subtrees can nest inside a
differently-themed host and resolve tokens by nearest-ancestor inheritance.

### Bring your own colors

Add colors in your CSS and list them so they get full component variant
coverage (`btn-<name>`, `badge-<name>`, `alert-<name>`, …) — no codegen step:

```css
@plugin "@wizeworks/silicaui" {
  colors: primary, secondary, accent, neutral, info, success, warning, error, brand;
}
@theme {
  --color-brand: #7c3aed;           /* hex, oklch, rgb, hsl — all fine */
  /* --color-brand-content is optional; omit it and Silica auto-derives a
     legible black/white foreground from the color's lightness. */
}
```

Now `btn-brand`, `btn-outline btn-brand`, `btn-soft btn-brand`, … all work,
exactly like the built-in colors.

## Components

Silica ships **76 component families** as plain CSS classes — daisyUI's
ergonomics, rebuilt on Tailwind v4's CSS-first engine with a wider, more
consistent variant grammar (color / style / size / shape are always the same
four axes).

| Category | Components |
| --- | --- |
| **Actions** | `button` `dropdown` `swap` |
| **Data display** | `accordion` `avatar` `badge` `card` `carousel` `chat` `details` `countdown` `diff` `kbd` `list` `mockup` `preview-card` `stat` `table` `timeline` |
| **Data input** | `calendar` `checkbox` `checkbox-group` `color-picker` `combobox` `field` `fieldset` `file-input` `filter` `input` `join` `label` `number-field` `radio` `radio-group` `range` `rating` `select` `select-menu` `slider` `switch` `tag-input` `textarea` `toggle` `toggle-group` `validator` |
| **Navigation** | `breadcrumb` `dock` `link` `menu` `menubar` `navbar` `navigation-menu` `pagination` `steps` `tabs` |
| **Feedback & overlay** | `alert` `dialog` `drawer` `indicator` `loading` `popover` `progress` `radial-progress` `skeleton` `toast` `tooltip` |
| **Layout** | `divider` `footer` `hero` `mask` `scroll-area` `stack` |
| **Composite / advanced** | `chart` `data-table` `resizable-panels` `rich-text-editor` `sortable-list` `command-palette` `dropzone` `empty-state` `tree-view` `toolbar` `wizard` |
| **Typography** | `typography` `prose` |

The composite/advanced classes back the matching React wrapper packages —
[`@wizeworks/silicaui-charts`](https://www.npmjs.com/package/@wizeworks/silicaui-charts),
[`@wizeworks/silicaui-table`](https://www.npmjs.com/package/@wizeworks/silicaui-table),
[`@wizeworks/silicaui-panels`](https://www.npmjs.com/package/@wizeworks/silicaui-panels),
[`@wizeworks/silicaui-editor`](https://www.npmjs.com/package/@wizeworks/silicaui-editor), and
[`@wizeworks/silicaui-dnd`](https://www.npmjs.com/package/@wizeworks/silicaui-dnd) — each pairing the
CSS with the JS engine it wraps (ECharts, TanStack Table, react-resizable-panels,
TipTap, dnd-kit).

### Button

```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-outline btn-secondary">Outline</button>
<button class="btn btn-soft btn-accent btn-lg">Soft large</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-primary" aria-busy="true">Loading</button>
<button class="btn btn-primary btn-square" aria-label="Add">+</button>
```

| Axis | Classes |
| --- | --- |
| Color | `btn-primary` … `btn-error`, `btn-<yourColor>` |
| Style | `btn-outline` · `btn-soft` · `btn-ghost` · `btn-link` · `btn-dash` (default is solid) |
| Size | `btn-xs` · `btn-sm` · `btn-md` · `btn-lg` · `btn-xl` |
| Shape | `btn-square` · `btn-circle` |
| Layout | `btn-block` · `btn-wide` |
| State | `btn-active` · `btn-disabled`, `aria-busy="true"` for loading |

Every other component follows the same color/style/size/shape grammar — see the
[architecture doc](https://github.com/silicaui/silicaui/blob/main/docs/silicaui-architecture.md)
for the full design system.

## Links

- [silicaui.com](https://silicaui.com) — website & docs

- [GitHub repo](https://github.com/silicaui/silicaui)
- [Issues](https://github.com/silicaui/silicaui/issues)
- [`@wizeworks/silicaui-react`](https://www.npmjs.com/package/@wizeworks/silicaui-react) — the React layer
