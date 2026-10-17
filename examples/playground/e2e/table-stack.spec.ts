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

// ---------------------------------------------------------------------------
// Hidden cells and a selection checkbox.
//
// A list often hides a column below a pane width with Tailwind's `hidden` plus a
// container variant (`hidden @xl:table-cell`). When that column is the FIRST
// cell, `:first-child` lands on a cell nobody can see and the name loses its own
// line; when it is the LAST, the button is no longer pushed to the end. And a
// first cell holding only a selection checkbox took a whole line to itself.
// ---------------------------------------------------------------------------

/** The row's content box: its border box less its inline padding. */
async function contentBox(row: Locator) {
  const b = await box(row);
  const pad = await row.evaluate((el) => {
    const s = getComputedStyle(el);
    return { start: parseFloat(s.paddingInlineStart), end: parseFloat(s.paddingInlineEnd) };
  });
  return { left: b.x + pad.start, right: b.x + b.width - pad.end };
}

/** The visible cells of a row, in order. */
async function shownCells(row: Locator) {
  const out: Locator[] = [];
  for (const cell of await row.locator(":scope > td").all()) if (await cell.isVisible()) out.push(cell);
  return out;
}

/** The space between the bottom of the name's line and the top of the next line. */
async function gapUnderName(row: Locator, name: Locator) {
  const nameBox = await box(name);
  let next = Infinity;
  for (const cell of await shownCells(row)) {
    const b = await box(cell);
    if (b.y >= nameBox.y + nameBox.height - 0.5) next = Math.min(next, b.y);
  }
  return next - (nameBox.y + nameBox.height);
}

test("a hidden first cell does not take the name's line", async ({ page }) => {
  const p = pane(page, "stack-hidden-narrow");
  for (const row of await p.locator("tbody tr").all()) {
    const [when, name] = await row.locator(":scope > td").all();
    await expect(when).toBeHidden();
    const { left, right } = await contentBox(row);
    const nameBox = await box(name);
    expect(nameBox.x).toBeCloseTo(left, 0);
    expect(nameBox.x + nameBox.width).toBeCloseTo(right, 0);
    for (const cell of (await shownCells(row)).slice(1)) {
      expect((await box(cell)).y).toBeGreaterThanOrEqual(nameBox.y + nameBox.height - 0.5);
    }
  }
});

test("a hidden last cell does not keep the button from the end", async ({ page }) => {
  const p = pane(page, "stack-hidden-narrow");
  for (const row of await p.locator("tbody tr").all()) {
    await expect(row.locator(":scope > td").last()).toBeHidden();
    const { right } = await contentBox(row);
    const b = await box(row.locator("button"));
    expect(b.x + b.width).toBeCloseTo(right, 0);
  }
});

test("the `hidden` attribute is skipped the same way as the class", async ({ page }) => {
  const p = pane(page, "stack-hidden-narrow");
  const row = p.locator("tbody tr").first();
  // Swap the class for the attribute on both hidden cells of the row.
  await row.evaluate((tr) => {
    for (const td of [tr.firstElementChild!, tr.lastElementChild!]) {
      td.classList.remove("hidden");
      td.setAttribute("hidden", "");
    }
  });
  const [, name] = await row.locator(":scope > td").all();
  const { left, right } = await contentBox(row);
  const nameBox = await box(name);
  expect(nameBox.x).toBeCloseTo(left, 0);
  expect(nameBox.x + nameBox.width).toBeCloseTo(right, 0);
  const b = await box(row.locator("button"));
  expect(b.x + b.width).toBeCloseTo(right, 0);
});

test("in a wide pane, the columns that were hidden show and it is a table", async ({ page }) => {
  const p = pane(page, "stack-hidden-wide");
  expect(await p.locator("table").evaluate((el) => getComputedStyle(el).display)).toBe("table");
  const row = p.locator("tbody tr").first();
  await expect(row.locator(":scope > td").first()).toBeVisible();
  await expect(row.locator(":scope > td").last()).toBeVisible();
});

test("a selection checkbox stays on the name's line, and the name takes the rest of it", async ({ page }) => {
  const plain = pane(page, "stack-narrow").locator("tbody tr").first();
  const plainGap = await gapUnderName(plain, plain.locator(":scope > td").first());

  const p = pane(page, "stack-select-narrow");
  for (const row of await p.locator("tbody tr").all()) {
    const [select, name] = await row.locator(":scope > td").all();
    const { left, right } = await contentBox(row);
    const selectBox = await box(select);
    const nameBox = await box(name);
    const checkbox = await box(select.locator("input"));
    // The checkbox starts the row and sits beside the name, centered on its line.
    expect(selectBox.x).toBeCloseTo(left, 0);
    expect(nameBox.x).toBeGreaterThan(selectBox.x + selectBox.width - 0.5);
    expect(checkbox.y).toBeGreaterThanOrEqual(nameBox.y - 0.5);
    expect(checkbox.y + checkbox.height).toBeLessThanOrEqual(nameBox.y + nameBox.height + 0.5);
    // The name fills what the checkbox leaves of the line.
    expect(nameBox.x + nameBox.width).toBeCloseTo(right, 0);
    // Everything else is below that line, as far below it as in a plain row.
    for (const cell of (await shownCells(row)).slice(2)) {
      expect((await box(cell)).y).toBeGreaterThanOrEqual(nameBox.y + nameBox.height - 0.5);
    }
    expect(await gapUnderName(row, name)).toBeCloseTo(plainGap, 0);
    // And the button is still at the end.
    const b = await box(row.locator("button"));
    expect(b.x + b.width).toBeCloseTo(right, 0);
  }
});

