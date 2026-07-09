import { test, expect, type Page } from "@playwright/test";

/**
 * The email builder's left-rail Navigator (parity with the site builder's
 * layer tree — dogfoods `TreeView`, two-way bound to selection) and the
 * Inspector's Design/Settings tab split (parity with the site builder's
 * Inspector chrome). Both were previously missing from the email builder;
 * this guards the parity, not just the mechanics.
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
  await page.goto("/?editor=email&persist=0");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-email-canvas");
}

test("Layers tab shows the document tree; clicking a row selects it on the canvas", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // Layers is the default left-rail tab (matches the site builder) — the tree
  // renders without switching tabs first.
  await expect(page.getByRole("treeitem", { name: "Email", exact: true })).toBeVisible();
  await expect(page.getByRole("treeitem", { name: "Section" })).toBeVisible();
  const textRow = page.getByRole("treeitem", { name: "Start writing your email…" });
  await expect(textRow).toBeVisible();

  await textRow.click();
  await expect(page.locator(".sui-email-canvas .outline-primary").first()).toBeVisible();
  await expect(textRow).toHaveAttribute("aria-selected", "true");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("selecting a block on the canvas highlights the matching Navigator row", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  await canvas.getByText("Start writing your email…").first().click();

  const textRow = page.getByRole("treeitem", { name: "Start writing your email…" });
  await expect(textRow).toHaveAttribute("aria-selected", "true");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("Insert tab still reaches the palette, and a newly inserted block appears in the Layers tree", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  await page.getByRole("button", { name: "Insert", exact: true }).click();
  const dividerRow = page.locator('[data-insert-key="divider"]');
  await expect(dividerRow).toBeVisible();
  await dividerRow.click();

  await page.getByRole("button", { name: "Layers", exact: true }).click();
  await expect(page.getByRole("treeitem", { name: "Divider" })).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("Inspector Design/Settings split matches the site builder's chrome, with an empty-tab fallback", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  await canvas.getByText("Start writing your email…").first().click();

  // Design is the default tab.
  await expect(page.getByText("Text", { exact: true })).toBeVisible();
  await expect(page.getByText("Content", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByText("Content", { exact: true })).toBeVisible();
  await expect(page.getByText("Font size", { exact: true })).toHaveCount(0);

  // The tab choice is sticky across a selection change (matches the site
  // Inspector's documented behavior).
  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await page.locator('[data-insert-key="divider"]').click();
  await expect(page.getByText("Content", { exact: true })).toHaveCount(0); // divider has no Settings fields
  await expect(page.getByText("No settings for this element.")).toBeVisible();

  // Divider's Design tab, by contrast, has real fields.
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await expect(page.getByText("Thickness (px)", { exact: true })).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("nothing selected shows the same empty state as the site builder; selecting Email reaches document settings via Design/Settings", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // Fresh load: nothing is selected — a real EmptyState, not a settings form.
  await expect(page.getByText("No selection", { exact: true })).toBeVisible();
  await expect(page.getByText("Select an element on the canvas to edit it.")).toBeVisible();
  await expect(page.getByText("Subject", { exact: true })).toHaveCount(0);

  // Selecting "Email" (the document root) in the Navigator routes through the
  // SAME Design/Settings tabs as any other node. Click the row's own `.tree-node`
  // (not the `treeitem` <li>, whose bounding box spans its expanded children too
  // — a click on its center can land on a nested row instead of "Email" itself).
  // The root's row is always the first `.tree-node` in document order.
  await page.locator(".tree-node").first().click();
  await expect(page.getByText("Surface", { exact: true })).toBeVisible();
  await expect(page.getByText("Content background", { exact: true })).toBeVisible();
  await expect(page.getByText("Subject", { exact: true })).toHaveCount(0); // that's on Settings

  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByText("Subject", { exact: true })).toBeVisible();
  await expect(page.getByText("Canvas width (px)", { exact: true })).toBeVisible();
  await expect(page.getByText("Font family", { exact: true })).toBeVisible();

  // The root can't be moved/duplicated/deleted/saved-as-block.
  await expect(page.getByLabel("Duplicate")).toBeDisabled();
  // exact: true — "Delete" is a substring of the Templates panel's "Delete template".
  await expect(page.getByLabel("Delete", { exact: true })).toBeDisabled();
  await expect(page.getByLabel("Save as block")).toHaveCount(0);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("Design tab's color swatches offer the full theme palette, matching the site builder's breadth", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await page.locator('[data-insert-key="button"]').click();

  // Background swatch row: 1 leading Auto + 8 semantic roles + 4 surfaces +
  // primary-content + 1 custom trigger — same breadth (and the same leading
  // Auto reset) as the site Inspector's `rolesOf(theme)` swatch vocab, plus
  // the custom escape hatch email needs and site doesn't.
  const bgRow = page.locator("label", { hasText: "Background" }).first();
  await expect(bgRow.locator("button")).toHaveCount(15);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("every swatch/chip row's leading Auto button resets that field to the value a fresh insert gets", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await page.locator('[data-insert-key="button"]').click();

  const canvas = page.locator(".sui-email-canvas");
  const button = canvas.getByText("Shop now").first();

  // Background: pick a non-default swatch (Error — button index 8: Auto(0),
  // primary(1), secondary(2), accent(3), neutral(4), info(5), success(6),
  // warning(7), error(8)), confirm it actually changed the canvas, then Auto
  // resets it back to the brand primary. Read the expected colors off the
  // swatches themselves (whatever theme the harness resolves) rather than
  // hardcoding hex, so this doesn't depend on which brand theme is active.
  const bgRow = page.locator("label", { hasText: "Background" }).first();
  const errorSwatch = bgRow.locator("button").nth(8);
  const primarySwatch = bgRow.locator("button").nth(1);
  const errorColor = await errorSwatch.evaluate((el) => getComputedStyle(el).backgroundColor);
  const primaryColor = await primarySwatch.evaluate((el) => getComputedStyle(el).backgroundColor);

  await errorSwatch.click();
  await expect(button).toHaveCSS("background-color", errorColor);
  // The leading swatch has a `title` attribute alongside its icon, which can
  // shadow the accessible name Playwright computes for `getByRole` — a plain
  // text-content filter sidesteps that ambiguity for every "Auto" lookup below.
  await bgRow.locator("button").first().click(); // "Auto"
  await expect(button).toHaveCSS("background-color", primaryColor);

  // Padding X: pick a non-default chip (Auto resets Button padding X to 16px
  // — the "4" chip already IS the default, so pick "8" instead), then Auto.
  const paddingXRow = page.locator("label", { hasText: "Padding X" }).first();
  await paddingXRow.getByRole("button", { name: "8", exact: true }).click();
  await paddingXRow.locator("button", { hasText: "Auto" }).click();
  await expect(paddingXRow.getByRole("button", { name: "4", exact: true })).toHaveClass(/btn-primary/);

  // Align: switch off the default (Center), then Auto restores it.
  const alignRow = page.locator("label", { hasText: "Align" }).first();
  await alignRow.getByRole("button", { name: "Left", exact: true }).click();
  await alignRow.locator("button", { hasText: "Auto" }).click();
  await expect(alignRow.getByRole("button", { name: "Center", exact: true })).toHaveClass(/btn-primary/);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("Text's Design tab has a Weight control matching the site builder's, and it actually changes the canvas", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  const text = canvas.getByText("Start writing your email…").first();
  await text.click();

  // Fresh document text starts at the "normal" default.
  await expect(text).toHaveCSS("font-weight", "400");

  const weightRow = page.locator("label", { hasText: "Weight" }).first();
  await expect(weightRow.getByRole("button", { name: "Normal", exact: true })).toBeVisible();
  await expect(weightRow.getByRole("button", { name: "Medium", exact: true })).toBeVisible();
  await expect(weightRow.getByRole("button", { name: "Semibold", exact: true })).toBeVisible();
  await expect(weightRow.getByRole("button", { name: "Bold", exact: true })).toBeVisible();

  await weightRow.getByRole("button", { name: "Bold", exact: true }).click();
  await expect(text).toHaveCSS("font-weight", "700");

  await weightRow.locator("button", { hasText: "Auto" }).click();
  await expect(text).toHaveCSS("font-weight", "400");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("bare numeric Design fields (no site chip analog) still get a leading Auto reset", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await page.locator('[data-insert-key="divider"]').click();

  const thicknessRow = page.locator("label", { hasText: "Thickness" }).first();
  const input = thicknessRow.locator("input[type='number']");
  await expect(input).toHaveValue("1");

  await input.fill("6");
  await input.blur();
  await expect(input).toHaveValue("6");

  await thicknessRow.locator("button", { hasText: "Auto" }).click();
  await expect(input).toHaveValue("1");

  expect(errors, errors.join("\n")).toHaveLength(0);
});
