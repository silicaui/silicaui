import { test, expect, type Page } from "@playwright/test";

/**
 * Local crash-recovery for the EMAIL builder — same durable-draft mechanism as
 * the site builder's `persistence.spec.ts` (shared `DraftStore`, distinct
 * `persistKey`), verified independently since it's driven by its own
 * `EmailBuilder` boot/autosave wiring, not shared UI.
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
  await page.waitForSelector(".sui-email-canvas");
}

test("email edits survive a reload via the local draft store", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));

  await page.goto("/?editor=email&persist=1");
  await clearDrafts(page);
  await page.reload();
  await ready(page);
  const canvas = page.locator(".sui-email-canvas");

  await expect(page.getByTestId("recovery-banner")).toHaveCount(0);

  // `.first()`: once selected, the SelectionOverlay's floating label repeats the
  // same text — scope to the real (first, in DOM order) occurrence.
  await canvas.getByText("Start writing your email…").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Persisted across reload");
  await page.keyboard.press("ControlOrMeta+Enter");
  await expect(canvas.getByText("Persisted across reload").first()).toBeVisible();

  // Let the debounced autosave land (localStorage flush also runs on reload).
  await page.waitForTimeout(900);

  await page.reload();
  await ready(page);
  await expect(page.getByTestId("recovery-banner")).toBeVisible();
  await expect(page.locator(".sui-email-canvas").getByText("Persisted across reload")).toBeVisible();

  // "Start fresh" discards the draft and reseeds from the default document.
  await page.getByRole("button", { name: "Start fresh" }).click();
  await expect(page.locator(".sui-email-canvas").getByText("Start writing your email…")).toBeVisible();
  await expect(page.locator(".sui-email-canvas").getByText("Persisted across reload")).toHaveCount(0);

  await page.reload();
  await ready(page);
  await expect(page.locator(".sui-email-canvas").getByText("Start writing your email…")).toBeVisible();

  await clearDrafts(page);
  expect(errors, errors.join("\n")).toHaveLength(0);
});
