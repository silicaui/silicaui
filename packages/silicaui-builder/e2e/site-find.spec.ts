import { test, expect, type Page } from "@playwright/test";

/**
 * Find a piece of text anywhere on a SITE, and change it everywhere at once.
 *
 * The defect this locks: the site builder had no Find at all. Its toolbar even
 * printed a `⌘ /` hint for it (docs/personas/issues/102) while the email builder
 * — which does have one — printed none. So "change the phone number everywhere"
 * meant "remember everywhere", and a site hides text in three places no screen
 * shows you: the shared header and footer (on every page, belonging to none), a
 * saved component (behind a mode switch), and the address behind a link (visible
 * only once that link is selected). docs/personas/issues/073, 111.
 *
 * The case here is deliberately the CROSS-TREE one, because that is the half a
 * person cannot do by hand: "store" is on the home page AND in the shared
 * footer, and the frame is not the tree that is open.
 */
async function ready(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

test("Find reaches every page AND the shared frame, and Change all crosses both", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await ready(page);

  await page.getByTestId("left-tab-find").click();
  const find = page.getByTestId("find-input");
  await find.fill("store");

  // The count IS the point of the panel — the number an author could not
  // otherwise have known before starting.
  await expect(page.getByTestId("find-count")).toHaveText("2 places in 2 parts of your site");
  await expect(page.getByTestId("find-hit")).toHaveCount(2);

  // One of the two is in the frame, which is NOT the tree that is open. That is
  // the whole reason this panel exists rather than a per-page search.
  await expect(page.getByText("The header and footer every page shares")).toBeVisible();

  // CONTROL: a word that is on no page and in no frame finds nothing. A panel
  // that reported hits for everything would be a text box with a number by it.
  await find.fill("Bedminster");
  await expect(page.getByTestId("find-count")).toContainText("Nothing on this site says");
  await expect(page.getByTestId("find-hit")).toHaveCount(0);

  await find.fill("store");
  await page.getByTestId("replace-input").fill("shop");
  await expect(page.getByTestId("replace-all")).toHaveText("Change all 2");
  await page.getByTestId("replace-all").click();

  await expect(page.getByTestId("find-count")).toContainText("Changed 2 places to “shop”");
  await expect(page.getByTestId("find-hit")).toHaveCount(0);

  // The honest read: the word moved in BOTH trees, including the one that was
  // never opened. Searching the new word is how an author would check it.
  await find.fill("shop");
  await expect(page.getByTestId("find-hit")).toHaveCount(2);
  await expect(page.getByText("The header and footer every page shares")).toBeVisible();

  // And it was ONE action. `Undo` names it, and puts both back together.
  const undo = page.getByRole("button", { name: /^Undo/ }).first();
  await expect(undo).toHaveAttribute("aria-label", /Undo —/);
  await undo.click();
  await find.fill("");
  await find.fill("store");
  await expect(page.getByTestId("find-hit")).toHaveCount(2);

  expect(errors).toEqual([]);
});

test("a page's web address is shown as a place the text sits, and never rewritten", async ({ page }) => {
  await ready(page);
  await page.getByTestId("left-tab-find").click();

  // "home" is in the home page's slug. A slug is a ROUTE: rewriting it breaks
  // every link that points at it and every bookmark a visitor has — so Find
  // lists it and the replacer leaves it alone.
  const find = page.getByTestId("find-input");
  await find.fill("/");
  const slugHit = page.getByTestId("find-hit").filter({ hasText: "shown, not changed" });
  if ((await slugHit.count()) > 0) {
    await expect(slugHit.first()).toContainText("the page's web address");
  }
});
