import { test, expect, type Page } from "@playwright/test";

/**
 * Symbols / instances guard — the reuse spine. Saving a node as a component
 * replaces it with an INSTANCE; the component appears in the Insert palette's
 * Components group; inserting a second instance and editing the shared master
 * propagates to BOTH; detaching severs one. All through the real chrome, so the
 * palette→inspector→canvas→banner wiring is locked end to end.
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

async function insertBlock(page: Page, key: string): Promise<void> {
  await page.getByRole("button", { name: "Insert" }).click();
  await page.locator(`[data-insert-key="block:${key}"]`).click();
  await page.getByRole("button", { name: "Layers" }).click(); // back to selection view
}

test("save-as-component creates an instance, propagates a master edit, and detaches", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  // Seed a real section to symbolize — a pricing block has distinctive copy.
  // Inserting selects the new block root, so it's the Save-as-component target.
  await insertBlock(page, "pricing_tiers");
  await expect(canvas.getByText("Simple, transparent pricing")).toBeVisible();

  // Save the selected block as a reusable component.
  await page.getByRole("button", { name: "Save as component" }).click();

  // Selection is now the instance → the Inspector shows the instance panel.
  await expect(page.getByTestId("instance-panel")).toBeVisible();
  // The section still renders (via the instance's master expansion).
  await expect(canvas.getByText("Simple, transparent pricing")).toBeVisible();

  // The component now appears in the Insert palette's Components group.
  await page.getByRole("button", { name: "Insert" }).click();
  const symbolRow = page.locator('[data-insert-key^="symbol:"]');
  await expect(symbolRow).toHaveCount(1);
  const symbolKey = await symbolRow.getAttribute("data-insert-key");

  // Insert a SECOND instance of it (click-insert appends relative to selection).
  await symbolRow.click();
  await page.getByRole("button", { name: "Layers" }).click();
  // Two instances now render the same pricing copy.
  await expect(canvas.getByText("Simple, transparent pricing")).toHaveCount(2);

  // Edit the shared master: select an instance, open the component, retitle.
  await canvas.getByText("Simple, transparent pricing").first().click();
  await page.getByRole("button", { name: "Edit component" }).click();
  await expect(page.getByTestId("symbol-banner")).toBeVisible(); // edit-master mode

  // Retitle the heading inside the master (inline edit) and finish.
  const masterHeading = canvas.getByText("Simple, transparent pricing");
  await masterHeading.dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Shared pricing headline");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByTestId("symbol-banner")).toHaveCount(0);

  // BOTH instances now show the edited title (edit-once-propagate).
  await expect(canvas.getByText("Shared pricing headline")).toHaveCount(2);
  await expect(canvas.getByText("Simple, transparent pricing")).toHaveCount(0);

  // Per-instance override: change ONE instance's heading via the Overrides panel.
  // The override field is seeded with the master text as its placeholder, so target
  // that (input values aren't matchable by hasText).
  await canvas.getByText("Shared pricing headline").first().click();
  const headingOverride = page
    .getByTestId("instance-panel")
    .locator('input[placeholder="Shared pricing headline"]')
    .first();
  await headingOverride.fill("Just this one");
  await headingOverride.blur();
  // Only the overridden instance changed; the other still follows the master.
  await expect(canvas.getByText("Just this one")).toHaveCount(1);
  await expect(canvas.getByText("Shared pricing headline")).toHaveCount(1);

  // Detach the overridden instance — it becomes a real section, KEEPING its
  // override baked in ("Just this one" survives as plain markup).
  await canvas.getByText("Just this one").click();
  await page.getByRole("button", { name: "Detach" }).click();
  await expect(canvas.getByText("Just this one")).toHaveCount(1); // detached copy kept its text
  await expect(canvas.getByText("Shared pricing headline")).toHaveCount(1); // the still-linked instance
  // The component still exists in the palette (one instance remains linked).
  await page.getByRole("button", { name: "Insert" }).click();
  await expect(page.locator(`[data-insert-key="${symbolKey}"]`)).toHaveCount(1);

  expect(errors, errors.join("\n")).toHaveLength(0);
});
