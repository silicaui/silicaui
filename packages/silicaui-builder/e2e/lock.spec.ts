import { test, expect, type Page } from "@playwright/test";

/**
 * Node locking (host-nodes-and-node-locking spec §B) through the real chrome:
 * the Inspector's Settings → Lock toggle marks a node locked, the Navigator/
 * canvas keep it, and the Delete key refuses it until it's unlocked. Proves the
 * engine refusal is reachable end-to-end from the author UI (the owner tiers +
 * move/duplicate rules are covered exhaustively by probe-lock).
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

/** The Inspector's Settings tab (a labeled toggle-group item). */
async function openSettings(page: Page): Promise<void> {
  await page.locator('[aria-label="Inspector tab"]').getByText("Settings").click();
}

test("lock a node from the Inspector: Delete is refused until it's unlocked", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  const canvas = page.locator(".sui-canvas");
  const heading = canvas.getByText("Simple, transparent pricing");

  // Insert a distinctive block — inserting selects its root (our lock target).
  await insertBlock(page, "pricing_tiers");
  await expect(heading).toBeVisible();

  // Settings → Lock: the toggle reads "Unlocked", then flips to "Locked".
  await openSettings(page);
  await expect(page.getByText("Unlocked", { exact: true })).toBeVisible();
  await page.getByTestId("settings-lock").click();
  await expect(page.getByText("Locked", { exact: true })).toBeVisible();

  // Move focus off the checkbox WITHOUT changing selection (Layers view toggle),
  // then Delete — the locked root is refused and stays on the canvas.
  await page.getByRole("button", { name: "Layers" }).click();
  await page.keyboard.press("Delete");
  await expect(heading).toBeVisible();

  // Unlock, then Delete again — now it's removed.
  await page.getByTestId("settings-lock").click();
  await expect(page.getByText("Unlocked", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Layers" }).click();
  await page.keyboard.press("Delete");
  await expect(heading).toHaveCount(0);

  expect(errors, errors.join("\n")).toHaveLength(0);
});
