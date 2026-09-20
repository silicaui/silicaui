import { test, expect, type Page } from "@playwright/test";

/**
 * Two rules for the site Inspector's rail, both invisible on screen and both
 * only checkable here.
 *
 * 1. EVERY control has a name. A row was a plain `<div>` with a `<span>` above
 *    the field — which looks like a label and isn't one. Every single-control
 *    row in Settings (Name, ID, Content, ARIA label, Role, Tab index, DOM id,
 *    Title, and the custom-attribute pairs) announced as a bare "edit".
 *
 * 2. No `<label>` wraps more than one control. A `<label>` names the FIRST
 *    labelable element it wraps, and `<button>` is labelable — so wrapping a
 *    chip row in one hands the row's whole text to whichever chip comes first
 *    and leaves every other chip with no context. Those rows are `role="group"`
 *    + `aria-labelledby` instead, which names the set without taking a member's
 *    name. (The same pair of rules governs the email Inspector; see
 *    `email-inspector-a11y.spec.ts`.)
 *
 * Swept across node kinds and both tabs, because rows are per-kind — a field
 * that only appears for an Image would otherwise never be checked.
 */

const CONTROLS = "button, input:not([type=hidden]), select, textarea, [contenteditable=true]";

async function ready(page: Page): Promise<void> {
  await page.goto("/?host=demo");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

/** Audit the Inspector rail — scoped to the tab PANEL belonging to the
 *  "Inspector tab" strip, so the Navigator and toolbar aren't swept in. */
async function audit(page: Page, sel: string) {
  return page.evaluate((sel) => {
    let up = document.querySelector('[role="tablist"][aria-label="Inspector tab"]') as HTMLElement | null;
    while (up && !up.querySelector('[role="tabpanel"]')) up = up.parentElement;
    const rail = up?.querySelector('[role="tabpanel"]') as HTMLElement | null;
    if (!rail) return { total: -1, unnamed: [] as string[], hijacked: [] as string[] };

    const describe = (c: Element): string => {
      const tag = `${c.tagName.toLowerCase()}${c.getAttribute("type") ? `[${c.getAttribute("type")}]` : ""}`;
      const hint = c.getAttribute("placeholder") ?? "";
      let row = "";
      for (let el = c.parentElement, i = 0; el && i < 4; el = el.parentElement, i++) {
        const t = (el.textContent ?? "").trim();
        if (t && t.length < 50) row = t.slice(0, 40);
      }
      return `${tag}${hint ? ` ph="${hint}"` : ""}${row ? ` under "${row}"` : ""}`;
    };

    const unnamed: string[] = [];
    for (const c of Array.from(rail.querySelectorAll(sel))) {
      const named =
        c.getAttribute("aria-label") ||
        c.getAttribute("title") ||
        c.getAttribute("aria-labelledby") ||
        (c.textContent ?? "").trim() ||
        (c.id && document.querySelector(`label[for="${c.id}"]`)) ||
        c.closest("label");
      if (!named) unnamed.push(describe(c));
    }

    const hijacked: string[] = [];
    for (const label of Array.from(rail.querySelectorAll("label"))) {
      const controls = Array.from(label.querySelectorAll(sel));
      if (controls.length > 1) {
        hijacked.push(`"${(label.textContent ?? "").trim().slice(0, 45)}" → ${controls.length} controls`);
      }
      // A <label> inside a <label> is invalid HTML and leaves which one names
      // the control up to the browser — same class of defect, different shape.
      if (label.querySelector("label")) {
        hijacked.push(`"${(label.textContent ?? "").trim().slice(0, 45)}" → nested <label>`);
      }
    }
    return { total: rail.querySelectorAll(sel).length, unnamed, hijacked };
  }, sel);
}

/** Select a canvas node, then sweep both Inspector tabs. */
async function sweep(page: Page, where: string, out: { unnamed: string[]; hijacked: string[] }) {
  for (const tab of ["Design", "Settings"]) {
    const t = page.getByRole("tab", { name: tab, exact: true });
    if (!(await t.count())) continue;
    await t.click();
    const r = await audit(page, CONTROLS);
    expect(r.total, `the Inspector rail was not found for ${where}/${tab}`).toBeGreaterThan(0);
    out.unnamed.push(...r.unnamed.map((u) => `${where}/${tab}: ${u}`));
    out.hijacked.push(...r.hijacked.map((h) => `${where}/${tab}: ${h}`));
  }
}

test("every Inspector control has a name, and no label wraps a control set", async ({ page }) => {
  await ready(page);
  const out = { unnamed: [] as string[], hijacked: [] as string[] };

  // Everything inside `main` — the editable PAGE body. The frame chrome around
  // it is the inert context layer in Page mode, so clicking it just deselects.
  const targets: [string, string][] = [
    ["section", ".sui-canvas main [data-sui-id]"],
    ["heading", ".sui-canvas main h1, .sui-canvas main h2"],
    ["image", ".sui-canvas main img"],
    ["button", ".sui-canvas main .btn"],
    ["paragraph", ".sui-canvas main p"],
  ];
  for (const [name, sel] of targets) {
    const node = page.locator(sel).first();
    if (!(await node.count())) continue;
    await node.click({ force: true });
    await sweep(page, name, out);
  }

  expect(out.hijacked, `a <label> wrapping a control SET — the first control inherits the row's whole text:\n  ${out.hijacked.join("\n  ")}`).toEqual([]);
  expect(out.unnamed, `controls with no accessible name of any kind:\n  ${out.unnamed.join("\n  ")}`).toEqual([]);
});

/**
 * P05 act 4 / issues 082 — a row of chips is ONE tab stop.
 *
 * Every chip used to be its own. One Size control cost ten presses, each Padding
 * row thirteen, a colour row twelve — and measured from a keyboard with a node
 * selected and the Design tab open, the host's own toolbar button was **142 tab
 * presses away**. A keyboard user could reach the app's Publish/Send action only
 * by walking the entire right rail first.
 */
test("a row of Design chips is one tab stop, with the arrows moving inside it", async ({ page }) => {
  await page.goto("/?host=demo");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");

  await page.locator(".sui-canvas [data-sui-id]").first().click();
  await page.getByRole("tab", { name: "Design", exact: true }).click();
  await page.waitForTimeout(400);

  // Count the tab stops the whole Design tab costs, by walking it.
  const stops = await page.evaluate(() => {
    const rail = document.querySelector('[data-testid="breakpoint-bar"]')?.parentElement;
    if (!rail) return -1;
    return [...rail.querySelectorAll<HTMLElement>("button, input, select, textarea, [tabindex]")].filter(
      (el) => el.getAttribute("tabindex") !== "-1" && !(el as HTMLButtonElement).disabled,
    ).length;
  });
  // It was 141 before this fix. The exact number moves as controls are added;
  // what must not come back is one-stop-per-chip, and 60 is far below that.
  expect(stops, `the Design tab costs ${stops} tab stops`).toBeLessThan(60);

  // A padding row: one chip in the tab order, the rest reachable by arrow.
  const row = page.getByTestId("row-padding-x");
  const chips = row.locator("button");
  const count = await chips.count();
  expect(count).toBeGreaterThan(5);
  const inOrder = await row.evaluate((el) =>
    [...el.querySelectorAll("button")].filter((b) => b.tabIndex === 0).length,
  );
  expect(inOrder, "exactly one chip is in the tab order").toBe(1);

  // Arrow keys move within it, and the chip they land on is really focused.
  await chips.first().focus();
  const firstName = await page.evaluate(() => document.activeElement?.textContent?.trim());
  await page.keyboard.press("ArrowRight");
  const secondName = await page.evaluate(() => document.activeElement?.textContent?.trim());
  expect(secondName).not.toBe(firstName);
  await page.keyboard.press("ArrowLeft");
  expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toBe(firstName);

  // End jumps to the last chip — thirteen padding chips are a long arrow away.
  await page.keyboard.press("End");
  const lastName = await page.evaluate(() => document.activeElement?.textContent?.trim());
  expect(lastName).not.toBe(firstName);

  // And a chip still WORKS when pressed, so this is navigation and not a
  // fix that made the controls unreachable.
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  const pressed = await row.evaluate((el) =>
    [...el.querySelectorAll("button")].some((b) => b.getAttribute("aria-pressed") === "true" && b.className.includes("btn-primary")),
  );
  expect(pressed, "the chip the keyboard landed on took effect").toBe(true);
});
