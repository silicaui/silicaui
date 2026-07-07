import { test, expect, type Page } from "@playwright/test";

/**
 * Default layout shell — a new site's frame is composed from our real navbar and
 * footer BLOCK components (not a bespoke stand-in), so the layout is built from
 * editable components out of the box. This guard locks that the default frame
 * renders the navbar + footer around the page, and that Layout mode exposes them
 * as editable frame nodes.
 */

async function ready(page: Page): Promise<void> {
    await page.goto("/");
    await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
    await page.waitForSelector(".sui-canvas");
}

test("the default frame is built from the navbar + footer components", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    // In Page mode the frame renders as context around the page — the navbar's CTA
    // and the footer's copyright (distinctive block copy) are on the canvas.
    await expect(canvas.locator("header").getByText("Get started")).toBeVisible();
    await expect(canvas.locator("footer").getByText("© 2026 SilicaUI, Inc. All rights reserved.")).toBeVisible();
    // And the page body still renders inside the shell's <main> outlet.
    await expect(canvas.locator("main").getByText("Ship your store in an afternoon")).toBeVisible();

    // In Layout mode the frame is the editable tree — selecting the navbar brand
    // proves the shell nodes are real, editable frame content.
    await page.getByRole("button", { name: "Layout", exact: true }).click();
    await canvas.getByText("SilicaUI").first().click();
    await expect(page.getByText("No selection")).toHaveCount(0); // something is selected

    expect(errors, errors.join("\n")).toHaveLength(0);
});
