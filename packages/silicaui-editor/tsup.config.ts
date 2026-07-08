import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // Keep peers + the TipTap/ProseMirror engine external so the consumer's
  // bundler dedupes them (the regexes catch every `@tiptap/*` and `prosemirror-*`
  // subpackage).
  external: [
    "react",
    "react-dom",
    "@wizeworks/silicaui-react",
    /^@tiptap\//,
    /^prosemirror-/,
  ],
});
