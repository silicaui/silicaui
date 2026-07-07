import { test, expect, type Page } from "@playwright/test";

/**
 * New-component starter picker — creating a component offers a blank shell OR a
 * ready-made section (navbar, footer, content, …) drawn from the validated block
 * catalog. This guard locks the picker opening, its search, and creating a
 * component from a section starter (which renders that section's markup).
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

test("New component picker: search + create from a section starter", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  await page.getByRole("button", { name: "Component", exact: true }).click();

  // Open the picker → it offers Blank plus grouped section starters.
  await page.getByTestId("new-component").click();
  await expect(page.getByTestId("starter:blank")).toBeVisible();
  await expect(page.getByTestId("starter:block:navbar")).toBeVisible();
  await expect(page.getByTestId("starter:block:footer")).toBeVisible();

  // Search narrows the gallery.
  await page.getByPlaceholder("Search starters…").fill("footer");
  await expect(page.getByTestId("starter:block:footer")).toBeVisible();
  await expect(page.getByTestId("starter:block:navbar")).toHaveCount(0);
  await expect(page.getByTestId("starter:blank")).toHaveCount(0);

  // Pick the Footer starter → a component is created from that block and opened;
  // its <footer> master renders on the canvas.
  await page.getByTestId("starter:block:footer").click();
  await expect(page.locator('[data-testid^="component-open:"]')).toHaveCount(1);
  await expect(canvas.locator("footer")).toBeVisible();

  // It's a real, editable component master — placeable back on a page afterwards.
  await page.getByRole("button", { name: "Page", exact: true }).click();
  await page.getByRole("button", { name: "Insert" }).click();
  await expect(page.locator('[data-insert-key^="symbol:"]')).toHaveCount(1);

  expect(errors, errors.join("\n")).toHaveLength(0);
});
