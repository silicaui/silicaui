import { test, expect, type Page } from "@playwright/test";

/**
 * The Layers tree names things the way a non-technical author would.
 *
 * The defect this locks: the Navigator listed raw markup — `Site root → header →
 * div → a SilicaUI → nav → a Product → div → …` — so finding "the Pricing link"
 * meant reading past four `div`s, and layout-only wrappers carried the same
 * weight as content. Three fixes, all guarded here:
 *
 *   1. a row names its CONTENT, or the author's own name for it, or its type in
 *      plain English ("Group", "Link", "Menu") — never a tag;
 *   2. "Simple" folds layout-only wrappers away, "Detailed" shows everything;
 *   3. double-click renames a layer, and the name is authoring metadata that
 *      never reaches the published HTML.
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
    await page.waitForSelector(".sui-canvas");
}

/** Click a tree row. `.tree-node` and not the `treeitem` <li>: an expanded row's
 *  box spans its whole subtree, so clicking the <li> lands on a descendant. */
async function clickRow(page: Page, name: string): Promise<void> {
    await page.getByRole("treeitem", { name, exact: true }).locator(".tree-node").first().click();
}

const row = (page: Page, name: string) => page.getByRole("treeitem", { name, exact: true });

test("layer rows read as plain English, never as tags", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);

    // Layout mode: the site frame is the tree, which is where the raw-markup
    // reading was worst (header/div/nav/div/a/button/main/outlet/footer/div…).
    await page.getByRole("button", { name: "Layout", exact: true }).click();

    // The frame root, and the landmarks — not `header`, `nav`, `main`, `footer`.
    await expect(row(page, "Site")).toBeVisible();
    await expect(row(page, "Header")).toBeVisible();
    await expect(row(page, "Menu").first()).toBeVisible();
    await expect(row(page, "Footer")).toBeVisible();
    // The outlet is the page's slot — it says so, rather than "Outlet".
    await expect(row(page, "Page content")).toBeVisible();

    // Content leads: the brand link is named by the words it holds, not by `a`.
    await expect(row(page, "SilicaUI").first()).toBeVisible();
    await expect(row(page, "Product").first()).toBeVisible();

    // And no row anywhere is a bare tag name.
    const labels = await page.locator(".tree-node-label").allInnerTexts();
    expect(labels.length).toBeGreaterThan(5);
    for (const raw of labels) {
        expect(["div", "span", "nav", "ul", "li", "a", "p", "header", "footer", "main", "section"])
            .not.toContain(raw.trim());
    }

    expect(errors, errors.join("\n")).toHaveLength(0);
});

test("Simple hides layout-only wrappers; Detailed shows them", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    await page.getByRole("button", { name: "Layout", exact: true }).click();

    const groups = row(page, "Group");
    const depth = page.getByRole("group", { name: "Layer detail" });

    // Simple is the default and folds every bare wrapper away.
    await expect(depth.getByText("Simple")).toBeVisible();
    await expect(groups).toHaveCount(0);
    const simpleRows = await page.getByRole("treeitem").count();

    // Detailed brings them back — and nothing else disappears.
    await depth.getByText("Detailed").click();
    expect(await groups.count()).toBeGreaterThan(0);
    expect(await page.getByRole("treeitem").count()).toBeGreaterThan(simpleRows);
    // A folded wrapper's CHILDREN survive folding — they were lifted, not hidden.
    await expect(row(page, "SilicaUI").first()).toBeVisible();

    await depth.getByText("Simple").click();
    await expect(groups).toHaveCount(0);
    await expect(row(page, "SilicaUI").first()).toBeVisible();

    expect(errors, errors.join("\n")).toHaveLength(0);
});

test("a wrapper selected on the canvas still gets a row in Simple", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    await page.getByRole("button", { name: "Layout", exact: true }).click();

    // No Group rows while nothing is selected…
    await expect(row(page, "Group")).toHaveCount(0);

    // …but selecting the navbar's inner bar (a bare `div`, folded in Simple)
    // must give it somewhere to highlight, or the tree and canvas disagree.
    await page.locator(".sui-canvas header > div").first().click({ position: { x: 3, y: 3 } });
    const selected = page.locator('.tree-node[data-selected]');
    await expect(selected).toHaveCount(1);
    await expect(selected).toHaveText(/Group/);

    expect(errors, errors.join("\n")).toHaveLength(0);
});

test("double-click renames a layer; undo reverts it in one step", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    await page.getByRole("button", { name: "Layout", exact: true }).click();

    await row(page, "Header").locator(".tree-node").first().dblclick();
    const field = page.getByRole("textbox", { name: "Rename" });
    await expect(field).toBeVisible();
    await field.fill("Top bar");
    await field.press("Enter");

    await expect(row(page, "Top bar")).toBeVisible();
    await expect(row(page, "Header")).toHaveCount(0);

    // ONE undo step, not one per keystroke — the rename commits on Enter only.
    await page.keyboard.press("Control+z");
    await expect(row(page, "Header")).toBeVisible();
    await expect(row(page, "Top bar")).toHaveCount(0);

    expect(errors, errors.join("\n")).toHaveLength(0);
});

