import { test, expect, type Page } from "@playwright/test";
import { ROW } from "./inspector-row";

/**
 * The email twin of the two site-builder defects a host reported: a canvas that
 * updated the model but never repainted, and a size control that couldn't
 * overwrite a value above its own ceiling.
 *
 * Neither should exist here — email nodes carry TYPED fields (`paddingY: 24`)
 * rather than a class string, so an update is an assignment and can't layer; and
 * every view reads `extract()`, which clones per commit, so nothing memoizes on
 * an in-place-mutated tree. Both of those are architecture, not a fix, which is
 * exactly why they need a test: they hold today by construction and would be
 * silently lost the first time someone adds a resolution memo or a live getter.
 *
 * `?host=demo` wires the demo host's `resolveBinding`/`resolveCollection` — the
 * condition that exposed the site bug (data resolution is what put a memoized
 * COPY between the model and the screen).
 */

interface Bus {
  __ready?: boolean;
  __changeCount?: number;
  __emailHandle?: { applyRemoteOps(ops: unknown[]): { applied: number; dropped: unknown[] } };
  __lastChange?: { templates: { id: string; document: { root: Record<string, unknown> } }[] };
}

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  return errors;
}

async function ready(page: Page): Promise<void> {
  await page.goto("/?editor=email&host=demo&persist=0");
  await page.waitForFunction(() => (window as Bus).__ready === true);
  await page.waitForSelector(".sui-email-canvas");
}

/** Select the seeded section (Navigator order: Email, Section, Text) and hand
 *  back its canvas element. Clicking the canvas would hit the text inside it. */
async function selectSection(page: Page) {
  await page.locator(".tree-node").nth(1).click();
  const id = await page.locator(".sui-email-canvas [data-sui-id]").nth(0).getAttribute("data-sui-id");
  return page.locator(`.sui-email-canvas [data-sui-id="${id}"]`);
}

const padRow = (page: Page, label: string) => page.locator(ROW, { hasText: label }).first();

