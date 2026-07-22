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

// A token on the island's `style` proves the theme was written, NOT that anything
// RENDERS with it. Assert the board's Typography specimen actually resolves the
// picked heading font on a real heading (while body stays untouched) AND that the
// ramp descends — a hardcoded `text-*` override once inverted h1 below h3 and made
// the font swap impossible to perceive.
test("board Typography specimen renders the heading font and a descending ramp", async ({ page }) => {
  await ready(page);
  const board = page.locator(".sui-brd");

  const firstFamily = (loc: ReturnType<Page["getByText"]>) =>
    loc.evaluate((el) => getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, ""));
  const px = (loc: ReturnType<Page["getByText"]>) =>
    loc.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

  const display = board.getByText("Ship faster", { exact: true });
  const h1 = board.getByText("Heading one", { exact: true });
  const h3 = board.getByText("Heading three", { exact: true });
  const body = board.getByText(/Body copy sits/);

  await pickFont(page, "Heading typeface", "Playfair Display");
  // The declared `font-family` resolves as soon as the token is on the island —
  // no need to wait for the actual webfont FILE to download.
  await expect(board).toHaveAttribute("style", /Playfair Display/);

  expect(await firstFamily(h1)).toBe("Playfair Display");
  expect(await firstFamily(h3)).toBe("Playfair Display");
  expect(await firstFamily(body)).not.toBe("Playfair Display"); // body untouched

  // Strictly descending: display › h1 › h3 › body.
  const [d, one, three, b] = [await px(display), await px(h1), await px(h3), await px(body)];
  expect(d).toBeGreaterThan(one);
  expect(one).toBeGreaterThan(three);
  expect(three).toBeGreaterThan(b);
});

test("the 4 legacy system stacks still select with no regression", async ({ page }) => {
  await ready(page);
  const board = page.locator(".sui-brd");

  await pickFont(page, "Body typeface", "Mono");
  await expect(board).toHaveAttribute("style", /ui-monospace/);
});
