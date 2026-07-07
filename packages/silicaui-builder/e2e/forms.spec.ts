import { test, expect, type Page } from "@playwright/test";

/**
 * Phase 1 (forms-first) guard: the Insert palette can add each native form control
 * and every one renders on the canvas through the component-expansion path with
 * ZERO React warnings. Form controls are the trap here — React logs a console.error
 * if `value`/`checked` reach a field without `onChange`, or if a `<textarea>` gets
 * children. The Canvas renders them uncontrolled (value→defaultValue, etc.), so a
 * clean insert proves that normalization holds.
 *
 * Each control is a `ComponentDef` that lowers to a real tag (`<input>`, `<select>`,
 * `<textarea>`), so a passing render is also proof the macro path needs no per-
 * component Canvas branch.
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

/** Open the Insert tab and click a palette row to insert it into the page. */
async function insert(page: Page, key: string): Promise<void> {
  await page.getByRole("button", { name: "Insert" }).click();
  await page.locator(`[data-insert-key="${key}"]`).click();
}

test("inserting each form control renders it on the canvas with no React warning", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  // Input → <input>, uncontrolled (no value/onChange warning).
  await insert(page, "input");
  await expect(canvas.locator("input[data-sui-id]").first()).toBeVisible();

  // Textarea → <textarea> (children lifted to defaultValue, no textarea-children warning).
  await insert(page, "textarea");
  await expect(canvas.locator("textarea[data-sui-id]").first()).toBeVisible();

  // Select → <select> with its options expanded as <option> children.
  await insert(page, "select");
  const select = canvas.locator("select[data-sui-id]").first();
  await expect(select).toBeVisible();
  expect(await select.locator("option").count()).toBeGreaterThanOrEqual(2);

  // Checkbox / Radio / Toggle → typed <input>s.
  await insert(page, "checkbox");
  await expect(canvas.locator('input[type="checkbox"][data-sui-id]').first()).toBeVisible();
  await insert(page, "radio");
  await expect(canvas.locator('input[type="radio"][data-sui-id]').first()).toBeVisible();

  // The whole run must be free of React's controlled-input / DOM-property warnings.
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("editing a control's props in the Inspector updates the published markup", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  await insert(page, "input");
  const input = canvas.locator("input[data-sui-id]").first();
  await input.click(); // select → the Inspector shows the Input's prop editors

  // The Inspector shows a "Placeholder" row (label + control); edit it and the
  // change lowers to the canvas input's placeholder attribute.
  const placeholder = page.locator("div.mb-2", { hasText: "Placeholder" }).locator("input");
  await placeholder.fill("you@example.com");
  await placeholder.blur(); // commit
  await expect(input).toHaveAttribute("placeholder", "you@example.com");

  // The Required toggle (the only role=switch — the canvas control has no role) sets
  // the boolean prop, which lowers to a bare `required` attribute on the element.
  await page.locator('[role="switch"]').first().click();
  await expect(input).toHaveAttribute("required", "");

  // Both edits flowed out through onChange.
  const changes = await page.evaluate(
    () => (window as unknown as { __changeCount?: number }).__changeCount ?? 0,
  );
  expect(changes).toBeGreaterThanOrEqual(2);
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("inserting a Field wires a label + input, and a Form nests a field + submit", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  // Field is a container macro: its label + input are real, selectable child nodes.
  await insert(page, "field");
  const field = canvas.locator("div.field[data-sui-id]").first();
  await expect(field).toBeVisible();
  await expect(field.locator("label.field-label")).toBeVisible();
  await expect(field.locator("input")).toBeVisible();

  // Form lowers to a <form> holding a field + a submit button.
  await insert(page, "form");
  const form = canvas.locator("form[data-sui-id]").first();
  await expect(form).toBeVisible();
  await expect(form.locator("input")).toBeVisible();
  await expect(form.locator('button[type="submit"]')).toBeVisible();

  expect(errors, errors.join("\n")).toHaveLength(0);
});
