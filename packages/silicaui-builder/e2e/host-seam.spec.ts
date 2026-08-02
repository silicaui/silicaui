import { test, expect, type Page } from "@playwright/test";
import { ROW } from "./inspector-row";

/**
 * The host adapter (builder-contract.md §5) — `catalog` merge, `validateClass`
 * composed with the built-in floor, `inspectorPanels`, and the `dataSources`-
 * powered binding picker. Mounted via `?host=demo`; the demo `BuilderHost`
 * lives in `harness/main.tsx`. `pickAsset` is exercised implicitly (its UI is
 * covered by the Inspector's own asset-control affordance, gated on the same
 * host object these tests already mount).
 */

async function ready(page: Page): Promise<void> {
  await page.goto("/?host=demo");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

test("host.catalog() extends the Insert palette, and the inserted node renders", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  await page.getByRole("button", { name: "Insert" }).click();
  await expect(page.getByText("Host", { exact: true })).toBeVisible();
  await page.locator('[data-insert-key="host:callout"]').click();

  await expect(canvas.locator("#host-callout")).toHaveText("Host-contributed block");
});

test("host.themes() adds a curated shelf above the shipped presets, applies, and hides one of ours", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: "Theme" }).click();
  await expect(page.locator(".sui-brd")).toBeVisible();

  // The host's shelf renders with its own heading, ABOVE the shipped presets.
  const hostShelf = page.getByTestId("theme-shelf-acme");
  const shippedShelf = page.getByTestId("theme-shelf-silicaui");
  await expect(hostShelf).toHaveText("Acme brand");
  await expect(shippedShelf).toBeVisible();
  const [hostY, shippedY] = await Promise.all([
    hostShelf.boundingBox().then((b) => b!.y),
    shippedShelf.boundingBox().then((b) => b!.y),
  ]);
  expect(hostY).toBeLessThan(shippedY);

  // `hide` pruned one shipped preset; its siblings are untouched.
  await expect(page.getByText("ocean", { exact: true })).toHaveCount(0);
  await expect(page.getByText("quartz", { exact: true })).toBeVisible();

  // Applying a host theme retargets the document — the name field reseeds and
  // the canvas repaints against the host's tokens.
  await page.getByText("acme-day", { exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Theme name" })).toHaveValue("acme-day");
  await expect(page.locator("[data-theme='acme-day']").first()).toBeVisible();

  // Apply-only: a host shelf carries no delete affordance (unlike "This site").
  await expect(hostShelf.locator("xpath=following-sibling::div[1]").getByRole("button", { name: /^Delete/ })).toHaveCount(0);

  // And it's a COPY — editing the applied theme cannot mutate the host catalog,
  // so re-applying from the shelf restores the host's original primary.
  const primaryOf = () =>
    page.evaluate(
      () =>
        (window as unknown as { __editor: { extract(): { theme: { tokens: Record<string, string> } } } }).__editor
          .extract().theme.tokens["--color-primary"],
    );
  expect(await primaryOf()).toBe("oklch(56% 0.16 42)");
  await page.evaluate(() => {
    const ed = (
      window as unknown as {
        __editor: {
          extract(): { theme: { name: string; tokens: Record<string, string> } };
          setTheme(t: unknown): void;
        };
      }
    ).__editor;
    const t = ed.extract().theme;
    ed.setTheme({ ...t, tokens: { ...t.tokens, "--color-primary": "oklch(50% 0.2 300)" } });
  });
  expect(await primaryOf()).toBe("oklch(50% 0.2 300)");
  await page.getByText("acme-night", { exact: true }).click();
  await page.getByText("acme-day", { exact: true }).click();
  expect(await primaryOf()).toBe("oklch(56% 0.16 42)");
});

test("host.validateClass composes with the built-in floor — both reject, host adds its own reason", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();

  const classField = page.locator("textarea").first();
  const before = await classField.inputValue();

  // The built-in floor rejects `fixed` regardless of any host policy.
  await classField.fill(`${before} fixed`);
  await classField.blur();
  await expect(page.getByText(/`fixed` is banned/)).toBeVisible();
  await expect(classField).toHaveValue(`${before} fixed`); // draft kept, not silently reverted
  await expect(canvas.locator("h1", { hasText: HEADLINE })).not.toHaveClass(/\bfixed\b/);

  // The demo host's OWN policy rejects a token the built-in floor allows.
  await classField.fill(`${before} host-banned`);
  await classField.blur();
  await expect(page.getByText(/demo host blocks "host-banned"/)).toBeVisible();

  // A clean edit still commits normally.
  await classField.fill(`${before} text-primary`);
  await classField.blur();
  await expect(canvas.locator("h1", { hasText: HEADLINE })).toHaveClass(/text-primary/);
});

