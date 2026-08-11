import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * `ScrollStrip`'s entire contract is a decision made from real layout, so real
 * layout is the only place it can be proven. jsdom reports every width as 0 —
 * the behaviors probe has to stub the geometry, which means it tests the
 * decisions but not the measuring. These tests are the other half.
 *
 * The specific thing being defended: the controls must be IN FLOW and must
 * appear/disappear as a PAIR. Mounting a control narrows the scroller, which
 * can create the very overflow that justified it — so a per-control rule
 * oscillates forever. That failure is invisible to a screenshot (a strip mid-
 * oscillation looks fine in a still) and invisible to jsdom.
 */

const strip = (page: Page, demo: string) => page.locator(`[data-demo="${demo}"]`);
const controls = (s: Locator) => s.locator(".scroll-strip-control");
const track = (s: Locator) => s.locator(".scroll-strip-track");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await strip(page, "fits").waitFor();
});

test("content that fits shows no controls at all", async ({ page }) => {
  const s = strip(page, "fits");
  await expect(controls(s)).toHaveCount(0);
  // And nothing is dimmed: a strip with nothing hidden must not look clipped.
  await expect(s).toHaveAttribute("data-at-start", "true");
  await expect(s).toHaveAttribute("data-at-end", "true");
});

test("overflowing content mounts BOTH controls, and the pair is stable", async ({ page }) => {
  const s = strip(page, "fade");
  await expect(controls(s)).toHaveCount(2);

  // The oscillation guard: re-measure after a settle and the count must be the
  // same. A per-control rule flickers between 1 and 2 here.
  await page.waitForTimeout(250);
  await expect(controls(s)).toHaveCount(2);
});

test("the controls take their own space — they never overlay the content", async ({ page }) => {
  const s = strip(page, "fade");
  const [back, forward] = await controls(s).all();
  const backBox = (await back!.boundingBox())!;
  const fwdBox = (await forward!.boundingBox())!;
  const trackBox = (await track(s).boundingBox())!;

  // In flow means: strictly left of / right of, not on top of. An overlaid
  // chevron would sit inside the track's own horizontal span.
  expect(backBox.x + backBox.width).toBeLessThanOrEqual(trackBox.x + 1);
  expect(fwdBox.x).toBeGreaterThanOrEqual(trackBox.x + trackBox.width - 1);
});

test("a control at an end disables but KEEPS its footprint", async ({ page }) => {
  const s = strip(page, "fade");
  const [back, forward] = await controls(s).all();
  await expect(back!).toBeDisabled();
  await expect(forward!).toBeEnabled();

  const before = (await track(s).boundingBox())!;
  await forward!.click();
  await expect(back!).toBeEnabled();

  // The strip must not jump sideways just because a control changed state.
  const after = (await track(s).boundingBox())!;
  expect(after.x).toBeCloseTo(before.x, 0);
  expect(after.width).toBeCloseTo(before.width, 0);
});

test("forward scrolls ~0.8 of the visible width and stops at the end", async ({ page }) => {
  const s = strip(page, "fade");
  const t = track(s);
  const forward = controls(s).nth(1);

  const { client, max } = await t.evaluate((el) => ({
    client: el.clientWidth,
    max: el.scrollWidth - el.clientWidth,
  }));
  expect(max).toBeGreaterThan(0);

  await forward.click();
  await expect
    .poll(() => t.evaluate((el) => el.scrollLeft))
    .toBeCloseTo(Math.min(client * 0.8, max), 0);

  // Press it until it gives up; it must land exactly at the end and disable,
  // never past it.
  for (let i = 0; i < 6; i++) {
    if (await forward.isDisabled()) break;
    await forward.click();
    await page.waitForTimeout(120);
  }
  await expect(forward).toBeDisabled();
  await expect.poll(() => t.evaluate((el) => el.scrollLeft)).toBeCloseTo(max, 0);
});

test("the edge fade tracks the clipping it describes", async ({ page }) => {
  const s = strip(page, "fade");
  // At the start there is nothing clipped on the leading edge, so that side
  // must not be dimmed — `data-at-start` is what collapses it.
  await expect(s).toHaveAttribute("data-at-start", "true");
  await expect(s).not.toHaveAttribute("data-at-end", "true");
  await expect(track(s)).toHaveCSS("mask-image", /linear-gradient/);

  await controls(s).nth(1).click();
  await expect(s).not.toHaveAttribute("data-at-start", "true");
});

