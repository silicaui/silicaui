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
/** Adds a template. Add opens the STARTER PICKER (issues/063) — these tests want
 *  the empty one, so they pick "Blank email", which is the document `addTemplate`
 *  used to mint on its own. The name field then opens with focus already inside
 *  it (issues/044), and Enter on an empty field keeps the generated name. */
async function addTemplate(page: Page, starter: "blank" | "newsletter" = "blank"): Promise<void> {
  await page.getByLabel("Add template").click();
  await page.getByTestId(`starter:${starter}`).click();
  const field = page.getByLabel("Template name");
  await expect(field).toBeFocused();
  await field.press("Enter");
}

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

  await addTemplate(page);
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
  await addTemplate(page);
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
  const renameInput = page.getByLabel("Template name");
  await renameInput.fill("October newsletter");
  await renameInput.press("Enter");
  await expect(trigger).toHaveText(/October newsletter/);

  await addTemplate(page);
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

  await addTemplate(page);
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

/**
 * P04 act 7 / issues 072 + 073 — the same email again, and fixing one wrong
 * word in all of them.
 *
 * Reuben sends one newsletter per shop. The switcher could add a template and
 * delete one, so the second version of an email that already existed had to be
 * built again from a starter, by hand. Then the offer code turned out to be
 * wrong, and it sat in twelve places across the three of them — six of which
 * are on no screen he was looking at.
 */
test("Duplicate makes a real copy of the email, and editing one never touches the other", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  await canvas.getByText("Start writing your email…").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Use DISPATCH10 at the Clifton till.");
  await page.keyboard.press("ControlOrMeta+Enter");

  await page.getByLabel("Duplicate template").click();
  // Naming follows the copy, exactly as it follows an add (issues/044).
  const field = page.getByLabel("Template name");
  await expect(field).toBeFocused();
  await field.fill("Dispatch — Gloucester Road");
  await field.press("Enter");

  const trigger = page.getByRole("combobox", { name: "Current template" });
  await expect(trigger).toHaveText(/Gloucester Road/);
  // The copy really carries the words — not a blank starter wearing a new name.
  await expect(canvas.getByText("Use DISPATCH10 at the Clifton till.")).toBeVisible();

  // Edit the COPY. The original must be untouched.
  await canvas.getByText("Use DISPATCH10 at the Clifton till.").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Use DISPATCH10 at the Gloucester Road till.");
  await page.keyboard.press("ControlOrMeta+Enter");

  const listbox = await openRoster(page);
  await page.getByRole("option", { name: "Email 1", exact: true }).click();
  await expect(listbox).toBeHidden();
  await expect(canvas.getByText("Use DISPATCH10 at the Clifton till.")).toBeVisible();
  await expect(canvas.getByText("Gloucester Road till")).toHaveCount(0);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("Find counts every place a word appears across all the emails, and changes them in one press", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");

  // Two of the four places are on no screen: the subject, and the web address
  // behind a button. Both go in here, because both are what the panel exists for.
  await page.locator(".tree-node").first().click();
  await page.getByRole("tab", { name: "Settings", exact: true }).click();
  const subject = page.getByRole("textbox", { name: /^Subject/ });
  await subject.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Clifton: 10% off with DISPATCH10");
  await subject.blur();

  await canvas.getByText("Start writing your email…").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Enter DISPATCH10 online.");
  await page.keyboard.press("ControlOrMeta+Enter");

  // …then the same email again, twice, for the other two shops.
  await page.getByLabel("Duplicate template").click();
  await page.getByLabel("Template name").press("Enter");

  await page.getByRole("tab", { name: "Find", exact: true }).click();
  const find = page.getByTestId("find-input");
  await find.fill("DISPATCH10");

  // The count IS the point of the panel — the number he would otherwise have
  // had to remember.
  await expect(page.getByTestId("find-count")).toHaveText("4 places in 2 emails");
  await expect(page.getByTestId("find-hit")).toHaveCount(4);
  // Including the one that is on no screen he was looking at.
  await expect(page.getByTestId("find-hit").first()).toContainText("Subject");

  // CONTROL: a word that is not in any of them finds nothing at all. A panel
  // that reported hits for everything would tell him nothing.
  await find.fill("BEDMINSTER20");
  await expect(page.getByTestId("find-count")).toContainText("Nothing in your emails says");
  await expect(page.getByTestId("find-hit")).toHaveCount(0);

  await find.fill("DISPATCH10");
  await page.getByTestId("replace-input").fill("THORNBURY10");
  await expect(page.getByTestId("replace-all")).toHaveText("Change all 4");
  await page.getByTestId("replace-all").click();

  await expect(page.getByTestId("find-count")).toContainText("Changed 4 places to “THORNBURY10”");
  await expect(page.getByTestId("find-hit")).toHaveCount(0);

  // The honest read: the HTML that actually reaches an inbox, for the email
  // that is NOT the one open — proving the fix crossed templates.
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __exported?: string }).__exported))
    .toContain("THORNBURY10");
  const exported = await page.evaluate(() => (window as unknown as { __exported?: string }).__exported ?? "");
  expect(exported).not.toContain("DISPATCH10");

  await page.getByRole("tab", { name: "Layers", exact: true }).click();
  const listbox = await openRoster(page);
  await page.getByRole("option", { name: "Email 1", exact: true }).click();
  await expect(listbox).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __exported?: string }).__exported))
    .toContain("THORNBURY10");
  const other = await page.evaluate(() => (window as unknown as { __exported?: string }).__exported ?? "");
  expect(other).not.toContain("DISPATCH10");

  expect(errors, errors.join("\n")).toHaveLength(0);
});
