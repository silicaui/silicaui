import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Deliberately NO aliases into the silicaui source tree. Quarrystone is an
// ordinary consumer: it installs the published packages and imports their built
// output, the same as any customer of ours would. The builder's own harness
// runs from source with a dozen path aliases, and "works in the harness" is not
// the question being asked here.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5192 },
  resolve: {
    // The step builder-contract.md never mentions, and the first thing an
    // evaluating integrator hits.
    //
    // The silicaui packages declare React as a PEER dependency, which is right —
    // but any local link (`file:`, `npm link`, a monorepo checkout) resolves
    // each linked package's own `node_modules/react` instead of ours. Four
    // copies of React, and the builder mounts to a blank panel with
    // "Invalid hook call" in the console. Nothing in the contract says a word
    // about it. See docs/personas/issues/079.
    dedupe: ["react", "react-dom"],
  },
});
