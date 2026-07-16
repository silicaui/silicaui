import { expect, test, type Page } from "@playwright/test";

// The demo host supplies `site.title` / `site.identity.logo` + the `__editor`
// handle (via its `toolbarSlot`), so the binding halves below need `?host=demo`.
async function ready(page: Page): Promise<void> {
  await page.goto("/?host=demo");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

/** Insert a Wordmark into the PAGE tree and select it. The navbar's own
 *  Wordmark lives in the layout frame — a locked backdrop in Page mode — so
 *  it's deliberately not selectable here. */
async function insertWordmark(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Insert" }).click();
  await page.locator('[data-insert-key="wordmark"]').click();
  await expect(page.locator(".sui-canvas .wordmark")).toHaveCount(1);
  // Inserting selects the new node, so the Inspector is already on it.
  await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();
}

/** Set the Wordmark's Logo. The Inspector's asset control is a plain URL Input
 *  (the harness supplies no `pickAsset`) inside a non-`<label>` Row, so it's
 *  addressed by placeholder and committed on Enter. */
async function setLogo(page: Page, url: string): Promise<void> {
  const input = page.getByPlaceholder("https://…");
  await input.fill(url);
  await input.press("Enter");
}

/**
 * The brand lockup, end to end in a real browser (§C of
 * data-resolution-and-brand-mark.md).
 *
 * Wordmark used to be a text-only atom (`container: false`, text prop only)
 * while its CSS and its React wrapper both already assumed a mark — so "put the
 * logo in the wordmark" was impossible by construction. These cover the two
 * halves that were broken: the SCHEMA can now carry a mark, and the CSS sizes a
 * non-square one without squashing it (the old `& svg { width: 1.15em }` forced
 * every mark square — a rule no golden markup test can catch, since it's purely
 * about computed layout).
 */

// A deliberately 3:1 logo — the aspect ratio IS the assertion. A square test
// asset would pass under both the old and new rules and prove nothing. Served
// from the harness's `public/`; a `data:` URI can't stand in here, since
// `sanitizeElement`'s URL policy drops those schemes by design.
const WIDE_LOGO = "/brand-wide.svg";

test("a Wordmark carries a logo, and a non-square mark keeps its aspect ratio", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  await insertWordmark(page);
  await page.getByRole("button", { name: "Settings" }).click();

  // The one-control path: assign a logo without touching the tree.
  await setLogo(page, WIDE_LOGO);

  const mark = canvas.locator(".wordmark img").first();
  await expect(mark).toBeVisible();

  // Height locks to the type; width follows the 3:1 source. The old rule made
  // this 1:1 and squashed the logo.
  const box = await mark.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThan(0);
  expect(box!.width / box!.height).toBeGreaterThan(2.5);
  expect(box!.width / box!.height).toBeLessThan(3.5);

  // Decorative by default — the brand NAME renders beside it, so the mark must
  // not re-announce it.
  await expect(mark).toHaveAttribute("alt", "");
  await expect(canvas.getByText("SilicaUI", { exact: true }).first()).toBeVisible();
});

test("a Wordmark's logo can be data-bound, and resolves to the host's real brand", async ({ page }) => {
  await ready(page);

  await insertWordmark(page);
  await page.getByRole("button", { name: "Settings" }).click();

  // Bind the LOGO specifically — `attr: "src"` targets the mark, leaving the
  // name alone. This is the exact thing a consumer tried and couldn't do.
  await page.evaluate(() => {
    const ed = (window as unknown as { __editor: { selection?: string; setData(id: string, b: unknown): void } })
      .__editor;
    ed.setData(ed.selection!, { kind: "value", ref: "site.identity.logo", attr: "src" });
  });

  // The host declares AND resolves `site.identity.logo`, so this is not an
  // unknown ref — no error state.
  await expect(page.getByTestId("data-unknown-ref")).toHaveCount(0);
  await expect(page.getByText("/brand-wide.svg")).toBeVisible();
});

