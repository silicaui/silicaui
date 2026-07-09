import { defineConfig } from "tsup";

export default defineConfig({
  // `.` / `./react` = the site editor (framework-neutral engine / React chrome).
  // `./email` / `./email/react` = the email editor, its peer.
  entry: {
    index: "src/index.ts",
    "react/index": "src/react/index.ts",
    "email/index": "src/email/index.ts",
    "email/react/index": "src/email/react/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: [
    "react",
    "react-dom",
    /^react\//,
    /^@wizeworks\/silicaui-html(\/|$)/,
    /^@wizeworks\/silicaui-react(\/|$)/,
    /^@wizeworks\/silicaui(\/|$)/,
  ],
});