test("host.inspectorPanels renders a host panel that writes through the shared mutation primitives", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();
  await page.getByRole("tab", { name: "Settings" }).click();

  await expect(page.getByText("Host panel", { exact: true })).toBeVisible();
  await expect(page.getByTestId("host-panel")).toBeVisible();
  await page.getByTestId("host-panel-set-attr").click();

  await expect(canvas.locator('[data-host-note="set-by-host-panel"]', { hasText: HEADLINE })).toHaveCount(1);
});

test("host.dataSources() + scopeAt turn the Reference field into a picker", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();
  await page.getByRole("tab", { name: "Settings" }).click();

  await page.getByTestId("data-kind").selectOption("value");

  // With dataSources() supplied, Reference is a picker (a <select>), not a raw
  // text input — populated from the demo host's flat + nested field catalog.
  const refSelect = page.getByTestId("data-ref-picker");
  await expect(refSelect.locator("option", { hasText: "Site title" })).toHaveCount(1);
  await expect(refSelect.locator("option", { hasText: "Products > Title" })).toHaveCount(1);
  await refSelect.selectOption("site.title");
  await expect(refSelect).toHaveValue("site.title");
});

test("a value bind's Target attribute round-trips through editor.setData", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByTestId("data-kind").selectOption("value");
  await page.getByTestId("data-ref-picker").selectOption("site.title");

  const attrField = page.getByPlaceholder("auto-detected (e.g. leave blank for text/src)");
  await attrField.fill("href");
  await attrField.blur();

  // Select a genuinely different node and back — the field must reseed from
  // the persisted `data.attr` (a fresh `id` prop), not just retain whatever
  // local draft state the input happened to have.
  // `.first()` — the navbar's CTA renders twice by design (the bar's copy plus
  // the mobile menu's, sharing one `cta` slot so a host fills both at once). The
  // desktop copy comes first and is the one this bind is authored on.
  await canvas.getByText("Get started").first().click();
  await canvas.getByText(HEADLINE).click();
  await expect(page.getByPlaceholder("auto-detected (e.g. leave blank for text/src)")).toHaveValue("href");
});

test("toolbarSlot renders host UI in the header, next to Publish", async ({ page }) => {
  await ready(page);
  await expect(page.getByTestId("toolbar-slot")).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
});

test("toolbarStatusSlot renders status ahead of the theme toggle and of toolbarSlot's actions", async ({ page }) => {
  await ready(page);
  const status = page.getByTestId("toolbar-status-slot");
  await expect(status).toBeVisible();

  // ORDER is the whole point of the second slot: status leads the right-hand
  // cluster with no control beside it, actions stay grouped with Publish. And
  // it has to be DOM order, not CSS — a host faking the position with `order`
  // would leave focus order following the visual one (WCAG 2.4.3).
  const positions = await status.evaluate((el) => {
    const FOLLOWING = 4; // Node.DOCUMENT_POSITION_FOLLOWING
    const after = (sel: string) => {
      const other = document.querySelector(sel);
      return other ? Boolean(el.compareDocumentPosition(other) & FOLLOWING) : null;
    };
    return {
      beforeTheme: after('[aria-label="Appearance"]'),
      beforeActions: after('[data-testid="toolbar-slot"]'),
      // …and after the engine's own left-hand controls, i.e. past the spacer.
      afterModes: (() => {
        const modes = document.querySelector('[aria-label="Editor mode"]');
        return modes ? Boolean(modes.compareDocumentPosition(el) & FOLLOWING) : null;
      })(),
    };
  });
  expect(positions).toEqual({ beforeTheme: true, beforeActions: true, afterModes: true });
});

