import { defineConfig } from "tsup";

export default defineConfig({
  // `.` = the framework-neutral engine. `./react` = the builder chrome (React).
  entry: { index: "src/index.ts", "react/index": "src/react/index.ts" },
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
