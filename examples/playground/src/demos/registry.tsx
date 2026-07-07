import type { ComponentType } from "react";
import { ButtonDemo } from "./Button";
import { BadgeDemo } from "./Badge";
import { InputDemo } from "./Input";
import { SelectDemo } from "./Select";
import { TextareaDemo } from "./Textarea";
import { CardDemo } from "./Card";
import { AlertDemo } from "./Alert";
import { ProgressDemo } from "./Progress";
import { AvatarDemo } from "./Avatar";
import { SkeletonDemo } from "./Skeleton";
import { TableDemo } from "./Table";
import { DividerDemo } from "./Divider";
import { KbdDemo } from "./Kbd";
import { BreadcrumbDemo } from "./Breadcrumb";
import { StatDemo } from "./Stat";
import { StepsDemo } from "./Steps";
import { JoinDemo } from "./Join";
import { MenuDemo } from "./Menu";
import { CollapseDemo } from "./Collapse";
import { IndicatorDemo } from "./Indicator";
import { LoadingDemo } from "./Loading";
import { ProseDemo } from "./Prose";
import { NavbarDemo } from "./Navbar";
import { FooterDemo } from "./Footer";
import { HeroDemo } from "./Hero";
import { LinkDemo } from "./Link";
import { MockupDemo } from "./Mockup";
import { TimelineDemo } from "./Timeline";
import { CarouselDemo } from "./Carousel";
import { StackDemo } from "./Stack";
import { RatingDemo } from "./Rating";
import { RadialProgressDemo } from "./RadialProgress";
import { PaginationDemo } from "./Pagination";
import { AccordionDemo } from "./Accordion";
import { ChatDemo } from "./Chat";
import { RangeDemo } from "./Range";
import { ToastDemo } from "./Toast";
import { SwapDemo } from "./Swap";
import { StatusDemo } from "./Status";
import { CountdownDemo } from "./Countdown";
import { NumberFieldDemo } from "./NumberField";
import { DrawerDemo } from "./Drawer";
import { ListDemo } from "./List";
import { FileInputDemo } from "./FileInput";
import { DockDemo } from "./Dock";
import { FieldsetDemo } from "./Fieldset";
import { LabelDemo } from "./Label";
import { ValidatorDemo } from "./Validator";
import { DiffDemo } from "./Diff";
import { MaskDemo } from "./Mask";
import { MeterDemo } from "./Meter";
import { ScrollAreaDemo } from "./ScrollArea";
import { PreviewCardDemo } from "./PreviewCard";
import { ToolbarDemo } from "./Toolbar";
import { NavigationMenuDemo } from "./NavigationMenu";
import { MenubarDemo } from "./Menubar";
import { ToggleGroupDemo } from "./ToggleGroup";
import { FieldDemo } from "./Field";
import { RadioGroupDemo } from "./RadioGroup";
import { CheckboxGroupDemo } from "./CheckboxGroup";
import { SliderDemo } from "./Slider";
import { SwitchDemo } from "./Switch";
import { CollapsibleDemo } from "./Collapsible";
import { FilterDemo } from "./Filter";
import { SelectMenuDemo } from "./SelectMenu";
import { ComboboxDemo } from "./Combobox";
import { CalendarDemo } from "./Calendar";
import { DataTableDemo } from "./DataTable";
import { EmptyStateDemo } from "./EmptyState";
import { TagInputDemo } from "./TagInput";
import { ChartDemo } from "./Chart";
import { ColorPickerDemo } from "./ColorPicker";
import { CommandPaletteDemo } from "./CommandPalette";
import { TreeViewDemo } from "./TreeView";
import { DropzoneDemo } from "./Dropzone";
import { WizardDemo } from "./Wizard";
import { RichTextEditorDemo } from "./RichTextEditor";
import { SortableListDemo } from "./SortableList";
import { ResizablePanelsDemo } from "./ResizablePanels";
import { TooltipDemo } from "./Tooltip";
import { DialogDemo } from "./Dialog";
import { PopoverDemo } from "./Popover";
import { DropdownDemo } from "./Dropdown";
import { TabsDemo } from "./Tabs";
import { CheckboxDemo } from "./Checkbox";
import { RadioDemo } from "./Radio";
import { ToggleDemo } from "./Toggle";
import { WordmarkDemo } from "./Wordmark";
import { SelectionListDemo } from "./SelectionList";
import { SidebarDemo } from "./Sidebar";

