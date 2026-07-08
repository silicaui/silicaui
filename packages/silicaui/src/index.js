import plugin from "tailwindcss/plugin";
import { LIGHT, SEMANTIC_COLORS } from "./colors.js";
import { buildBase } from "./theme.js";
import { colorUtilities, softUtilities } from "./color-utilities.js";
import { button } from "./components/button.js";
import { badge } from "./components/badge.js";
import { input } from "./components/input.js";
import { inputGroup } from "./components/input-group.js";
import { pinInput } from "./components/pin-input.js";
import { phoneInput } from "./components/phone-input.js";
import { select } from "./components/select.js";
import { textarea } from "./components/textarea.js";
import { card } from "./components/card.js";
import { alert } from "./components/alert.js";
import { progress } from "./components/progress.js";
import { avatar } from "./components/avatar.js";
import { skeleton } from "./components/skeleton.js";
import { table } from "./components/table.js";
import { divider } from "./components/divider.js";
import { kbd } from "./components/kbd.js";
import { timestamp } from "./components/timestamp.js";
import { breadcrumb } from "./components/breadcrumb.js";
import { stat } from "./components/stat.js";
import { steps } from "./components/steps.js";
import { join } from "./components/join.js";
import { menu } from "./components/menu.js";
import { collapse } from "./components/collapse.js";
import { indicator } from "./components/indicator.js";
import { loading } from "./components/loading.js";
import { prose } from "./components/prose.js";
import { typography } from "./components/typography.js";
import { navbar } from "./components/navbar.js";
import { footer } from "./components/footer.js";
import { hero } from "./components/hero.js";
import { link } from "./components/link.js";
import { mockup } from "./components/mockup.js";
import { timeline } from "./components/timeline.js";
import { carousel } from "./components/carousel.js";
import { stack } from "./components/stack.js";
import { rating } from "./components/rating.js";
import { radialProgress } from "./components/radial-progress.js";
import { pagination } from "./components/pagination.js";
import { accordion } from "./components/accordion.js";
import { chat } from "./components/chat.js";
import { range } from "./components/range.js";
import { toast } from "./components/toast.js";
import { swap } from "./components/swap.js";
import { status } from "./components/status.js";
import { countdown } from "./components/countdown.js";
import { numberField } from "./components/number-field.js";
import { drawer } from "./components/drawer.js";
import { list } from "./components/list.js";
import { fileInput } from "./components/file-input.js";
import { dock } from "./components/dock.js";
import { tooltip } from "./components/tooltip.js";
import { dialog } from "./components/dialog.js";
import { popover } from "./components/popover.js";
import { dropdown } from "./components/dropdown.js";
import { tabs } from "./components/tabs.js";
import { checkbox } from "./components/checkbox.js";
import { radio } from "./components/radio.js";
import { toggle } from "./components/toggle.js";
import { fieldset } from "./components/fieldset.js";
import { label } from "./components/label.js";
import { validator } from "./components/validator.js";
import { diff } from "./components/diff.js";
import { mask } from "./components/mask.js";
import { meter } from "./components/meter.js";
import { scrollArea } from "./components/scroll-area.js";
import { previewCard } from "./components/preview-card.js";
import { toolbar } from "./components/toolbar.js";
import { navigationMenu } from "./components/navigation-menu.js";
import { menubar } from "./components/menubar.js";
import { toggleGroup } from "./components/toggle-group.js";
import { field } from "./components/field.js";
import { radioGroup } from "./components/radio-group.js";
import { checkboxGroup } from "./components/checkbox-group.js";
import { slider } from "./components/slider.js";
import { switchControl } from "./components/switch.js";
import { collapsible } from "./components/collapsible.js";
import { filter } from "./components/filter.js";
import { selectMenu } from "./components/select-menu.js";
import { combobox } from "./components/combobox.js";
import { multiSelect } from "./components/multi-select.js";
import { outline } from "./components/outline.js";
import { segmentField } from "./components/segment-field.js";
import { lightbox } from "./components/lightbox.js";
import { overlay } from "./components/overlay.js";
import { overflowList } from "./components/overflow-list.js";
import { metadataList } from "./components/metadata-list.js";
import { chatSuite } from "./components/chat-suite.js";
import { powerSearch } from "./components/power-search.js";
import { appShell } from "./components/app-shell.js";
import { calendar } from "./components/calendar.js";
import { dataTable } from "./components/data-table.js";
import { emptyState } from "./components/empty-state.js";
import { tagInput } from "./components/tag-input.js";
import { chart } from "./components/chart.js";
import { colorPicker } from "./components/color-picker.js";
import { commandPalette } from "./components/command-palette.js";
import { treeView } from "./components/tree-view.js";
import { dropzone } from "./components/dropzone.js";
import { fileUpload } from "./components/file-upload.js";
import { wizard } from "./components/wizard.js";
import { richTextEditor } from "./components/rich-text-editor.js";
import { sortableList } from "./components/sortable-list.js";
import { resizablePanels } from "./components/resizable-panels.js";
import { wordmark } from "./components/wordmark.js";
import { selectionList } from "./components/selection-list.js";
import { sidebar } from "./components/sidebar.js";

