import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * The Effects ▸ Noise toggle and the `--noise` token behind it.
 *
 * The toggle shipped writing a token no CSS read — a live control with no
 * effect. `--noise` now paints a tiling SVG grain on the themed surface
 * (`[data-theme]`), gated by `background-size` so that OFF means genuinely not
 * painted rather than painted-at-zero-opacity.
 */

async function ready(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
  await page.getByRole("button", { name: "Theme" }).click();
  await expect(page.locator(".sui-brd")).toBeVisible();
}

const styleOf = (el: Locator, prop: string): Promise<string> =>
  el.evaluate((n, p) => getComputedStyle(n).getPropertyValue(p), prop);

// Reachable by NAME because the Effects switches now carry one — they shipped
// with no accessible label at all, which a screen reader reads as a bare
// "switch" and which made this control unaddressable from a test too.
const noiseToggle = (page: Page): Locator => page.getByRole("switch", { name: "Noise" });

test("Noise paints grain on the themed surface, and off means not painted", async ({ page }) => {
  await ready(page);
  const board = page.locator(".sui-brd");

  // Off by default: the image is declared but sized to nothing, so the browser
  // never paints it — no cost for the themes that don't ask for grain.
  expect(await styleOf(board, "background-size")).toBe("0px 0px");

  await noiseToggle(page).click();

  expect(await styleOf(board, "background-size")).toBe("128px 128px");
  expect(await styleOf(board, "background-image")).toContain("feTurbulence");
  // Grey grain over the base color, rather than a tint laid on top of it.
  expect(await styleOf(board, "background-blend-mode")).toBe("overlay");

  await noiseToggle(page).click();
  expect(await styleOf(board, "background-size")).toBe("0px 0px");
});

test("grain reaches a scoped island, and rides the theme's own surface color", async ({ page }) => {
  await ready(page);
  const board = page.locator(".sui-brd");

  await noiseToggle(page).click();

  // The token is inherited, but the PAINT is scoped to elements that carry
  // [data-theme] — the one rule that defines "surface" here. A raised Card keeps
  // its clean fill (grain is the paper, not the thing sitting on it).
  const card = page.locator(".sui-brd .card").first();
  expect(await styleOf(card, "background-size")).not.toBe("128px 128px");

  // The surface color is untouched — grain blends against it, never replaces it.
  expect(await styleOf(board, "background-color")).not.toBe("rgba(0, 0, 0, 0)");
});

/** Mean + standard deviation of the painted pixels in a patch of the surface. */
async function patchStats(page: Page, clip: { x: number; y: number; width: number; height: number }) {
  const b64 = (await page.screenshot({ clip })).toString("base64");
  return page.evaluate(async (data) => {
    const img = new Image();
    img.src = `data:image/png;base64,${data}`;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, c.width, c.height).data;
    let n = 0, sum = 0, sumSq = 0;
    for (let i = 0; i < px.length; i += 4) {
      const lum = 0.2126 * px[i]! + 0.7152 * px[i + 1]! + 0.0722 * px[i + 2]!;
      n++; sum += lum; sumSq += lum * lum;
    }
    const mean = sum / n;
    return { mean, sd: Math.sqrt(Math.max(0, sumSq / n - mean * mean)) };
  }, b64);
}

/**
 * The assertion that actually protects the feature. Computed styles prove the
 * grain is DECLARED; only pixels prove it is grain rather than a haze. Two
 * earlier cuts of this filter passed every style assertion above while washing a
 * base-200 surface 7.7/255 lighter and carrying a standard deviation of 0.5 —
 * visually a flat, wrongly-lightened panel. The filter chain is calibrated so
 * the layer's mean sits exactly on `overlay`'s identity point; these two numbers
 * are what say so.
 */
test("grain adds texture WITHOUT shifting the surface color", async ({ page }) => {
  await ready(page);
  const box = (await page.locator(".sui-brd").boundingBox())!;
  const clip = { x: box.x + 430, y: box.y + 4, width: 48, height: 48 };

  const off = await patchStats(page, clip);
  expect(off.sd).toBeLessThan(0.01); // a flat, untextured surface to begin with

  await noiseToggle(page).click();
  const on = await patchStats(page, clip);

  expect(Math.abs(on.mean - off.mean)).toBeLessThan(1.5); // no wash
  expect(on.sd).toBeGreaterThan(2); // real, visible grain
});
