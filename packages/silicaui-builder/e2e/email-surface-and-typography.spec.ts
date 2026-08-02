import { test, expect, type Page } from "@playwright/test";
import { ROW } from "./inspector-row";

/**
 * The email builder's surface + typography vocabulary: section box decoration
 * (border / radius / margin), the button outline variant, inline link colour,
 * per-node auto-colour ROLES, and document web fonts / colour scheme.
 *
 * These are the schema fields that used to have no editor affordance at all —
 * a bordered card had to be hand-built from a pair of raw `html` nodes, and a
 * tinted section fill had to be frozen to a literal hex. The point of these
 * specs is that each one is now REACHABLE AND VISIBLE IN THE EDITOR, not just
 * expressible in the projected output (which `probe-email.ts` covers).
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

test("a section can be given a border, radius and margin from the Inspector", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // Select the seeded section via the Navigator (clicking the canvas would hit
  // the text block inside it). Click the row's own `.tree-node` rather than the
  // `treeitem` <li>, whose box spans its expanded children — the same gotcha
  // `email-navigator-and-tabs.spec.ts` documents. Order: Email, Section, Text.
  await page.locator(".tree-node").nth(1).click();

  const section = page.locator(".sui-email-canvas [data-sui-id]").filter({ hasText: "Start writing your email…" }).first();

  // Radius: the "Medium" (8px) preset is the third swatch (Auto, None, Small,
  // Medium, Full) — read by title so the assertion survives a reorder.
  const radiusRow = page.locator(ROW, { hasText: "Corner radius" }).first();
  await radiusRow.locator('button[title="Medium"]').click();
  await expect(section).toHaveCSS("border-radius", "8px");

  const widthRow = page.locator(ROW, { hasText: "Border width" }).first();
  const widthInput = widthRow.locator("input[type='number']");
  await widthInput.fill("2");
  await widthInput.blur();
  await expect(section).toHaveCSS("border-top-width", "2px");

  // Margin is a real outer inset — the body background shows through it.
  const marginYRow = page.locator(ROW, { hasText: "Margin Y" }).first();
  await marginYRow.getByRole("button", { name: "4", exact: true }).click();
  await expect(section).toHaveCSS("margin-top", "16px");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("the button variant control switches between a filled and an outline button", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await page.locator('[data-insert-key="button"]').click();

  const canvas = page.locator(".sui-email-canvas");
  const label = canvas.getByText("Shop now").first();

  const variantRow = page.locator(ROW, { hasText: "Variant" }).first();
  await expect(variantRow.getByRole("button", { name: "Filled", exact: true })).toHaveClass(/btn-primary/);

  // Read the brand primary off a swatch rather than hardcoding a hex, so this
  // doesn't depend on which theme the harness resolves.
  const primarySwatch = page.locator(ROW, { hasText: "Background" }).first().locator("button").nth(1);
  const primaryColor = await primarySwatch.evaluate((el) => getComputedStyle(el).backgroundColor);
  await expect(label).toHaveCSS("background-color", primaryColor);

  await variantRow.getByRole("button", { name: "Outline", exact: true }).click();

  // Outline drops the fill entirely and draws a border instead...
  await expect(label).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(label).toHaveCSS("border-top-width", "1px");
  // ...and the LABEL repoints to the brand colour, because primaryContent ink
  // on a transparent button would be invisible.
  await expect(label).toHaveCSS("color", primaryColor);

  await variantRow.getByRole("button", { name: "Filled", exact: true }).click();
  await expect(label).toHaveCSS("background-color", primaryColor);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("a text block's link colour applies to anchors on the canvas", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  await canvas.getByText("Start writing your email…").first().click();

  // Put a real anchor in the copy via the Settings tab's raw content field.
  await page.getByRole("tab", { name: "Settings", exact: true }).click();
  const contentArea = page.locator("textarea").first();
  await contentArea.fill('Read the <a href="https://example.com">docs</a>.');
  await contentArea.blur();

  const anchor = canvas.locator("a", { hasText: "docs" }).first();
  await expect(anchor).toBeVisible();

  await page.getByRole("tab", { name: "Design", exact: true }).click();
  const linkRow = page.locator(ROW, { hasText: "Link color" }).first();
  const errorSwatch = linkRow.locator("button").nth(7); // no leading Auto here: primary(0)…error(7)
  const errorColor = await errorSwatch.evaluate((el) => getComputedStyle(el).backgroundColor);
  await errorSwatch.click();

  await expect(anchor).toHaveCSS("color", errorColor);
  // Clearing returns the anchor to the client-default styling.
  await linkRow.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(anchor).not.toHaveCSS("color", errorColor);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("picking a theme swatch TRACKS that role — a tinted section follows a theme change", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  await page.locator(".tree-node").nth(1).click();

  // Base 200 is swatch index 11 (Auto, then the 13 roles in `colorOptionsOf`
  // order: primary…error, baseContent, base100, base200).
  const bgRow = page.locator(ROW, { hasText: "Background" }).first();
  const base200 = bgRow.locator("button").nth(11);
  await expect(base200).toHaveAttribute("title", "Base 200");
  const base200Color = await base200.evaluate((el) => getComputedStyle(el).backgroundColor);

  await base200.click();
  const section = page.locator(".sui-email-canvas [data-sui-id]").filter({ hasText: "Start writing your email…" }).first();
  await expect(section).toHaveCSS("background-color", base200Color);

  // The swatch reads as selected (ring), i.e. the field is on a ROLE rather
  // than a frozen one-off hex — the custom-picker swatch is not ringed.
  await expect(base200).toHaveClass(/ring-2/);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("document settings expose web fonts and a colour-scheme declaration", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // The document root's row is always the first `.tree-node`.
  await page.locator(".tree-node").first().click();
  await page.getByRole("tab", { name: "Settings", exact: true }).click();

  await expect(page.getByText("Web fonts (0)")).toBeVisible();
  await page.getByRole("button", { name: "Add web font" }).click();
  await expect(page.getByText("Web fonts (1)")).toBeVisible();

  const family = page.getByPlaceholder("Font family");
  await family.fill("Playfair Display");
  await family.blur();

  // The canvas resolves the declared family into its real font stack, so an
  // author sees what will actually be sent (in the clients that honour it).
  const body = page.locator(".sui-email-canvas [style*='font-family']").first();
  await expect(body).toHaveAttribute("style", /Playfair Display/);

  // The reach caveat is stated in the UI, not left as tribal knowledge.
  await expect(page.getByText(/Gmail clips messages over/)).toBeVisible();

  const schemeRow = page.locator(ROW, { hasText: "Supported" }).first();
  await schemeRow.getByRole("button", { name: "Both", exact: true }).click();
  await expect(schemeRow.getByRole("button", { name: "Both", exact: true })).toHaveClass(/btn-primary/);

  expect(errors, errors.join("\n")).toHaveLength(0);
});
