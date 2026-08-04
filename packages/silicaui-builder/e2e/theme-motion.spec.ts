import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * The Theme editor's MOTION group (`--duration` + `--ease`) and the focus-ring
 * OFFSET (`--focus-offset`).
 *
 * All three were read by the library and written by nothing: 86 `--duration`/
 * `--ease` declarations across 38 components with no way to set either, and a
 * "Focus ring" control that wrote `--focus-width` but not the offset — so a ring
 * could be thickened and never moved off the control it outlines.
 *
 * Every assertion here reads a COMPUTED style off a real control on the board,
 * not the token on the island's `style` — a token that lands and doesn't paint is
 * the failure these are here to catch.
 */

const BOARD_INPUT = ".sui-brd .input";

async function ready(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
  await page.getByRole("button", { name: "Theme" }).click();
  await expect(page.locator(".sui-brd")).toBeVisible();
}

/** Click a step in a labelled ToggleGroup (label sits directly above the group). */
async function setStep(page: Page, label: string, step: string): Promise<void> {
  const group = page.locator("div").filter({ hasText: new RegExp(`^${label}$`) }).last()
    .locator("xpath=following-sibling::*[1]");
  await group.getByRole("button", { name: step, exact: true }).click();
}

/** Click a step in an inline row (label sits in a 74px column beside the group). */
async function setRowStep(page: Page, label: string, step: string): Promise<void> {
  const row = page.locator("div").filter({ has: page.locator(`span:text-is("${label}")`) }).last();
  await row.getByRole("button", { name: step, exact: true }).click();
}

const styleOf = (el: Locator, prop: string): Promise<string> =>
  el.evaluate((n, p) => getComputedStyle(n).getPropertyValue(p), prop);

/** Computed seconds, however the engine chose to serialize them ("0.3s", "1e-05s"). */
const secondsOf = async (el: Locator, prop: string): Promise<number> =>
  parseFloat(await styleOf(el, prop));

/** The ring only exists while the control has focus, and clicking a control in
 *  the theme panel takes that focus away — so re-focus before every read. */
async function ringOf(el: Locator): Promise<{ offset: string; width: string }> {
  await el.focus();
  return { offset: await styleOf(el, "outline-offset"), width: await styleOf(el, "outline-width") };
}

test("transition speed is themeable and reaches a real control", async ({ page }) => {
  await ready(page);
  const input = page.locator(BOARD_INPUT).first();

  expect(await styleOf(input, "transition-duration")).toBe("0.15s"); // the built-in default

  await setStep(page, "Speed", "relaxed");
  expect(await styleOf(input, "transition-duration")).toBe("0.3s");

  await setStep(page, "Speed", "snappy");
  expect(await styleOf(input, "transition-duration")).toBe("0.1s");

  await setStep(page, "Speed", "off");
  expect(await styleOf(input, "transition-duration")).toBe("0s");
});

test("easing is themeable, and independent of speed", async ({ page }) => {
  await ready(page);
  const input = page.locator(BOARD_INPUT).first();

  await setStep(page, "Speed", "relaxed");
  await setStep(page, "Easing", "linear");
  expect(await styleOf(input, "transition-timing-function")).toBe("linear");
  expect(await styleOf(input, "transition-duration")).toBe("0.3s"); // speed untouched

  // Spring overshoots past 1 — the curve that makes motion feel physical.
  await setStep(page, "Easing", "spring");
  expect(await styleOf(input, "transition-timing-function")).toBe("cubic-bezier(0.34, 1.56, 0.64, 1)");
});

test("focus gap moves the ring off the control, independently of its width", async ({ page }) => {
  await ready(page);
  const input = page.locator(BOARD_INPUT).first();

  expect(await ringOf(input)).toEqual({ offset: "2px", width: "2px" }); // built-in defaults

  await setRowStep(page, "Focus gap", "4");
  expect(await ringOf(input)).toEqual({ offset: "4px", width: "2px" }); // width lever untouched

  await setRowStep(page, "Focus gap", "0");
  expect((await ringOf(input)).offset).toBe("0px");

  // And the two really are separate knobs — thicken the ring, keep the new gap.
  await setRowStep(page, "Focus ring", "4");
  expect(await ringOf(input)).toEqual({ offset: "0px", width: "4px" });
});

test("prefers-reduced-motion overrides a theme that asks for slow motion", async ({ page }) => {
  await ready(page);
  const input = page.locator(BOARD_INPUT).first();

  await setStep(page, "Speed", "relaxed");
  expect(await styleOf(input, "transition-duration")).toBe("0.3s");

  // The theme island declares `--duration` ON ITSELF (inline, as a live editor
  // does), which shadows an inherited `:root` value for its whole subtree. The
  // guard therefore has to match `[data-theme]` too, and be `!important` to beat
  // the inline declaration — a `:root`-only rule silently loses here.
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await secondsOf(input, "transition-duration")).toBeLessThan(0.001);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect(await styleOf(input, "transition-duration")).toBe("0.3s");
});