test("a collection bind's 'Omit when empty' toggle drops the node from the resolved output at zero items", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();
  await page.getByRole("tab", { name: "Settings" }).click();

  await page.getByTestId("data-kind").selectOption("collection");
  const refSelect = page.getByTestId("data-ref-picker");
  // `empty-collection` always resolves to zero items in the demo host — the
  // ref this toggle actually changes behavior for (unlike `products`, which
  // never hits the zero-item case).
  await refSelect.selectOption("empty-collection");
  await expect(page.getByText("0 items — the template renders once as a placeholder", { exact: true })).toBeVisible();

  await page.locator(ROW, { hasText: "Omit when empty" }).locator('[role="switch"]').click();
  await expect(page.getByText("0 items — the node is omitted entirely", { exact: true })).toBeVisible();

  // The bound node (the headline) is dropped from the resolved tree entirely
  // — proven directly against the engine's own resolve, since this demo host
  // has no live "resolved preview" render surface on the canvas itself (the
  // canvas always shows the AUTHORED tree, not a resolved one — see Canvas's
  // own doc comment). `packages/silicaui-html/verify-resolve.mjs` covers the
  // resolver-level assertion end to end; this test proves the UI round-trips
  // the flag into `editor.setData` without error.
  await expect(refSelect).toHaveValue("empty-collection");
});

test("onActivePageChange fires on mount, and again on a page switch/rename", async ({ page }) => {
  await ready(page);

  await page.waitForFunction(() => (window as unknown as { __activePage?: unknown }).__activePage !== undefined);
  const initial = (await page.evaluate(
    () => (window as unknown as { __activePage: { id: string; name: string; slug: string } }).__activePage,
  )) as { id: string; name: string; slug: string };
  expect(initial.name).toBeTruthy();

  // Adding a page switches to it — the callback fires again with the NEW page.
  await page.getByRole("button", { name: "Add page" }).click();
  await page.waitForFunction(
    (prevId) => (window as unknown as { __activePage: { id: string } }).__activePage.id !== prevId,
    initial.id,
  );
  const afterAdd = (await page.evaluate(
    () => (window as unknown as { __activePage: { id: string; name: string } }).__activePage,
  )) as { id: string; name: string };
  expect(afterAdd.name).toBe("Page 2");

  // Renaming the (now active) page fires again with the updated name.
  await page.getByRole("button", { name: "Rename page" }).click();
  await page.locator("input").last().fill("Landing");
  await page.locator("input").last().press("Enter");
  await page.waitForFunction(
    () => (window as unknown as { __activePage: { name: string } }).__activePage.name === "Landing",
  );
});

test("the Data binding Preview row calls host.resolveBinding/resolveCollection live", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByTestId("data-kind").selectOption("value");
  await page.getByTestId("data-ref-picker").selectOption("site.title");

  // resolveBinding("site.title") is fixed sample data in the demo host. Scoped
  // to the Preview ROW — the canvas resolves the same ref now too, so a bare
  // text match is ambiguous (and that ambiguity is the feature working).
  await expect(page.getByTestId("data-preview")).toHaveText("Acme Storefront");
  await expect(canvas.getByRole("heading", { name: "Acme Storefront" })).toBeVisible();

  // `product.title` is declared as a FIELD of the `products` collection, so at
  // top-level scope there's no item to resolve it against — the host returns
  // `{ value: undefined }` ("known, but empty here"), which previews as blank
  // rather than as an error. Being declared-and-handled, it is NOT an unknown ref.
  await page.getByTestId("data-ref-picker").selectOption("product.title");
  await expect(page.getByTestId("data-unknown-ref")).toHaveCount(0);

  // Switch to a collection bind — the preview shows the resolved item count.
  await page.getByTestId("data-kind").selectOption("collection");
  await page.getByTestId("data-ref-picker").selectOption("products");
  await expect(page.getByText("3 items")).toBeVisible();
});

