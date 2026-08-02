import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * The canvas drop indicator, on BOTH builders. Three properties, each of which
 * was broken before `DropOverlay` existed:
 *
 *  1. It's a ZONE, not a hairline. The old marker was a 2px bar — it stated the
 *     seam precisely and said nothing about how much slack the author had, so a
 *     drop read as threading a needle.
 *  2. It takes the axis the target's SIBLINGS flow along. `computeEdge` used to
 *     read `clientY` unconditionally, so in a flex row the whole top half of
 *     every sibling meant "before" and the pointer's horizontal position — the
 *     only thing being aimed with — was thrown away.
 *  3. It costs the layout NOTHING. A marker spliced between two children of a
 *     flex row is itself a flex item and claims a share of the container's
 *     `gap`, shoving the target out from under the cursor mid-drag; the drop
 *     then re-resolved to INSIDE and the marker vanished without the author
 *     moving the mouse. Test 2 walks the pointer across that exact seam.
 */

async function ready(page: Page, url: string, canvas: string): Promise<void> {
  await page.goto(url);
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(canvas);
}

/** Start an HTML5 drag and PARK the pointer — no mouse.up, so the marker is
 *  still on screen to assert against. Two moves: the first arms the drag, the
 *  second is the one the drop target actually sees. */
async function hoverDrag(page: Page, source: Locator, x: number, y: number): Promise<void> {
  const s = (await source.boundingBox())!;
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 8 });
  await page.mouse.move(x + 1, y);
}

const marker = (page: Page) => page.locator('[data-testid="drop-marker"]');

/** The id of a node whose DOM parent lays its children out in a row. */
async function rowChildId(page: Page, canvas: string): Promise<string | null> {
  return page.evaluate((sel) => {
    for (const el of Array.from(document.querySelectorAll(`${sel} [data-sui-id]`))) {
      const p = el.parentElement;
      if (!p) continue;
      const cs = getComputedStyle(p);
      if ((cs.display === "flex" || cs.display === "inline-flex") && cs.flexDirection.startsWith("row")) {
        const r = el.getBoundingClientRect();
        if (r.width > 20 && r.height > 10) return el.getAttribute("data-sui-id");
      }
    }
    return null;
  }, canvas);
}

test("site: a stacked target gets a horizontal ZONE centered on the edge it will drop at", async ({ page }) => {
  await ready(page, "/", ".sui-canvas");
  const target = page.locator(".sui-canvas").locator("h1[data-sui-id], h2[data-sui-id]").first();
  const box = (await target.boundingBox())!;

  await hoverDrag(page, target, box.x + box.width / 2, box.y + 3); // upper edge → "before"

  await expect(marker(page)).toHaveCount(1);
  await expect(marker(page)).toHaveAttribute("data-drop-axis", "y");
  const m = (await marker(page).boundingBox())!;
  expect(m.height, "a hairline is not a target").toBeGreaterThan(12);
  expect(m.width).toBeGreaterThan(m.height); // lies ACROSS a vertical stack
  expect(Math.abs(m.y + m.height / 2 - box.y), "not centered on the seam").toBeLessThan(2);
  expect(m.width).toBeGreaterThanOrEqual(box.width); // spans the node it belongs to
});

