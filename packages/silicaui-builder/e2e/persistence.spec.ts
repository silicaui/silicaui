import { test, expect, type Page } from "@playwright/test";

/**
 * Local crash-recovery — the huge one: work must survive a reload / closed tab /
 * power cut. The harness enables local persistence under `?persist=1`; this spec
 * edits, reloads, and proves the edit came back (restored from the durable local
 * draft) with the recovery banner confirming it. It wipes the store before and
 * after so runs are independent (other specs run with persistence OFF).
 */

const clearDrafts = (page: Page) =>
  page.evaluate(() => {
    try {
      indexedDB.deleteDatabase("silicaui-builder");
    } catch {
      /* ignore */
    }
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });

async function ready(page: Page): Promise<void> {
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

test("edits survive a reload via the local draft store", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));

  // Start from a clean store so the seed (not a stale draft) loads first.
  await page.goto("/?persist=1");
  await clearDrafts(page);
  await page.reload();
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  // First load has no draft → no recovery banner, seeded document renders.
  await expect(page.getByTestId("recovery-banner")).toHaveCount(0);

  // Make a real edit: retitle the hero headline inline on the canvas.
  await canvas.getByText("Ship your store in an afternoon").dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Persisted across reload");
  await page.keyboard.press("Enter");
  await expect(canvas.getByText("Persisted across reload")).toBeVisible();

  // Let the debounced autosave land (localStorage flush also runs on reload).
  await page.waitForTimeout(900);

  // Reload as if the tab crashed and reopened — the edit comes back, and the
  // banner confirms the session was restored.
  await page.reload();
  await ready(page);
  await expect(page.getByTestId("recovery-banner")).toBeVisible();
  await expect(page.locator(".sui-canvas").getByText("Persisted across reload")).toBeVisible();
  await expect(page.locator(".sui-canvas").getByText("Ship your store in an afternoon")).toHaveCount(0);

  // "Start fresh" discards the draft and reseeds from the original document.
  await page.getByRole("button", { name: "Start fresh" }).click();
  await expect(page.locator(".sui-canvas").getByText("Ship your store in an afternoon")).toBeVisible();
  await expect(page.locator(".sui-canvas").getByText("Persisted across reload")).toHaveCount(0);

  // And that discard is durable — a reload no longer restores the edit.
  await page.reload();
  await ready(page);
  await expect(page.locator(".sui-canvas").getByText("Ship your store in an afternoon")).toBeVisible();

  await clearDrafts(page);
  expect(errors, errors.join("\n")).toHaveLength(0);
});

/**
 * The hole the reload test above cannot see: text being TYPED.
 *
 * Inline editing holds the new characters in a `contentEditable` and only writes
 * them into the document on blur or Enter, and the draft store persists the
 * document — so a sentence in progress lived nowhere durable. Marlene typed a
 * full sentence, the tab closed, and her seven pages came back without it
 * (issues/058). The difference from the test above is exactly one keystroke:
 * no Enter, no click away, the caret still in the text when the page goes.
 */
test("a sentence still being typed survives the page going away", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));

  await page.goto("/?persist=1");
  await clearDrafts(page);
  await page.reload();
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  await canvas.getByText("Ship your store in an afternoon").dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Half term moves to the second week");

  // The caret is still in the field. Nothing has been committed — assert that,
  // so a future change that commits on every keystroke doesn't make this test
  // pass for a reason it isn't testing.
  await expect(
    page.locator('[data-sui-editing="true"]'),
    "still editing in place — the edit has NOT been committed",
  ).toBeVisible();

  await page.reload();
  await ready(page);
  await expect(page.locator(".sui-canvas").getByText("Half term moves to the second week")).toBeVisible();
  await expect(page.locator(".sui-canvas").getByText("Ship your store in an afternoon")).toHaveCount(0);

  await clearDrafts(page);
  expect(errors, errors.join("\n")).toHaveLength(0);
});

/**
 * P05 act 1 / issues 080 — the builder writes under the host's key, and only
 * under the host's key.
 *
 * Arvid embeds the builder in Quarrystone with one `persistKey`, and the rails'
 * own `autoSaveId` was a hard-coded constant — so a host that audited its own
 * `localStorage` found `react-resizable-panels:silicaui-builder-site-rails`
 * sitting next to its own data, under a name it had never seen, and
 * `persistKey={null}` did not stop it.
 */
test("the site builder stores nothing under a key the host did not give it", async ({ page }) => {
  await page.goto("/?persist=1");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");

  // Drag a rail so there is something worth persisting.
  const handle = page.locator('[role="separator"]').first();
  const box = await handle.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 60, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
  }
  await page.waitForTimeout(600);

  const keys = await page.evaluate(() => Object.keys(window.localStorage));
  // The harness's own key under `?persist=1` is "silicaui-designer".
  const foreign = keys.filter((k) => !k.includes("silicaui-designer"));
  expect(foreign, `keys outside the host's prefix: ${foreign.join(", ")}`).toEqual([]);
  // ...and the rails really are being remembered, so this is containment and
  // not a fix that simply broke the feature.
  expect(keys.some((k) => k.endsWith(":rails"))).toBe(true);
});

test("persistKey={null} means the builder writes nothing at all", async ({ page }) => {
  await page.goto("/?persist=0");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");

  const handle = page.locator('[role="separator"]').first();
  const box = await handle.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 60, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
  }
  await page.waitForTimeout(600);

  // The rails still resize — they just are not remembered.
  await expect(page.locator(".sui-canvas")).toBeVisible();
  const keys = await page.evaluate(() => Object.keys(window.localStorage));
  expect(keys, `a host that asked for no storage got: ${keys.join(", ")}`).toEqual([]);
});

test("the email builder honours the same rule", async ({ page }) => {
  await page.goto("/?editor=email&persist=0");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-email-canvas");
  await page.waitForTimeout(600);

  const keys = await page.evaluate(() => Object.keys(window.localStorage));
  expect(keys, `a host that asked for no storage got: ${keys.join(", ")}`).toEqual([]);
});
