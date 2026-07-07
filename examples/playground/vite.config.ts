import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Ensure a single React copy across the workspace source packages (the
    // charts/table packages import React and must share the playground's).
    dedupe: ["react", "react-dom"],
    alias: {
      // Consume the workspace packages straight from source during dev — no
      // build step. (Alias keys match on path-segment boundaries, so
      // `silicaui-react` won't shadow `silicaui-charts`/`silicaui-table`.)
      "silicaui-charts": fileURLToPath(
        new URL("../../packages/silicaui-charts/src/index.ts", import.meta.url),
      ),
      "silicaui-table": fileURLToPath(
        new URL("../../packages/silicaui-table/src/index.ts", import.meta.url),
      ),
      "silicaui-editor": fileURLToPath(
        new URL("../../packages/silicaui-editor/src/index.ts", import.meta.url),
      ),
      "silicaui-dnd": fileURLToPath(
        new URL("../../packages/silicaui-dnd/src/index.ts", import.meta.url),
      ),
      "silicaui-panels": fileURLToPath(
        new URL("../../packages/silicaui-panels/src/index.ts", import.meta.url),
      ),
      "silicaui-react": fileURLToPath(
        new URL("../../packages/silicaui-react/src/index.ts", import.meta.url),
      ),
    },
  },
});
