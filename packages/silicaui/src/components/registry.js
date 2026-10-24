/**
 * Every component stylesheet in emit order. Order is cascade order: keep it stable.
 * `name` is the component file name and the value `components:` accepts.
 * Each entry takes (colors, prefix, prefersDark) and returns a CSS-in-JS object.
 */
import { button } from "./button.js";
import { badge } from "./badge.js";
import { input } from "./input.js";
import { inputGroup } from "./input-group.js";
import { pinInput } from "./pin-input.js";
import { select } from "./select.js";
import { textarea } from "./textarea.js";
import { card } from "./card.js";
import { alert } from "./alert.js";
import { progress } from "./progress.js";
import { avatar } from "./avatar.js";
import { skeleton } from "./skeleton.js";
import { table } from "./table.js";
import { divider } from "./divider.js";
import { kbd } from "./kbd.js";
import { timestamp } from "./timestamp.js";
import { breadcrumb } from "./breadcrumb.js";
import { stat } from "./stat.js";
import { steps } from "./steps.js";
import { join } from "./join.js";
import { phoneInput } from "./phone-input.js";
import { menu } from "./menu.js";
import { collapse } from "./collapse.js";
import { indicator } from "./indicator.js";
import { loading } from "./loading.js";
import { prose } from "./prose.js";
import { typography } from "./typography.js";
import { navbar } from "./navbar.js";
import { footer } from "./footer.js";
import { hero } from "./hero.js";
import { link } from "./link.js";
import { mockup } from "./mockup.js";
import { timeline } from "./timeline.js";
import { carousel } from "./carousel.js";
import { marquee } from "./marquee.js";
import { stack } from "./stack.js";
import { rating } from "./rating.js";
import { radialProgress } from "./radial-progress.js";
import { pagination } from "./pagination.js";
import { accordion } from "./accordion.js";
import { chat } from "./chat.js";
import { range } from "./range.js";
import { toast } from "./toast.js";
import { swap } from "./swap.js";
import { status } from "./status.js";
import { countdown } from "./countdown.js";
import { numberField } from "./number-field.js";
import { drawer } from "./drawer.js";
import { list } from "./list.js";
import { fileInput } from "./file-input.js";
import { dock } from "./dock.js";
import { fieldset } from "./fieldset.js";
import { label } from "./label.js";
import { validator } from "./validator.js";
import { diff } from "./diff.js";
import { mask } from "./mask.js";
import { meter } from "./meter.js";
import { scrollArea } from "./scroll-area.js";
import { previewCard } from "./preview-card.js";
import { toolbar } from "./toolbar.js";
import { navigationMenu } from "./navigation-menu.js";
import { menubar } from "./menubar.js";
import { toggleGroup } from "./toggle-group.js";
import { field } from "./field.js";
import { radioGroup } from "./radio-group.js";
import { checkboxGroup } from "./checkbox-group.js";
import { slider } from "./slider.js";
import { switchControl } from "./switch.js";
import { collapsible } from "./collapsible.js";
import { filter } from "./filter.js";
import { selectMenu } from "./select-menu.js";
import { combobox } from "./combobox.js";
import { multiSelect } from "./multi-select.js";
import { outline } from "./outline.js";
import { segmentField } from "./segment-field.js";
import { lightbox } from "./lightbox.js";
import { overlay } from "./overlay.js";
import { overflowList } from "./overflow-list.js";
import { scrollStrip } from "./scroll-strip.js";
import { metadataList } from "./metadata-list.js";
import { chatSuite } from "./chat-suite.js";
import { powerSearch } from "./power-search.js";
import { appShell } from "./app-shell.js";
import { calendar } from "./calendar.js";
import { dataTable } from "./data-table.js";
import { emptyState } from "./empty-state.js";
import { tagInput } from "./tag-input.js";
import { chart } from "./chart.js";
import { colorPicker } from "./color-picker.js";
import { commandPalette } from "./command-palette.js";
import { treeView } from "./tree-view.js";
import { dropzone } from "./dropzone.js";
import { fileUpload } from "./file-upload.js";
import { wizard } from "./wizard.js";
import { richTextEditor } from "./rich-text-editor.js";
import { sortableList } from "./sortable-list.js";
import { resizablePanels } from "./resizable-panels.js";
import { wordmark } from "./wordmark.js";
import { selectionList } from "./selection-list.js";
import { sidebar } from "./sidebar.js";
import { animations } from "./animations.js";
import { tooltip } from "./tooltip.js";
import { dialog } from "./dialog.js";
import { popover } from "./popover.js";
import { dropdown } from "./dropdown.js";
import { tabs } from "./tabs.js";
import { checkbox } from "./checkbox.js";
import { radio } from "./radio.js";
import { toggle } from "./toggle.js";

