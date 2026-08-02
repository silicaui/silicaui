import { test, expect, type Page } from "@playwright/test";

/**
 * MULTI-SELECT: shift-click and Cmd+A, with Design edits applying to the whole
 * set as one undo step.
 *
 * Provable only in a browser — the engine probes cover the verbs, but "the
 * Inspector wrote to all six nodes" is wiring, and wiring is exactly what a unit
 * probe can't see.
 */

async function ready(page: Page): Promise<void> {
    await page.goto("/");
    await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
    await page.waitForSelector(".sui-canvas");
}

const mod = process.platform === "darwin" ? "Meta" : "Control";

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