test("a hidden selection cell leaves the name its own line", async ({ page }) => {
  const p = pane(page, "stack-select-hidden-narrow");
  for (const row of await p.locator("tbody tr").all()) {
    const [select, name] = await row.locator(":scope > td").all();
    await expect(select).toBeHidden();
    const { left, right } = await contentBox(row);
    const nameBox = await box(name);
    expect(nameBox.x).toBeCloseTo(left, 0);
    expect(nameBox.x + nameBox.width).toBeCloseTo(right, 0);
  }
});

test("a cell that marks itself data-stack=select is a selection cell too", async ({ page }) => {
  const p = pane(page, "stack-select-narrow");
  const row = p.locator("tbody tr").first();
  // Wrap the checkbox in a label, so only the opt-in can say what the cell is.
  await row.evaluate((tr) => {
    const td = tr.firstElementChild as HTMLElement;
    const label = document.createElement("label");
    label.append(td.querySelector("input")!, document.createElement("span"));
    td.replaceChildren(label);
    td.dataset.stack = "select";
  });
  const [select, name] = await row.locator(":scope > td").all();
  const { right } = await contentBox(row);
  const selectBox = await box(select);
  const nameBox = await box(name);
  expect(nameBox.x).toBeGreaterThan(selectBox.x + selectBox.width - 0.5);
  expect(nameBox.y).toBeLessThan(selectBox.y + selectBox.height);
  expect(nameBox.x + nameBox.width).toBeCloseTo(right, 0);
});

test("the new lists fit their 343px panes too", async ({ page }) => {
  for (const demo of ["stack-hidden-narrow", "stack-select-narrow", "stack-select-hidden-narrow"]) {
    const p = pane(page, demo);
    const { scroll, client } = await p.locator(".table-scroll").evaluate((el) => ({
      scroll: el.scrollWidth,
      client: el.clientWidth,
    }));
    expect(scroll, demo).toBeLessThanOrEqual(client);
  }
});

// ---------------------------------------------------------------------------
// Tailwind's own `table` utility.
//
// `table` is also a Tailwind core utility (`.table { display: table }`). An app
// whose sources say "table" gets it, in the utilities layer, and that layer
// outranks the plugin's rules. If it beats the stacked table's `display: block`,
// the rows still wrap, but the table grows to fit its longest unbroken line: a
// list of long, truncated names runs past its pane and scrolls sideways. This
// playground's sources say "table", so its stylesheet has the utility.
// ---------------------------------------------------------------------------

/** The display Tailwind's `table` utility gives a plain `<div class="table">`. */
async function tableUtilityDisplay(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement("div");
    probe.className = "table";
    document.body.append(probe);
    const display = getComputedStyle(probe).display;
    probe.remove();
    return display;
  });
}

test("a stacked table is a block, even with Tailwind's `table` utility on the page", async ({ page }) => {
  // Without the utility there is no collision to test, so make sure it is there.
  expect(await tableUtilityDisplay(page)).toBe("table");
  for (const demo of ["stack-narrow", "stack-hidden-narrow", "stack-select-narrow", "stack-long-narrow"]) {
    const display = await pane(page, demo)
      .locator("table")
      .evaluate((el) => getComputedStyle(el).display);
    expect(display, demo).toBe("block");
  }
});

test("names longer than the pane truncate, and the list still fits its 343px pane", async ({ page }) => {
  expect(await tableUtilityDisplay(page)).toBe("table");
  const p = pane(page, "stack-long-narrow");
  const wrapper = p.locator(".table-scroll");
  const { scroll, client } = await wrapper.evaluate((el) => ({
    scroll: el.scrollWidth,
    client: el.clientWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(client);
  // The table is no wider than its pane.
  const edge = await box(p);
  const table = await box(p.locator("table"));
  expect(table.x + table.width).toBeLessThanOrEqual(edge.x + edge.width + 0.5);
  // Each name is cut short with an ellipsis, and the button is on screen.
  for (const row of await p.locator("tbody tr").all()) {
    const name = row.locator(":scope > td").first().locator("div").first();
    const cut = await name.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(cut).toBe(true);
    const b = await box(row.locator("button"));
    expect(b.x + b.width).toBeLessThanOrEqual(edge.x + edge.width + 0.5);
  }
});

// The stacked `display: block` is important, so it must step aside for a table
// that is hidden. The bare `hidden` class is not tried here: on this page it
// cannot hide ANY `<table class="table">`, stacked or not, because Tailwind
// emits `table` after `hidden` and the two weigh the same. The CSS probe checks
// that case in a build without the `table` utility.
test("a stacked table hidden with a `hidden` variant or the attribute stays hidden", async ({ page }) => {
  const table = pane(page, "stack-narrow").locator("table");
  const display = () => table.evaluate((el) => getComputedStyle(el).display);

  // This page is wider than `md`, so `md:hidden` applies.
  await table.evaluate((el) => el.classList.add("md:hidden"));
  expect(await display()).toBe("none");
  await table.evaluate((el) => el.classList.remove("md:hidden"));
  expect(await display()).not.toBe("none");

  // The important form of the class.
  await table.evaluate((el) => el.classList.add("hidden!"));
  expect(await display()).toBe("none");
  await table.evaluate((el) => el.classList.remove("hidden!"));
  expect(await display()).not.toBe("none");

  await table.evaluate((el) => el.setAttribute("hidden", ""));
  expect(await display()).toBe("none");
});
