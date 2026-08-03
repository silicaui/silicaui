import { test, expect, type Page } from "@playwright/test";

/**
 * Deleting a page asks first.
 *
 * The trash icon sits one button away from Add in the Pages panel and takes the
 * whole page tree with it, so it raises the shared `AlertDialog` rather than
 * firing straight through. Three things have to hold: cancelling changes
 * nothing, confirming removes the page, and the popup — which portals to
 * `document.body`, outside the chrome's `[data-theme]` island — still carries
 * the studio theme.
 */

async function ready(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

/** Adds a page so there are ≥2 (the engine refuses to remove the last one, and
 *  the button is disabled to match), and returns the new page's name. */
async function addSecondPage(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Add page" }).click();
  const name = await page.getByRole("combobox", { name: "Current page" }).textContent();
  expect(name?.trim()).toBeTruthy();
  return name!.trim();
}

test("cancelling the confirm keeps the page", async ({ page }) => {
  await ready(page);
  const name = await addSecondPage(page);

  await page.getByRole("button", { name: "Delete page" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(name);

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("combobox", { name: "Current page" })).toHaveText(name);
});

test("Escape dismisses the confirm and keeps the page", async ({ page }) => {
  await ready(page);
  const name = await addSecondPage(page);

  await page.getByRole("button", { name: "Delete page" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(page.getByRole("alertdialog")).toBeHidden();
  await expect(page.getByRole("combobox", { name: "Current page" })).toHaveText(name);
});

test("confirming removes the page, and undo brings it back", async ({ page }) => {
  await ready(page);
  const name = await addSecondPage(page);

  await page.getByRole("button", { name: "Delete page" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete page" }).click();

  await expect(page.getByRole("alertdialog")).toBeHidden();
  await expect(page.getByRole("combobox", { name: "Current page" })).not.toHaveText(name);

  // The prompt promises undo covers this — hold it to that. Undo restores the
  // DOCUMENT, not the view: the page is back in the switcher, but the active
  // page stays wherever the delete left it, so check the roster, not the label.
  await page.getByRole("button", { name: "Undo" }).click();
  await page.getByRole("combobox", { name: "Current page" }).click();
  await expect(page.getByRole("option", { name })).toBeVisible();
});

test("the confirm popup is themed, not the bare host page", async ({ page }) => {
  await ready(page);
  await addSecondPage(page);
  await page.getByRole("button", { name: "Delete page" }).click();

  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  // Portals to document.body, so it re-stamps the island itself.
  await expect(dialog).toHaveAttribute("data-theme", "studio");
  // …and that attribute actually resolves tokens: an unthemed popup inherits
  // the host page's transparent/UA background.
  const bg = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe("rgba(0, 0, 0, 0)");
  expect(bg).not.toBe("transparent");
});

test("the last remaining page cannot be deleted", async ({ page }) => {
  await ready(page);
  await expect(page.getByRole("button", { name: "Delete page" })).toBeDisabled();
});