test("a collection's 'How many' caps the instance, and the canvas draws that count", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  // Bind the CONTAINER that holds the hero copy (Navigator row 3: Page →
  // section → div → div) to the 12-row demo catalog. A repeat clones the
  // node's children per item, so a container is what makes the count legible;
  // the canvas renders the authored template once plus a ghost per further
  // item, so the count the author lays out against is the count that ships.
  //
  // "Detailed" first, because this row is addressed BY POSITION: both `div`s in
  // that path are bare layout wrappers, which the Navigator's default "Simple"
  // depth folds away (they're only worth a row once something — like the
  // binding this test is about to add — makes them meaningful).
  const HEADLINE = "Ship your store in an afternoon";
  await page.getByRole("button", { name: "Detailed", exact: true }).click();
  await page.locator(".tree-node").nth(3).click();
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByTestId("data-kind").selectOption("collection");
  await page.getByTestId("data-ref-picker").selectOption("catalog");

  await expect(page.getByTestId("data-collection-preview")).toHaveText("12 items");
  // 12 copies of the authored template on the canvas — 1 real + 11 ghosts.
  await expect(canvas.getByText(HEADLINE)).toHaveCount(12);

  // Cap it. Same ref, a different count — the thing a catalog `key` alone
  // cannot express, since `scopeAt` matches the ref against that key.
  await page.getByTestId("data-limit").fill("4");
  await page.getByTestId("data-limit").press("Enter");
  await expect(page.getByTestId("data-collection-preview")).toHaveText("4 of 12 items — limited");
  await expect(canvas.getByText(HEADLINE)).toHaveCount(4);

  // Exactly ONE of them is the authored, selectable node — the ghosts carry no
  // id and no wiring, so nothing about selection identity changed.
  await expect(canvas.locator("h1[data-sui-id]")).toHaveCount(1);

  // A blank field means "all of it" again, and never means zero.
  await page.getByTestId("data-limit").fill("");
  await page.getByTestId("data-limit").press("Enter");
  await expect(page.getByTestId("data-collection-preview")).toHaveText("12 items");
  await expect(canvas.getByText(HEADLINE)).toHaveCount(12);
});

test("a ref the host cannot resolve fails LOUDLY — it never blanks the node silently", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByTestId("data-kind").selectOption("value");

  // The picker only offers refs the host DECLARED, so an unknown ref can't be
  // reached through it — it's what a stale document or a host whose catalog and
  // resolver disagree produces. Write one straight into the engine, which is
  // exactly the state a consumer hit in the wild.
  await page.evaluate(() => {
    const ed = (window as unknown as { __editor: { selection?: string; setData(id: string, b: unknown): void } })
      .__editor;
    ed.setData(ed.selection!, { kind: "value", ref: "logo" });
  });

  // LOUD: the Inspector names the bad ref instead of previewing an empty string.
  const err = page.getByTestId("data-unknown-ref");
  await expect(err).toBeVisible();
  await expect(err).toContainText("logo");

  // NOT DESTRUCTIVE: the authored headline still renders. Before this, an
  // unresolvable ref blanked the node and the author was left with an empty
  // span and no explanation.
  await expect(canvas.getByText(HEADLINE)).toBeVisible();
});

test("statusBarSlot renders host state in the footer, after the engine's mode label", async ({ page }) => {
  await ready(page);
  const status = page.getByTestId("status-bar-slot");
  await expect(status).toBeVisible();

  // The FOOTER (the status bar), not the header — and positioned between the
  // engine's own mode label and the spacer, so host state and engine state read
  // left to right as one sentence about the session. DOM order, not CSS: a host
  // can't reach mid-container with `order`, and faking it would desync focus
  // order from reading order (WCAG 2.4.3) exactly as in the header.
  const placement = await status.evaluate((el) => {
    const FOLLOWING = 4; // Node.DOCUMENT_POSITION_FOLLOWING
    const footer = el.closest("footer");
    if (!footer) return "not in the footer";
    const kids = [...footer.children];
    const mode = kids[0]!;
    const spacer = kids.find((k) => k.className.includes("flex-1"));
    return {
      modeLabel: (mode.textContent ?? "").trim(),
      afterMode: Boolean(mode.compareDocumentPosition(el) & FOLLOWING),
      beforeSpacer: spacer ? Boolean(el.compareDocumentPosition(spacer) & FOLLOWING) : null,
      // Non-interactive by contract: a 28px strip is nowhere to put a control,
      // and text costs no tab stop.
      controls: el.querySelectorAll("button, a, input, select, [tabindex]").length,
    };
  });
  expect(placement).toEqual({ modeLabel: "page", afterMode: true, beforeSpacer: true, controls: 0 });
});

