import { test, expect, type Page } from "@playwright/test";

/**
 * Webfont loading is driven off the ACTIVE THEME, not off the click that picked a
 * font — see `google-fonts-loader`'s `useThemeWebfonts`.
 *
 * The bug this guards: the load used to hang off the theme editor's font picker, so
 * that was the ONLY way a face ever got fetched. Every other route to a theme —
 * applying one of the 18 shipped presets that carry Google faces, a saved theme,
 * pasted theme CSS, crash-recovery restore, a reload — wrote a perfectly correct
 * `--font-head: "Syne", sans-serif` onto the island against a font the page had
 * never fetched. The token resolved, the browser fell back to the generic, and the
 * component board's Typography specimen showed headings in the same face as body:
 * "the heading font doesn't change when I switch themes."
 *
 * So these tests assert on the `<link>`, not just the token. A token on the island's
 * `style` was exactly the evidence that made the bug invisible.
 */

const clearDrafts = (page: Page) =>
  page.evaluate(() => {
    try {
      indexedDB.deleteDatabase("silicaui-builder");
    } catch {
      /* ignore */
    }
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });

async function ready(page: Page): Promise<void> {
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

async function openTheme(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Theme" }).click();
  await expect(page.locator(".sui-brd")).toBeVisible();
}

/** The preview `<link>` for a family, which is what proves the face was fetched. */
const fontLink = (page: Page, family: string) =>
  page.locator(`link[href*="fonts.googleapis.com"][href*="${family.replace(/ /g, "+")}"]`);

test("applying a preset theme loads BOTH its body and heading faces", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await openTheme(page);
  const board = page.locator(".sui-brd");

  // `neon` pairs Space Grotesk (body) with Syne (headings) — two distinct Google
  // faces, so a body-only load would still fail this.
  await page.getByText("neon", { exact: true }).first().click();

  await expect(board).toHaveAttribute("style", /Syne/);
  await expect(fontLink(page, "Space Grotesk")).toHaveCount(1);
  await expect(fontLink(page, "Syne")).toHaveCount(1);

  // The heading really resolves the head face, and body is untouched by it.
  const firstFamily = (loc: ReturnType<Page["getByText"]>) =>
    loc.evaluate((el) => getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, ""));
  expect(await firstFamily(board.getByText("Heading one", { exact: true }))).toBe("Syne");
  expect(await firstFamily(board.getByText(/Body copy sits/))).toBe("Space Grotesk");
});

test("switching between presets loads each one's faces", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await openTheme(page);
  const board = page.locator(".sui-brd");

  await page.getByText("marble", { exact: true }).first().click(); // Inter / Cormorant Garamond
  await expect(fontLink(page, "Cormorant Garamond")).toHaveCount(1);

  await page.getByText("carbon", { exact: true }).first().click(); // IBM Plex Sans / Archivo
  await expect(board).toHaveAttribute("style", /Archivo/);
  await expect(fontLink(page, "IBM Plex Sans")).toHaveCount(1);
  await expect(fontLink(page, "Archivo")).toHaveCount(1);
});

test("a picked font is still loaded after a reload restores the draft", async ({ page }) => {
  await page.goto("/?persist=1");
  await clearDrafts(page);
  await page.reload();
  await ready(page);
  await openTheme(page);

  const picker = page.getByRole("combobox", { name: "Heading typeface" });
  await picker.click();
  await picker.fill("");
  await picker.pressSequentially("Playfair Display", { delay: 15 });
  await page.getByRole("option", { name: "Playfair Display", exact: true }).click();
  await expect(fontLink(page, "Playfair Display")).toHaveCount(1);

  // Let the debounced autosave land, then reopen as if the tab had crashed. The
  // restored theme still names Playfair — so the face has to be fetched again on
  // this fresh page, with no picker interaction to hang the load off.
  await page.waitForTimeout(900);
  await page.reload();
  await ready(page);
  await openTheme(page);

  await expect(page.locator(".sui-brd")).toHaveAttribute("style", /Playfair Display/);
  await expect(fontLink(page, "Playfair Display")).toHaveCount(1);
});

test("pasted theme CSS naming a catalog family loads it, with no `fonts` record", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await openTheme(page);

  await page.getByRole("button", { name: "CSS", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  // Add a head token to the FIRST block only — appending past the trailing brace
  // would land inside the dark `@media` wrapper and be rejected.
  const textarea = page.getByRole("textbox", { name: "Theme CSS" });
  const original = await textarea.inputValue();
  const edited = original.replace(/\n\}/, '\n  --font-head: "Fraunces", serif;\n}');
  expect(edited).not.toBe(original);
  await textarea.fill(edited);
  await page.getByRole("dialog").getByRole("button", { name: "Apply" }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Applied" })).toBeVisible();

  await expect(page.locator(".sui-brd")).toHaveAttribute("style", /Fraunces/);
  await expect(fontLink(page, "Fraunces")).toHaveCount(1);

  // The paste has no picker interaction to record, so `theme.fonts` is inferred
  // from the token — otherwise the publish-time self-hosting step (which reads
  // exactly that field) would ship the token with no @font-face behind it, and the
  // published page would disagree with the board the author signed off on.
  // Read it off `__lastChange` — the site a real host persists and later hands to
  // `selfHostGoogleFonts`. No bespoke test API.
  const head = await page.evaluate(
    () =>
      (window as unknown as { __lastChange?: { theme?: { fonts?: Record<string, unknown> } } }).__lastChange?.theme
        ?.fonts?.head,
  );
  expect(head).toEqual({ family: "Fraunces", source: "google", weights: [400, 600, 700] });
});
