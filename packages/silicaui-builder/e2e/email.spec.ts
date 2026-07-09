import { test, expect, type Page } from "@playwright/test";

/**
 * The email builder's core loop: render the seeded document, select/insert/edit
 * blocks on the canvas, move/duplicate/delete via the Inspector toolbar, and
 * export real table-based HTML. Mounted via `?editor=email` in the shared
 * harness (see `harness/main.tsx`), which exposes the same `window.__ready` /
 * `window.__changeCount` bus the site builder's specs use, plus `__exported`
 * (set from `EmailBuilder`'s `onExport`).
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
  await page.goto("/?editor=email&persist=0");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-email-canvas");
}

/** The left rail defaults to the Layers tab (the new Navigator) — switch to
 *  Insert before looking up a `data-insert-key` palette row, same as the site
 *  builder's specs do. */
async function openInsert(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Insert", exact: true }).click();
}

test("renders the seeded section + text block with no error", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  await expect(canvas.locator("[data-sui-id]").first()).toBeVisible();
  expect(await canvas.locator("[data-sui-id]").count()).toBeGreaterThan(0);
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("clicking a block selects it (overlay appears) and shows its Design/Settings fields", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // The seeded section holds one text block — click its rendered text.
  const text = page.locator('.sui-email-canvas [data-sui-id]').last();
  await text.click();

  await expect(page.locator(".sui-email-canvas .outline-primary").first()).toBeVisible();
  // Design is the default tab — its Text group shows.
  await expect(page.getByText("Text", { exact: true })).toBeVisible();
  await expect(page.getByText("Font size", { exact: true })).toBeVisible();
  // Settings holds the node's content.
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByText("Content", { exact: true }).first()).toBeVisible();
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("inserting a Button from the palette adds it to the canvas and it's editable", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  await openInsert(page);

  await page.locator('[data-insert-key="button"]').click();

  // A button block renders (bulletproof-button look on the canvas is a styled
  // span). `.first()`: the SelectionOverlay's floating label repeats the same
  // text once the button is selected, so scope to the first (real) match —
  // it renders before the overlay in DOM order.
  const canvas = page.locator(".sui-email-canvas");
  const buttonText = canvas.getByText("Shop now").first();
  await expect(buttonText).toBeVisible();

  // Selecting it surfaces the Button fields (Settings tab: Label/Link).
  await buttonText.click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByText("Label", { exact: true })).toBeVisible();
  const labelInput = page.locator("label", { hasText: "Label" }).locator("input");
  await labelInput.fill("Get 20% off");
  await labelInput.blur();
  await expect(canvas.getByText("Get 20% off").first()).toBeVisible();

  const changes = await page.evaluate(() => (window as unknown as { __changeCount?: number }).__changeCount ?? 0);
  expect(changes).toBeGreaterThan(0);
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("double-click a text block edits in place and commits", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const text = page.locator(".sui-email-canvas [data-sui-id]").last();
  await text.dblclick();

  const editing = page.locator('[data-sui-editing="true"]');
  await expect(editing).toBeVisible();
  await page.keyboard.press("Control+a");
  await page.keyboard.type("Hello from the email builder");
  await page.keyboard.press("Control+Enter");

  await expect(editing).toBeHidden();
  await expect(page.locator(".sui-email-canvas")).toContainText("Hello from the email builder");
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("move up / duplicate / delete act on the selected block via the Inspector toolbar", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  await openInsert(page);

  // Insert a divider so there are two siblings to reorder.
  await page.locator('[data-insert-key="divider"]').click();
  const before = await page.locator(".sui-email-canvas [data-sui-id]").count();

  await page.getByLabel("Duplicate").click();
  await expect
    .poll(() => page.locator(".sui-email-canvas [data-sui-id]").count())
    .toBeGreaterThan(before);

  const afterDuplicate = await page.locator(".sui-email-canvas [data-sui-id]").count();
  // exact: true — "Delete" is a substring of the Templates panel's "Delete template".
  await page.getByLabel("Delete", { exact: true }).click();
  await expect
    .poll(() => page.locator(".sui-email-canvas [data-sui-id]").count())
    .toBeLessThan(afterDuplicate);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("Export HTML produces valid table-based markup with the current subject", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // Subject lives on the document root's Settings tab now (nothing-selected
  // shows an EmptyState, same as the site builder) — select "Email" first.
  // Click the row's own `.tree-node` (always the first in document order),
  // not the `treeitem` <li> (whose bounding box spans its expanded children).
  await page.locator(".tree-node").first().click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("label", { hasText: "Subject" }).locator("input").fill("Weekend sale");
  await page.locator("label", { hasText: "Subject" }).locator("input").blur();

  await page.getByRole("button", { name: /export html/i }).click();

  const html = await page.waitForFunction(() => (window as unknown as { __exported?: string }).__exported);
  const value = await html.jsonValue();
  expect(value).toContain("<title>Weekend sale</title>");
  expect(value).toContain("role=\"presentation\"");
  expect(value).not.toContain("<link");
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("dragging a palette item onto the canvas margin inserts it (drag-from-palette)", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  await openInsert(page);

  const canvas = page.locator(".sui-email-canvas");
  const before = await canvas.locator("[data-sui-id]").count();

  // Drop on the canvas's left margin (outside the centered board, safely inside
  // the scrollable canvas area regardless of viewport height).
  await page.locator('[data-insert-key="divider"]').dragTo(canvas, { targetPosition: { x: 20, y: 100 } });

  await expect.poll(() => canvas.locator("[data-sui-id]").count()).toBeGreaterThan(before);
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("dragging a block on the canvas reorders it (drag-to-reorder)", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");

  // Retitle the seeded text, then insert a second, distinguishable text block.
  await canvas.getByText("Start writing your email…").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("FIRST");
  await page.keyboard.press("ControlOrMeta+Enter");

  await openInsert(page);
  await page.locator('[data-insert-key="text"]').click(); // inserts after the selected FIRST block
  await canvas.getByText("Write something…").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("SECOND");
  await page.keyboard.press("ControlOrMeta+Enter");

  await expect(canvas.getByText("FIRST").first()).toBeVisible();
  await expect(canvas.getByText("SECOND").first()).toBeVisible();

  // FIRST should currently precede SECOND in the DOM (insertion order).
  const orderBefore = await canvas.locator("[data-sui-id]").allTextContents();
  expect(orderBefore.indexOf("FIRST")).toBeLessThan(orderBefore.indexOf("SECOND"));

  // Drag SECOND above FIRST (drop on FIRST's upper edge → "before").
  const second = canvas.getByText("SECOND").first();
  const first = canvas.getByText("FIRST").first();
  const firstBox = await first.boundingBox();
  await second.dragTo(first, { targetPosition: { x: (firstBox?.width ?? 100) / 2, y: 2 } });

  await expect.poll(async () => {
    const order = await canvas.locator("[data-sui-id]").allTextContents();
    return order.indexOf("SECOND") < order.indexOf("FIRST");
  }).toBe(true);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("the rich text toolbar bolds the selected text", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  const text = canvas.getByText("Start writing your email…").first();
  await text.dblclick();

  // Select all the text inside the now-editable field, then click Bold. Scoped
  // to its exact title (not a name regex) — the Inspector's Weight chip is
  // also labeled "Bold" and is visible at the same time.
  await page.keyboard.press("ControlOrMeta+a");
  await page.getByRole("button", { name: "Bold (Ctrl/Cmd+B)" }).click();

  // Commit the edit and confirm the HTML actually carries a <b>/<strong>.
  await page.keyboard.press("ControlOrMeta+Enter");
  const html = await canvas.locator('[data-sui-id]').first().innerHTML();
  expect(/<b>|<strong>/i.test(html)).toBe(true);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("inserting Social/Video/HTML blocks renders them on the canvas", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  await openInsert(page);

  const canvas = page.locator(".sui-email-canvas");
  await page.locator('[data-insert-key="social"]').click();
  await expect(canvas.locator("text=f").first()).toBeVisible(); // the Facebook badge glyph

  await page.locator('[data-insert-key="video"]').click();
  await expect(canvas.locator("img").last()).toBeVisible();

  await page.locator('[data-insert-key="html"]').click();
  await expect(canvas.getByText("Custom HTML", { exact: true }).first()).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("saving a block adds it to the palette, inserts a copy, and can be deleted", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // Clear any saved blocks left by a prior run (localStorage isn't wiped
  // between specs the way IndexedDB drafts are cleaned in persistence.spec).
  await page.evaluate(() => localStorage.removeItem("silicaui-email-saved-blocks"));
  await page.reload();
  await ready(page);
  await openInsert(page);

  const canvas = page.locator(".sui-email-canvas");
  await canvas.getByText("Start writing your email…").first().click();

  page.once("dialog", (d) => d.accept("My Saved Intro"));
  await page.getByLabel("Save as block").click();

  const savedRow = page.locator('[data-insert-key^="saved:"]');
  await expect(savedRow).toContainText("My Saved Intro");

  const before = await canvas.locator("[data-sui-id]").count();
  await savedRow.click();
  await expect.poll(() => canvas.locator("[data-sui-id]").count()).toBeGreaterThan(before);

  // Delete it — the row disappears from the palette (existing canvas copies stay).
  await page.locator('[data-insert-key^="saved:"]').hover();
  await page.getByTitle("Delete saved block").click();
  await expect(page.locator('[data-insert-key^="saved:"]')).toHaveCount(0);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("Preview mode renders the real projected HTML in an iframe, and rails hide", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // Retitle the seeded text so we can confirm the SAME content round-trips
  // into the projected HTML the iframe renders (not a stale/cached copy).
  await page.locator(".sui-email-canvas").getByText("Start writing your email…").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Preview me");
  await page.keyboard.press("ControlOrMeta+Enter");

  await page.getByRole("button", { name: "Preview", exact: true }).click();

  // The editable canvas + Insert/Design rails are gone; a real iframe renders.
  await expect(page.locator(".sui-email-canvas")).toHaveCount(0);
  await expect(page.getByText("Insert", { exact: true })).toHaveCount(0);
  const frame = page.frameLocator('iframe[title="Email preview"]');
  await expect(frame.locator("body")).toContainText("Preview me");
  // It's the literal projected markup — table-based, not the live-DOM approximation.
  await expect(frame.locator('table[role="presentation"]').first()).toBeVisible();

  await page.getByRole("button", { name: /^edit/i }).click();
  await expect(page.locator(".sui-email-canvas")).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("Send test validates the address, calls onSendTest, and shows Sent!", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  await page.getByRole("button", { name: /send test/i }).click();
  const sendButton = page.getByRole("button", { name: /^send$/i });
  await expect(sendButton).toBeDisabled(); // empty address

  await page.getByPlaceholder("you@example.com").fill("not-an-email");
  await expect(sendButton).toBeDisabled(); // invalid format

  await page.getByPlaceholder("you@example.com").fill("qa@example.com");
  await expect(sendButton).toBeEnabled();
  await sendButton.click();

  await expect(page.getByRole("button", { name: /sent!/i })).toBeVisible();
  const sent = await page.waitForFunction(
    () => (window as unknown as { __sentTest?: { to: string } }).__sentTest,
  );
  expect((await sent.jsonValue()) as { to: string }).toMatchObject({ to: "qa@example.com" });

  expect(errors, errors.join("\n")).toHaveLength(0);
});
