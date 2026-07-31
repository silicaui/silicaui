import { test, expect, type Page } from "@playwright/test";

/**
 * Per-item links inside an email `collection` repeat — the `link` group node.
 *
 * The gap this closes: a node carries at most ONE data marker, so a repeated
 * `image` could bind its `src` OR its `href`, never both, and a `text` node has
 * no `href` at all. A rail of product cards therefore had no way to send each
 * card to its own record. A `link` group holds the destination, so its `href`
 * binds per item while every child keeps its own marker for its own field.
 *
 * The assertions that matter run against the EXPORTED HTML (`__exported`, the
 * host's real projection through `toEmailHtml` + the demo resolver), not the
 * canvas: the canvas is an approximation, and "each card links to its own URL"
 * is a claim about what actually sends.
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
  await page.goto("/?editor=email&persist=0&host=demo");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-email-canvas");
}

/** Select a CONTAINER by its Navigator row. Clicking the `.tree-node` rather
 *  than the `treeitem` <li> matters — an expanded row's box spans its children,
 *  so an <li> click can land on a descendant (same gotcha noted in
 *  email-navigator-and-tabs.spec.ts). The row click also collapses the row, so
 *  anything nested under it has to be selected on the canvas instead. */
async function selectLayer(page: Page, name: string): Promise<void> {
  await page.getByRole("treeitem", { name, exact: true }).locator(".tree-node").first().click();
  await page.getByRole("tab", { name: "Settings", exact: true }).click();
}

async function openSettings(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Settings", exact: true }).click();
}

async function bind(page: Page, kind: string, ref: string): Promise<void> {
  await page.locator("label", { hasText: "Bind" }).first().locator("select").selectOption(kind);
  await page.locator("label", { hasText: "Reference" }).first().locator("select").selectOption(ref);
}

test("a Linked card inserts as a group with its blocks INSIDE it", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await page.locator('[data-insert-key="link-card"]').click();
  // Back to the layer tree — the left rail is one panel, and everything below
  // selects nodes through it.
  await page.getByRole("button", { name: "Layers", exact: true }).click();

  // The group draws a persistent boundary + link glyph — it emits nothing in
  // the sent HTML, so without this an author can't tell the card's blocks are
  // inside the group rather than siblings after it.
  await expect(page.getByTestId("email-link-group-mark").first()).toBeVisible();

  // The blocks are CHILDREN of the group, which is what makes them link.
  const link = page.getByRole("treeitem", { name: "Link", exact: true });
  await expect(link.getByRole("treeitem", { name: "Image", exact: true })).toBeVisible();
  await expect(link.getByRole("treeitem", { name: "Product name", exact: true })).toBeVisible();

  await selectLayer(page, "Link");
  await expect(page.getByLabel("Link URL")).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("inside a collection repeat, each card links to ITS OWN url while its image binds its own src", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await page.locator('[data-insert-key="link-card"]').click();
  // Back to the layer tree — the left rail is one panel, and everything below
  // selects nodes through it.
  await page.getByRole("button", { name: "Layers", exact: true }).click();

  // Each child binds its OWN field — picked on the canvas, since selecting a
  // container in the tree collapses it out from under its descendants.
  const canvas = page.locator(".sui-email-canvas");
  await canvas.locator("img").first().click();
  await openSettings(page);
  await bind(page, "value", "product.image");

  await canvas.getByText("Product name").first().click();
  await openSettings(page);
  await bind(page, "value", "product.title");

  // The group's href is the per-item destination (no `attr` needed — `href` is
  // the kind's only field, so it's the default target).
  await selectLayer(page, "Link");
  await bind(page, "value", "product.url");

  // The Section repeats once per product. Bound LAST, deliberately: clicking a
  // container row in the tree toggles it shut, and its descendants go with it.
  await selectLayer(page, "Section");
  await bind(page, "collection", "products");
  await expect(page.getByText("3 items", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Export HTML", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __exported?: string }).__exported))
    .toContain("shop.example.com/p/widget");
  const exported = (await page.evaluate(() => (window as unknown as { __exported?: string }).__exported))!;

  // Every card: its own URL around its own image.
  for (const [slug, image] of [
    ["widget", "widget.jpg"],
    ["gadget", "gadget.jpg"],
    ["gizmo", "gizmo.jpg"],
  ]) {
    expect(exported).toContain(
      `<a href="https://shop.example.com/p/${slug}" target="_blank"><img src="https://cdn.example.com/${image}"`,
    );
  }
  // The title is linked to the same per-item URL, as inline copy that inherits
  // its ink — not a blue underlined link inside a card.
  expect(exported).toContain(
    `<a href="https://shop.example.com/p/gizmo" target="_blank" style="color:inherit;text-decoration:none">Gizmo</a>`,
  );
  // Binding the group's href did not strand the children's binds.
  expect(exported).not.toContain(`src=""`);
  expect(exported).not.toContain("Product name");

  expect(errors, errors.join("\n")).toHaveLength(0);
});