export const COMPONENTS = [
  ["button", (colors, prefix, dark) => button(colors, prefix)],
  ["badge", (colors, prefix, dark) => badge(colors, prefix)],
  ["input", (colors, prefix, dark) => input(colors, prefix)],
  ["input-group", (colors, prefix, dark) => inputGroup(prefix)],
  ["pin-input", (colors, prefix, dark) => pinInput(colors, prefix)],
  ["select", (colors, prefix, dark) => select(colors, prefix)],
  ["textarea", (colors, prefix, dark) => textarea(colors, prefix)],
  ["card", (colors, prefix, dark) => card(prefix)],
  ["alert", (colors, prefix, dark) => alert(colors, prefix)],
  ["progress", (colors, prefix, dark) => progress(colors, prefix)],
  ["avatar", (colors, prefix, dark) => avatar(colors, prefix)],
  ["skeleton", (colors, prefix, dark) => skeleton(prefix)],
  ["table", (colors, prefix, dark) => table(prefix)],
  ["divider", (colors, prefix, dark) => divider(prefix)],
  ["kbd", (colors, prefix, dark) => kbd(prefix)],
  ["timestamp", (colors, prefix, dark) => timestamp(prefix)],
  ["breadcrumb", (colors, prefix, dark) => breadcrumb(prefix)],
  ["stat", (colors, prefix, dark) => stat(prefix)],
  ["steps", (colors, prefix, dark) => steps(colors, prefix)],
  ["join", (colors, prefix, dark) => join(prefix)],
  ["phone-input", (colors, prefix, dark) => phoneInput(prefix)],
  ["menu", (colors, prefix, dark) => menu(prefix)],
  ["collapse", (colors, prefix, dark) => collapse(prefix)],
  ["indicator", (colors, prefix, dark) => indicator(prefix)],
  ["loading", (colors, prefix, dark) => loading(prefix)],
  ["prose", (colors, prefix, dark) => prose(prefix)],
  ["typography", (colors, prefix, dark) => typography(prefix, dark)],
  ["navbar", (colors, prefix, dark) => navbar(prefix)],
  ["footer", (colors, prefix, dark) => footer(prefix)],
  ["hero", (colors, prefix, dark) => hero(prefix)],
  ["link", (colors, prefix, dark) => link(colors, prefix)],
  ["mockup", (colors, prefix, dark) => mockup(prefix)],
  ["timeline", (colors, prefix, dark) => timeline(prefix)],
  ["carousel", (colors, prefix, dark) => carousel(prefix)],
  ["marquee", (colors, prefix, dark) => marquee(prefix)],
  ["stack", (colors, prefix, dark) => stack(prefix)],
  ["rating", (colors, prefix, dark) => rating(colors, prefix)],
  ["radial-progress", (colors, prefix, dark) => radialProgress(prefix)],
  ["pagination", (colors, prefix, dark) => pagination(colors, prefix)],
  ["accordion", (colors, prefix, dark) => accordion(prefix)],
  ["chat", (colors, prefix, dark) => chat(colors, prefix)],
  ["range", (colors, prefix, dark) => range(colors, prefix)],
  ["toast", (colors, prefix, dark) => toast(colors, prefix)],
  ["swap", (colors, prefix, dark) => swap(prefix)],
  ["status", (colors, prefix, dark) => status(colors, prefix)],
  ["countdown", (colors, prefix, dark) => countdown(prefix)],
  ["number-field", (colors, prefix, dark) => numberField(prefix)],
  ["drawer", (colors, prefix, dark) => drawer(prefix)],
  ["list", (colors, prefix, dark) => list(prefix)],
  ["file-input", (colors, prefix, dark) => fileInput(prefix)],
  ["dock", (colors, prefix, dark) => dock(colors, prefix)],
  ["fieldset", (colors, prefix, dark) => fieldset(prefix)],
  ["label", (colors, prefix, dark) => label(prefix)],
  ["validator", (colors, prefix, dark) => validator(prefix)],
  ["diff", (colors, prefix, dark) => diff(prefix)],
  ["mask", (colors, prefix, dark) => mask(prefix)],
  ["meter", (colors, prefix, dark) => meter(colors, prefix)],
  ["scroll-area", (colors, prefix, dark) => scrollArea(prefix)],
  ["preview-card", (colors, prefix, dark) => previewCard(prefix)],
  ["toolbar", (colors, prefix, dark) => toolbar(prefix)],
  ["navigation-menu", (colors, prefix, dark) => navigationMenu(prefix)],
  ["menubar", (colors, prefix, dark) => menubar(prefix)],
  ["toggle-group", (colors, prefix, dark) => toggleGroup(colors, prefix)],
  ["field", (colors, prefix, dark) => field(prefix)],
  ["radio-group", (colors, prefix, dark) => radioGroup(prefix)],
  ["checkbox-group", (colors, prefix, dark) => checkboxGroup(prefix)],
  ["slider", (colors, prefix, dark) => slider(colors, prefix)],
  ["switch", (colors, prefix, dark) => switchControl(colors, prefix)],
  ["collapsible", (colors, prefix, dark) => collapsible(prefix)],
  ["filter", (colors, prefix, dark) => filter(colors, prefix)],
  ["select-menu", (colors, prefix, dark) => selectMenu(prefix)],
  ["combobox", (colors, prefix, dark) => combobox(prefix)],
  ["multi-select", (colors, prefix, dark) => multiSelect(colors, prefix)],
  ["outline", (colors, prefix, dark) => outline(prefix)],
  ["segment-field", (colors, prefix, dark) => segmentField(colors, prefix)],
  ["lightbox", (colors, prefix, dark) => lightbox(prefix)],
  ["overlay", (colors, prefix, dark) => overlay(prefix)],
  ["overflow-list", (colors, prefix, dark) => overflowList(prefix)],
  ["scroll-strip", (colors, prefix, dark) => scrollStrip(prefix)],
  ["metadata-list", (colors, prefix, dark) => metadataList(prefix)],
  ["chat-suite", (colors, prefix, dark) => chatSuite(prefix)],
  ["power-search", (colors, prefix, dark) => powerSearch(prefix)],
  ["app-shell", (colors, prefix, dark) => appShell(prefix)],
  ["calendar", (colors, prefix, dark) => calendar(colors, prefix)],
  ["data-table", (colors, prefix, dark) => dataTable(colors, prefix)],
  ["empty-state", (colors, prefix, dark) => emptyState(prefix)],
  ["tag-input", (colors, prefix, dark) => tagInput(colors, prefix)],
  ["chart", (colors, prefix, dark) => chart(prefix)],
  ["color-picker", (colors, prefix, dark) => colorPicker(prefix)],
  ["command-palette", (colors, prefix, dark) => commandPalette(prefix)],
  ["tree-view", (colors, prefix, dark) => treeView(prefix)],
  ["dropzone", (colors, prefix, dark) => dropzone(prefix)],
  ["file-upload", (colors, prefix, dark) => fileUpload(prefix)],
  ["wizard", (colors, prefix, dark) => wizard(colors, prefix)],
  ["rich-text-editor", (colors, prefix, dark) => richTextEditor(prefix)],
  ["sortable-list", (colors, prefix, dark) => sortableList(prefix)],
  ["resizable-panels", (colors, prefix, dark) => resizablePanels(prefix)],
  ["wordmark", (colors, prefix, dark) => wordmark(colors, prefix)],
  ["selection-list", (colors, prefix, dark) => selectionList(prefix)],
  ["sidebar", (colors, prefix, dark) => sidebar(colors, prefix)],
  ["animations", (colors, prefix, dark) => animations(prefix)],
  ["tooltip", (colors, prefix, dark) => tooltip(prefix)],
  ["dialog", (colors, prefix, dark) => dialog(prefix)],
  ["popover", (colors, prefix, dark) => popover(prefix)],
  ["dropdown", (colors, prefix, dark) => dropdown(prefix)],
  ["tabs", (colors, prefix, dark) => tabs(colors, prefix)],
  ["checkbox", (colors, prefix, dark) => checkbox(colors, prefix)],
  ["radio", (colors, prefix, dark) => radio(colors, prefix)],
  ["toggle", (colors, prefix, dark) => toggle(colors, prefix)],
];
