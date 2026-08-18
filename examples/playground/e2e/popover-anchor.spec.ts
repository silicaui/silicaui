import { test, expect, type Page } from "@playwright/test";

/**
 * `anchor` is a LAYOUT claim, so real layout is the only thing that can prove
 * it. jsdom gives every element a zero rect, which makes "the popup moved to
 * the anchor" and "the popup never moved at all" indistinguishable there — the
 * exact failure this probe exists to catch.
 *
 * The regression being defended: Silica's `*Content` wrappers used to forward
 * only `side`/`align`/`sideOffset` to Base UI's Positioner, so a popup could
 * physically only sit against its own trigger. Anything that anchors to another
 * element, a virtual element, or a pointer was unreachable through the wrapper.
 */

const demo = (page: Page, name: string) => page.locator(`[data-demo="${name}"]`);

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await demo(page, "anchor-trigger").waitFor();
});

test("the popup sits against the anchor, not the trigger that opened it", async ({
  page,
}) => {
  const trigger = demo(page, "anchor-trigger");
  const target = demo(page, "anchor-target");

  await trigger.click();
  const popup = demo(page, "anchor-popup");
  await expect(popup).toBeVisible();

  const [popupBox, targetBox, triggerBox] = await Promise.all([
    popup.boundingBox(),
    target.boundingBox(),
    trigger.boundingBox(),
  ]);
  if (!popupBox || !targetBox || !triggerBox) throw new Error("no layout");

  // side="right" against the target: the popup starts past the target's right
  // edge, and is vertically centred on the target.
  expect(popupBox.x).toBeGreaterThanOrEqual(targetBox.x + targetBox.width - 1);

  const popupMid = popupBox.y + popupBox.height / 2;
  const targetMid = targetBox.y + targetBox.height / 2;
  const triggerMid = triggerBox.y + triggerBox.height / 2;
  expect(Math.abs(popupMid - targetMid)).toBeLessThan(4);

  // The load-bearing half: this must FAIL if `anchor` is dropped. If the two
  // elements happened to share a centre line the assertion above would pass on
  // a broken build, so assert they genuinely differ.
  expect(Math.abs(targetMid - triggerMid)).toBeGreaterThan(8);
});

test("a virtual element pins the popup to an arbitrary point", async ({ page }) => {
  const surface = demo(page, "pointer-surface");
  // boundingBox is viewport-relative, and this section sits well below the
  // fold — clicking an unscrolled box hits empty space, not the surface.
  await surface.scrollIntoViewIfNeeded();
  const box = await surface.boundingBox();
  if (!box) throw new Error("no layout");

  const click = { x: box.x + box.width * 0.75, y: box.y + box.height * 0.25 };
  await page.mouse.click(click.x, click.y);

  const popup = demo(page, "pointer-popup");
  await expect(popup).toBeVisible();

  const popupBox = await popup.boundingBox();
  if (!popupBox) throw new Error("no popup layout");

  // align="start", side="bottom" on a zero-size rect: the popup's top-left
  // lands on the clicked point (Base UI may shift it to dodge the viewport
  // edge, which is why this is a tolerance and not an equality).
  expect(Math.abs(popupBox.x - click.x)).toBeLessThan(24);
  expect(popupBox.y).toBeGreaterThanOrEqual(click.y - 1);
  expect(popupBox.y - click.y).toBeLessThan(24);
});
