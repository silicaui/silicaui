import { test, expect, type Page } from "@playwright/test";

/**
 * Canvas rendering + selection + inline-edit — the guard for the Phase 0b refactor
 * that made the canvas render every component through `expandComponent` (one
 * element path, no per-component branch). The seeded harness document is the
 * `heroSplitCta` block, which uses `atom("Button")` + `atom("Image")` + a heading,
 * so a passing render proves the component-expansion path draws real tags.
 *
 * The harness exposes `window.__ready` (mount signal) and `window.__changeCount`
 * (committed-edit counter) for exactly this.
 */

/** Collect uncaught page errors + console.errors so a test can assert none fired. */
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

test("renders the seeded block's component atoms without error", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-canvas");
  // Expanded component atoms → real tags on the canvas. `[data-sui-id]` scopes to
  // editable PAGE nodes (the frame chrome renders inert, without ids), so these
  // assert the seeded block's own atoms, not the layout's nav.
  await expect(canvas.locator("h1[data-sui-id], h2[data-sui-id]").first()).toBeVisible(); // Heading
  await expect(canvas.locator("button[data-sui-id]").first()).toBeVisible(); // Button atom → <button>
  await expect(canvas.locator("img[data-sui-id]").first()).toBeVisible(); // Image atom → <img>

  // Every rendered node — including the expanded component roots — carries the
  // click-select mapping back to its node id.
  expect(await canvas.locator("[data-sui-id]").count()).toBeGreaterThan(0);

  // An unset Image still shows on the canvas (placeholder src affordance).
  const src = await canvas.locator("img").first().getAttribute("src");
  expect(src).toBeTruthy();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("clicking a component node selects it (overlay appears)", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // Click the Button atom's expanded element (a page node, so it carries an id and
  // is selectable — the frame's nav links render inert). It must map back to its
  // component node.
  const button = page.locator(".sui-canvas button[data-sui-id]").first();
  await button.click();

  // The SelectionOverlay draws a border-primary chrome box over the selection.
  await expect(page.locator(".sui-canvas .border-primary").first()).toBeVisible();
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("double-click a heading edits in place and commits", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const heading = page
    .locator(".sui-canvas h1[data-sui-id], .sui-canvas h2[data-sui-id], .sui-canvas h3[data-sui-id]")
    .first();
  await heading.dblclick();

  // The node's own tag becomes a contentEditable field (textTag comes from the
  // expansion — the crux of the refactor for a component heading).
  const editing = page.locator('[data-sui-editing="true"]');
  await expect(editing).toBeVisible();

  // Content is pre-selected on mount, so typing replaces it; Enter commits.
  await page.keyboard.type("Edited on canvas");
  await page.keyboard.press("Enter");

  await expect(editing).toBeHidden();
  await expect(
    page
      .locator(".sui-canvas h1[data-sui-id], .sui-canvas h2[data-sui-id], .sui-canvas h3[data-sui-id]")
      .first(),
  ).toHaveText("Edited on canvas");
  // A real commit flowed out through onChange.
  const changes = await page.evaluate(
    () => (window as unknown as { __changeCount?: number }).__changeCount ?? 0,
  );
  expect(changes).toBeGreaterThan(0);
  expect(errors, errors.join("\n")).toHaveLength(0);
});
