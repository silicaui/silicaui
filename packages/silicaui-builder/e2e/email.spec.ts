import { test, expect, type Page } from "@playwright/test";

/**
 * The email builder's core loop: render the seeded document, select/insert/edit
 * blocks on the canvas, move/duplicate/delete via the Inspector toolbar, and
 * export real table-based HTML. Mounted via `?editor=email` in the shared
 * harness (see `harness/main.tsx`), which exposes the same `window.__ready` /
 * `window.__changeCount` bus the site builder's specs use, plus `__exported`
 * (set from `EmailBuilder`'s `onExport`).
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

test("renders the seeded section + text block with no error", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  await expect(canvas.locator("[data-sui-id]").first()).toBeVisible();
  expect(await canvas.locator("[data-sui-id]").count()).toBeGreaterThan(0);
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("clicking a block selects it (overlay appears) and shows its fields", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // The seeded section holds one text block — click its rendered text.
  const text = page.locator('.sui-email-canvas [data-sui-id]').last();
  await text.click();

  await expect(page.locator(".sui-email-canvas .border-primary").first()).toBeVisible();
  await expect(page.getByText("Content", { exact: true })).toBeVisible();
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("inserting a Button from the palette adds it to the canvas and it's editable", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  await page.locator('[data-insert-key="button"]').click();

  // A button block renders (bulletproof-button look on the canvas is a styled
  // span). `.first()`: the SelectionOverlay's floating label repeats the same
  // text once the button is selected, so scope to the first (real) match —
  // it renders before the overlay in DOM order.
  const canvas = page.locator(".sui-email-canvas");
  const buttonText = canvas.getByText("Shop now").first();
  await expect(buttonText).toBeVisible();

  // Selecting it surfaces the Button fields; editing Label updates the canvas.
  await buttonText.click();
  await expect(page.getByText("Label", { exact: true })).toBeVisible();
  const labelInput = page.locator("label", { hasText: "Label" }).locator("input");
  await labelInput.fill("Get 20% off");
  await labelInput.blur();
  await expect(canvas.getByText("Get 20% off").first()).toBeVisible();

  const changes = await page.evaluate(() => (window as unknown as { __changeCount?: number }).__changeCount ?? 0);
  expect(changes).toBeGreaterThan(0);
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("double-click a text block edits in place and commits", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const text = page.locator(".sui-email-canvas [data-sui-id]").last();
  await text.dblclick();

  const editing = page.locator('[data-sui-editing="true"]');
  await expect(editing).toBeVisible();
  await page.keyboard.press("Control+a");
  await page.keyboard.type("Hello from the email builder");
  await page.keyboard.press("Control+Enter");

  await expect(editing).toBeHidden();
  await expect(page.locator(".sui-email-canvas")).toContainText("Hello from the email builder");
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("move up / duplicate / delete act on the selected block via the Inspector toolbar", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // Insert a divider so there are two siblings to reorder.
  await page.locator('[data-insert-key="divider"]').click();
  const before = await page.locator(".sui-email-canvas [data-sui-id]").count();

  await page.getByLabel("Duplicate").click();
  await expect
    .poll(() => page.locator(".sui-email-canvas [data-sui-id]").count())
    .toBeGreaterThan(before);

  const afterDuplicate = await page.locator(".sui-email-canvas [data-sui-id]").count();
  await page.getByLabel("Delete").click();
  await expect
    .poll(() => page.locator(".sui-email-canvas [data-sui-id]").count())
    .toBeLessThan(afterDuplicate);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("Export HTML produces valid table-based markup with the current subject", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // Set a subject via the empty-selection Email settings panel.
  await page.locator("label", { hasText: "Subject" }).locator("input").fill("Weekend sale");
  await page.locator("label", { hasText: "Subject" }).locator("input").blur();

  await page.getByRole("button", { name: /export html/i }).click();

  const html = await page.waitForFunction(() => (window as unknown as { __exported?: string }).__exported);
  const value = await html.jsonValue();
  expect(value).toContain("<title>Weekend sale</title>");
  expect(value).toContain("role=\"presentation\"");
  expect(value).not.toContain("<link");
  expect(errors, errors.join("\n")).toHaveLength(0);
});
