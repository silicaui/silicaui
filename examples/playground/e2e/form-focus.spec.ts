import { test, expect, type Page } from "@playwright/test";

/**
 * Real-browser confirmation of `Form`'s focus policy.
 *
 * silicaui-react's `verify-form-focus.mjs` asserts the same contract in jsdom,
 * and this is not redundant with it: jsdom does not run the microtask
 * checkpoint the HTML spec performs BETWEEN event listener callbacks, so the
 * submit-path guard passed there while closing its window before Base UI ever
 * focused in Chromium. jsdom also only simulates focus and text selection.
 * Anything about WHEN focus moves has to be proven here.
 */
const email = '[data-testid="demo-email"]';
const password = '[data-testid="demo-password"]';

async function open(page: Page, mode: "true" | "scroll" | "false") {
  await page.goto("/");
  const section = page.locator("#form");
  await section.scrollIntoViewIfNeeded();
  await section.getByRole("button", { name: mode, exact: true }).click();
  return section;
}

/** What has focus, and what its selection looks like. */
function state(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLInputElement | null;
    return {
      testid: el?.getAttribute("data-testid") ?? el?.tagName ?? "none",
      start: el?.selectionStart ?? null,
      end: el?.selectionEnd ?? null,
      value: el?.value ?? null,
    };
  });
}

const signIn = (section: ReturnType<Page["locator"]>) =>
  section.getByRole("button", { name: /^Sign in$/ });

test("invalid submit focuses the bad field", async ({ page }) => {
  const section = await open(page, "true");
  await page.fill(email, "brandon@"); // no domain — genuinely invalid
  await page.fill(password, "hunter2!");
  await signIn(section).click();

  expect((await state(page)).testid).toBe("demo-email");
  await page.keyboard.type("wize.works");
  expect(await page.inputValue(email)).toBe("brandon@wize.works");
});

test("…and never selects what the user already typed there", async ({ page }) => {
  // Asserted on the PASSWORD field: `type="email"` has no selection API at all
  // (`selectionStart` is null), so it can't show the difference. `type="password"`
  // can — and it is the control Base UI's `select()` would have wiped.
  const section = await open(page, "true");
  await page.fill(email, "brandon@wize.works");
  await page.fill(password, "hunter"); // valid email, password under 8 → first invalid
  await signIn(section).click();

  const after = await state(page);
  expect(after.testid).toBe("demo-password");
  expect(after.start).toBe(6);
  expect(after.end).toBe(6); // Base UI on its own would leave 0–6 selected

  // The decisive part: the next keystrokes APPEND rather than replacing.
  await page.keyboard.type("2!");
  expect(await page.inputValue(password)).toBe("hunter2!");
});

test("a late server rejection does not take the caret out of the password field", async ({ page }) => {
  const section = await open(page, "true");
  await page.fill(email, "brandon@wize.works");
  await page.fill(password, "hunter2!"); // valid, so the submit reaches the server
  await signIn(section).click();

  // The request is in flight (1.5s). The user carries on typing their password.
  await page.click(password);
  await page.keyboard.type("9");
  // The rejection lands: pending clears and `errors` is set in the same commit.
  await expect(section.getByText("That address isn't registered.")).toBeVisible();

  expect((await state(page)).testid).toBe("demo-password");
  await page.keyboard.type("9");
  expect(await page.inputValue(password)).toBe("hunter2!99");
});

test("focusOnError={false} leaves focus on the submit button", async ({ page }) => {
  const section = await open(page, "false");
  await page.fill(email, "brandon@");
  await page.fill(password, "hunter2!");
  await signIn(section).click();
  expect((await state(page)).testid).toBe("BUTTON");
});
