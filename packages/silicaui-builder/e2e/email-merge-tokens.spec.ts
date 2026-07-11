import { test, expect, type Page } from "@playwright/test";

/**
 * The inline `{{ref}}` merge-token autocomplete (Q23) — the counterpart to
 * `email-data-binding.spec.ts`'s whole-field `data` bind: typing `{{` inside
 * a text block (the Canvas's contentEditable rich-text editor) or a prose
 * Settings field (Subject/Preview text/Button label, `TokenTextField`) opens
 * a picker over the demo host's `dataSources()`, and the chosen token
 * resolves through the SAME `resolveBinding` hook `email-data-binding.spec.ts`
 * exercises. All against `?host=demo`'s `demoEmailHost`.
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

test("typing {{ inside a text block opens the merge-token popover, and picking one inserts {{ref}}", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  await canvas.getByText("Start writing your email…").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Hi {{cust");

  const popover = page.locator('[data-testid="token-autocomplete"]');
  await expect(popover).toBeVisible();
  await expect(popover.getByText("Customer first name", { exact: true })).toBeVisible();
  // Filtered to the "cust" query — the unrelated "Products > Title"/"Products
  // > Price" options (also in the demo host's catalog) don't match it.
  await expect(popover.getByText("Products > Title", { exact: true })).toHaveCount(0);

  await popover.getByText("Customer first name", { exact: true }).click();
  await page.keyboard.press("ControlOrMeta+Enter");

  await expect(page.locator('[data-sui-editing="true"]')).toBeHidden();
  // The Canvas shows the LITERAL token — it never resolves bindings itself
  // (only Export/Preview do, through the host), same as a whole-field bind.
  await expect(canvas.getByText("Hi {{customer.firstName}}", { exact: true }).first()).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("an inline token inside a text block resolves through the host on Export HTML", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  await canvas.getByText("Start writing your email…").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Welcome, {{cust");
  await page.keyboard.press("ArrowDown"); // no-op with one match; proves the nav keys don't type into the field
  await page.keyboard.press("Enter"); // picks the highlighted (only) match
  await page.keyboard.press("ControlOrMeta+Enter"); // commits the text edit

  await page.getByRole("button", { name: "Export HTML", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __exported?: string }).__exported)).toContain("Welcome, Jordan");
  const exported = await page.evaluate(() => (window as unknown as { __exported?: string }).__exported);
  expect(exported).not.toContain("{{customer");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("Escape closes the token popover WITHOUT cancelling the text edit itself", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  await canvas.getByText("Start writing your email…").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Note {{cust");
  await expect(page.locator('[data-testid="token-autocomplete"]')).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator('[data-testid="token-autocomplete"]')).toBeHidden();
  // The edit is still live (Escape only closed the popover, per the doc
  // comment's "Escape && match" branch firing before the cancel branch).
  await expect(page.locator('[data-sui-editing="true"]')).toBeVisible();

  await page.keyboard.press("ControlOrMeta+Enter");
  await expect(canvas.getByText("Note {{cust", { exact: true }).first()).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("the Subject field's token autocomplete inserts a token that resolves in the exported <title>", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // Subject lives on the document root's Settings tab (see email.spec.ts's
  // "Export HTML produces valid table-based markup" for the same selection
  // pattern) — click the row's own `.tree-node`, not the `treeitem` <li>.
  await page.locator(".tree-node").first().click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();

  const subjectInput = page.locator("label", { hasText: "Subject" }).locator("input");
  await subjectInput.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Hi {{price");

  const popover = page.locator('[data-testid="token-autocomplete"]');
  await expect(popover).toBeVisible();
  await expect(popover.getByText("Products > Price", { exact: true })).toBeVisible();
  await popover.getByText("Products > Price", { exact: true }).click();
  await expect(subjectInput).toHaveValue("Hi {{product.price}}");
  await subjectInput.blur();

  await page.getByRole("button", { name: "Export HTML", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __exported?: string }).__exported)).toContain("<title>Hi");
  const exported = await page.evaluate(() => (window as unknown as { __exported?: string }).__exported);
  // `product.price` has no scope (`scope.item` is undefined) at document
  // level, so `resolveBinding` returns "" — proving the field's OWN token
  // round-tripped through the SAME host hook the Canvas case uses, not a
  // hardcoded string.
  expect(exported).toContain("<title>Hi </title>");
  expect(exported).not.toContain("{{product");

  expect(errors, errors.join("\n")).toHaveLength(0);
});
