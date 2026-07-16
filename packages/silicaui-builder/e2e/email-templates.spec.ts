import { test, expect, type Page } from "@playwright/test";

/**
 * The email builder's Templates switcher (top of the left rail) — the fix for
 * the previously-missing multi-template support, mirroring the site builder's
 * Pages switcher control-for-control (Select + rename/add/delete).
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
  await page.goto("/?editor=email&persist=0");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-email-canvas");
}

/**
 * Open the template roster and wait until it is REALLY open.
 *
 * The wait is the point. Asserting "option X is absent" against a popup that
 * may still be animating open is vacuous — it passes just as happily when the
 * popup never opened at all, so it proves nothing AND synchronizes nothing.
 * Escape then races the open animation; when it loses, Base UI's inert backdrop
 * stays up and silently swallows every later click in the test. Anchor on
 * something that can only be true once the listbox is genuinely open.
 */
async function openRoster(page: Page) {
  const listbox = page.getByRole("listbox");
  await page.getByRole("combobox", { name: "Current template" }).click();
  await expect(listbox).toBeVisible();
  // The active template is always in the roster — proof the options rendered,
  // not just the popup element.
  await expect(page.getByRole("option").first()).toBeVisible();
  return listbox;
}

/** Close the roster and wait for its backdrop to actually go away, so the next
 *  click can't be intercepted by a popup that's still tearing down. */
async function closeRoster(page: Page, listbox: ReturnType<Page["getByRole"]>) {
  await page.keyboard.press("Escape");
  await expect(listbox).toBeHidden();
  await expect(page.locator("[data-base-ui-inert]")).toHaveCount(0);
}

test("a fresh email starts with exactly one template, and Add creates a second, independent one", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const trigger = page.getByRole("combobox", { name: "Current template" });
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveText(/Email 1/);

  // Deleting is disabled with only one template.
  await expect(page.getByLabel("Delete template")).toBeDisabled();

  await page.getByLabel("Add template").click();
  await expect(trigger).toHaveText(/Email 2/);

  // The new template is a fresh document — the seeded intro text, not
  // whatever was on template 1.
  const canvas = page.locator(".sui-email-canvas");
  await expect(canvas.getByText("Start writing your email…")).toBeVisible();

  await expect(page.getByLabel("Delete template")).toBeEnabled();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("switching templates preserves each one's own edits independently", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  const trigger = page.getByRole("combobox", { name: "Current template" });

  // Edit template 1's seeded text.
  await canvas.getByText("Start writing your email…").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Only on template 1");
  await page.keyboard.press("ControlOrMeta+Enter");
  // `.first()`: once selected, the SelectionOverlay's floating label repeats
  // the same text — scope to the real (first, in DOM order) occurrence.
  await expect(canvas.getByText("Only on template 1").first()).toBeVisible();

  // Add template 2 — its own fresh seeded text, template 1's edit isn't here.
  await page.getByLabel("Add template").click();
  await expect(canvas.getByText("Start writing your email…").first()).toBeVisible();
  await expect(canvas.getByText("Only on template 1")).toHaveCount(0);

  // Switch back to template 1 via the Select — its edit is still there.
  await trigger.click();
  await page.getByRole("option", { name: "Email 1" }).click();
  await expect(canvas.getByText("Only on template 1").first()).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("rename and delete act on the current template, and the roster can't drop below one", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const trigger = page.getByRole("combobox", { name: "Current template" });

  await page.getByLabel("Rename template").click();
  // `.last()`, not `.first()`: the header's Subject/Preview text fields are
  // textboxes that sit earlier in the DOM and are always mounted — the rename
  // input is the one that just appeared, swapped in for the template Select.
  const renameInput = page.getByRole("textbox").last();
  await renameInput.fill("October newsletter");
  await renameInput.press("Enter");
  await expect(trigger).toHaveText(/October newsletter/);

  await page.getByLabel("Add template").click();
  await expect(trigger).toHaveText(/Email 2/);

  // Delete the active (second) template — falls back to the first.
  await page.getByLabel("Delete template").click();
  await expect(trigger).toHaveText(/October newsletter/);
  await expect(page.getByLabel("Delete template")).toBeDisabled();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("undo/redo spans template add/remove, not just node edits", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const trigger = page.getByRole("combobox", { name: "Current template" });
  await expect(trigger).toHaveText(/Email 1/);

  await page.getByLabel("Add template").click();
  await expect(trigger).toHaveText(/Email 2/);

  await page.getByRole("button", { name: "Undo" }).click();
  // Undo restores the ROSTER (back to one template) — same as the site
  // builder's page history, the active pointer itself isn't part of what's
  // snapshotted, only clamped back when it would otherwise dangle. With just
  // one template left, "Email 2" is gone from the roster entirely.
  await expect(trigger).toHaveText(/Email 1/);
  let roster = await openRoster(page);
  // Meaningful only because the roster is provably open and populated above.
  await expect(page.getByRole("option", { name: "Email 1" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Email 2" })).toHaveCount(0);
  await closeRoster(page, roster);

  await page.getByRole("button", { name: "Redo" }).click();
  // Redo brings "Email 2" back into the roster — reachable again.
  roster = await openRoster(page);
  await expect(page.getByRole("option", { name: "Email 2" })).toBeVisible();
  await closeRoster(page, roster);

  expect(errors, errors.join("\n")).toHaveLength(0);
});
