import { test, expect, type Page } from "@playwright/test";

/**
 * The subject is on screen from the first moment, and one click lands on the
 * field that edits it.
 *
 * The defect this locks (P04 act 2, docs/personas/issues/112): getting to the
 * subject took knowing that a tree row called "Email" held it — two clicks —
 * and **until then nothing on screen mentioned a subject line at all**. For
 * someone writing a campaign the subject is the first thing they write.
 *
 * It is a READ-OUT and not a second field, deliberately. `EmailBuilder`'s
 * toolbar already carries a written decision against a second copy, and two
 * `TokenTextField`s on one value would drift: each seeds its state from
 * `defaultValue` at mount and never re-syncs, so the last one blurred would win.
 */
async function ready(page: Page): Promise<void> {
  await page.goto("/?editor=email");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-email-canvas, .sui-canvas");
}

test("the subject is on screen before anything is selected, and clicking it opens the field", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await ready(page);

  // On screen from the first moment — nothing selected, nothing opened.
  const bar = page.getByTestId("subject-bar");
  await expect(bar).toBeVisible();
  await expect(bar).toHaveText(/\S/);

  // CONTROL: the Inspector is NOT already on Settings, or "it went to Settings"
  // would prove nothing.
  const settingsTab = page.getByRole("tab", { name: "Settings", exact: true });
  await expect(settingsTab).toHaveAttribute("aria-selected", "false");

  await bar.click();

  // Both halves. The root is the node that HOLDS the subject, and Settings is
  // the tab it is on — selecting without the tab would land on Design, which is
  // the right rail and the wrong page of it.
  await expect(settingsTab).toHaveAttribute("aria-selected", "true");
  const inspector = page.getByRole("tabpanel").last();
  await expect(inspector.getByText("Subject", { exact: true })).toBeVisible();

  expect(errors).toEqual([]);
});

test("the bar follows the subject, and says so when there is none", async ({ page }) => {
  await ready(page);
  const bar = page.getByTestId("subject-bar");

  await bar.click();
  const subject = page.getByRole("textbox", { name: /^Subject/ });
  await subject.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Half term at Bright Step");
  await subject.blur();

  // One value, two views: the bar reads the document, not a copy of it.
  await expect(bar).toHaveText("Half term at Bright Step");

  // Emptied, it says what is missing rather than rendering as a shorter line of
  // nothing. An email with no subject is the one that goes out wrong.
  await subject.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Delete");
  await subject.blur();
  await expect(bar).toContainText("No subject yet");
});