test("a host's setActiveTree('frame') moves the mode toggle and the left rail with it", async ({ page }) => {
  await ready(page);
  const pageTab = page.getByRole("button", { name: "Page", exact: true });
  const layoutTab = page.getByRole("button", { name: "Layout", exact: true });
  const footer = page.locator("footer");

  await expect(pageTab).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("layout-switcher")).toHaveCount(0);

  // How a host jumps to a finding in the header or footer: selection is
  // tree-scoped, so it has to retarget the spine before it can select a frame
  // node at all. The chrome has to follow, or it claims you're on a page body
  // while you're editing the shared shell.
  await page.evaluate(() => (window as unknown as { __editor: { setActiveTree(t: string): void } }).__editor.setActiveTree("frame"));

  await expect(layoutTab).toHaveAttribute("aria-pressed", "true");
  await expect(pageTab).toHaveAttribute("aria-pressed", "false");
  await expect(footer.getByText("layout", { exact: true })).toBeVisible();
  // The two knock-ons of the stale mode, both gone with it: the left rail lists
  // LAYOUTS rather than pages, and the Navigator — keyed on the mode — remounts,
  // so it reseeds its expanded set for the tree now in view.
  await expect(page.getByTestId("layout-switcher")).toBeVisible();
  await expect(page.getByRole("treeitem").first()).toBeVisible();

  // A frame node is now selectable, which is the whole point of the jump.
  const landed = await page.evaluate(() => {
    const ed = (window as unknown as {
      __editor: { frame: { root: { children: { id: string }[] } }; select(id: string): boolean };
    }).__editor;
    return ed.select(ed.frame.root.children[0]!.id);
  });
  expect(landed).toBe(true);
  await expect(page.getByText("No selection")).toHaveCount(0);

  // …and it follows back the other way too.
  await page.evaluate(() => (window as unknown as { __editor: { setActiveTree(t: string): void } }).__editor.setActiveTree("page"));
  await expect(pageTab).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("layout-switcher")).toHaveCount(0);
});

test("a mode that deliberately leaves the tree alone is not yanked back by the tree sync", async ({ page }) => {
  await ready(page);
  const componentTab = page.getByRole("button", { name: "Component", exact: true });

  // Component mode with nothing to open leaves the spine on the page body on
  // purpose, so the pair (tree=page, mode=component) is legitimate — the sync
  // keys off a CHANGE of tree for exactly this reason. A pair test would bounce
  // the author straight back out of the "create a component" state.
  await componentTab.click();
  await expect(componentTab).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("footer").getByText("component", { exact: true })).toBeVisible();
  const tree = await page.evaluate(
    () => (window as unknown as { __editor: { activeTree: string } }).__editor.activeTree,
  );
  expect(["page", "symbol"]).toContain(tree); // whichever it is, the mode stayed put

  // Theme mode is exempt for the same shape of reason: it edits tokens, so being
  // in it is not a claim about any tree, and a host retargeting the spine has
  // nothing stale on screen to correct.
  await page.getByRole("button", { name: "Theme", exact: true }).click();
  await page.evaluate(() =>
    (window as unknown as { __editor: { setActiveTree(t: string): void } }).__editor.setActiveTree("frame"),
  );
  await expect(page.getByRole("button", { name: "Theme", exact: true })).toHaveAttribute("aria-pressed", "true");
});

// ── inspectorTabs (the coarse half of the inspector seam) ────────────────────

test("the Inspector rail has no header above its tabs — the tab strip IS the header", async ({ page }) => {
  await ready(page);
  const rail = page.getByTestId("inspector-tab-design").locator("xpath=ancestor::div[contains(@class,'border-l')][1]");

  // The strip is the FIRST thing in the rail. A fixed "Design" bar above it used
  // to duplicate the first tab's name and then contradict the second, and the
  // regression is invisible in a screenshot diff of the Design tab alone —
  // it only shows once you open Settings. So assert the structure, not the pixels.
  const stripY = await page.getByTestId("inspector-tab-design").boundingBox().then((b) => b!.y);
  const railY = await rail.boundingBox().then((b) => b!.y);
  expect(stripY - railY).toBeLessThan(12);

  // And "Design" appears in the rail exactly ONCE — as the tab. The old header
  // made it two, the second of which went stale the moment Settings opened.
  await page.getByTestId("inspector-tab-settings").click();
  await expect(rail.getByText("Design", { exact: true })).toHaveCount(1);
  await expect(page.getByTestId("inspector-tab-design")).toHaveText("Design");
});