test("widening the pane retires the controls; narrowing brings them back", async ({ page }) => {
  const s = strip(page, "pane");
  // Scoped to this demo's own section — the playground has a Range demo too,
  // and an unscoped `.first()` silently drives that one instead.
  const slider = page.locator('#scroll-strip input[type="range"]');

  await slider.fill("48");
  await expect(controls(s)).toHaveCount(0);

  await slider.fill("16");
  await expect(controls(s)).toHaveCount(2);
});

test("the size ramp grows the control monotonically", async ({ page }) => {
  const widths: number[] = [];
  for (const size of ["xs", "sm", "md", "lg", "xl"]) {
    const box = (await controls(strip(page, `strip-size-${size}`)).first().boundingBox())!;
    widths.push(box.width);
  }
  for (let i = 1; i < widths.length; i++) {
    expect(widths[i]!, `${i} should out-size ${i - 1}`).toBeGreaterThan(widths[i - 1]!);
  }
});

test("RTL: the first control still means 'toward the start'", async ({ page }) => {
  const s = strip(page, "rtl");
  const [back, forward] = await controls(s).all();
  await expect(back!).toBeDisabled();

  // The row reverses, so 'back' renders on the RIGHT — and the glyph turns
  // around with it rather than pointing into the content.
  const backBox = (await back!.boundingBox())!;
  const fwdBox = (await forward!.boundingBox())!;
  expect(backBox.x).toBeGreaterThan(fwdBox.x);
  await expect(back!.locator("svg")).toHaveCSS("transform", "matrix(-1, 0, 0, 1, 0, 0)");

  // Scrolling forward in RTL runs scrollLeft NEGATIVE; the control must still
  // move the content, and 'back' must come alive.
  await forward!.click();
  await expect.poll(() => track(s).evaluate((el) => el.scrollLeft)).toBeLessThan(0);
  await expect(back!).toBeEnabled();
});

test("a strip of real buttons adds no redundant tab stop", async ({ page }) => {
  // The pane strip holds Buttons, which the browser already gives tab stops.
  await expect(track(strip(page, "pane"))).not.toHaveAttribute("tabindex", "0");
});

// ── Tabs carries this itself ────────────────────────────────────────────────
// The reason ScrollStrip exists at all is a tab strip that ended at "Activity"
// with two more tabs past the edge. Requiring every call site to remember a
// wrapper is the papercut, not the fix — so TabsList does it, and these prove
// it without breaking what Tabs already did.

for (const variant of ["underline", "boxed", "pills"] as const) {
  test(`${variant} tabs that overflow get controls, and still select`, async ({ page }) => {
    const s = page.locator(`[data-demo="overflow-${variant}"]`);
    const list = s.locator(".tabs-list");
    const btns = s.locator(".scroll-strip-control");
    await expect(btns).toHaveCount(2);

    // The list IS the scroller — not a div wrapped around it — so Base UI's
    // indicator keeps measuring against the same box.
    await expect(list).toHaveClass(/tabs-list-scroll/);
    expect(await list.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeGreaterThan(0);

    // Selection is untouched by the wrapping.
    const timeline = s.getByRole("tab", { name: "Timeline" });
    await timeline.click();
    // Base UI marks the active tab `data-active`, NOT `data-selected` — the
    // same mismatch tabs.js calls out for the CSS.
    await expect(timeline).toHaveAttribute("data-active", "");
    await expect(timeline).toHaveAttribute("aria-selected", "true");

    await btns.nth(1).click();
    await expect.poll(() => list.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  });
}

test("the moving indicator is not shaved off by the scroller's clip", async ({ page }) => {
  // `overflow-x: auto` forces the other axis off `visible`, so a horizontal
  // scroller clips vertically — and the underline deliberately overhangs the
  // baseline by 1px. If that overhang survives into the scrollable case, the
  // 2px indicator renders 1px tall.
  const list = page.locator('[data-demo="overflow-underline"] .tabs-list');
  const indicator = list.locator(".tabs-indicator");
  const box = (await indicator.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(2);

  const listBox = (await list.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(listBox.y + listBox.height + 0.5);
});

test("tabs that FIT are left exactly as they were", async ({ page }) => {
  // The scrollable list must not grow: an `inline-flex` list has always ended
  // its baseline rule at the last tab, and wrapping it must not change that.
  const list = page.locator("#tabs .tabs-list").first();
  await expect(list.locator("xpath=../*[contains(@class,'scroll-strip-control')]")).toHaveCount(0);
  const overhang = await list.evaluate((el) => {
    const tabs = el.querySelectorAll(".tabs-tab");
    const last = tabs[tabs.length - 1]!;
    return el.getBoundingClientRect().right - last.getBoundingClientRect().right;
  });
  expect(overhang).toBeLessThanOrEqual(1);
});
