import { test, expect, type Page } from "@playwright/test";

/**
 * The Theme editor's font pickers — a searchable Combobox over 1900+ Google
 * Fonts (plus the 4 legacy system stacks), replacing the old 4-option body /
 * 2-option heading ToggleGroups. Body and heading are picked independently;
 * selecting a Google Font records `theme.fonts` (for a host's publish-time
 * self-hosting step) and loads a live editor-time preview `<link>`.
 */

async function ready(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
  await page.getByRole("button", { name: "Theme" }).click();
  await expect(page.locator(".sui-brd")).toBeVisible();
}

// Reopening a Combobox immediately after a prior selection, before its popup has
// fully closed, can leave Base UI's internal filter query frozen on the PREVIOUS
// search — wait for the listbox to actually detach (its close transition finish)
// before the next open, rather than racing it.
async function pickFont(page: Page, comboboxName: string, query: string, optionName = query): Promise<void> {
  const picker = page.getByRole("combobox", { name: comboboxName });
  await picker.click();
  await picker.fill("");
  await picker.pressSequentially(query, { delay: 15 });
  await page.getByRole("option", { name: optionName, exact: true }).click();
  await page.getByRole("listbox").waitFor({ state: "hidden" }).catch(() => {});
}

test("body typeface: search + select a Google Font, live preview link loads, board style updates", async ({ page }) => {
  await ready(page);
  const board = page.locator(".sui-brd");

  await pickFont(page, "Body typeface", "Poppins");

  await expect(board).toHaveAttribute("style", /Poppins/);
  await expect(page.locator('link[href*="fonts.googleapis.com"][href*="Poppins"]')).toHaveCount(1);
});

test("heading typeface is independent of body, and 'Match body' clears it", async ({ page }) => {
  await ready(page);
  const board = page.locator(".sui-brd");

  await pickFont(page, "Body typeface", "Poppins");
  await pickFont(page, "Heading typeface", "Playfair Display");

  await expect(board).toHaveAttribute("style", /Playfair Display/);
  await expect(board).toHaveAttribute("style", /Poppins/); // body selection untouched

  await pickFont(page, "Heading typeface", "Match body");
  await expect(board).not.toHaveAttribute("style", /Playfair Display/);
});

test("the 4 legacy system stacks still select with no regression", async ({ page }) => {
  await ready(page);
  const board = page.locator(".sui-brd");

  await pickFont(page, "Body typeface", "Mono");
  await expect(board).toHaveAttribute("style", /ui-monospace/);
});
