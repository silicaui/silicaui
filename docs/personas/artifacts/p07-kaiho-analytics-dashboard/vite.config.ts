import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwind()],
  // Two copies of React is the first thing that breaks a linked workspace
  // package, and it fails as a hook error rather than as a resolution error.
  resolve: { dedupe: ["react", "react-dom"] },
  build: {
    // One file, so "how big is this" has one answer rather than a pile to add up.
    rollupOptions: { output: { manualChunks: undefined } },
  },
});
