import { test, expect, type Page } from "@playwright/test";
import { ROW } from "./inspector-row";

/**
 * The inline `{{ref}}` merge-token autocomplete (Q23) — the counterpart to
 * `email-data-binding.spec.ts`'s whole-field `data` bind: typing `{{` inside
 * a text block (the Canvas's contentEditable rich-text editor) or a prose
 * Settings field (Subject/Preview text/Button label, `TokenTextField`) opens
 * a picker over the demo host's `dataSources()`, and the chosen token
 * resolves through the SAME `resolveBinding` hook `email-data-binding.spec.ts`
 * exercises. All against `?host=demo`'s `demoEmailHost`.
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
  await page.goto("/?editor=email&persist=0&host=demo");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-email-canvas");
}

test("typing {{ inside a text block opens the merge-token popover, and picking one inserts {{ref}}", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  await canvas.getByText("Start writing your email…").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Hi {{cust");

  const popover = page.locator('[data-testid="token-autocomplete"]');
  await expect(popover).toBeVisible();
  await expect(popover.getByText("Customer first name", { exact: true })).toBeVisible();
  // Filtered to the "cust" query — the unrelated "Products > Title"/"Products
  // > Price" options (also in the demo host's catalog) don't match it.
  await expect(popover.getByText("Products > Title", { exact: true })).toHaveCount(0);

  await popover.getByText("Customer first name", { exact: true }).click();
  await page.keyboard.press("ControlOrMeta+Enter");

  await expect(page.locator('[data-sui-editing="true"]')).toBeHidden();
  // The Canvas shows the LITERAL token — it never resolves bindings itself
  // (only Export/Preview do, through the host), same as a whole-field bind.
  await expect(canvas.getByText("Hi {{customer.firstName}}", { exact: true }).first()).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("an inline token inside a text block resolves through the host in the projected HTML", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  await canvas.getByText("Start writing your email…").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  // `{{cust` used to match exactly one source. It no longer does: the demo host
  // gained `customer.homeShop` and `customer.atClifton` when P04/issues 071 gave
  // it real segmentation data, and all three contain "cust". This query narrows
  // to one again, which is what the two key presses below are actually about.
  await page.keyboard.type("Welcome, {{customer.first");
  await page.keyboard.press("ArrowDown"); // no-op with one match; proves the nav keys don't type into the field
  await page.keyboard.press("Enter"); // picks the highlighted (only) match
  await page.keyboard.press("ControlOrMeta+Enter"); // commits the text edit

  await expect.poll(() => page.evaluate(() => (window as unknown as { __exported?: string }).__exported)).toContain("Welcome, Jordan");
  const exported = await page.evaluate(() => (window as unknown as { __exported?: string }).__exported);
  expect(exported).not.toContain("{{customer");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("Escape closes the token popover WITHOUT cancelling the text edit itself", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  await canvas.getByText("Start writing your email…").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Note {{cust");
  await expect(page.locator('[data-testid="token-autocomplete"]')).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator('[data-testid="token-autocomplete"]')).toBeHidden();
  // The edit is still live (Escape only closed the popover, per the doc
  // comment's "Escape && match" branch firing before the cancel branch).
  await expect(page.locator('[data-sui-editing="true"]')).toBeVisible();

  await page.keyboard.press("ControlOrMeta+Enter");
  await expect(canvas.getByText("Note {{cust", { exact: true }).first()).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("the Subject field's token autocomplete inserts a token that resolves in the exported <title>", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  // Subject lives on the document root's Settings tab (see email.spec.ts's
  // "the projected HTML is valid table-based markup" for the same selection
  // pattern) — click the row's own `.tree-node`, not the `treeitem` <li>.
  await page.locator(".tree-node").first().click();
  await page.getByRole("tab", { name: "Settings", exact: true }).click();

  // A textarea since issues/065 — the subject wraps rather than scrolling.
  const subjectInput = page.locator(ROW, { hasText: "Subject" }).locator("textarea");
  await subjectInput.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Hi {{price");

  const popover = page.locator('[data-testid="token-autocomplete"]');
  await expect(popover).toBeVisible();
  await expect(popover.getByText("Products > Price", { exact: true })).toBeVisible();
  await popover.getByText("Products > Price", { exact: true }).click();
  await expect(subjectInput).toHaveValue("Hi {{product.price}}");
  await subjectInput.blur();

  await expect.poll(() => page.evaluate(() => (window as unknown as { __exported?: string }).__exported)).toContain("<title>Hi");
  const exported = await page.evaluate(() => (window as unknown as { __exported?: string }).__exported);
  // `product.price` has no scope (`scope.item` is undefined) at document
  // level, so `resolveBinding` returns "" — proving the field's OWN token
  // round-tripped through the SAME host hook the Canvas case uses, not a
  // hardcoded string.
  expect(exported).toContain("<title>Hi </title>");
  expect(exported).not.toContain("{{product");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

/**
 * P04 / issues 066 — the Inspector's "Merge tokens" row.
 *
 * The resolver has always known when a token is unresolvable (it fires an
 * `unknown-ref` diagnostic) and nothing in the builder ever drew it, so the
 * literal `{{firstName}}` went out to real subscribers with no warning
 * anywhere. These cover all three states plus the negative control, because a
 * panel that appears for every block would tell an author nothing.
 */
