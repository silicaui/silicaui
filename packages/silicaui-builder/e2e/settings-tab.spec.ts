import { test, expect, type Page } from "@playwright/test";

/**
 * Inspector Design / Settings split — the right rail now has two tabs. Design
 * carries visual style (Text/Surface); Settings carries identity + semantics
 * (name, tag, id, visibility), content, links, data binding, accessibility,
 * attributes, and custom data. This guard locks the split, the tab switch, and
 * the two schema-writing controls that had no UI before: semantic retag and a
 * custom `data-*` attribute.
 */

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  return errors;
}

async function ready(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

test("Design/Settings tabs split style from semantics, and Settings retags + adds data-*", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  // Select the hero heading. Design tab is the default — Surface is a design group.
  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();
  await expect(page.getByText("Surface", { exact: true })).toBeVisible();
  // Settings sections are NOT in the Design tab.
  await expect(page.getByText("Data binding")).toHaveCount(0);

  // Switch to Settings → identity + semantics surface; design groups hide.
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByText("Element")).toBeVisible();
  await expect(page.getByText("Data binding")).toBeVisible();
  await expect(page.getByText("Surface", { exact: true })).toHaveCount(0);

  // Retag the heading h1 → h2 (a pure-semantics edit with no UI before). The
  // canvas element's tag actually changes.
  await expect(canvas.locator("h1", { hasText: HEADLINE })).toBeVisible();
  await page.getByTestId("settings-tag").selectOption("h2");
  await expect(canvas.locator("h2", { hasText: HEADLINE })).toBeVisible();
  await expect(canvas.locator("h1", { hasText: HEADLINE })).toHaveCount(0);

  // Add a custom data-* attribute via the trailing blank creator row (the only
  // key/value pair present until one is added). Enter on the value field commits.
  await page.locator('input[placeholder="key"]').first().fill("analytics-id");
  const dataVal = page.locator('input[placeholder="value"]').first();
  await dataVal.fill("hero-title");
  await dataVal.press("Enter");
  // It lands on the canvas element as data-analytics-id.
  await expect(canvas.locator('[data-analytics-id="hero-title"]')).toHaveCount(1);

  // The switch is sticky — selecting another node stays in Settings.
  await canvas.getByText("Everything you need to sell online — no code, no wrangling.").click();
  await expect(page.getByText("Element")).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});
