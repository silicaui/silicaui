import { defineConfig, devices } from "@playwright/test";

/**
 * Browser probes for behavior jsdom cannot faithfully reproduce.
 *
 * The silicaui-react package's own probes run in jsdom, which is enough for
 * almost everything — but not for event-loop-sensitive work. jsdom does not
 * perform the microtask checkpoint the HTML spec runs BETWEEN event listener
 * callbacks, so `Form`'s focus policy passed there while being broken in every
 * real browser. Anything that turns on real focus, selection, or listener
 * ordering belongs here instead.
 *
 * Run: `pnpm --filter playground e2e` (builds + serves the playground itself).
 */
const PORT = 5191;
const URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "line" : "list",
  use: { baseURL: URL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // `preview` serves the real production bundle, so these probe the same
    // output a consumer installs — not a dev-server-only code path.
    command: `pnpm build && pnpm exec vite preview --port ${PORT} --strictPort`,
    url: URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
