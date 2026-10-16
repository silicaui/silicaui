import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * `table-stack`'s contract is about real layout, so real layout is where it is
 * proven. The CSS probe (packages/silicaui/scripts/verify-table-stack.mjs)
 * proves the rules reach the stylesheet; this proves what they do to a list
 * shaped like the ones that ran past their panes: a name cell with a 224px
 * floor (`w-full max-w-0 min-w-56`), then nowrap cells for the amount, the
 * state and the row's own button.
 *
 * The narrow pane is 343px, the width at which those lists hid their state and
 * their button. The wide pane holds the same list and must stay a table.
 */

const pane = (page: Page, demo: string) => page.locator(`[data-demo="${demo}"]`);
const box = async (l: Locator) => (await l.boundingBox())!;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await pane(page, "stack-narrow").locator("table").waitFor();
});

test("in a 343px pane, the list fits: nothing runs past the right edge", async ({ page }) => {
  const p = pane(page, "stack-narrow");
  const wrapper = p.locator(".table-scroll");
  const { scroll, client } = await wrapper.evaluate((el) => ({
    scroll: el.scrollWidth,
    client: el.clientWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(client);

  const edge = await box(p);
  for (const cell of await p.locator("tbody td, tfoot td").all()) {
    if (!(await cell.isVisible())) continue;
    const b = await box(cell);
    expect(b.x + b.width).toBeLessThanOrEqual(edge.x + edge.width + 0.5);
  }
});

test("every row's state and button are on screen inside the pane", async ({ page }) => {
  const p = pane(page, "stack-narrow");
  const edge = await box(p);
  const buttons = p.locator("tbody button");
  await expect(buttons).toHaveCount(3);
  for (const target of [...(await buttons.all()), ...(await p.locator("tbody .badge").all())]) {
    await expect(target).toBeVisible();
    const b = await box(target);
    expect(b.x).toBeGreaterThanOrEqual(edge.x);
    expect(b.x + b.width).toBeLessThanOrEqual(edge.x + edge.width + 0.5);
  }
});

test("a stacked row puts the name on its own line and the button at the end", async ({ page }) => {
  const p = pane(page, "stack-narrow");
  const row = p.locator("tbody tr").first();
  const rowBox = await box(row);
  const nameBox = await box(row.locator("td").first());
  const buttonBox = await box(row.locator("button"));
  const pad = await row.evaluate((el) => parseFloat(getComputedStyle(el).paddingInlineEnd));

  // The name cell spans the row's content box, not its 224px floor.
  expect(nameBox.width).toBeGreaterThan(rowBox.width - 2 * pad - 1);
  // Everything else sits below it.
  expect(buttonBox.y).toBeGreaterThanOrEqual(nameBox.y + nameBox.height - 0.5);
  // The button ends where the row's content ends.
  expect(buttonBox.x + buttonBox.width).toBeCloseTo(rowBox.x + rowBox.width - pad, 0);
});

test("the header leaves the screen but stays in the page for a screen reader", async ({ page }) => {
  const thead = pane(page, "stack-narrow").locator("thead");
  const b = await box(thead);
  expect(b.width).toBeLessThanOrEqual(1);
  expect(b.height).toBeLessThanOrEqual(1);
  const style = await thead.evaluate((el) => {
    const s = getComputedStyle(el);
    return { display: s.display, visibility: s.visibility };
  });
  expect(style.display).not.toBe("none");
  expect(style.visibility).not.toBe("hidden");
});

test("a cell with data-label shows its label only while stacked", async ({ page }) => {
  const label = (demo: string) =>
    pane(page, demo)
      .locator('tbody td[data-label="Due"]')
      .first()
      .evaluate((el) => getComputedStyle(el, "::before").content);
  expect(await label("stack-narrow")).toBe('"Due"');
  expect(await label("stack-wide")).toBe("none");
});

test("in a wide pane, the same list is an ordinary table", async ({ page }) => {
  const p = pane(page, "stack-wide");
  const display = await p.locator("table").evaluate((el) => getComputedStyle(el).display);
  expect(display).toBe("table");
  const head = await box(p.locator("thead th").first());
  expect(head.height).toBeGreaterThan(1);
  // One row of cells per record: the button shares the name's line.
  const row = p.locator("tbody tr").first();
  const nameBox = await box(row.locator("td").first());
  const buttonBox = await box(row.locator("button"));
  expect(buttonBox.y).toBeLessThan(nameBox.y + nameBox.height);
});

test("the stack holds in the dark theme", async ({ page }) => {
  await page.evaluate(() => (document.documentElement.dataset.theme = "dark"));
  const p = pane(page, "stack-narrow");
  const { scroll, client } = await p.locator(".table-scroll").evaluate((el) => ({
    scroll: el.scrollWidth,
    client: el.clientWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(client);
  // The footer's rule is a token, so it follows the theme.
  const rule = await p.locator("tfoot").evaluate((el) => getComputedStyle(el).borderTopColor);
  await page.evaluate(() => (document.documentElement.dataset.theme = "light"));
  const light = await p.locator("tfoot").evaluate((el) => getComputedStyle(el).borderTopColor);
  expect(rule).not.toBe(light);
});