/**
 * One entry per component. The shell walks this list to render every demo under
 * its own big heading + anchor. Adding a component = write `demos/<Name>.tsx`,
 * import it, and append a line here — nothing else. Order here mirrors the
 * plugin's own component enumeration in `packages/silicaui/src/index.js`.
 */
export interface DemoEntry {
    /** URL-hash anchor + React key. */
    id: string;
    /** The loud heading shown above the demo. */
    title: string;
    Demo: ComponentType;
}

export const DEMOS: DemoEntry[] = [
    { id: "button", title: "Button", Demo: ButtonDemo },
    { id: "badge", title: "Badge", Demo: BadgeDemo },
    { id: "input", title: "Input", Demo: InputDemo },
    { id: "select", title: "Select (Native)", Demo: SelectDemo },
    { id: "textarea", title: "Textarea", Demo: TextareaDemo },
    { id: "card", title: "Card", Demo: CardDemo },
    { id: "alert", title: "Alert", Demo: AlertDemo },
    { id: "progress", title: "Progress", Demo: ProgressDemo },
    { id: "avatar", title: "Avatar", Demo: AvatarDemo },
    { id: "skeleton", title: "Skeleton", Demo: SkeletonDemo },
    { id: "table", title: "Table", Demo: TableDemo },
    { id: "divider", title: "Divider", Demo: DividerDemo },
    { id: "kbd", title: "Kbd", Demo: KbdDemo },
    { id: "breadcrumb", title: "Breadcrumb", Demo: BreadcrumbDemo },
    { id: "stat", title: "Stat", Demo: StatDemo },
    { id: "steps", title: "Steps", Demo: StepsDemo },
    { id: "join", title: "Join", Demo: JoinDemo },
    { id: "menu", title: "Menu", Demo: MenuDemo },
    { id: "collapse", title: "Collapse", Demo: CollapseDemo },
    { id: "indicator", title: "Indicator", Demo: IndicatorDemo },
    { id: "loading", title: "Loading", Demo: LoadingDemo },
    { id: "prose", title: "Prose", Demo: ProseDemo },
    { id: "navbar", title: "Navbar", Demo: NavbarDemo },
    { id: "footer", title: "Footer", Demo: FooterDemo },
    { id: "hero", title: "Hero", Demo: HeroDemo },
    { id: "link", title: "Link", Demo: LinkDemo },
    { id: "mockup", title: "Mockup", Demo: MockupDemo },
    { id: "timeline", title: "Timeline", Demo: TimelineDemo },
    { id: "carousel", title: "Carousel", Demo: CarouselDemo },
    { id: "stack", title: "Stack", Demo: StackDemo },
    { id: "rating", title: "Rating", Demo: RatingDemo },
    { id: "radial-progress", title: "Radial Progress", Demo: RadialProgressDemo },
    { id: "pagination", title: "Pagination", Demo: PaginationDemo },
    { id: "accordion", title: "Accordion", Demo: AccordionDemo },
    { id: "chat", title: "Chat", Demo: ChatDemo },
    { id: "range", title: "Range", Demo: RangeDemo },
    { id: "toast", title: "Toast", Demo: ToastDemo },
    { id: "swap", title: "Swap", Demo: SwapDemo },
    { id: "status", title: "Status", Demo: StatusDemo },
    { id: "countdown", title: "Countdown", Demo: CountdownDemo },
    { id: "number-field", title: "Number Field", Demo: NumberFieldDemo },
    { id: "drawer", title: "Drawer", Demo: DrawerDemo },
    { id: "list", title: "List", Demo: ListDemo },
    { id: "file-input", title: "File Input", Demo: FileInputDemo },
    { id: "dock", title: "Dock", Demo: DockDemo },
    { id: "fieldset", title: "Fieldset", Demo: FieldsetDemo },
    { id: "label", title: "Label", Demo: LabelDemo },
    { id: "validator", title: "Validator", Demo: ValidatorDemo },
    { id: "diff", title: "Diff", Demo: DiffDemo },
    { id: "mask", title: "Mask", Demo: MaskDemo },
    { id: "meter", title: "Meter", Demo: MeterDemo },
    { id: "scroll-area", title: "Scroll Area", Demo: ScrollAreaDemo },
    { id: "preview-card", title: "Preview Card", Demo: PreviewCardDemo },
    { id: "toolbar", title: "Toolbar", Demo: ToolbarDemo },
    { id: "navigation-menu", title: "Navigation Menu", Demo: NavigationMenuDemo },
    { id: "menubar", title: "Menubar", Demo: MenubarDemo },
    { id: "toggle-group", title: "Toggle Group", Demo: ToggleGroupDemo },
    { id: "field", title: "Field", Demo: FieldDemo },
    { id: "radio-group", title: "Radio Group", Demo: RadioGroupDemo },
    { id: "checkbox-group", title: "Checkbox Group", Demo: CheckboxGroupDemo },
    { id: "slider", title: "Slider", Demo: SliderDemo },
    { id: "switch", title: "Switch", Demo: SwitchDemo },
    { id: "collapsible", title: "Collapsible", Demo: CollapsibleDemo },
    { id: "filter", title: "Filter", Demo: FilterDemo },
    { id: "select-menu", title: "Select (Advanced)", Demo: SelectMenuDemo },
    { id: "combobox", title: "Combobox", Demo: ComboboxDemo },
    { id: "calendar", title: "Calendar", Demo: CalendarDemo },
    { id: "data-table", title: "Data Table", Demo: DataTableDemo },
    { id: "empty-state", title: "Empty State", Demo: EmptyStateDemo },
    { id: "tag-input", title: "Tag Input", Demo: TagInputDemo },
    { id: "chart", title: "Chart", Demo: ChartDemo },
    { id: "color-picker", title: "Color Picker", Demo: ColorPickerDemo },
    { id: "command-palette", title: "Command Palette", Demo: CommandPaletteDemo },
    { id: "tree-view", title: "Tree View", Demo: TreeViewDemo },
    { id: "dropzone", title: "Dropzone", Demo: DropzoneDemo },
    { id: "wizard", title: "Wizard", Demo: WizardDemo },
    { id: "rich-text-editor", title: "Rich Text Editor", Demo: RichTextEditorDemo },
    { id: "sortable-list", title: "Sortable List", Demo: SortableListDemo },
    { id: "resizable-panels", title: "Resizable Panels", Demo: ResizablePanelsDemo },
    { id: "tooltip", title: "Tooltip", Demo: TooltipDemo },
    { id: "dialog", title: "Dialog", Demo: DialogDemo },
    { id: "popover", title: "Popover", Demo: PopoverDemo },
    { id: "dropdown", title: "Dropdown", Demo: DropdownDemo },
    { id: "tabs", title: "Tabs", Demo: TabsDemo },
    { id: "checkbox", title: "Checkbox", Demo: CheckboxDemo },
    { id: "radio", title: "Radio", Demo: RadioDemo },
    { id: "toggle", title: "Toggle", Demo: ToggleDemo },
    { id: "wordmark", title: "Wordmark", Demo: WordmarkDemo },
    { id: "selection-list", title: "Selection List", Demo: SelectionListDemo },
    { id: "sidebar", title: "Sidebar", Demo: SidebarDemo },
];