/**
 * Parse the `colors` option from `@plugin "@wizeworks/silicaui" { colors: … }`.
 * Tailwind may hand this to us as an array or a comma/space-separated string.
 */
function parseColors(option) {
  if (!option) return SEMANTIC_COLORS;
  const raw = Array.isArray(option) ? option : String(option).split(/[\s,]+/);
  const list = raw.map((s) => s.trim()).filter(Boolean);
  return list.length ? list : SEMANTIC_COLORS;
}

/**
 * Parse the `prefix` option from `@plugin "@wizeworks/silicaui" { prefix: sx-; }`.
 * Prepended verbatim to every Silica component class, so the caller controls the
 * separator (`sx-` → `.sx-btn`). Whitespace/quotes are stripped; empty → "".
 * NOTE: this must match the prefix given to `<SilicaProvider prefix>` in the
 * React package, since React rebuilds these class names at runtime.
 */
function parsePrefix(option) {
  if (option == null) return "";
  const raw = Array.isArray(option) ? option.join("") : String(option);
  return raw.trim().replace(/^['"]+|['"]+$/g, "");
}

/**
 * Silica CSS — a Tailwind v4 plugin.
 *
 * Usage (CSS-first, no tailwind.config):
 *
 *   @import "tailwindcss";
 *   @plugin "@wizeworks/silicaui";
 *
 * Add your own component colors — they get the full treatment, including an
 * auto-derived foreground if you don't supply a `-content`:
 *
 *   @plugin "@wizeworks/silicaui" { colors: primary, secondary, brand; }
 *   @theme { --color-brand: #7c3aed; }
 *
 * Namespace every Silica class with a prefix (e.g. to coexist with another
 * design system). The value is prepended verbatim, so include your own
 * separator. Must match `<SilicaProvider prefix>` in @wizeworks/silicaui-react:
 *
 *   @plugin "@wizeworks/silicaui" { prefix: sx-; }   // → .sx-btn, .sx-btn-primary, …
 */
export default plugin.withOptions(
  (options = {}) =>
    ({ addBase, addUtilities }) => {
      const colors = parseColors(options.colors);
      const prefix = parsePrefix(options.prefix);
      addBase(buildBase());
      // Components are emitted via addBase, not addComponents, on purpose.
      // Tailwind v4 tree-shakes addComponents/addUtilities output against
      // scanned content — but a React component library builds its class names
      // dynamically (`btn-${color}`), so the scanner never sees them and would
      // drop everything. addBase is always emitted, which is what a component
      // library needs. Utilities still win over these (higher layer), so
      // `<Button className="w-full">` overrides as expected.
      addBase(button(colors, prefix));
      addBase(badge(colors, prefix));
      addBase(input(colors, prefix));
      addBase(inputGroup(prefix));
      addBase(pinInput(colors, prefix));
      addBase(select(colors, prefix));
      addBase(textarea(colors, prefix));
      addBase(card(prefix));
      addBase(alert(colors, prefix));
      addBase(progress(colors, prefix));
      addBase(avatar(colors, prefix));
      addBase(skeleton(prefix));
      addBase(table(prefix));
      addBase(divider(prefix));
      addBase(kbd(prefix));
      addBase(timestamp(prefix));
      addBase(breadcrumb(prefix));
      addBase(stat(prefix));
      addBase(steps(colors, prefix));
      addBase(join(prefix));
      addBase(phoneInput(prefix));
      addBase(menu(prefix));
      addBase(collapse(prefix));
      addBase(indicator(prefix));
      addBase(loading(prefix));
      addBase(prose(prefix));
      addBase(typography(prefix));
      addBase(navbar(prefix));
      addBase(footer(prefix));
      addBase(hero(prefix));
      addBase(link(colors, prefix));
      addBase(mockup(prefix));
      addBase(timeline(prefix));
      addBase(carousel(prefix));
      addBase(stack(prefix));
      addBase(rating(colors, prefix));
      addBase(radialProgress(prefix));
      addBase(pagination(colors, prefix));
      addBase(accordion(prefix));
      addBase(chat(colors, prefix));
      addBase(range(colors, prefix));
      addBase(toast(colors, prefix));
      addBase(swap(prefix));
      addBase(status(colors, prefix));
      addBase(countdown(prefix));
      addBase(numberField(prefix));
      addBase(drawer(prefix));
      addBase(list(prefix));
      addBase(fileInput(prefix));
      addBase(dock(colors, prefix));
      addBase(fieldset(prefix));
      addBase(label(prefix));
      addBase(validator(prefix));
      addBase(diff(prefix));
      addBase(mask(prefix));
      addBase(meter(colors, prefix));
      addBase(scrollArea(prefix));
      addBase(previewCard(prefix));
      addBase(toolbar(prefix));
      addBase(navigationMenu(prefix));
      addBase(menubar(prefix));
      addBase(toggleGroup(prefix));
      addBase(field(prefix));
      addBase(radioGroup(prefix));
      addBase(checkboxGroup(prefix));
      addBase(slider(colors, prefix));
      addBase(switchControl(colors, prefix));
      addBase(collapsible(prefix));
      addBase(filter(colors, prefix));
      addBase(selectMenu(prefix));
      addBase(combobox(prefix));
      addBase(multiSelect(colors, prefix));
      addBase(outline(prefix));
      addBase(segmentField(colors, prefix));
      addBase(lightbox(prefix));
      addBase(overlay(prefix));
      addBase(overflowList(prefix));
      addBase(metadataList(prefix));
      addBase(chatSuite(prefix));
      addBase(powerSearch(prefix));
      addBase(appShell(prefix));
      addBase(calendar(colors, prefix));
      addBase(dataTable(colors, prefix));
      addBase(emptyState(prefix));
      addBase(tagInput(colors, prefix));
      addBase(chart(prefix));
      addBase(colorPicker(prefix));
      addBase(commandPalette(prefix));
      addBase(treeView(prefix));
      addBase(dropzone(prefix));
      addBase(fileUpload(prefix));
      addBase(wizard(colors, prefix));
      addBase(richTextEditor(prefix));
      addBase(sortableList(prefix));
      addBase(resizablePanels(prefix));
      addBase(wordmark(colors, prefix));
      addBase(selectionList(prefix));
      addBase(sidebar(colors, prefix));
      addBase(tooltip(prefix));
      addBase(dialog(prefix));
      addBase(popover(prefix));
      addBase(dropdown(prefix));
      addBase(tabs(colors, prefix));
      addBase(checkbox(colors, prefix));
      addBase(radio(colors, prefix));
      addBase(toggle(colors, prefix));
      // Color utilities as var-setters for EVERY declared color — parity with the
      // component variants above. Custom colors get `text-brand`/`bg-brand`/
      // `border-brand` with no scanning or safelist (@wizeworks/silicaui's N-color promise).
      // Emitted LAST so an explicit `text-*`/`bg-*` still layers over a
      // component's own color, matching Tailwind's utilities-beat-components rule.
      addBase(colorUtilities(colors, prefix));
      // The `soft` family goes through addUtilities, not addBase: a registered
      // semantic color (e.g. `bg-primary`) gets a REAL utilities-layer rule from
      // Tailwind's own generator whenever it's scanned, which always beats a
      // base-layer rule regardless of source order. addUtilities lands `.soft`/
      // `.bg-soft`/`.text-soft`/`.border-soft` in that same utilities layer, after
      // Tailwind's core output, so they reliably win. See softUtilities' doc.
      addUtilities(softUtilities(prefix));
    },
  // Register the semantic colors as real theme values so Tailwind generates the
  // matching CSS variables (`--color-primary`, …) AND utilities (`bg-primary`,
  // `text-primary-content`, …). `[data-theme]` overrides in buildBase() then
  // re-point those same variables per theme.
  () => ({
    theme: {
      extend: {
        // Point color utilities at the CSS variables (defined and theme-switched
        // in buildBase) instead of literal values. Registering literals here
        // froze `bg-base-*` / `text-primary` / etc. to the LIGHT palette —
        // Tailwind inlined the value — while components reading `var(--color-*)`
        // switched under `[data-theme]`, so the two diverged in dark mode (a
        // light footer/menu sitting on a dark page). Referencing the same vars
        // keeps every color utility in lockstep with the active theme. Opacity
        // modifiers (`bg-primary/50`) still work — v4 wraps var colors in
        // color-mix() for those.
        colors: Object.fromEntries(
          Object.keys(LIGHT).map((name) => [name, `var(--color-${name})`]),
        ),
        // Same rationale as colors: reference the radius vars (with each
        // component's default as the fallback) so `rounded-box` / `rounded-field`
        // / `rounded-selector` track a theme's radius overrides instead of
        // freezing to the literal registered here.
        borderRadius: {
          selector: "var(--radius-selector, 1rem)",
          field: "var(--radius-field, 0.25rem)",
          box: "var(--radius-box, 0.5rem)",
        },
        // The type scale. Anchored to a 16px root (see buildBase): `text-md`
        // (== `text-base`) is 1rem = 16px — the worldwide default body size — so
        // the scale reads as a self-documenting xs → sm → MD → lg… ladder rather
        // than leaving 16px as an accidental Tailwind default. Values match
        // Tailwind's own defaults (nothing shifts); `md` is the named alias
        // @wizeworks/silicaui code should reach for. Always prefer a scale step over a
        // `text-[13px]`-style magic number.
        fontSize: {
          xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
          sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
          md: ["1rem", { lineHeight: "1.5rem" }], // 16px — base / world standard
          base: ["1rem", { lineHeight: "1.5rem" }], // 16px — alias of md
          lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
          xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
          "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
          "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
          "4xl": ["2.25rem", { lineHeight: "2.5rem" }], // 36px
          "5xl": ["3rem", { lineHeight: "1" }], // 48px
          "6xl": ["3.75rem", { lineHeight: "1" }], // 60px
          "7xl": ["4.5rem", { lineHeight: "1" }], // 72px
        },
        // Point the font utilities at the typeface tokens (defined + theme-
        // switched in buildBase), same var strategy as colors/radius — so
        // `font-sans` / `font-serif` / `font-mono` track a theme's `--font-*`
        // override instead of freezing to a literal stack.
        fontFamily: {
          sans: "var(--font-sans)",
          serif: "var(--font-serif)",
          mono: "var(--font-mono)",
        },
      },
    },
  }),
);
