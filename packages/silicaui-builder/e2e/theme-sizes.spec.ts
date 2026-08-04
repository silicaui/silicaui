import { test, expect, type Page } from "@playwright/test";

/**
 * The Theme editor's two DENSITY levers. Silica sizes controls off two separate
 * base units — `--size-field` for anything with a field height (Input, Select,
 * Textarea, Button, FileInput) and `--size-selector` for the square/round
 * controls (Checkbox, Radio, Switch, Toggle, Badge). The editor shipped only the
 * field lever for a while, which left every selector-tier control unreachable
 * from the theme panel even though the CSS had always read the token.
 *
 * Asserting the token landed on the island's `style` would only prove the theme
 * was WRITTEN. These assert the rendered box actually changes — and, critically,
 * that each lever leaves the other tier alone.
 */

async function ready(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
  await page.getByRole("button", { name: "Theme" }).click();
  await expect(page.locator(".sui-brd")).toBeVisible();
}

/** Click a step in one of the two labelled size ToggleGroups. */
async function setSize(page: Page, label: string, step: "xs" | "sm" | "md" | "lg"): Promise<void> {
  const group = page.locator("div").filter({ hasText: new RegExp(`^${label}$`) }).last()
    .locator("xpath=following-sibling::*[1]");
  await group.getByRole("button", { name: step, exact: true }).click();
}

const heightOf = async (page: Page, selector: string): Promise<number> =>
  (await page.locator(selector).first().boundingBox())!.height;

test("selector base size resizes selector-tier controls, and leaves fields alone", async ({ page }) => {
  await ready(page);

  const switchAtMd = await heightOf(page, ".sui-brd [role='switch']");
  const buttonAtMd = await heightOf(page, ".sui-brd .btn");

  await setSize(page, "Selector base size", "lg");
  const switchAtLg = await heightOf(page, ".sui-brd [role='switch']");
  expect(switchAtLg).toBeGreaterThan(switchAtMd);

  await setSize(page, "Selector base size", "xs");
  const switchAtXs = await heightOf(page, ".sui-brd [role='switch']");
  expect(switchAtXs).toBeLessThan(switchAtMd);

  // The field tier is a SEPARATE unit — a dense checkbox next to a large input is
  // the whole reason these are two tokens and not one.
  expect(await heightOf(page, ".sui-brd .btn")).toBeCloseTo(buttonAtMd, 0);
});

test("field base size resizes field-tier controls, and leaves selectors alone", async ({ page }) => {
  await ready(page);

  const buttonAtMd = await heightOf(page, ".sui-brd .btn");
  const switchAtMd = await heightOf(page, ".sui-brd [role='switch']");

  await setSize(page, "Field base size", "lg");
  expect(await heightOf(page, ".sui-brd .btn")).toBeGreaterThan(buttonAtMd);

  await setSize(page, "Field base size", "xs");
  expect(await heightOf(page, ".sui-brd .btn")).toBeLessThan(buttonAtMd);

  expect(await heightOf(page, ".sui-brd [role='switch']")).toBeCloseTo(switchAtMd, 0);
});
