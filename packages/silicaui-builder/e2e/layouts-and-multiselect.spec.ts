import { test, expect, type Page } from "@playwright/test";

/**
 * The two chrome surfaces added for doc 139's remaining asks: NAMED LAYOUTS
 * (Layout mode edits more than one shell, and a page picks which wraps it) and
 * MULTI-SELECT (shift-click and Cmd+A, with Design edits applying to the whole
 * set as one undo step).
 *
 * Both are provable only in a browser: the engine probes cover the verbs, but
 * "the switcher retargets the tree" and "the Inspector wrote to all six nodes"
 * are wiring, and wiring is exactly what a unit probe can't see.
 */

async function ready(page: Page): Promise<void> {
    await page.goto("/");
    await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
    await page.waitForSelector(".sui-canvas");
}

const mod = process.platform === "darwin" ? "Meta" : "Control";

test("Layout mode creates a named layout, edits it, and a page opts in", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    await page.getByRole("button", { name: "Layout", exact: true }).click();
    // The default layout is what the switcher opens on, and it can't be deleted —
    // every page falls back to it.
    await expect(page.getByTestId("layout-switcher")).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete layout" })).toBeDisabled();

    await page.getByTestId("layout-add").click();
    // Creating one OPENS it: the delete/rename affordances light up, because we
    // are no longer on the default.
    await expect(page.getByRole("button", { name: "Delete layout" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Rename layout" })).toBeEnabled();
    // ...and it seeds from the real default shell rather than an empty box.
    // `.first()` — the navbar CTA renders in the bar AND in the mobile menu (one
    // shared `cta` slot), so the header legitimately holds two copies.
    await expect(canvas.locator("header").getByText("Get started").first()).toBeVisible();

    // Editing THIS layout must not touch the default one. A class edit is the
    // sharpest probe of that: it's the same node in two independent trees, so a
    // mis-targeted op would show up on both.
    // Target a leaf by its text, so the click can't land on a descendant and
    // style something other than what we then assert on.
    const brand = () => canvas.getByText("SilicaUI").first();
    await brand().click();
    await page.getByTestId("row-text-align").getByRole("button", { name: "Center" }).click();
    await expect(brand()).toHaveClass(/text-center/);

    await page.getByTestId("layout-switcher").click();
    await page.getByRole("option", { name: "Default" }).click();
    await expect(brand()).not.toHaveClass(/text-center/);

    // Back in Page mode, the page can now opt into the named layout — and the
    // page-mode canvas composes THAT shell around the body.
    await page.getByRole("button", { name: "Page", exact: true }).click();
    await expect(page.getByTestId("page-frame")).toBeVisible();
    await page.getByTestId("page-frame").click();
    await page.getByRole("option", { name: "Layout 1" }).click();
    await expect(brand()).toHaveClass(/text-center/);

    // ...and "No layout" renders the page bare — the campaign-page case.
    await page.getByTestId("page-frame").click();
    await page.getByRole("option", { name: "No layout (bare page)" }).click();
    await expect(canvas.locator("header")).toHaveCount(0);
    await expect(canvas.locator("footer")).toHaveCount(0);
    await expect(canvas.getByText("Ship your store in an afternoon")).toBeVisible();

    expect(errors, errors.join("\n")).toHaveLength(0);
});

test("shift-click and Cmd+A select several nodes, and one Design edit hits all of them", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    const heading = canvas.getByText("Ship your store in an afternoon");
    await heading.click();
    await expect(page.getByTestId("multi-select-note")).toHaveCount(0); // one node

    // Shift-click extends. The note appears and states the rule.
    const body = canvas.getByText("Everything you need to sell online — no code, no wrangling.");
    await body.click({ modifiers: ["Shift"] });
    await expect(page.getByTestId("multi-select-note")).toContainText("2 selected");

    // A Design edit applies to BOTH — the whole point of the set.
    await page.getByTestId("row-text-align").getByRole("button", { name: "Center" }).click();
    await expect(heading).toHaveClass(/text-center/);
    await expect(body).toHaveClass(/text-center/);

    // ...as ONE undo step, not two.
    await page.keyboard.press(`${mod}+z`);
    await expect(heading).not.toHaveClass(/text-center/);
    await expect(body).not.toHaveClass(/text-center/);

    // Shift-clicking an already-selected node removes it from the set.
    await body.click({ modifiers: ["Shift"] });
    await expect(page.getByTestId("multi-select-note")).toHaveCount(0);

    // Cmd+A takes every sibling at this level — more than the two we had.
    await heading.click();
    await page.keyboard.press(`${mod}+a`);
    await expect(page.getByTestId("multi-select-note")).toBeVisible();

    expect(errors, errors.join("\n")).toHaveLength(0);
});
