import { test, expect, type Page } from "@playwright/test";

/**
 * Local crash-recovery — the huge one: work must survive a reload / closed tab /
 * power cut. The harness enables local persistence under `?persist=1`; this spec
 * edits, reloads, and proves the edit came back (restored from the durable local
 * draft) with the recovery banner confirming it. It wipes the store before and
 * after so runs are independent (other specs run with persistence OFF).
 */

const clearDrafts = (page: Page) =>
  page.evaluate(() => {
    try {
      indexedDB.deleteDatabase("silicaui-builder");
    } catch {
      /* ignore */
    }
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });

async function ready(page: Page): Promise<void> {
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

test("edits survive a reload via the local draft store", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));

  // Start from a clean store so the seed (not a stale draft) loads first.
  await page.goto("/?persist=1");
  await clearDrafts(page);
  await page.reload();
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  // First load has no draft → no recovery banner, seeded document renders.
  await expect(page.getByTestId("recovery-banner")).toHaveCount(0);

  // Make a real edit: retitle the hero headline inline on the canvas.
  await canvas.getByText("Ship your store in an afternoon").dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Persisted across reload");
  await page.keyboard.press("Enter");
  await expect(canvas.getByText("Persisted across reload")).toBeVisible();

  // Let the debounced autosave land (localStorage flush also runs on reload).
  await page.waitForTimeout(900);

  // Reload as if the tab crashed and reopened — the edit comes back, and the
  // banner confirms the session was restored.
  await page.reload();
  await ready(page);
  await expect(page.getByTestId("recovery-banner")).toBeVisible();
  await expect(page.locator(".sui-canvas").getByText("Persisted across reload")).toBeVisible();
  await expect(page.locator(".sui-canvas").getByText("Ship your store in an afternoon")).toHaveCount(0);

  // "Start fresh" discards the draft and reseeds from the original document.
  await page.getByRole("button", { name: "Start fresh" }).click();
  await expect(page.locator(".sui-canvas").getByText("Ship your store in an afternoon")).toBeVisible();
  await expect(page.locator(".sui-canvas").getByText("Persisted across reload")).toHaveCount(0);

  // And that discard is durable — a reload no longer restores the edit.
  await page.reload();
  await ready(page);
  await expect(page.locator(".sui-canvas").getByText("Ship your store in an afternoon")).toBeVisible();

  await clearDrafts(page);
  expect(errors, errors.join("\n")).toHaveLength(0);
});
