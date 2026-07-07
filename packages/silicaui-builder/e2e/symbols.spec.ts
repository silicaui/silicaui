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

test("Component mode: create a blank component from scratch, edit it, and place it", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  // Enter Component mode with no components → the empty state offers to create one.
  await page.getByRole("button", { name: "Component", exact: true }).click();
  await expect(page.getByText("No component open")).toBeVisible();

  // Create a blank component — the New button opens the starter picker; pick Blank.
  await page.getByTestId("new-component").click();
  await page.getByTestId("starter:blank").click();
  await expect(canvas.getByText("New component")).toBeVisible();
  await expect(page.locator('[data-testid^="component-open:"]')).toHaveCount(1);

  // Edit the starter heading in the master.
  await canvas.getByText("New component").dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Promo banner");
  await page.keyboard.press("Enter");
  await expect(canvas.getByText("Promo banner")).toBeVisible();

  // Back on a page, the new component is insertable and renders its master.
  await page.getByRole("button", { name: "Page", exact: true }).click();
  await page.getByRole("button", { name: "Insert" }).click();
  await page.locator('[data-insert-key^="symbol:"]').click();
  await page.getByRole("button", { name: "Layers" }).click();
  await expect(canvas.getByText("Promo banner")).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("drill into an instance on the canvas and override text in place", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  await insertBlock(page, "pricing_tiers");
  await page.getByRole("button", { name: "Save as component" }).click();

  // Add a second instance so we can prove the override is per-instance.
  await page.getByRole("button", { name: "Insert" }).click();
  await page.locator('[data-insert-key^="symbol:"]').click();
  await page.getByRole("button", { name: "Layers" }).click();
  await expect(canvas.getByText("Simple, transparent pricing")).toHaveCount(2);

  // Double-click the heading INSIDE the first instance → inline edit → override.
  await canvas.getByText("Simple, transparent pricing").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Drilled override");
  await page.keyboard.press("Enter");

  // Only the drilled instance changed; the other still follows the master.
  await expect(canvas.getByText("Drilled override")).toHaveCount(1);
  await expect(canvas.getByText("Simple, transparent pricing")).toHaveCount(1);

  // Clicking inside the instance selects the INSTANCE (the atomic unit); the
  // Overrides panel now reflects the in-place edit (row keyed by the master text).
  await canvas.getByText("Drilled override").click();
  await expect(page.getByTestId("instance-panel")).toBeVisible();
  await expect(
    page.getByTestId("instance-panel").locator('input[placeholder="Simple, transparent pricing"]'),
  ).toHaveValue("Drilled override");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

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

  // Edit the shared master: select an instance, open the component (→ Component
  // mode, the component library shows), retitle the heading, return to the page.
  await canvas.getByText("Simple, transparent pricing").first().click();
  await page.getByRole("button", { name: "Edit component" }).click();
  await expect(page.getByTestId("new-component")).toBeVisible(); // Component mode

  const masterHeading = canvas.getByText("Simple, transparent pricing");
  await masterHeading.dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Shared pricing headline");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Page", exact: true }).click(); // back to the page

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
