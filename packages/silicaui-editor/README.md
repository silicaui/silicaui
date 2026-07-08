# @wizeworks/silicaui-editor

Silica UI's `<RichTextEditor>` — [TipTap](https://tiptap.dev/) wrapped with a
Silica-styled formatting toolbar and content surface. Controlled or
uncontrolled, HTML in and out.

[![Website](https://img.shields.io/badge/website-silicaui.com-8b5cf6?style=flat-square)](https://silicaui.com)
[![npm version](https://img.shields.io/npm/v/@wizeworks/silicaui-editor.svg?style=flat-square)](https://www.npmjs.com/package/@wizeworks/silicaui-editor)
[![npm downloads](https://img.shields.io/npm/dm/@wizeworks/silicaui-editor.svg?style=flat-square)](https://www.npmjs.com/package/@wizeworks/silicaui-editor)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@wizeworks/silicaui-editor?style=flat-square)](https://bundlephobia.com/package/@wizeworks/silicaui-editor)
[![license](https://img.shields.io/npm/l/@wizeworks/silicaui-editor.svg?style=flat-square)](https://github.com/silicaui/silicaui/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/silicaui/silicaui/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/silicaui/silicaui/actions/workflows/ci.yml)

## Install

```bash
pnpm add @wizeworks/silicaui-editor @wizeworks/silicaui-react
pnpm add -D @wizeworks/silicaui tailwindcss
```

## Usage

```tsx
import { RichTextEditor } from "@wizeworks/silicaui-editor";

const [html, setHtml] = React.useState("<p>Hello world</p>");

<RichTextEditor value={html} onValueChange={setHtml} placeholder="Write something…" />
```

Ships with `StarterKit`, link, and placeholder extensions preconfigured.

## `<RichTextEditor>` props

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `string` — controlled HTML value | — |
| `defaultValue` | `string` — uncontrolled initial HTML | — |
| `onValueChange` | `(html: string) => void` — fires with the editor's HTML on every change | — |
| `placeholder` | `string` — empty-state placeholder text | — |
| `editable` | `boolean` | `true` |
| `toolbar` | `boolean` — show the formatting toolbar | `true` |
| `contentClassName` | `string` — class for the editable content surface | — |

Also re-exports TipTap's `useEditor`, `EditorContent`, and `Editor` (plus
`EditorOptions`), so you can extend the editor — add extensions, drive
commands imperatively — without a separate TipTap install.

## Links

- [silicaui.com](https://silicaui.com) — website & docs

- [GitHub repo](https://github.com/silicaui/silicaui)
- [Issues](https://github.com/silicaui/silicaui/issues)
- [`@wizeworks/silicaui-react`](https://www.npmjs.com/package/@wizeworks/silicaui-react) — the component layer this package extends
