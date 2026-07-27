import { test, expect, type Page } from "@playwright/test";

/**
 * Host chrome around an authored email, through the real builder: an
 * `EmailFrame` renders on the canvas as inert context (no selection, no
 * `data-sui-id`, no drop target) and composes into every projection (Preview /
 * Export HTML / Send test) — while never entering the document the host
 * persists. Plus its in-document counterpart: a host-locked section, which IS
 * saved but refuses delete/move.
 *
 * Mounted via `?editor=email&frame=1` in the shared harness (see
 * `harness/main.tsx`), which supplies a demo brand bar + legal footer and seeds
 * a project whose first section carries `locked: "host"`. The engine-level
 * rules are covered exhaustively by `probe-email-frame` / `probe-email-lock`;
 * this proves they're reachable from the author UI.
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
  await page.goto("/?editor=email&frame=1&persist=0");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-email-canvas");
}

async function openSettings(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Settings", exact: true }).click();
}

test("the frame renders on the canvas, above and below the editable body", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  const header = canvas.locator('[data-sui-frame="header"]');
  const footer = canvas.locator('[data-sui-frame="footer"]');

  await expect(header).toBeVisible();
  await expect(footer).toBeVisible();
  await expect(header).toContainText("ACME");
  await expect(footer).toContainText("Unsubscribe");

  // Order matters — chrome that renders in the wrong place is worse than none.
  const headerBox = (await header.boundingBox())!;
  const footerBox = (await footer.boundingBox())!;
  const bodyBox = (await canvas.getByText("Your order is confirmed.").boundingBox())!;
  expect(headerBox.y).toBeLessThan(bodyBox.y);
  expect(footerBox.y).toBeGreaterThan(bodyBox.y);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("frame nodes are inert: no ids, no selection, and a tag explains why", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  const header = canvas.locator('[data-sui-frame="header"]');

  // Not addressable: a frame node isn't in the document, so it gets no
  // `data-sui-id` — nothing in the editor could resolve one.
  await expect(header.locator("[data-sui-id]")).toHaveCount(0);

  // Clicking it selects nothing (the canvas's own deselect still runs).
  await header.click();
  await expect(page.getByText("No selection", { exact: true })).toBeVisible();

  // The region names itself WITHOUT being hovered — an author who never hovers
  // still has to be able to tell host chrome from their own content.
  await expect(page.getByTestId("email-frame-tag-header")).toBeVisible();
  await expect(page.getByTestId("email-frame-tag-header")).toHaveText("Brand frame");
  await expect(page.getByTestId("email-frame-tag-footer")).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("a frame region wears NO body-editor chrome — a real footer can't read as a placeholder", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  const footer = canvas.locator('[data-sui-frame="footer"]');

  // The host's raw-HTML footer block renders as finished output…
  await expect(footer).toContainText("ACME Inc. is a registered trader.");
  // …and NOT wearing the editor's raw-HTML affordance. This is the regression:
  // the chip made a composed legal footer read as an unfilled developer
  // placeholder for two days.
  await expect(footer.getByText("Custom HTML")).toHaveCount(0);
  await expect(canvas.locator('[data-sui-frame] .border-dashed')).toHaveCount(0);

  // The same chip IS still the affordance for an author's own HTML block — the
  // fix is scoped to the frame, not a removal of the feature.
  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await page.locator('[data-insert-key="html"]').click();
  await expect(canvas.getByText("Custom HTML", { exact: true }).first()).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("Export HTML composes the frame around the body — the same markup a send would produce", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  await page.getByRole("button", { name: "Export HTML" }).click();
  const html = await page.evaluate(() => (window as unknown as { __exported?: string }).__exported ?? "");

  expect(html).toContain("ACME");
  expect(html).toContain("Unsubscribe");
  expect(html).toContain("Your order is confirmed.");
  // Header → body → footer, in the sent markup too.
  expect(html.indexOf("ACME")).toBeLessThan(html.indexOf("Your order is confirmed."));
  expect(html.indexOf("Your order is confirmed.")).toBeLessThan(html.indexOf("Unsubscribe"));

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("the frame never enters the persisted document", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // Make an edit so `onChange` fires with a real project payload.
  const canvas = page.locator(".sui-email-canvas");
  await canvas.getByText("Start writing your email…").click();
  await page.getByLabel("Duplicate").click();
  await page.waitForFunction(() => (window as unknown as { __changeCount: number }).__changeCount > 0);

  const saved = await page.evaluate(() => JSON.stringify((window as unknown as { __lastChange?: unknown }).__lastChange));
  expect(saved).toContain("Your order is confirmed."); // the locked section IS part of the document
  expect(saved).not.toContain("ACME"); // the frame is not
  expect(saved).not.toContain("Unsubscribe");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("a host-locked section is saved but refuses delete and move", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  const pinned = canvas.getByText("Your order is confirmed.");

  // Select the SECTION, not its text child — the lock is on the section. The
  // Navigator's rows are Email → Section → Text …, so the pinned section is the
  // second `.tree-node` (clicking the row itself, not the `treeitem` whose box
  // spans its children).
  await page.locator(".tree-node").nth(1).click();

  // The structural actions read as unavailable rather than silently no-oping.
  await expect(page.getByLabel("Delete", { exact: true })).toBeDisabled();
  await expect(page.getByLabel("Move down")).toBeDisabled();

  // Settings explains the tier — and offers the author no unlock.
  await openSettings(page);
  await expect(page.getByTestId("email-lock-host")).toBeVisible();
  await expect(page.getByTestId("email-lock")).toHaveCount(0);

  // The Delete key is refused too — the engine, not the button, is the guard.
  await page.getByRole("button", { name: "Layers", exact: true }).click();
  await page.keyboard.press("Delete");
  await expect(pinned).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("an author can lock their own block, and unlock it again", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  const body = canvas.getByText("Start writing your email…");
  await body.click();

  await openSettings(page);
  await expect(page.getByText("Unlocked", { exact: true })).toBeVisible();
  await page.getByTestId("email-lock").click();
  await expect(page.getByText("Locked", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Delete", { exact: true })).toBeDisabled();

  // Unlike a host lock, this one is the author's to clear.
  await page.getByTestId("email-lock").click();
  await expect(page.getByText("Unlocked", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Delete", { exact: true })).toBeEnabled();

  expect(errors, errors.join("\n")).toHaveLength(0);
});
