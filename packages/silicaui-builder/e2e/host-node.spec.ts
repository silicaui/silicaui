import { test, expect, type Page } from "@playwright/test";

/**
 * Host NODES (host-nodes-and-node-locking spec §A) end to end through the real
 * chrome: the demo `BuilderHost.hostComponents()` shows in the Insert palette,
 * inserting one renders the host's live component (`renderHostNode`) on the
 * canvas, its declared props edit through the Inspector's Host panel, and a
 * `pinned` component inserts host-locked + non-deletable. Mounted via
 * `?host=demo` (the demo host lives in `harness/main.tsx`).
 */

async function ready(page: Page): Promise<void> {
  await page.goto("/?host=demo");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

async function insertHost(page: Page, name: string): Promise<void> {
  await page.getByRole("button", { name: "Insert" }).click();
  await page.locator(`[data-insert-key="host:${name}"]`).click();
  await page.getByRole("button", { name: "Layers" }).click(); // back to selection view
}

async function openSettings(page: Page): Promise<void> {
  await page.locator('[aria-label="Inspector tab"]').getByText("Settings").click();
}

test("insert a host component, see it render live, and edit its props", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  // The host component is in the Insert palette (its own "Commerce" group).
  await insertHost(page, "PriceTag");

  // It renders the host's LIVE component (`renderHostNode`), not a placeholder.
  const tag = canvas.getByTestId("host-pricetag");
  await expect(tag).toHaveText("USD 9.99");

  // Select it on the canvas → Settings → the Host panel edits its declared props.
  await tag.click();
  await openSettings(page);
  const amount = page.getByTestId("host-prop:amount");
  await amount.fill("25");
  await amount.blur();

  // The live preview reflects the new prop (preview == production, through the host).
  await expect(tag).toHaveText("USD 25.00");
});

test("a pinned host component inserts host-locked and non-deletable", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  await insertHost(page, "CheckoutWidget");
  const checkout = canvas.getByTestId("host-checkout");
  await expect(checkout).toBeVisible();

  // Settings shows it host-locked: the "Locked by host" indicator, and NO author
  // unlock toggle (only the host can clear a host lock).
  await checkout.click();
  await openSettings(page);
  await expect(page.getByTestId("settings-lock-host")).toBeVisible();
  await expect(page.getByTestId("settings-lock")).toHaveCount(0);

  // Delete is refused — it stays on the canvas.
  await page.getByRole("button", { name: "Layers" }).click(); // move focus off inputs, keep selection
  await page.keyboard.press("Delete");
  await expect(checkout).toBeVisible();
});