test("the canvas repaints as you edit — a size chip is not a no-op", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  const section = await selectSection(page);

  await padRow(page, "Padding X").getByRole("button", { name: "8", exact: true }).click();
  await expect(section).toHaveCSS("padding-left", "32px");

  // A second edit on the same node — a view that refreshed once by luck would
  // still fail here.
  await padRow(page, "Padding Y").getByRole("button", { name: "2", exact: true }).click();
  await expect(section).toHaveCSS("padding-top", "8px");
  await expect(section).toHaveCSS("padding-left", "32px");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

/**
 * The `py-20` case, in email's shape. A value off the chip ladder can arrive
 * from a host template or another author's op; the control has to SHOW it and be
 * able to replace it. (Assignment can't layer the way two classes did, so this
 * locks the behavior rather than fixing it.)
 */
test("a size off the chip ladder is shown truthfully, and a chip replaces it", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  const section = await selectSection(page);
  const sectionId = await section.getAttribute("data-sui-id");

  // One real edit first, so the harness has recorded the project and we can read
  // the template id a collaborator's op has to name.
  await padRow(page, "Padding Y").getByRole("button", { name: "4", exact: true }).click();
  await expect(section).toHaveCSS("padding-top", "16px");
  const tid = await page.evaluate(() => (window as Bus).__lastChange!.templates[0]!.id);

  // Now introduce the off-ladder value the way a real one arrives — another
  // author's op, applied to the live document.
  const applied = await page.evaluate(
    ({ tid, nodeId }) =>
      (window as Bus).__emailHandle!.applyRemoteOps([
        { target: { scope: "template", id: tid }, kind: "node.update", nodeId, patch: { paddingY: 44 } },
      ]).applied,
    { tid, nodeId: sectionId! },
  );
  expect(applied).toBe(1);

  // It PAINTS — the remote-op repaint path, on a node the Inspector is showing.
  await expect(section).toHaveCSS("padding-top", "44px");

  // ...and the Inspector tells the truth about it rather than showing the last
  // chip value: no chip is active, and the numeric fallback carries the real 44.
  const row = padRow(page, "Padding Y");
  await expect(row.locator("input[type='number']")).toHaveValue("44");
  await expect(row.getByRole("button", { name: "4", exact: true })).not.toHaveClass(/btn-primary/);

  // Custom is what owns "this isn't a preset" — and Auto, which is a reset
  // ACTION, stays unlit. It used to light up here, announcing a deliberate 44px
  // as the kind's default.
  await expect(row.getByRole("button", { name: "Custom", exact: true })).toHaveClass(/btn-primary/);
  await expect(row.getByRole("button", { name: "Auto", exact: true })).not.toHaveClass(/btn-primary/);

  // The whole point: a chip REPLACES it. This is where the site builder appended.
  await row.getByRole("button", { name: "8", exact: true }).click();
  await expect(section).toHaveCSS("padding-top", "32px");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

/**
 * The reach half. The chip ladder is a scale, and a scale you can't step off is
 * a control that can't express the design: padding offered 0/8/16/24/32px and
 * the number field only appeared once the value was ALREADY off the ladder — so
 * an author could edit a foreign value but never author one. 12px was simply
 * unreachable. Radius (4 presets) had the same hole.
 */
test("Custom reaches a value the chips don't offer, for sizes and radii", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  const section = await selectSection(page);

  const row = padRow(page, "Padding Y");
  // Nothing on show but chips while the value is a preset — the field is opt-in,
  // not a permanent second control under every row.
  await expect(row.locator("input[type='number']")).toHaveCount(0);

  await row.getByRole("button", { name: "Custom", exact: true }).click();
  const custom = row.locator("input[type='number']");
  await expect(custom).toHaveCount(1);
  await custom.fill("13");
  await custom.blur();
  await expect(section).toHaveCSS("padding-top", "13px");
  // It stays open on its own now that the value is off-ladder — a value you can
  // see but can't reach is worse than one you can't set.
  await expect(row.locator("input[type='number']")).toHaveValue("13");

  // Back onto the ladder puts the field away again.
  await row.getByRole("button", { name: "4", exact: true }).click();
  await expect(section).toHaveCSS("padding-top", "16px");
  await expect(row.locator("input[type='number']")).toHaveCount(0);

  // Corner radius: 4 preset swatches plus the same escape hatch.
  const radius = page.getByRole("group", { name: "Corner radius" }).first();
  await expect(radius.locator("input[type='number']")).toHaveCount(0);
  await radius.getByRole("button", { name: "Custom radius" }).click();
  const radiusInput = radius.locator("input[type='number']");
  await radiusInput.fill("12");
  await radiusInput.blur();
  await expect(section).toHaveCSS("border-radius", "12px");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

/**
 * The other half of "the view tells the truth": undo. Email's fields are
 * uncontrolled (`defaultValue`, committed on blur) so typing doesn't fight a
 * re-render — which would go stale on undo if the field set weren't keyed on the
 * node's own content (Inspector.tsx). Canvas and Inspector must agree after it.
 */
test("undo reverts both the canvas and the Inspector, with no reload", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  const section = await selectSection(page);

  await padRow(page, "Padding Y").getByRole("button", { name: "8", exact: true }).click();
  await expect(section).toHaveCSS("padding-top", "32px");
  await expect(padRow(page, "Padding Y").getByRole("button", { name: "8", exact: true })).toHaveClass(
    /btn-primary/,
  );

  await page.keyboard.press("ControlOrMeta+z");
  await expect(section).not.toHaveCSS("padding-top", "32px");
  await expect(padRow(page, "Padding Y").getByRole("button", { name: "8", exact: true })).not.toHaveClass(
    /btn-primary/,
  );

  expect(errors, errors.join("\n")).toHaveLength(0);
});
