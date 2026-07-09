import { test, expect, type Page } from "@playwright/test";

/**
 * The host adapter (builder-contract.md §5) — `catalog` merge, `validateClass`
 * composed with the built-in floor, `inspectorPanels`, and the `dataSources`-
 * powered binding picker. Mounted via `?host=demo`; the demo `BuilderHost`
 * lives in `harness/main.tsx`. `pickAsset` is exercised implicitly (its UI is
 * covered by the Inspector's own asset-control affordance, gated on the same
 * host object these tests already mount).
 */

async function ready(page: Page): Promise<void> {
  await page.goto("/?host=demo");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

test("host.catalog() extends the Insert palette, and the inserted node renders", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  await page.getByRole("button", { name: "Insert" }).click();
  await expect(page.getByText("Host", { exact: true })).toBeVisible();
  await page.locator('[data-insert-key="host:callout"]').click();

  await expect(canvas.locator("#host-callout")).toHaveText("Host-contributed block");
});

test("host.validateClass composes with the built-in floor — both reject, host adds its own reason", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();

  const classField = page.locator("textarea").first();
  const before = await classField.inputValue();

  // The built-in floor rejects `fixed` regardless of any host policy.
  await classField.fill(`${before} fixed`);
  await classField.blur();
  await expect(page.getByText(/`fixed` is banned/)).toBeVisible();
  await expect(classField).toHaveValue(`${before} fixed`); // draft kept, not silently reverted
  await expect(canvas.locator("h1", { hasText: HEADLINE })).not.toHaveClass(/\bfixed\b/);

  // The demo host's OWN policy rejects a token the built-in floor allows.
  await classField.fill(`${before} host-banned`);
  await classField.blur();
  await expect(page.getByText(/demo host blocks "host-banned"/)).toBeVisible();

  // A clean edit still commits normally.
  await classField.fill(`${before} text-primary`);
  await classField.blur();
  await expect(canvas.locator("h1", { hasText: HEADLINE })).toHaveClass(/text-primary/);
});

test("host.inspectorPanels renders a host panel that writes through the shared mutation primitives", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();
  await page.getByRole("button", { name: "Settings" }).click();

  await expect(page.getByText("Host panel", { exact: true })).toBeVisible();
  await expect(page.getByTestId("host-panel")).toBeVisible();
  await page.getByTestId("host-panel-set-attr").click();

  await expect(canvas.locator('[data-host-note="set-by-host-panel"]', { hasText: HEADLINE })).toHaveCount(1);
});

test("host.dataSources() + scopeAt turn the Reference field into a picker", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();
  await page.getByRole("button", { name: "Settings" }).click();

  await page.getByTestId("data-kind").selectOption("value");

  // With dataSources() supplied, Reference is a picker (a <select>), not a raw
  // text input — populated from the demo host's flat + nested field catalog.
  const refSelect = page.getByTestId("data-ref-picker");
  await expect(refSelect.locator("option", { hasText: "Site title" })).toHaveCount(1);
  await expect(refSelect.locator("option", { hasText: "Products > Title" })).toHaveCount(1);
  await refSelect.selectOption("site.title");
  await expect(refSelect).toHaveValue("site.title");
});

test("the Data binding Preview row calls host.resolveBinding/resolveCollection live", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByTestId("data-kind").selectOption("value");
  await page.getByTestId("data-ref-picker").selectOption("site.title");

  // resolveBinding("site.title") is fixed sample data in the demo host.
  await expect(page.getByText("Acme Storefront")).toBeVisible();

  // A ref the demo host doesn't recognize resolves visible:false — the preview
  // says so instead of a blank/misleading value.
  await page.getByTestId("data-ref-picker").selectOption("product.title");
  await expect(page.getByText("hidden (visible: false)")).toBeVisible();

  // Switch to a collection bind — the preview shows the resolved item count.
  await page.getByTestId("data-kind").selectOption("collection");
  await page.getByTestId("data-ref-picker").selectOption("products");
  await expect(page.getByText("3 items")).toBeVisible();
});
