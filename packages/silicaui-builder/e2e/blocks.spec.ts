import { test, expect, type Page } from "@playwright/test";

/**
 * Block-library guard: every marketing block is a fully-editable composed tree
 * (real child nodes, not props). Inserting one from the palette must render its
 * content on the canvas through the normal element path — with zero per-block
 * Canvas code and zero React warnings. This locks the palette→insert→render chain
 * for the whole block catalog, and (because the harness builds Tailwind from
 * source) proves each block's utility classes survive the `@source` safelist scan.
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

async function insertBlock(page: Page, key: string): Promise<void> {
    await page.getByRole("button", { name: "Insert" }).click();
    await page.locator(`[data-insert-key="block:${key}"]`).click();
}

test("marketing blocks insert and render their content on the canvas", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    // A representative sweep across the library — chrome, social proof, pricing,
    // content, and the working form — asserting a distinctive string from each.
    await insertBlock(page, "navbar");
    await expect(canvas.getByText("SilicaUI").first()).toBeVisible();

    await insertBlock(page, "pricing_tiers");
    await expect(canvas.getByText("Simple, transparent pricing")).toBeVisible();
    await expect(canvas.getByText("$29")).toBeVisible();

    await insertBlock(page, "stats_band");
    await expect(canvas.getByText("99.99%")).toBeVisible();

    await insertBlock(page, "testimonials_grid");
    await expect(canvas.getByText("Loved by teams everywhere")).toBeVisible();

    await insertBlock(page, "cta_band");
    await expect(canvas.getByText("Ready to build something great?")).toBeVisible();

    await insertBlock(page, "footer");
    // The default frame already carries a footer, so the inserted one is the 2nd.
    await expect(canvas.getByText("© 2026 SilicaUI, Inc. All rights reserved.").first()).toBeVisible();

    expect(errors, errors.join("\n")).toHaveLength(0);
});

test("interactive composites insert and reveal every panel on the canvas", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    // Tabs ship panels 2/3 `hidden` so only the first shows before hydration; the
    // canvas reveal rule must surface ALL panels so every one is editable in the
    // builder (there's no runtime to switch tabs on the design surface).
    await insertBlock(page, "tabs");
    await expect(canvas.getByText("A quick summary of what this product does and who it's for.")).toBeVisible();
    await expect(canvas.getByText("Straightforward plans that scale as your team grows.")).toBeVisible(); // authored hidden

    // Dropdown's menu panel ships `hidden`; revealed on canvas so its items edit.
    await insertBlock(page, "dropdown");
    await expect(canvas.getByText("Options")).toBeVisible(); // trigger
    await expect(canvas.getByText("Sign out")).toBeVisible(); // item inside the hidden panel

    // Accordion (multi-open disclosure) reveals every section body for editing.
    await insertBlock(page, "accordion");
    await expect(canvas.getByText("You're charged monthly and can change or cancel your plan anytime.")).toBeVisible(); // authored hidden

    expect(errors, errors.join("\n")).toHaveLength(0);
});

test("collapsed disclosure panels are revealed on the canvas so they're editable", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    // The FAQ block ships its 2nd/3rd answers `hidden` (so they don't flash before a
    // runtime hydrates). On the canvas there's no runtime, so the reveal-on-canvas
    // rule must surface every answer for editing — even the ones authored hidden.
    await insertBlock(page, "faq_accordion");
    await expect(canvas.getByText("Nope — everything is visual.")).toBeVisible(); // open by default
    await expect(canvas.getByText("Yes, connect any domain you already own.")).toBeVisible(); // authored hidden

    expect(errors, errors.join("\n")).toHaveLength(0);
});

test("the contact block lowers a real form with the wired control structure", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    await insertBlock(page, "contact_section");
    await expect(canvas.getByText("Get in touch")).toBeVisible();

    // The canvas renders the form's STRUCTURE (a <form> with two required inputs, a
    // textarea, and a submit button). The Phase-2 contract markers
    // (data-sui-behavior="form" / data-sui-action="contact") are a production-output
    // concern lowered by toHtml — locked by the golden fixture, not the canvas DOM.
    const form = canvas.locator("form").first();
    await expect(form).toBeVisible();
    await expect(form.locator("input[required]")).toHaveCount(2);
    await expect(form.locator("textarea")).toHaveCount(1);
    await expect(form.locator('button[type="submit"]')).toHaveCount(1);

    expect(errors, errors.join("\n")).toHaveLength(0);
});
