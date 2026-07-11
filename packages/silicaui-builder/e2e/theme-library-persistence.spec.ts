import { test, expect, type Page } from "@playwright/test";

/**
 * The site's OWN saved-theme library (`site.savedThemes` — "This site" in the
 * Themes panel) is real site data now, not an in-memory-only convenience: it
 * must relay through the same channels as any other edit — local crash-recovery
 * AND survive being reseeded from a host-provided `document`. The motivating
 * case: an author starts a "Christmas" theme months ahead of the holiday and
 * expects it to still be there — and still their host's to persist — later.
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

async function openTheme(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Theme" }).click();
  await expect(page.locator(".sui-brd")).toBeVisible();
}

test("saving a named theme survives a reload via the local draft store", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));

  await page.goto("/?persist=1");
  await clearDrafts(page);
  await page.reload();
  await ready(page);
  await openTheme(page);

  // Rename the active theme and snapshot it into "This site".
  const nameInput = page.getByRole("textbox", { name: "Theme name" });
  await nameInput.fill("Christmas");
  await page.getByRole("button", { name: "Save current" }).click();
  await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();
  await expect(page.getByText("Christmas", { exact: true })).toBeVisible();

  // Let the debounced autosave land.
  await page.waitForTimeout(900);

  // Reload as if the tab crashed and reopened — the saved theme comes back.
  await page.reload();
  await ready(page);
  await expect(page.getByTestId("recovery-banner")).toBeVisible();
  await openTheme(page);
  await expect(page.getByText("Christmas", { exact: true })).toBeVisible();

  await clearDrafts(page);
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("saving a named theme relays the whole site to the host's onChange", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));

  // No local persistence — the host's onChange is the only channel under test.
  await page.goto("/");
  await ready(page);
  await openTheme(page);

  const nameInput = page.getByRole("textbox", { name: "Theme name" });
  await nameInput.fill("Christmas");
  const countBefore = await page.evaluate(() => (window as unknown as { __changeCount: number }).__changeCount);
  await page.getByRole("button", { name: "Save current" }).click();
  await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();

  const [countAfter, savedThemeNames] = await page.evaluate(() => {
    const w = window as unknown as { __changeCount: number; __lastChange: { savedThemes?: { name: string }[] } };
    return [w.__changeCount, (w.__lastChange.savedThemes ?? []).map((t) => t.name)];
  });
  expect(countAfter).toBeGreaterThan(countBefore);
  expect(savedThemeNames).toContain("Christmas");

  // Re-apply it from the library to prove it's a real, selectable entry, not
  // just a payload artifact.
  await page.getByText("Christmas", { exact: true }).click();
  await expect(nameInput).toHaveValue("Christmas");

  expect(errors, errors.join("\n")).toHaveLength(0);
});