async function selectByRowText(page: Page, text: string): Promise<void> {
  // The row's OWN element. A `[role="treeitem"]` contains its descendants, so
  // matching a treeitem by text selects an ancestor — the trap documented in
  // P03 and walked into again in P04.
  await page.locator(".tree-node", { hasText: text }).first().click();
  await page.getByRole("tab", { name: "Settings", exact: true }).click();
}

test("the Inspector says what each merge token will actually send", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");

  // CONTROL FIRST: stock copy carries no token, so there must be no panel.
  await selectByRowText(page, "Start writing your email…");
  await expect(page.locator('[data-testid="token-check"]')).toHaveCount(0);

  // 1. a token nothing resolves — the one that gets delivered literally.
  await canvas.getByText("Start writing your email…").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Hello {{firstName}},");
  await page.keyboard.press("ControlOrMeta+Enter");
  await selectByRowText(page, "Hello {{firstName}},");
  await expect(page.locator('[data-testid="token-check:firstName"]')).toContainText("Nothing resolves this");

  // 2. one the host really has — shows the value it sends.
  await canvas.getByText("Hello {{firstName}},").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Hello {{customer.firstName}},");
  await page.keyboard.press("ControlOrMeta+Enter");
  await selectByRowText(page, "Hello {{customer.firstName}},");
  await expect(page.locator('[data-testid="token-check:customer.firstName"]')).toContainText("Jordan");

  // 3. KNOWN but empty — the "Hello ," case. `product.price` has no
  //    `scope.item` at document level, so it resolves to empty: the identical
  //    code path a subscriber with no first name on file takes.
  await canvas.getByText("Hello {{customer.firstName}},").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Hello {{product.price}},");
  await page.keyboard.press("ControlOrMeta+Enter");
  await selectByRowText(page, "Hello {{product.price}},");
  await expect(page.locator('[data-testid="token-check:product.price"]')).toContainText("closes over an empty space");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("the subject line gets the same check — a leaked token there shows in the inbox", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  await page.locator(".tree-node").first().click();
  await page.getByRole("tab", { name: "Settings", exact: true }).click();

  // By accessible name, not `ROW, {hasText:"Subject"}` — the Preview text row's
  // own copy reads "…shown next to the subject" and matches that too.
  const subject = page.getByRole("textbox", { name: /^Subject\b/ });
  await subject.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("{{firstName}}, this week at Thornbury");
  await subject.blur();

  await expect(page.locator('[data-testid="token-check:firstName"]')).toContainText("Nothing resolves this");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

/**
 * P04 / issues 071 — previewing as a different subscriber.
 *
 * One marketing email is many emails. The builder could render exactly one of
 * them — whatever the host's resolver happened to return — so an author could
 * write "show this only to the Clifton lot" and never look at what anybody else
 * received. The demo host now offers three sample recipients, two of them
 * deliberately awkward.
 */
test("the Preview renders as each sample subscriber, including the one with nothing on file", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  await canvas.getByText("Start writing your email…").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Hello {{customer.firstName}},");
  await page.keyboard.press("ControlOrMeta+Enter");

  await page.getByRole("button", { name: /Preview/i }).first().click();

  const picker = page.locator('[data-testid="preview-audience"]');
  await expect(picker).toBeVisible();
  await expect(picker.locator("option")).toHaveCount(3);

  // The iframe is `sandbox=""` on purpose, so read the `srcdoc` it is showing
  // rather than reaching into a document the sandbox is there to protect.
  const shown = async (): Promise<string> =>
    (await page.locator('iframe[title="Email preview"]').getAttribute("srcdoc")) ?? "";

  await picker.selectOption({ index: 0 });
  await expect.poll(shown).toContain("Hello Reuben,");

  await picker.selectOption({ index: 1 });
  await expect.poll(shown).toContain("Hello Priya,");

  // The one an author would otherwise never see until somebody replied.
  await picker.selectOption({ index: 2 });
  await expect.poll(shown).toContain("Hello ,");

  expect(errors, errors.join("\n")).toHaveLength(0);
});

/**
 * P04 act 8 / issues 074 — a token nothing resolves is marked ON THE CANVAS.
 *
 * The site canvas has marked an unresolvable reference for a long time; this one
 * did not. The cost showed on the last act: the newsletter starter's own footer
 * ships `<a href="{{unsubscribeUrl}}">Unsubscribe</a>`, no host in this repo
 * declares that reference, and a whole newsletter was written, reviewed and
 * composed without one word of warning — leaving every subscriber an
 * unsubscribe link pointing at the literal characters.
 */
test("the canvas marks a block whose merge token nothing resolves — including the starter's own unsubscribe", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  const canvas = page.locator(".sui-email-canvas");
  const marked = page.locator(".sui-email-canvas [data-sui-unresolved]");

  // CONTROL FIRST: the blank starter carries no token, so nothing is marked. A
  // canvas that outlined everything would tell an author nothing.
  await expect(marked).toHaveCount(0);

  // A token the host really has — still nothing marked.
  await canvas.getByText("Start writing your email…").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Hello {{customer.firstName}},");
  await page.keyboard.press("ControlOrMeta+Enter");
  await expect(canvas.getByText("Hello {{customer.firstName}},").first()).toBeVisible();
  await expect(marked).toHaveCount(0);

  // A token nothing resolves — marked.
  await canvas.getByText("Hello {{customer.firstName}},").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Your shop is {{homeShop}}.");
  await page.keyboard.press("ControlOrMeta+Enter");
  await expect(marked).toHaveCount(1);
  await expect(marked.first()).toContainText("{{homeShop}}");
  // The attribute is a hook; the OUTLINE is what a person sees. Asserting only
  // the hook passes happily with nothing drawn on the screen at all — checked,
  // by deleting the class and watching this test keep passing.
  await expect(marked.first()).toHaveClass(/outline-dashed/);
  await expect(marked.first()).toHaveClass(/outline-warning/);

  // Fixing it clears the mark, so the signal means something.
  await canvas.getByText("Your shop is {{homeShop}}.").first().dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Your shop is {{customer.homeShop}}.");
  await page.keyboard.press("ControlOrMeta+Enter");
  await expect(marked).toHaveCount(0);

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("the newsletter starter's own unsubscribe is marked the moment it lands", async ({ page }) => {
  const errors = trackErrors(page);
  await ready(page);

  await page.getByLabel("Add template").click();
  await page.getByTestId("starter:newsletter").click();
  await page.getByLabel("Template name").press("Enter");

  // Before he has typed a single word.
  const marked = page.locator(".sui-email-canvas [data-sui-unresolved]");
  await expect(marked).toHaveCount(1);
  await expect(marked.first()).toContainText("Unsubscribe");
  await expect(marked.first()).toHaveClass(/outline-dashed/);

  expect(errors, errors.join("\n")).toHaveLength(0);
});