test("site: a flex-row target gets a VERTICAL marker that survives the pointer crossing the seam", async ({ page }) => {
  await ready(page, "/", ".sui-canvas");
  const canvas = page.locator(".sui-canvas");
  const found = await rowChildId(page, ".sui-canvas");
  test.skip(!found, "no flex-row child in the seeded document");

  const source = canvas.locator(`[data-sui-id="${found}"]`);
  const target = canvas.locator("a.btn[data-sui-id], button.btn[data-sui-id]").nth(1);
  const box = (await target.boundingBox())!;
  await hoverDrag(page, source, box.x + 3, box.y + box.height / 2); // left edge → "before"

  await expect(marker(page)).toHaveCount(1);
  await expect(marker(page), "before/after was decided on the wrong axis").toHaveAttribute("data-drop-axis", "x");
  const m = (await marker(page).boundingBox())!;
  expect(m.height).toBeGreaterThan(m.width); // stands UP between side-by-side nodes
  expect(m.width).toBeGreaterThan(12);

  // The regression the overlay exists for: the marker must neither disappear
  // nor move what's being aimed at as the pointer walks the target's edge.
  for (const dx of [0, 2, 4, 8, 12]) {
    await page.mouse.move(box.x + 3 + dx, box.y + box.height / 2);
    const state = await page.evaluate(() => ({
      markers: document.querySelectorAll('[data-testid="drop-marker"]').length,
      targetX: document.querySelectorAll(".sui-canvas a.btn[data-sui-id]")[1]?.getBoundingClientRect().x ?? -1,
    }));
    expect(state.markers, `marker lost at +${dx}px`).toBe(1);
    expect(Math.abs(state.targetX - box.x), `the drop target moved at +${dx}px`).toBeLessThan(1);
  }
});

test("email: a section edge gets the same zone", async ({ page }) => {
  await ready(page, "/?editor=email&persist=0", ".sui-email-canvas");
  const target = page.locator(".sui-email-canvas [data-sui-id]").first();
  const box = (await target.boundingBox())!;

  await hoverDrag(page, target, box.x + box.width / 2, box.y + 3);

  await expect(marker(page)).toHaveCount(1);
  await expect(marker(page)).toHaveAttribute("data-drop-axis", "y");
  const m = (await marker(page).boundingBox())!;
  expect(m.height).toBeGreaterThan(12);
  expect(m.width).toBeGreaterThan(m.height);
});

test("email: columns sit side by side, so the marker between them stands up", async ({ page }) => {
  await ready(page, "/?editor=email&persist=0", ".sui-email-canvas");
  const canvas = page.locator(".sui-email-canvas");

  // The seeded email is a single stack — insert a 2-column row so there IS a
  // horizontal axis to aim along.
  await page.getByRole("button", { name: /insert/i }).first().click();
  await page.locator('[data-insert-key="columns-2"]').first().click();

  const found = await rowChildId(page, ".sui-email-canvas");
  expect(found, "columns-2 did not render side by side").not.toBeNull();

  const source = canvas.locator("[data-sui-id]").first();
  const target = canvas.locator(`[data-sui-id="${found}"]`);
  const box = (await target.boundingBox())!;
  await hoverDrag(page, source, box.x + 3, box.y + box.height / 2);

  await expect(marker(page)).toHaveCount(1);
  await expect(marker(page)).toHaveAttribute("data-drop-axis", "x");
  const m = (await marker(page).boundingBox())!;
  expect(m.height).toBeGreaterThan(m.width);
});

test("dropping INSIDE a container draws the container's ring, not an edge marker", async ({ page }) => {
  await ready(page, "/", ".sui-canvas");
  const canvas = page.locator(".sui-canvas");
  // A container's MIDDLE band means INSIDE — the dashed ring on the container
  // says "lands in here", and an edge marker would contradict it. Aim at the
  // button row's own `gap`: a point that belongs to the row and to neither
  // button, at the row's vertical centre.
  const buttons = canvas.locator("a.btn[data-sui-id], button.btn[data-sui-id]");
  const a = (await buttons.nth(0).boundingBox())!;
  const b = (await buttons.nth(1).boundingBox())!;
  expect(b.x, "the seeded CTAs are not side by side").toBeGreaterThan(a.x + a.width);

  await hoverDrag(page, buttons.nth(0), (a.x + a.width + b.x) / 2, a.y + a.height / 2);

  await expect(marker(page)).toHaveCount(0);
  await expect(canvas.locator(".outline-accent.outline-dashed").first()).toBeVisible();
});
