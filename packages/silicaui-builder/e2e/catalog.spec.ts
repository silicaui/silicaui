import { test, expect, type Page } from "@playwright/test";

/**
 * Breadth-wave guard (nav / feedback / data families): every new component is a
 * `ComponentDef` that lowers to plain elements, so inserting it from the palette
 * must render correct structure on the canvas through the SAME macro-expansion
 * path — with ZERO per-component Canvas code and zero React warnings. This locks
 * that the def→palette→expand→Canvas chain holds for the whole catalog.
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

test("every nav / feedback / data component inserts and renders its structure", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  // Each macro ROOT (a block/flex element) is asserted visible; inner structure
  // is asserted by count/text/attr — the contract is correct lowering, and some
  // component CSS (inline-flex metric boxes, closed <details>) trips Playwright's
  // pixel-visibility heuristic on sub-parts even though they render correctly.

  // ── navigation ──
  await insert(page, "breadcrumb");
  const crumb = canvas.locator("nav.breadcrumb[data-sui-id]").first();
  await expect(crumb).toBeVisible();
  await expect(crumb.locator("ol > li > a")).toHaveCount(3);
  await expect(crumb.locator('a[aria-current="page"]')).toHaveCount(1);

  await insert(page, "menu");
  const menu = canvas.locator("ul.menu[data-sui-id]").first();
  await expect(menu).toBeVisible();
  await expect(menu.locator("li > a")).toHaveCount(3);

  await insert(page, "steps");
  const steps = canvas.locator("ul.steps[data-sui-id]").first();
  await expect(steps).toBeVisible();
  await expect(steps.locator("li.step")).toHaveCount(3);
  expect(await steps.locator("li.step-primary").count()).toBeGreaterThanOrEqual(1);

  await insert(page, "pagination");
  const pag = canvas.locator("div.join[data-sui-id]").first();
  await expect(pag).toBeVisible();
  await expect(pag.locator("button")).toHaveCount(3);

  await insert(page, "navbar");
  const navbar = canvas.locator("div.navbar[data-sui-id]").first();
  await expect(navbar).toBeVisible();
  await expect(navbar.locator(".navbar-start")).toHaveCount(1);

  // ── feedback ──
  await insert(page, "alert");
  await expect(canvas.locator('div.alert[role="alert"][data-sui-id]').first()).toBeVisible();

  await insert(page, "progress");
  const progress = canvas.locator("div.progress[data-sui-id]").first();
  await expect(progress).toBeVisible();
  await expect(progress.locator(".progress-bar")).toHaveCount(1);

  await insert(page, "loading");
  await expect(canvas.locator("span.loading[data-sui-id]").first()).toBeVisible();

  await insert(page, "skeleton");
  await expect(canvas.locator("div.skeleton[data-sui-id]").first()).toBeVisible();

  await insert(page, "kbd");
  await expect(canvas.locator("kbd.kbd[data-sui-id]").first()).toHaveText("Ctrl");

  // ── data ──
  await insert(page, "stat");
  const stat = canvas.locator("div.stats[data-sui-id]").first();
  await expect(stat).toBeVisible();
  await expect(stat.locator(".stat .stat-value")).toHaveText("1,204");

  await insert(page, "avatar");
  const avatar = canvas.locator("div.avatar[data-sui-id]").first();
  await expect(avatar).toBeVisible();
  await expect(avatar.locator("img")).toHaveCount(1);

  // Collapse lowers to a native closed <details>; Playwright reports a closed
  // <details> element as "hidden", so assert the (user-visible) summary text and
  // that the body lowered, rather than the element's pixel-visibility.
  await insert(page, "collapse");
  const coll = canvas.locator("details.collapse[data-sui-id]").first();
  await expect(coll).toHaveCount(1);
  await expect(coll.locator("summary.collapse-title")).toHaveText("Click to expand");
  await expect(coll.locator(".collapse-content")).toHaveCount(1);

  await insert(page, "timeline");
  const timeline = canvas.locator("ul.timeline[data-sui-id]").first();
  await expect(timeline).toBeVisible();
  expect(await timeline.locator("> li").count()).toBeGreaterThanOrEqual(2);

  await insert(page, "table");
  const table = canvas.locator("table.table[data-sui-id]").first();
  await expect(table).toBeVisible();
  await expect(table.locator("thead th")).toHaveCount(2);
  await expect(table.locator("tbody td")).toHaveCount(4);

  // The whole catalog run must be free of React warnings / render errors.
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("the insert palette is searchable and Enter inserts the top match", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  await page.getByRole("button", { name: "Insert" }).click();
  const search = page.getByLabel("Search the insert catalog");

  // Fuzzy query collapses the whole catalog to ranked matches; the pricing block
  // is the strongest hit for "pricing" and sorts to the top.
  await search.fill("pricing");
  const rows = page.locator("[data-insert-key]");
  await expect(rows.first()).toHaveAttribute("data-insert-key", "block:pricing_tiers");
  // A non-matching primitive is filtered out entirely.
  await expect(page.locator('[data-insert-key="input"]')).toHaveCount(0);

  // Enter inserts the top-ranked match without touching the mouse.
  await search.press("Enter");
  await expect(canvas.getByText("Simple, transparent pricing")).toBeVisible();

  // Clearing the query restores the grouped browse view (group headings return).
  await search.fill("");
  await expect(page.getByRole("heading", { name: "Layout" })).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("editing a list-prop (Breadcrumb items) rewrites the rendered items", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  await insert(page, "breadcrumb");
  const crumb = canvas.locator("nav.breadcrumb[data-sui-id]").first();
  await crumb.click(); // select
  await page.getByRole("button", { name: "Settings" }).click(); // props live in Settings

  // The Items row is a newline textarea; four lines → four <li>.
  const items = page.locator("div.mb-2", { hasText: "Items" }).locator("textarea");
  await items.fill("One\nTwo\nThree\nFour");
  await items.blur(); // commit
  await expect(crumb.locator("ol > li")).toHaveCount(4);
  await expect(crumb.locator('a[aria-current="page"]')).toHaveText("Four");

  const changes = await page.evaluate(
    () => (window as unknown as { __changeCount?: number }).__changeCount ?? 0,
  );
  expect(changes).toBeGreaterThanOrEqual(1);
  expect(errors, errors.join("\n")).toHaveLength(0);
});
