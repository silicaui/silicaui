import { test, expect, type Page } from "@playwright/test";

/**
 * `.stack`'s peek must survive a real content-height card.
 *
 * It did not: the nudge was a fixed `1.5rem` while the shrink from `scale()`
 * is proportional, so above ~320px the shrink out-ran the nudge, every edge
 * went negative, and the deck rendered as a single card with no warning. That
 * is invisible to jsdom (no layout) and was invisible to the old demo, whose
 * only specimens were 128x192 — comfortably under the ceiling. Which is why it
 * shipped.
 *
 * So measure real geometry, at a size that used to fail. Every number below is
 * a back card's edge relative to the FRONT card's: positive means it peeks out,
 * negative means it is fully occluded.
 */

/** How far the `n`th child's edges sit outside the front card's, in CSS px. */
function peekOf(page: Page, demo: string, n: number) {
  return page.locator(`[data-demo="${demo}"]`).evaluate((el, i) => {
    const kids = [...el.children];
    const front = kids[0]!.getBoundingClientRect();
    const back = kids[i - 1]!.getBoundingClientRect();
    return {
      up: front.top - back.top,
      down: back.bottom - front.bottom,
      left: front.left - back.left,
      right: back.right - front.right,
      height: back.height,
    };
  }, n);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-demo="large"]').waitFor();
});

test("a 480x448 deck still peeks — the case that used to collapse", async ({
  page,
}) => {
  const second = await peekOf(page, "large", 2);
  const third = await peekOf(page, "large", 3);

  // At the default 5% per step a 448px card peeks ~22px then ~45px. Assert
  // loosely on the figure, strictly on the ordering: a regression to fixed
  // distances puts both of these below zero.
  expect(second.up).toBeGreaterThan(15);
  expect(third.up).toBeGreaterThan(second.up + 10);

  // Upward only — the other three edges stay tucked behind the front card.
  expect(second.down).toBeLessThanOrEqual(0);
  expect(second.left).toBeLessThanOrEqual(0);
  expect(second.right).toBeLessThanOrEqual(0);
});

test("the peek is proportional — the same share of a small and a large card", async ({
  page,
}) => {
  // `size-md` (96px tall) and `large` (448px) both run the default 5%, so the
  // peek as a FRACTION of card height has to match. That equality IS the fix:
  // one declaration, any card size.
  const small = await peekOf(page, "size-md", 3);
  const large = await peekOf(page, "large", 3);

  expect(small.up / small.height).toBeCloseTo(large.up / large.height, 2);
  expect(small.up).toBeGreaterThan(0);
});

test("the size ramp widens the fan monotonically", async ({ page }) => {
  const ups: number[] = [];
  for (const size of ["xs", "sm", "md", "lg", "xl"]) {
    ups.push((await peekOf(page, `size-${size}`, 3)).up);
  }
  expect(ups[0]).toBeGreaterThan(0);
  for (let i = 1; i < ups.length; i++) {
    expect(ups[i]!, `${i} should out-fan ${i - 1}`).toBeGreaterThan(ups[i - 1]!);
  }
});

test("--stack-peek is overridable per deck", async ({ page }) => {
  // Same 448px card, 4% against the default 5%.
  const tuned = await peekOf(page, "large-tuned", 3);
  const dflt = await peekOf(page, "large", 3);

  expect(tuned.up).toBeGreaterThan(0);
  expect(tuned.up).toBeLessThan(dflt.up);
  expect(tuned.up / dflt.up).toBeCloseTo(0.8, 1);
});

test("every direction peeks on its own axis", async ({ page }) => {
  const cases = [
    { demo: "dir-top", edge: "up" },
    { demo: "dir-bottom", edge: "down" },
    { demo: "dir-start", edge: "left" },
    { demo: "dir-end", edge: "right" },
  ] as const;

  for (const { demo, edge } of cases) {
    const p = await peekOf(page, demo, 3);
    expect(p[edge], `${demo} should peek ${edge}`).toBeGreaterThan(0);
  }
});
