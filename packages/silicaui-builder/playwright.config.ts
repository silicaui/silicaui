import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for the builder. Playwright boots the Vite HARNESS (which resolves
 * the workspace packages straight from source — so specs test the current source,
 * no build step) on a dedicated, deterministic port and drives it headless.
 *
 * Run: `pnpm --filter silicaui-builder e2e`. A dev harness on 5178 is left alone —
 * e2e uses its own port (`--strictPort` so it never silently drifts).
 */
const PORT = 5190;
const URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Call vite directly (not `pnpm harness`, whose `--` forwarding swallows the
    // flags) so the harness binds our deterministic port.
    command: `pnpm exec vite harness --port ${PORT} --strictPort`,
    url: URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
