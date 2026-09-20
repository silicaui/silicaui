import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Vite + React + Tailwind v4, exactly as getting-started step 2 says to set it up:
// "with Vite it is usually `src/index.css`".
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Trois pages: le kit, et les deux moitiés de l'acte 5.
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        collision: resolve(import.meta.dirname, "collision.html"),
        prefixed: resolve(import.meta.dirname, "prefixed.html"),
      },
    },
  },
  server: { port: 4106, strictPort: true },
  preview: { port: 4107, strictPort: true },
});
