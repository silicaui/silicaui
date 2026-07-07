import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// The harness runs the workspace packages straight from source (no build step).
// Tailwind compiles silicaui's plugin so the chrome renders with the REAL
// component + utility classes; the React plugin lets it dogfood silicaui-react.
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: { port: 5178 },
  resolve: {
    alias: {
      "silicaui-html/blocks": fileURLToPath(
        new URL("../../silicaui-html/src/blocks/index.ts", import.meta.url),
      ),
      "silicaui-html": fileURLToPath(new URL("../../silicaui-html/src/index.ts", import.meta.url)),
      "silicaui-react": fileURLToPath(new URL("../../silicaui-react/src/index.ts", import.meta.url)),
      "silicaui-builder/react": fileURLToPath(new URL("../src/react/index.ts", import.meta.url)),
      "silicaui-builder": fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    },
  },
});