test("a bare bind on a Wordmark fills the NAME, never the logo URL", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  await insertWordmark(page);
  await page.getByRole("button", { name: "Settings" }).click();
  await setLogo(page, WIDE_LOGO);

  // With a logo set, the Wordmark now HAS a `src` prop — the case that would
  // have written a bound site NAME into the image URL under the resolver's old
  // `"src" in props` sniff. `ComponentDef.primary: "text"` is what prevents it.
  await page.evaluate(() => {
    const ed = (window as unknown as { __editor: { selection?: string; setData(id: string, b: unknown): void } })
      .__editor;
    ed.setData(ed.selection!, { kind: "value", ref: "site.title" });
  });

  // On the CANVAS (the Inspector's preview row says the same thing — be specific
  // about which, now that the canvas resolves too).
  await expect(canvas.locator(".wordmark").first()).toContainText("Acme Storefront");
  // The logo survived the name bind — still the wide mark, not a text URL.
  await expect(canvas.locator(".wordmark img").first()).toHaveAttribute("src", WIDE_LOGO);
});

/**
 * THE origin case, end to end: bind a Wordmark to the host's data and see the
 * host's real brand ON THE CANVAS. Every prior test proved a piece of this in
 * the Inspector; this is the one that proves the editor itself resolves.
 */
test("the canvas resolves bindings — a bound Wordmark shows the host's real brand", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");
  const wordmark = canvas.locator(".wordmark").first();

  await insertWordmark(page);
  await expect(wordmark).toHaveText("SilicaUI"); // the authored placeholder

  await page.evaluate(() => {
    const ed = (window as unknown as { __editor: { selection?: string; setData(id: string, b: unknown): void } })
      .__editor;
    ed.setData(ed.selection!, { kind: "value", ref: "site.title" });
  });

  // The canvas — not just the Inspector's preview row — now shows real data.
  await expect(wordmark).toHaveText("Acme Storefront");

  // Data OFF returns the authored placeholder: it's what ships when data is
  // absent, so it has to remain visible and editable.
  await page.getByTestId("data-preview-toggle").click();
  await expect(wordmark).toHaveText("SilicaUI");
  await page.getByTestId("data-preview-toggle").click();
  await expect(wordmark).toHaveText("Acme Storefront");
});

test("resolved text is not editable in place, but an unresolved node's authored text still is", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");
  const wordmark = canvas.locator(".wordmark").first();

  await insertWordmark(page);
  await page.evaluate(() => {
    const ed = (window as unknown as { __editor: { selection?: string; setData(id: string, b: unknown): void } })
      .__editor;
    ed.setData(ed.selection!, { kind: "value", ref: "site.title" });
  });
  await expect(wordmark).toHaveText("Acme Storefront");

  // Double-click would normally start an in-place edit. On RESOLVED text it must
  // not: the text isn't authored, so committing it would overwrite the authored
  // placeholder with the host's data.
  await wordmark.dblclick();
  await expect(canvas.locator("[contenteditable=true]")).toHaveCount(0);

  // An UNKNOWN ref still shows authored text — so it stays editable.
  await page.evaluate(() => {
    const ed = (window as unknown as { __editor: { selection?: string; setData(id: string, b: unknown): void } })
      .__editor;
    ed.setData(ed.selection!, { kind: "value", ref: "logo" });
  });
  await expect(wordmark).toHaveText("SilicaUI");
  await wordmark.dblclick();
  await expect(canvas.locator("[contenteditable=true]")).toHaveCount(1);
});

test("an unresolvable ref is marked on the canvas, not silently blanked", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");
  const wordmark = canvas.locator(".wordmark").first();

  await insertWordmark(page);
  await page.evaluate(() => {
    const ed = (window as unknown as { __editor: { selection?: string; setData(id: string, b: unknown): void } })
      .__editor;
    ed.setData(ed.selection!, { kind: "value", ref: "logo" });
  });

  // Authored content survives, and the node is MARKED — the whole point: an
  // empty span with no explanation is what cost a consumer an afternoon.
  await expect(wordmark).toHaveText("SilicaUI");
  await expect(wordmark).toHaveAttribute("data-sui-unresolved", "logo");
});
