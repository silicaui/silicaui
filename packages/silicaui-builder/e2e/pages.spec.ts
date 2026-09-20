import { test, expect, type Page } from "@playwright/test";

/**
 * Deleting a page asks first.
 *
 * The trash icon sits one button away from Add in the Pages panel and takes the
 * whole page tree with it, so it raises the shared `AlertDialog` rather than
 * firing straight through. Three things have to hold: cancelling changes
 * nothing, confirming removes the page, and the popup — which portals to
 * `document.body`, outside the chrome's `[data-theme]` island — still carries
 * the studio theme.
 */

async function ready(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

/** Adds a page so there are ≥2 (the engine refuses to remove the last one, and
 *  the button is disabled to match), and returns the new page's name. */
async function addSecondPage(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Add page" }).click();
  // Adding a page now opens its name field with focus already inside it, so the
  // panel is in rename mode until that field is committed (issues/044 — one
  // click plus one Enter used to fire Add twice and silently make two pages).
  // Enter on an empty field keeps the generated name, which is all this needs.
  const field = page.getByLabel("Page name");
  await expect(field).toBeFocused();
  await field.press("Enter");
  const name = await page.getByRole("combobox", { name: "Current page" }).textContent();
  expect(name?.trim()).toBeTruthy();
  return name!.trim();
}

test("cancelling the confirm keeps the page", async ({ page }) => {
  await ready(page);
  const name = await addSecondPage(page);

  await page.getByRole("button", { name: "Delete page" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(name);

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("combobox", { name: "Current page" })).toHaveText(name);
});

test("Escape dismisses the confirm and keeps the page", async ({ page }) => {
  await ready(page);
  const name = await addSecondPage(page);

  await page.getByRole("button", { name: "Delete page" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(page.getByRole("alertdialog")).toBeHidden();
  await expect(page.getByRole("combobox", { name: "Current page" })).toHaveText(name);
});

test("confirming removes the page, and undo brings it back", async ({ page }) => {
  await ready(page);
  const name = await addSecondPage(page);

  await page.getByRole("button", { name: "Delete page" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete page" }).click();

  await expect(page.getByRole("alertdialog")).toBeHidden();
  await expect(page.getByRole("combobox", { name: "Current page" })).not.toHaveText(name);

  // The prompt promises undo covers this — hold it to that. Undo restores the
  // DOCUMENT, not the view: the page is back in the switcher, but the active
  // page stays wherever the delete left it, so check the roster, not the label.
  await page.getByRole("button", { name: "Undo" }).click();
  await page.getByRole("combobox", { name: "Current page" }).click();
  await expect(page.getByRole("option", { name })).toBeVisible();
});

test("the confirm popup is themed, not the bare host page", async ({ page }) => {
  await ready(page);
  await addSecondPage(page);
  await page.getByRole("button", { name: "Delete page" }).click();

  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  // Portals to document.body, so it re-stamps the island itself.
  await expect(dialog).toHaveAttribute("data-theme", "studio");
  // …and that attribute actually resolves tokens: an unthemed popup inherits
  // the host page's transparent/UA background.
  const bg = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe("rgba(0, 0, 0, 0)");
  expect(bg).not.toBe("transparent");
});

test("the last remaining page cannot be deleted", async ({ page }) => {
  await ready(page);
  await expect(page.getByRole("button", { name: "Delete page" })).toBeDisabled();
});

/**
 * P04 act 7 / issues 072 — copying a page.
 *
 * The sibling of the email builder's missing template copy, found in the same
 * act: the switcher could add a page and delete one, so a page resembling one
 * that already existed had to be rebuilt block by block. A studio with one page
 * per class, a shop with one per location — all the same page with different
 * words in it.
 */
test("Duplicate makes a real copy of the page, with its own address, and the two are independent", async ({ page }) => {
  await ready(page);

  const first = (await page.getByRole("combobox", { name: "Current page" }).textContent())!.trim();

  await page.getByRole("button", { name: "Duplicate page" }).click();
  // Naming follows the copy, exactly as it follows an add (issues/044).
  const field = page.getByLabel("Page name");
  await expect(field).toBeFocused();
  await field.fill("Term dates");
  await field.press("Enter");

  const trigger = page.getByRole("combobox", { name: "Current page" });
  await expect(trigger).toHaveText(/Term dates/);

  // Both pages are in the roster, so the copy is a second page and not a rename
  // of the first.
  await trigger.click();
  await expect(page.getByRole("option", { name: first, exact: true })).toBeVisible();
  await expect(page.getByRole("option", { name: "Term dates", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-base-ui-inert]")).toHaveCount(0);

  // The copy carries the original's whole tree, shape for shape, with its own
  // fresh node ids — so editing one can never reach into the other.
  const shape = await page.evaluate(() => {
    const site = (window as unknown as {
      __lastChange?: { pages?: Array<{ name: string; slug: string; root: unknown }> };
    }).__lastChange;
    const pages = site?.pages ?? [];
    // Text children are bare strings and some wrappers carry no id of their own,
    // so an id-less node contributes nothing rather than an empty string that
    // would collide with every other one.
    const ids = (node: unknown): string[] => {
      if (typeof node !== "object" || node === null) return [];
      const n = node as { id?: string; children?: unknown[] };
      return [...(n.id ? [n.id] : []), ...(n.children ?? []).flatMap(ids)];
    };
    const stripped = (node: unknown): string =>
      JSON.stringify(node, (k, v) => (k === "id" ? undefined : v));
    return {
      names: pages.map((p) => `${p.name}|${p.slug}`),
      sameShape: pages.length === 2 && stripped(pages[0]!.root) === stripped(pages[1]!.root),
      sharedIds: pages.length === 2 ? ids(pages[0]!.root).filter((id) => ids(pages[1]!.root).includes(id)) : ["not-two-pages"],
    };
  });
  expect(shape.sameShape).toBe(true);
  expect(shape.sharedIds).toEqual([]);

  // Two pages cannot share a route: the copy got its own address, derived from
  // the name it was given.
  expect(shape.names).toHaveLength(2);
  expect(new Set(shape.names.map((s) => s.split("|")[1])).size).toBe(2);
  expect(shape.names).toContain("Term dates|/term-dates");
});
