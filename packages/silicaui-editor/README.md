# silicaui-editor

Silica UI's `<RichTextEditor>` — [TipTap](https://tiptap.dev/) wrapped with a
Silica-styled formatting toolbar and content surface. Controlled or
uncontrolled, HTML in and out.

[![npm version](https://img.shields.io/npm/v/silicaui-editor.svg?style=flat-square)](https://www.npmjs.com/package/silicaui-editor)
[![npm downloads](https://img.shields.io/npm/dm/silicaui-editor.svg?style=flat-square)](https://www.npmjs.com/package/silicaui-editor)
[![bundle size](https://img.shields.io/bundlephobia/minzip/silicaui-editor?style=flat-square)](https://bundlephobia.com/package/silicaui-editor)
[![license](https://img.shields.io/npm/l/silicaui-editor.svg?style=flat-square)](https://github.com/silicaui/silicaui/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/silicaui/silicaui/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/silicaui/silicaui/actions/workflows/ci.yml)

## Install

```bash
pnpm add silicaui-editor silicaui-react
pnpm add -D silicaui tailwindcss
```

## Usage

```tsx
import { RichTextEditor } from "silicaui-editor";

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

- [GitHub repo](https://github.com/silicaui/silicaui)
- [Issues](https://github.com/silicaui/silicaui/issues)
- [`silicaui-react`](https://www.npmjs.com/package/silicaui-react) — the component layer this package extends
