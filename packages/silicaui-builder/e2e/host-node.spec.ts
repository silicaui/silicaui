import { test, expect, type Page } from "@playwright/test";

/**
 * Host NODES (host-nodes-and-node-locking spec §A) end to end through the real
 * chrome: the demo `BuilderHost.hostComponents()` shows in the Insert palette,
 * inserting one renders the host's live component (`renderHostNode`) on the
 * canvas, its declared props edit through the Inspector's Host panel, and a
 * `pinned` component inserts host-locked + non-deletable. Mounted via
 * `?host=demo` (the demo host lives in `harness/main.tsx`).
 */

async function ready(page: Page): Promise<void> {
  await page.goto("/?host=demo");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

async function insertHost(page: Page, name: string): Promise<void> {
  await page.getByRole("tab", { name: "Insert" }).click();
  await page.locator(`[data-insert-key="host:${name}"]`).click();
  await page.getByRole("tab", { name: "Layers" }).click(); // back to selection view
}

async function openSettings(page: Page): Promise<void> {
  await page.locator('[aria-label="Inspector tab"]').getByText("Settings").click();
}

test("insert a host component, see it render live, and edit its props", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  // The host component is in the Insert palette (its own "Commerce" group).
  await insertHost(page, "PriceTag");

  // It renders the host's LIVE component (`renderHostNode`), not a placeholder.
  const tag = canvas.getByTestId("host-pricetag");
  await expect(tag).toHaveText("USD 9.99");

  // Select it on the canvas → Settings → the Host panel edits its declared props.
  await tag.click();
  await openSettings(page);
  const amount = page.getByTestId("host-prop:amount");
  await amount.fill("25");
  await amount.blur();

  // The live preview reflects the new prop (preview == production, through the host).
  await expect(tag).toHaveText("USD 25.00");
});

/**
 * The palette + inspector RENDERING of a host def. Everything below is invisible
 * to a tree assertion or an HTML snapshot — it is what the author reads — which
 * is exactly why the whole class of it once shipped past a full render sweep.
 */
test("a host component is a first-class palette row", async ({ page }) => {
  await ready(page);
  await page.getByRole("tab", { name: "Insert" }).click();

  // The registered icon renders, rather than a generic plug for every host row.
  const priceRow = page.locator('[data-insert-key="host:PriceTag"]');
  await expect(priceRow.locator("[data-icon]").first()).toHaveAttribute("data-icon", "pricing");
  await expect(page.locator('[data-insert-key="host:CheckoutWidget"] [data-icon]').first()).toHaveAttribute(
    "data-icon",
    "cta",
  );

  // `hint` reaches the row as its tooltip — a real one now, not a native
  // `title`, so it's asserted by hovering rather than by reading an attribute.
  await priceRow.hover();
  await expect(
    page.getByText("The live price of the product this page is about.", { exact: true }),
  ).toBeVisible();

  // `category` is display copy: "Media" names a shelf the builder already has,
  // so the row lands INSIDE it — one heading, not two identical ones.
  await expect(page.getByRole("heading", { name: "Media", exact: true })).toHaveCount(1);
  const mediaSection = page.locator("section", { has: page.getByRole("heading", { name: "Media", exact: true }) });
  await expect(mediaSection.locator('[data-insert-key="host:video.reel"]')).toBeVisible();
  await expect(mediaSection.locator('[data-insert-key="carousel"]')).toBeVisible();

  // `catalog().hide` reaches a host row — the bare frame is registered (it still
  // renders and takes props) but is not offered for direct placement.
  await expect(page.locator('[data-insert-key="host:ReelFrame"]')).toHaveCount(0);

  // The hint feeds search ranking too, so a word that is in neither the label nor
  // the key still finds the row.
  await page.getByLabel("Search the insert catalog").fill("looping");
  await expect(page.locator("[data-insert-key]").first()).toHaveAttribute("data-insert-key", "host:video.reel");
});

test("a placed host component keeps the name and glyph its host registered", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  await insertHost(page, "PriceTag");
  await canvas.getByTestId("host-pricetag").click();

  // The identity header reads the registered LABEL, never the allowlist key
  // ("Price Tag", not "PriceTag"), and calls the node what it is — a host
  // component is not an Outlet.
  const header = page.locator("[data-testid='inspector-identity']");
  await expect(header).toContainText("Price Tag");
  await expect(header).toContainText("Host component");
  await expect(header.locator("[data-icon]").first()).toHaveAttribute("data-icon", "pricing");

  // The Navigator row agrees — same name, same glyph, so the thing you inserted
  // is recognisably the thing you just clicked in the palette.
  const row = page.getByRole("treeitem", { name: "Price Tag", exact: true });
  await expect(row).toBeVisible();
  await expect(row.locator("[data-icon]").first()).toHaveAttribute("data-icon", "pricing");
});

/**
 * A search row is where the author is reading NAMES rather than scanning
 * sections (the browse list renders its group as a heading and passes no badge),
 * so the group badge is the redundant half of that row and has to be what gives
 * way. "Video, audio & maps" is 19 characters — the width at which a `shrink-0`
 * badge used to keep every pixel and truncate the name to nothing.
 */
test("a narrow palette drops a search row's category before its name", async ({ page }) => {
  await ready(page);
  await page.getByRole("tab", { name: "Insert" }).click();
  await page.getByLabel("Search the insert catalog").fill("store map");

  const row = page.locator('[data-insert-key="host:store.map"]');
  await expect(row).toBeVisible();
  const name = row.getByText("Store map", { exact: true });
  const badge = row.getByText("Video, audio & maps", { exact: true });
  const [fullName, fullBadge] = await Promise.all([
    name.evaluate((el) => el.getBoundingClientRect().width),
    badge.evaluate((el) => el.getBoundingClientRect().width),
  ]);
  expect(fullBadge).toBeGreaterThan(fullName); // the badge really is the wider half

  // Squeeze the results list to a compact dock — a tear-off pane, a narrow host
  // panel. "Make the panel wider" is not available to a host: the dock is theirs.
  const squeezeTo = async (px: number) => {
    await row.evaluate((el, w) => {
      (el.closest("section") as HTMLElement).style.width = `${w}px`;
    }, px);
    return Promise.all([
      name.evaluate((el) => el.getBoundingClientRect().width),
      badge.evaluate((el) => el.getBoundingClientRect().width),
    ]);
  };

  // Tight: the category is the only one that gave anything up.
  const [name180, badge180] = await squeezeTo(180);
  expect(name180).toBeCloseTo(fullName, 0);
  expect(badge180).toBeLessThan(fullBadge * 0.9);

  // Tighter than both can fit: the category collapses to nothing FIRST, and the
  // name is still naming something rather than truncated away.
  const [name110, badge110] = await squeezeTo(110);
  expect(badge110).toBeLessThan(fullBadge * 0.1);
  expect(name110).toBeGreaterThan(30);
});

test("a pinned host component inserts host-locked and non-deletable", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  await insertHost(page, "CheckoutWidget");
  const checkout = canvas.getByTestId("host-checkout");
  await expect(checkout).toBeVisible();

  // Settings shows it host-locked: the "Locked by host" indicator, and NO author
  // unlock toggle (only the host can clear a host lock).
  await checkout.click();
  await openSettings(page);
  await expect(page.getByTestId("settings-lock-host")).toBeVisible();
  await expect(page.getByTestId("settings-lock")).toHaveCount(0);

  // Delete is refused — it stays on the canvas.
  await page.getByRole("tab", { name: "Layers" }).click(); // move focus off inputs, keep selection
  await page.keyboard.press("Delete");
  await expect(checkout).toBeVisible();
});
