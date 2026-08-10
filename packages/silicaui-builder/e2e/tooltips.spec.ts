import { test, expect, type Page } from "@playwright/test";

/**
 * Every button in the builder chrome says what it does on hover.
 *
 * The bar this holds is deliberately higher than "a tooltip appears somewhere":
 *
 *  1. It must be a REAL tooltip, not the native `title` attribute — `title` has
 *     an unconfigurable ~1s delay, no styling, no theme, and is announced
 *     inconsistently by screen readers. A `title` left beside a tooltip shows
 *     BOTH, staggered, so the absence of `title` on chrome buttons is itself
 *     asserted.
 *  2. It must be THEMED. Base UI portals the popup to `document.body`, outside
 *     the chrome's `[data-theme]` island — a popup that forgot to re-stamp the
 *     studio theme resolves `--color-*` against nothing and renders as
 *     unstyled black-on-white. Asserting the attribute catches that class of
 *     regression without pinning an exact colour.
 *  3. A DISABLED button must still explain itself. That's the hover a person
 *     makes most ("why can't I click this"), and it's the one Base UI drops by
 *     default because a disabled button emits no pointer events.
 */

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  return errors;
}

async function ready(page: Page, query = ""): Promise<void> {
  await page.goto(`/${query}`);
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
}

/** The live tooltip popup, whichever trigger opened it. */
const TIP = ".tooltip, [class*='tooltip']:not([class*='tooltip-arrow'])";

test("a site toolbar icon button opens a themed tooltip and carries no native title", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const undo = page.getByRole("button", { name: "Undo", exact: true });
  await expect(undo).toBeVisible();
  // The native attribute is GONE — a `title` surviving beside a real tooltip is
  // the regression this asserts, not a harmless leftover.
  await expect(undo).not.toHaveAttribute("title", /./);

  await undo.hover();
  const tip = page.locator(TIP).filter({ hasText: "Undo" }).first();
  await expect(tip).toBeVisible();
  // Portaled outside the chrome's island, so it re-stamps the studio theme.
  await expect(tip).toHaveAttribute("data-theme", "studio");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("a DISABLED button still explains itself on hover", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // Nothing has been edited yet, so Redo is disabled — the exact case Base UI
  // drops by default (a disabled <button> emits no pointer events).
  const redo = page.getByRole("button", { name: "Redo", exact: true });
  await expect(redo).toBeDisabled();

  // Hover the WRAPPER, which is what a real pointer lands on.
  await redo.hover({ force: true });
  await expect(page.locator(TIP).filter({ hasText: "Redo" }).first()).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("an unlabelled swatch has both an accessible name and a tooltip", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // Select something so the Inspector shows its Design controls.
  await page.locator(".tree-node").first().click();

  // A colour swatch is an EMPTY element — `aria-label` is its whole accessible
  // name, so getByRole finding it at all is half the assertion.
  const auto = page.getByRole("button", { name: "Auto", exact: true }).first();
  await expect(auto).toBeVisible();
  await expect(auto).not.toHaveAttribute("title", /./);

  await auto.hover();
  await expect(page.locator(TIP).first()).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("the email builder's toolbar buttons are tooltipped too, and Export HTML is gone", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page, "?editor=email");

  // The builder ships no HTML-export button — projection is the host's job,
  // done with `toEmailHtml`, not a button in the chrome.
  await expect(page.getByRole("button", { name: /export/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /import/i })).toHaveCount(0);

  const undo = page.getByRole("button", { name: "Undo", exact: true });
  await expect(undo).not.toHaveAttribute("title", /./);
  await undo.hover({ force: true });
  const tip = page.locator(TIP).filter({ hasText: "Undo" }).first();
  await expect(tip).toBeVisible();
  await expect(tip).toHaveAttribute("data-theme", "studio");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("the site builder has no Export/Import HTML button either", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  await expect(page.getByRole("button", { name: /export html/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /import/i })).toHaveCount(0);
  // Publish is the site builder's terminal action and stays.
  await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});
