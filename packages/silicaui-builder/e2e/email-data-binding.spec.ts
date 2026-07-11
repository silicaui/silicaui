import { test, expect, type Page } from "@playwright/test";

/**
 * The email Inspector's Data binding section (Q1/Q23 ported from the site
 * Inspector's DataSection/DataPreview) — a node's `Bind` kind, its picked
 * `Reference` (via the demo host's `dataSources()`), a live `Preview` row
 * fed by `resolveBinding`/`resolveCollection`, and the host-added palette
 * block from `catalog()`. All exercised against `?host=demo`'s
 * `demoEmailHost` (harness/main.tsx), the email twin of the site harness's
 * existing `demoHost`.
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
  await page.goto("/?editor=email&persist=0&host=demo");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-email-canvas");
}

test("a leaf content node's Data binding offers Value/Action but hides Collection (no children to repeat)", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  await canvas.getByText("Start writing your email…").first().click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();

  const bindRow = page.locator("label", { hasText: "Bind" }).first();
  const options = await bindRow.locator("select option").allTextContents();
  expect(options).toContain("None");
  expect(options).toContain("Value (fill this node)");
  expect(options).toContain("Action (host handler)");
  expect(options).not.toContain("Collection (repeat children)");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("a container node's Data binding offers Collection too, and its Preview reflects the resolved item count", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // The seeded Section (a container — has `children`) via the Navigator.
  // Click its own `.tree-node` row, not the `treeitem` <li> — a container
  // row's bounding box spans its expanded children too, so a plain
  // `.click()` on the <li> can land on a nested child instead of "Section"
  // itself (see email-navigator-and-tabs.spec.ts for the same gotcha).
  await page.getByRole("treeitem", { name: "Section" }).locator(".tree-node").first().click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();

  const bindRow = page.locator("label", { hasText: "Bind" }).first();
  const options = await bindRow.locator("select option").allTextContents();
  expect(options).toContain("Collection (repeat children)");

  await bindRow.locator("select").selectOption("collection");
  const refRow = page.locator("label", { hasText: "Reference" }).first();
  // `dataSources()` is wired under `?host=demo` — Reference becomes a picker,
  // scoped to array-cardinality sources only for a collection bind.
  await refRow.locator("select").selectOption("products");

  await expect(page.getByText("3 items", { exact: true })).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("a value bind's live Preview shows the host's resolved data, and clearing the bind hides it", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  await canvas.getByText("Start writing your email…").first().click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();

  const bindRow = page.locator("label", { hasText: "Bind" }).first();
  await bindRow.locator("select").selectOption("value");

  const refRow = page.locator("label", { hasText: "Reference" }).first();
  await refRow.locator("select").selectOption("customer.firstName");

  await expect(page.getByText("Jordan", { exact: true })).toBeVisible();

  await bindRow.locator("select").selectOption("");
  await expect(page.getByText("Jordan", { exact: true })).toHaveCount(0);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("the demo host's catalog-contributed block appears in Insert and can be placed", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  await page.getByRole("button", { name: "Insert", exact: true }).click();
  const hostItem = page.locator('[data-insert-key="host:callout"]');
  await expect(hostItem).toBeVisible();
  await hostItem.click();

  // `.first()`: once selected, the SelectionOverlay's floating label repeats
  // the same text — scope to the real (first, in DOM order) occurrence.
  await expect(page.locator(".sui-email-canvas").getByText("Host-contributed block").first()).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("Export HTML resolves a bound node through the host, not the static placeholder", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  await canvas.getByText("Start writing your email…").first().click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();

  const bindRow = page.locator("label", { hasText: "Bind" }).first();
  await bindRow.locator("select").selectOption("value");
  const refRow = page.locator("label", { hasText: "Reference" }).first();
  await refRow.locator("select").selectOption("customer.firstName");

  await page.getByRole("button", { name: "Export HTML", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __exported?: string }).__exported)).toContain("Jordan");
  const exported = await page.evaluate(() => (window as unknown as { __exported?: string }).__exported);
  expect(exported).not.toContain("Start writing your email");

  expect(errors, errors.join("\n")).toHaveLength(0);
});