test("Escape cancels a rename, and clearing the field restores the derived name", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    await page.getByRole("button", { name: "Layout", exact: true }).click();

    // Escape leaves the name alone.
    await row(page, "Footer").locator(".tree-node").first().dblclick();
    await page.getByRole("textbox", { name: "Rename" }).fill("Nope");
    await page.getByRole("textbox", { name: "Rename" }).press("Escape");
    await expect(row(page, "Footer")).toBeVisible();
    await expect(row(page, "Nope")).toHaveCount(0);

    // Naming, then clearing, falls back to the derived name — never a one-way door.
    await row(page, "Footer").locator(".tree-node").first().dblclick();
    await page.getByRole("textbox", { name: "Rename" }).fill("Legal");
    await page.getByRole("textbox", { name: "Rename" }).press("Enter");
    await expect(row(page, "Legal")).toBeVisible();

    await row(page, "Legal").locator(".tree-node").first().dblclick();
    await page.getByRole("textbox", { name: "Rename" }).fill("");
    await page.getByRole("textbox", { name: "Rename" }).press("Enter");
    await expect(row(page, "Footer")).toBeVisible();

    expect(errors, errors.join("\n")).toHaveLength(0);
});

test("an inserted block keeps its catalog name, and the catalog isn't mutated", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);

    await page.getByRole("button", { name: "Insert" }).click();
    await page.locator('[data-insert-key="block:pricing_tiers"]').click();
    await page.getByRole("button", { name: "Layers" }).click();

    // Not "Section" — the row carries the name the author picked it by.
    const named = page.getByRole("treeitem", { name: /Pricing/ });
    await expect(named.first()).toBeVisible();

    // Insert the SAME block again. `blockItem.make()` hands back the shared
    // catalog root, so a label assigned onto it (rather than onto a copy) would
    // leak into every later insert — and both rows would still read right. What
    // catches it is a DIFFERENT block: if the shared tree was mutated, this one
    // would come back wearing the pricing name.
    await page.getByRole("button", { name: "Insert" }).click();
    await page.locator('[data-insert-key="block:faq_accordion"]').click();
    await page.getByRole("button", { name: "Layers" }).click();
    const faq = page.getByRole("treeitem", { name: /FAQ/i });
    await expect(faq.first()).toBeVisible();
    await expect(page.getByRole("treeitem", { name: /Pricing/ })).toHaveCount(1);

    expect(errors, errors.join("\n")).toHaveLength(0);
});

test("a layer name is authoring metadata — it never reaches the published HTML", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);

    await page.getByRole("button", { name: "Insert" }).click();
    await page.locator('[data-insert-key="block:pricing_tiers"]').click();
    await page.getByRole("button", { name: "Layers" }).click();

    await page.getByRole("treeitem", { name: /Pricing/ }).first().locator(".tree-node").first().dblclick();
    await page.getByRole("textbox", { name: "Rename" }).fill("Our plans");
    await page.getByRole("textbox", { name: "Rename" }).press("Enter");
    await expect(page.getByRole("treeitem", { name: "Our plans", exact: true })).toBeVisible();

    // The name is a builder concern. The PUBLISHED markup — what actually ships —
    // must not carry it, neither as an attribute nor as stray text. This is the
    // portable-HTML guarantee: authoring metadata stays in the builder.
    await page.getByRole("button", { name: "Publish" }).click();
    await page.waitForFunction(() => (window as unknown as { __published?: unknown }).__published != null);
    const html = await page.evaluate(() => {
        const payload = (window as unknown as { __published: { pages: { html: string }[] } }).__published;
        return payload.pages.map((p) => p.html).join("\n");
    });
    expect(html.length).toBeGreaterThan(0);
    expect(html).not.toContain("Our plans");
    // A bare `label="…"` attribute would be the schema field leaking through.
    // Anchored on the leading space so it can't match `aria-label`, which is a
    // real attribute the blocks legitimately emit.
    expect(html).not.toMatch(/\slabel="/);

    // The canvas is the live projection of the same tree, so no rendered node may
    // carry the name as an attribute either. Checked on the projected elements
    // rather than on `.sui-canvas`'s innerHTML, because the selection overlay is
    // builder chrome that lives inside the canvas and legitimately DOES show the
    // name — that pill is the whole point of naming a layer.
    const strayLabels = await page.locator(".sui-canvas [data-sui-id][label]").count();
    expect(strayLabels).toBe(0);
    await expect(page.locator(".sui-canvas [aria-hidden='true'] >> text=Our plans")).toHaveCount(1);

    expect(errors, errors.join("\n")).toHaveLength(0);
});