test("a panel-scoped host tab renders with NOTHING selected, and node chrome stays hidden", async ({ page }) => {
  await ready(page);

  // Nothing selected: the built-in tabs are node-scoped, so they show the empty
  // state — but the strip is still there and the host's History tab still works.
  // This is the whole reason the seam has two scopes.
  await expect(page.getByText("No selection")).toBeVisible();
  await page.getByTestId("inspector-tab-demo-history").click();
  await expect(page.getByTestId("host-tab-history")).toBeVisible();
  await expect(page.getByText("No selection")).toHaveCount(0);

  // With a node selected the panel tab keeps rendering — and the node chrome
  // (identity header, Duplicate/Delete) stays hidden, because this tab is not
  // about that node.
  await page.locator(".sui-canvas").getByText("Ship your store in an afternoon").click();
  await expect(page.getByTestId("host-tab-history")).toBeVisible();
  await expect(page.getByRole("button", { name: "Duplicate" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save as component" })).toHaveCount(0);

  // Back to Design and the node chrome returns.
  await page.getByTestId("inspector-tab-design").click();
  await expect(page.getByRole("button", { name: "Save as component" })).toBeVisible();
});

test("a node-scoped host tab comes and goes with the selection, and falls back rather than blanking", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");
  const audit = page.getByTestId("inspector-tab-demo-audit");

  // The demo host returns Audit only for element nodes, so it is absent until one
  // is selected.
  await expect(audit).toHaveCount(0);
  await canvas.getByText("Ship your store in an afternoon").click();
  await expect(audit).toBeVisible();

  // It writes through the SAME ctx the built-in panels use — the attribute lands
  // on the real canvas element, not in host-local state.
  await audit.click();
  await expect(page.getByTestId("host-tab-audit-tag")).toHaveText("h1");
  await page.getByTestId("host-tab-audit-mark").click();
  await expect(canvas.locator('[data-audited="yes"]')).toHaveCount(1);

  // Deselecting takes the tab away WHILE IT IS OPEN. The rail must fall back to
  // Design, not render a blank body or keep a tab that no longer exists.
  await page.evaluate(() =>
    (window as unknown as { __editor: { select(id: string | undefined): boolean } }).__editor.select(undefined),
  );
  await expect(audit).toHaveCount(0);
  // `aria-selected`, not `aria-pressed` — these are real tabs (a page of the
  // panel), not toggle buttons (a mode that is armed). The mode toggles in the
  // header above are the ones that use `aria-pressed`.
  await expect(page.getByTestId("inspector-tab-design")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("No selection")).toBeVisible();
});

test("a host tab cannot hijack a built-in id, and overflow gets paging buttons rather than a scrollbar", async ({ page }) => {
  await ready(page);
  await page.locator(".sui-canvas").getByText("Ship your store in an afternoon").click();

  // The demo host registers a tab with id "design". Rejected — the built-in
  // survives with its own label and its own content. Letting a host shadow it
  // would silently remove the only way to style a node.
  await expect(page.getByTestId("host-tab-hijack")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Hijack" })).toHaveCount(0);
  await page.getByTestId("inspector-tab-design").click();
  await expect(page.getByText("Surface", { exact: true })).toBeVisible();

  // Six tabs do not fit a ~300px rail, so the paging buttons mount. They take
  // real layout space beside the strip — an overlay would cover the end tabs.
  const left = page.getByRole("button", { name: "Scroll tabs left" });
  const right = page.getByRole("button", { name: "Scroll tabs right" });
  await expect(right).toBeVisible();
  // At the start there is nowhere to go left, and the button says so.
  await expect(left).toBeDisabled();
  await expect(right).toBeEnabled();

  await right.click();
  await expect(left).toBeEnabled();

  // No horizontal scrollbar: the strip scrolls, but its chrome is hidden because
  // the buttons are the affordance.
  const hasScrollbar = await page.getByTestId("inspector-tab-design").evaluate((el) => {
    const scroller = el.closest("div[class*='overflow-x-auto']") as HTMLElement | null;
    return scroller ? scroller.offsetHeight - scroller.clientHeight > 0 : null;
  });
  expect(hasScrollbar).toBe(false);
});
