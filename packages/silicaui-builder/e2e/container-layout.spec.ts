import { test, expect, type Page } from "@playwright/test";

/**
 * Container layout — the Inspector's parent-side flex/grid controls (Design tab,
 * Layout group). Guards three things the class-string alone can't prove:
 *   1. Display GATES the child-arrangement rows (they're inert on a plain block).
 *   2. Picking a value actually PAINTS on the canvas — asserting computed style,
 *      not `class`, is what proves the utility survived the `@source` safelist
 *      scan (canvas HTML is generated at runtime, so Tailwind never sees it).
 *   3. Switching display drops the classes the new display can't honor.
 */

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  return errors;
}

async function ready(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

async function insert(page: Page, key: string): Promise<void> {
  await page.getByRole("button", { name: "Insert" }).click();
  await page.locator(`[data-insert-key="${key}"]`).click();
}

/**
 * Locate the just-inserted node by its own `data-sui-id`. Selection is React
 * state (no marker class), and the test mutates the very classes that would
 * otherwise identify it — so pin the id up front and locate off that.
 */
async function insertedNode(page: Page, key: string) {
  const before = await page.locator(".sui-canvas [data-sui-id]").evaluateAll((els) =>
    els.map((e) => e.getAttribute("data-sui-id")),
  );
  await insert(page, key);
  const id = await page.waitForFunction((seen: (string | null)[]) => {
    const ids = [...document.querySelectorAll(".sui-canvas [data-sui-id]")].map((e) => e.getAttribute("data-sui-id"));
    return ids.find((i) => !seen.includes(i)) ?? false;
  }, before);
  return page.locator(`.sui-canvas [data-sui-id="${await id.jsonValue()}"]`);
}

test("container layout: display gates the flex rows, and each value paints on the canvas", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  // A Row block is a flex container already — the exact case that previously had
  // no UI to change its justification once inserted.
  const row = await insertedNode(page, "row");
  await expect(row).toHaveClass(/\bflex\b/);

  // Display reads back out of the class set, so the gated rows are already open.
  await expect(page.getByTestId("display-flex")).toHaveClass(/btn-primary/);
  await expect(page.getByTestId("row-justify")).toBeVisible();
  await expect(page.getByTestId("row-wrap")).toBeVisible();

  // Every justify value paints. `space-around`/`space-evenly` are the ones most
  // likely to be missing from a hand-written safelist, so assert all six.
  const JUSTIFY: ReadonlyArray<[string, string]> = [
    ["Start", "flex-start"],
    ["Center", "center"],
    ["End", "flex-end"],
    ["Between", "space-between"],
    ["Around", "space-around"],
    ["Evenly", "space-evenly"],
  ];
  for (const [label, computed] of JUSTIFY) {
    await page.getByTestId("row-justify").getByRole("button", { name: label, exact: true }).click();
    await expect(row).toHaveCSS("justify-content", computed);
  }

  // Gap + direction + wrap paint too.
  await page.getByTestId("row-gap").getByRole("button", { name: "8", exact: true }).click();
  await expect(row).toHaveCSS("column-gap", "32px");
  await page.getByTestId("row-direction").getByRole("button", { name: "Column", exact: true }).click();
  await expect(row).toHaveCSS("flex-direction", "column");
  await page.getByTestId("row-wrap").getByRole("button", { name: "Wrap", exact: true }).click();
  await expect(row).toHaveCSS("flex-wrap", "wrap");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("flex child sizing: Fill/Grow/Fixed paint on a child inside a flex row", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const row = await insertedNode(page, "row");
  await expect(row).toHaveCSS("display", "flex");
  // Two children, so "Fill" has something to take space FROM — flex-1 on an
  // only child is indistinguishable from no rule at all. The second insert is
  // the one we style.
  await insert(page, "text");
  const child = await insertedNode(page, "text");

  await page.getByTestId("row-self-size").getByRole("button", { name: "Fill", exact: true }).click();
  await expect(child).toHaveClass(/\bflex-1\b/);
  await expect(child).toHaveCSS("flex-grow", "1");
  await expect(child).toHaveCSS("flex-basis", "0%");

  // Grow and Fill both set flex-grow, so the class swap is what distinguishes
  // them — assert basis, which is where they actually differ.
  await page.getByTestId("row-self-size").getByRole("button", { name: "Grow", exact: true }).click();
  await expect(child).not.toHaveClass(/\bflex-1\b/);
  await expect(child).toHaveCSS("flex-grow", "1");
  await expect(child).toHaveCSS("flex-basis", "auto");

  await page.getByTestId("row-self-size").getByRole("button", { name: "Fixed", exact: true }).click();
  await expect(child).toHaveCSS("flex-grow", "0");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("padding: editing one axis expands the shorthand instead of dropping the other", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const node = await insertedNode(page, "container");

  // Start uniform.
  await page.getByTestId("row-padding").getByRole("button", { name: "8", exact: true }).click();
  await expect(node).toHaveCSS("padding-top", "32px");
  await expect(node).toHaveCSS("padding-left", "32px");

  // Now set X only. The uniform `p-8` must expand so the UNTOUCHED vertical
  // padding survives at 8 — this is the regression that would silently zero it.
  await page.getByTestId("row-padding-x").getByRole("button", { name: "2", exact: true }).click();
  await expect(node).toHaveCSS("padding-left", "8px");
  await expect(node).toHaveCSS("padding-top", "32px");
  await expect(node).not.toHaveClass(/\bp-8\b/);
  await expect(node).toHaveClass(/\bpy-8\b/);

  // The palette bakes py-12/py-16 on sections, so the scale must reach them.
  await page.getByTestId("row-padding-y").getByRole("button", { name: "16", exact: true }).click();
  await expect(node).toHaveCSS("padding-top", "64px");
  await expect(node).toHaveCSS("padding-left", "8px");

  // Going back to uniform clears both axes rather than layering on top of them.
  await page.getByTestId("row-padding").getByRole("button", { name: "4", exact: true }).click();
  await expect(node).not.toHaveClass(/\bpx-|\bpy-/);
  await expect(node).toHaveCSS("padding-top", "16px");
  await expect(node).toHaveCSS("padding-left", "16px");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("container layout: grid columns paint, and switching display drops inert classes", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const node = await insertedNode(page, "row");

  // flex → grid: the flex-only classes the new display can't honor are dropped,
  // and the grid-only row appears in their place.
  await page.getByRole("button", { name: "Wrap", exact: true }).click();
  await expect(node).toHaveClass(/\bflex-wrap\b/);
  await page.getByTestId("display-grid").click();
  await expect(node).not.toHaveClass(/\bflex-wrap\b/);
  await expect(node).not.toHaveClass(/\bflex-row\b/);
  await expect(page.getByTestId("row-columns")).toBeVisible();

  await page.getByTestId("row-columns").getByRole("button", { name: "3", exact: true }).click();
  await expect(node).toHaveCSS("grid-template-columns", /^\S+ \S+ \S+$/);

  // grid → block: the whole child-arrangement vocab goes, and the rows close.
  await page.getByTestId("display-block").click();
  await expect(node).not.toHaveClass(/\bgrid-cols-3\b/);
  await expect(node).not.toHaveClass(/\bjustify-|\bitems-|\bgap-/);
  await expect(page.getByTestId("row-justify")).toBeHidden();
  await expect(page.getByTestId("row-columns")).toBeHidden();

  expect(errors, errors.join("\n")).toHaveLength(0);
});
