import { test, expect, type Page } from "@playwright/test";

/**
 * Breadth-wave guard for the palette gap-fill (Overlay/Form/Data/Nav/Media/
 * Layout/Content/Feedback additions — the 176-component audit gap). Mirrors
 * `catalog.spec.ts`'s contract: every new palette entry must insert and
 * render through the SAME def→palette→expand→Canvas path with zero React
 * warnings. A handful of the trickiest composites (Dialog family, Popover,
 * TreeView, Wizard, Carousel, AppShell) get closer structural assertions;
 * everything else gets the broad "inserted something real, no console noise"
 * smoke check — with 74 new entries, exhaustive per-item assertions would be
 * mostly-duplicated boilerplate for little extra confidence.
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
  await page.goto("/?persist=0");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

/** Deselect first: click-to-insert targets the CURRENT selection, and the
 *  previous item's freshly-inserted (now-selected) node may be a leaf, or —
 *  for a few registry entries flagged `container: true` despite an
 *  `expand()` that discards authored children (e.g. NumberField) — may
 *  silently swallow the next insert into the document tree without ever
 *  rendering it. Deselecting lands every item at the page root instead, same
 *  as a real user clicking the palette with nothing selected. */
async function insert(page: Page, key: string): Promise<void> {
  await page.keyboard.press("Escape");
  await page.locator(`[data-insert-key="${key}"]`).click();
}

test("Dialog family (Dialog/Drawer/AlertDialog) insert with a real trigger + visible content, no button-in-button", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  await page.getByRole("button", { name: "Insert" }).click();
  const canvas = page.locator(".sui-canvas");

  await insert(page, "dialog");
  // The trigger IS the button (no nested <button>) — exactly one button renders,
  // and it carries the visible label directly (regression guard for the
  // DialogTrigger/Button double-nesting bug found during this pass).
  const dialogTrigger = canvas.locator("button", { hasText: "Open dialog" }).first();
  await expect(dialogTrigger).toBeVisible();
  await expect(dialogTrigger.locator("button")).toHaveCount(0);
  // The content panel auto-reveals on canvas (same rule as Collapse's panel).
  await expect(canvas.getByText("Dialog title").first()).toBeVisible();

  await insert(page, "drawer");
  await expect(canvas.locator("button", { hasText: "Open drawer" }).first().locator("button")).toHaveCount(0);

  await insert(page, "alert-dialog");
  await expect(canvas.locator("button", { hasText: "Delete account" }).first().locator("button")).toHaveCount(0);
  await expect(canvas.getByText("Delete your account?").first()).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("Popover / Tooltip / CommandPalette / PreviewCard insert and their content is visible on canvas", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  await page.getByRole("button", { name: "Insert" }).click();
  const canvas = page.locator(".sui-canvas");

  await insert(page, "popover");
  await expect(canvas.locator("button", { hasText: "Open popover" }).first().locator("button")).toHaveCount(0);
  await expect(canvas.getByText("Popover title").first()).toBeVisible();

  await insert(page, "tooltip");
  await expect(canvas.getByText("Helpful tooltip text").first()).toBeVisible();

  await insert(page, "command-palette");
  await expect(canvas.locator('input[placeholder="Type a command or search…"]').first()).toBeVisible();

  await insert(page, "preview-card");
  await expect(canvas.getByText("Design system & component kit").first()).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("TreeView / Wizard / Collapsible insert with correct nested structure", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  await page.getByRole("button", { name: "Insert" }).click();
  const canvas = page.locator(".sui-canvas");

  await insert(page, "tree-view");
  const tree = canvas.locator(".tree[data-sui-id]").first();
  await expect(tree).toBeVisible();
  // 2 top-level nodes (Overview, Components) + 2 nested inside Components'
  // (defaultExpanded) group (Button, Card) = 4.
  await expect(tree.locator(".tree-item")).toHaveCount(4);

  await insert(page, "wizard");
  const wizard = canvas.locator(".wizard[data-sui-id]").first();
  await expect(wizard).toBeVisible();
  await expect(wizard.locator(".wizard-step")).toHaveCount(3);
  await expect(wizard.getByText("Back")).toBeVisible();
  await expect(wizard.getByText("Next")).toBeVisible();

  await insert(page, "collapsible");
  await expect(canvas.getByText("Advanced settings").first()).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("Carousel / AppShell insert with correct nested structure", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  await page.getByRole("button", { name: "Insert" }).click();
  const canvas = page.locator(".sui-canvas");

  await insert(page, "carousel");
  const carousel = canvas.locator(".carousel-root[data-sui-id]").first();
  await expect(carousel).toBeVisible();
  await expect(carousel.locator(".carousel-item")).toHaveCount(3);

  await insert(page, "app-shell");
  const shell = canvas.locator(".app-shell[data-sui-id]").first();
  await expect(shell).toBeVisible();
  await expect(shell.locator(".app-shell-sidebar")).toHaveCount(1);
  await expect(shell.locator(".app-shell-header")).toHaveCount(1);
  await expect(shell.locator(".app-shell-main")).toHaveCount(1);
  await expect(shell.locator(".app-shell-footer")).toHaveCount(1);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

// Every other new entry: a broad smoke pass — click insert, confirm at least
// one new node landed on the canvas, and that nothing threw. Grouped into
// batches (not one giant list) so a failure narrows down which corner broke.
const SMOKE_BATCHES: Record<string, string[]> = {
  "form composites": ["checkbox-group", "radio-group", "toggle-group", "input-group", "fieldset", "date-picker", "date-range-picker", "dropzone", "file-upload"],
  "form standalone": [
    "combobox", "autocomplete", "multi-select", "number-field", "range", "slider", "switch", "rating",
    "phone-input", "search-input", "password-input", "pin-input", "label-atom", "date-input",
    "date-range-input", "date-time-input", "time-input", "calendar", "theme-controller",
  ],
  "nav additions": ["toolbar", "dock", "menubar", "navigation-menu", "outline"],
  "data additions": ["stats", "timestamp", "metadata-list", "list", "avatar-group"],
  "layout additions": ["card", "clickable-card", "hero", "footer-primitive", "scroll-area", "overflow-list", "join"],
  "content additions": ["icon", "prose", "blockquote", "display"],
  "feedback additions": ["empty-state", "meter", "radial-progress", "indicator", "swap"],
  "media": ["lightbox", "mockup-window", "mockup-browser", "mockup-code", "mockup-phone", "mask", "diff", "overlay"],
};

for (const [label, keys] of Object.entries(SMOKE_BATCHES)) {
  test(`smoke: ${label} insert without React warnings`, async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    await page.getByRole("button", { name: "Insert" }).click();
    const canvas = page.locator(".sui-canvas");

    for (const key of keys) {
      const before = await canvas.locator("[data-sui-id]").count();
      await expect(page.locator(`[data-insert-key="${key}"]`), `palette row missing for "${key}"`).toHaveCount(1);
      await insert(page, key);
      await expect
        .poll(() => canvas.locator("[data-sui-id]").count(), { message: `"${key}" inserted nothing` })
        .toBeGreaterThan(before);
    }

    expect(errors, errors.join("\n")).toHaveLength(0);
  });
}
