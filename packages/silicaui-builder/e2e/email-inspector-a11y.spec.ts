import { test, expect, type Page } from "@playwright/test";

/**
 * The email Inspector's rows must not hijack a control's accessible name.
 *
 * A `<label>` names the FIRST labelable element it wraps — and `<button>` is
 * labelable. So a row built as `<label><span>Padding Y</span><chips…/></label>`
 * hands the whole row's text to whichever chip happens to come first: the Auto
 * chip announced as "Padding Y 0 2 4 6 8 44", and every other chip announced
 * with no context at all. It renders correctly and reads correctly on screen,
 * which is exactly why it survived — the defect is only visible in the
 * accessibility tree.
 *
 * This asserts the general rule rather than a list of known-bad rows: a `<label>`
 * may wrap at most ONE labelable control. A row of controls is a `role="group"`
 * named by `aria-labelledby` instead, which names the SET without stealing any
 * member's own name.
 *
 * Swept across several node kinds because rows are per-kind — a chip row that
 * only appears for a Button would otherwise never be checked.
 */

const LABELABLE = "button, input:not([type=hidden]), select, textarea, meter, output, progress";

interface Bus {
  __ready?: boolean;
}

async function ready(page: Page): Promise<void> {
  await page.goto("/?editor=email&persist=0");
  await page.waitForFunction(() => (window as Bus).__ready === true);
  await page.waitForSelector(".sui-email-canvas");
}

/** Every `<label>` on the page wrapping more than one control, with the text
 *  that would be stolen and the controls it collides over. */
async function hijackingLabels(page: Page, sel: string) {
  return page.evaluate((sel) => {
    const out: { text: string; controls: string[] }[] = [];
    for (const label of Array.from(document.querySelectorAll("label"))) {
      const controls = Array.from(label.querySelectorAll(sel));
      if (controls.length > 1) {
        out.push({
          text: (label.textContent ?? "").trim().slice(0, 60),
          controls: controls.slice(0, 6).map((c) => `${c.tagName.toLowerCase()}:${(c.textContent ?? "").trim().slice(0, 12)}`),
        });
      }
    }
    return out;
  }, sel);
}

async function insert(page: Page, key: string): Promise<void> {
  await page.getByRole("tab", { name: "Insert" }).click();
  await page.locator(`[data-insert-key="${key}"]`).click();
}

test("no Inspector row steals a control's accessible name", async ({ page }) => {
  await ready(page);

  const found: { where: string; text: string; controls: string[] }[] = [];
  const sweep = async (where: string) => {
    for (const tab of ["Design", "Settings"]) {
      const t = page.getByRole("tab", { name: tab, exact: true });
      if (await t.count()) await t.click();
      for (const hit of await hijackingLabels(page, LABELABLE)) found.push({ where: `${where}/${tab}`, ...hit });
    }
  };

  // The seeded section + text and the document root, then one of every kind that
  // carries its own field set. Navigator order at boot: Email, Section, Text —
  // taken before any insert shifts it.
  // Deepest first: clicking a container row also toggles it shut, which would
  // take its children out of the tree before we got to them.
  await expect(page.locator(".tree-node")).toHaveCount(3);
  await page.locator(".tree-node").nth(2).click();
  await sweep("text");
  await page.locator(".tree-node").nth(1).click();
  await sweep("section");
  await page.locator(".tree-node").first().click();
  await sweep("body");
  for (const key of ["button", "image", "divider", "spacer", "social", "video", "html", "columns-2", "link"]) {
    await insert(page, key);
    await sweep(key);
  }

  expect(
    found,
    `rows whose <label> wraps several controls (the first one inherits the row's whole text):\n${found
      .map((f) => `  ${f.where}: "${f.text}" → ${f.controls.join(", ")}`)
      .join("\n")}`,
  ).toEqual([]);
});

/**
 * The positive half: what a screen reader now actually gets. The rule above only
 * says nothing is stolen; this says the row still HAS a name and each control
 * keeps its own — which is the thing a user notices.
 */
test("a control row names the set, and each control keeps its own name", async ({ page }) => {
  await ready(page);
  await page.locator(".tree-node").nth(1).click(); // the seeded section

  // The row is a named group...
  const padding = page.getByRole("group", { name: "Padding Y" });
  await expect(padding).toHaveCount(1);
  // ...and its chips are "Auto", "0", "2"… — not "Padding Y 0 2 4 6 8", which is
  // what the Auto chip was called when a <label> wrapped the row.
  await expect(padding.getByRole("button", { name: "Auto", exact: true })).toHaveCount(1);
  await expect(padding.getByRole("button", { name: "4", exact: true })).toHaveCount(1);

  // A swatch row's reset control is icon-only, so its name legitimately comes
  // from `title` — asserted so the distinction is on the record rather than
  // rediscovered as "getByRole doesn't work here".
  const background = page.getByRole("group", { name: "Background" }).first();
  await expect(background.getByRole("button", { name: "Reset to default" })).toHaveCount(1);

  // A single-control row stays a real <label>, which is stronger than a group
  // name — the input is reachable by its own label in a screen reader's forms mode.
  await page.getByRole("tab", { name: "Settings", exact: true }).click();
  await page.locator(".tree-node").first().click();
  await expect(page.getByRole("textbox", { name: "Subject" })).toHaveCount(1);
});
