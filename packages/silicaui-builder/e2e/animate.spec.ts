import { test, expect, type Page } from "@playwright/test";

/**
 * Assignable element animations — the Inspector's Animate section (Design
 * tab). Guards: Load/Scroll/Hover triggers write the right `sui-animate-*`/
 * `sui-reveal-*`/`sui-hover-*` class onto the canvas node; Scroll additionally
 * attaches a `reveal` behavior marker that lowers to `data-sui-behavior` on
 * Publish; the canvas itself never scroll-janks (it stamps `data-sui-inview`
 * statically and shows the final state while editing).
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

async function publishedHtml(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Publish" }).click();
  await page.waitForFunction(() => (window as unknown as { __published?: unknown }).__published != null);
  return page.evaluate(() => {
    const payload = (window as unknown as { __published: { pages: { html: string }[] } }).__published;
    return payload.pages.map((p) => p.html).join("\n");
  });
}

test("Animate section: Load/Scroll/Hover triggers write the right classes + behavior marker", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();
  await expect(page.getByText("Animate", { exact: true })).toBeVisible();

  const heading = canvas.locator("h1", { hasText: HEADLINE });

  // Load — defaults to the first preset (fade-in), no behavior marker needed.
  await page.getByTestId("animate-trigger-load").click();
  await expect(heading).toHaveClass(/\bsui-animate-fade-in\b/);

  // Switching the preset within the same trigger swaps the class (setToken).
  await page.getByRole("button", { name: "Slide up", exact: true }).click();
  await expect(heading).toHaveClass(/\bsui-animate-slide-up\b/);
  await expect(heading).not.toHaveClass(/sui-animate-fade-in/);

  let html = await publishedHtml(page);
  expect(html).toContain("sui-animate-slide-up");
  expect(html).not.toContain("data-sui-behavior");

  // Scroll — resets to the family's first preset, attaches the `reveal`
  // behavior marker, AND the canvas stamps data-sui-inview so the element
  // stays visible while editing (no scroll-jank on the live canvas).
  await page.getByTestId("animate-trigger-scroll").click();
  await expect(heading).toHaveClass(/\bsui-reveal-fade-in\b/);
  await expect(heading).toHaveAttribute("data-sui-inview", "true");
  await expect(heading).toHaveCSS("opacity", "1");

  html = await publishedHtml(page);
  expect(html).toContain("sui-reveal-fade-in");
  expect(html).toContain('data-sui-behavior="reveal"');

  // Hover — clears the `reveal` marker (never leaves a stale behavior root).
  await page.getByTestId("animate-trigger-hover").click();
  await expect(heading).toHaveClass(/\bsui-hover-lift\b/);

  html = await publishedHtml(page);
  expect(html).toContain("sui-hover-lift");
  expect(html).not.toContain("data-sui-behavior");

  // None — clears every animate/reveal/hover class.
  await page.getByTestId("animate-trigger-none").click();
  await expect(heading).not.toHaveClass(/sui-(animate|reveal|hover)-/);

  expect(errors, errors.join("\n")).toHaveLength(0);
});
