import { test, expect, type Page } from "@playwright/test";

/**
 * Default layout shell — a new site's frame is composed from our real navbar and
 * footer BLOCK components (not a bespoke stand-in), so the layout is built from
 * editable components out of the box. This guard locks that the default frame
 * renders the navbar + footer around the page, and that Layout mode exposes them
 * as editable frame nodes.
 */

async function ready(page: Page, query = ""): Promise<void> {
    await page.goto(`/${query}`);
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
    //
    // `.first()` because the navbar carries the CTA TWICE by design: once in the
    // bar (`@md:inline-block`) and once in the mobile menu, sharing one `cta` slot
    // so a host fills both from one key. A header whose primary action disappears
    // on a phone is broken, so the duplicate is the fix, not an accident. The
    // first is the desktop one, which is the copy this assertion is about.
    await expect(canvas.locator("header").getByText("Get started").first()).toBeVisible();
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

/**
 * Layout mode REPAINTS as you edit. The bug this locks: the model updated, the
 * Inspector chip moved, the draft saved and reloaded correctly — and the canvas
 * kept painting the pre-edit shell until a full reload, so every control read as
 * dead and the change never got published.
 *
 * `?host=demo` is load-bearing, not incidental. A host that resolves data puts a
 * memoized COPY of the tree between the model and the screen (`useResolved`); a
 * host without one renders the engine's own objects and paints either way. So
 * this only ever failed for a real host — which is exactly who found it.
 *
 * Asserts COMPUTED padding, not `class`: the class attribute updating proves the
 * model reached the DOM, and the pixels prove it reached the user.
 */
test("Layout mode repaints the canvas as you edit, with no reload", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));
    await ready(page, "?host=demo");

    await page.getByRole("button", { name: "Layout", exact: true }).click();

    // The navbar's inner bar — `px-6 py-4`, a node WITH children, which is the
    // case that froze (a childless leaf passes through resolution by reference
    // and would have painted even before the fix, proving nothing). Clicking its
    // own padding box selects it rather than one of its children.
    const bar = page.locator(".sui-canvas header > div").first();
    await expect(bar).toHaveCSS("padding-left", "24px");
    await bar.click({ position: { x: 3, y: 3 } });
    await expect(page.getByTestId("row-padding-x")).toBeVisible();

    await page.getByTestId("row-padding-x").getByRole("button", { name: "12", exact: true }).click();
    await expect(bar).toHaveClass(/\bpx-12\b/);
    await expect(bar).toHaveCSS("padding-left", "48px");

    // A second edit on the same node — a stale snapshot that happened to refresh
    // once would still fail here.
    await page.getByTestId("row-padding-y").getByRole("button", { name: "8", exact: true }).click();
    await expect(bar).toHaveCSS("padding-top", "32px");
    await expect(bar).toHaveCSS("padding-left", "48px");

    expect(errors, errors.join("\n")).toHaveLength(0);
});
