import { test, expect, type Page } from "@playwright/test";

/**
 * The Theme editor's "CSS" button opens a modal showing the theme as CSS custom
 * properties, editable in place (Copy / Reset / Apply) — no file upload. Apply
 * only accepts exactly what the theme's own CSS export produces (one
 * `[data-theme]` block, optionally a dark `@media` block); anything else
 * (an extra selector, `url()`, a comment) must be rejected with an inline error
 * and must NOT touch the live theme.
 */

async function ready(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
  await page.getByRole("button", { name: "Theme" }).click();
  await expect(page.locator(".sui-brd")).toBeVisible();
}

async function openCssModal(page: Page): Promise<void> {
  await page.getByRole("button", { name: "CSS", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test("opens showing the theme's CSS, Copy puts it on the clipboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await ready(page);
  await openCssModal(page);

  const textarea = page.getByRole("textbox", { name: "Theme CSS" });
  await expect(textarea).toHaveValue(/\[data-theme="/);

  await page.getByRole("dialog").getByRole("button", { name: "Copy" }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Copied" })).toBeVisible();
});

test("editing a token and applying updates the live theme", async ({ page }) => {
  await ready(page);
  await openCssModal(page);
  const board = page.locator(".sui-brd");

  const textarea = page.getByRole("textbox", { name: "Theme CSS" });
  const original = await textarea.inputValue();
  const edited = original.replace(/--color-primary:\s*[^;]+;/, "--color-primary: oklch(0.9 0 0);");
  expect(edited).not.toBe(original); // sanity: the token was actually present and replaced

  await textarea.fill(edited);
  await page.getByRole("dialog").getByRole("button", { name: "Apply" }).click();

  await expect(page.getByRole("dialog").getByRole("button", { name: "Applied" })).toBeVisible();
  await expect(board).toHaveAttribute("style", /oklch\(0\.9 0 0\)/);
});

test("CSS that isn't exactly a theme export is rejected, theme is left untouched", async ({ page }) => {
  await ready(page);
  await openCssModal(page);
  const board = page.locator(".sui-brd");
  const styleBefore = await board.getAttribute("style");

  const textarea = page.getByRole("textbox", { name: "Theme CSS" });
  await textarea.fill('[data-theme="evil"] {\n  --color-primary: url(https://evil.example/x);\n}');
  await page.getByRole("dialog").getByRole("button", { name: "Apply" }).click();

  await expect(page.getByRole("dialog").getByText(/character that isn't allowed/)).toBeVisible();
  await expect(board).toHaveAttribute("style", styleBefore ?? "");
});

test("Reset discards edits and reloads the live theme's CSS", async ({ page }) => {
  await ready(page);
  await openCssModal(page);

  const textarea = page.getByRole("textbox", { name: "Theme CSS" });
  const original = await textarea.inputValue();
  await textarea.fill("garbage");
  await page.getByRole("dialog").getByRole("button", { name: "Reset" }).click();

  await expect(textarea).toHaveValue(original);
});
