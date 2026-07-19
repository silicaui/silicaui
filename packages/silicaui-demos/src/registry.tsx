import type { ComponentType } from "react";
import { ButtonDemo } from "./demos/Button";
import { TypographyDemo } from "./demos/Typography";
import { BadgeDemo } from "./demos/Badge";
import { InputDemo } from "./demos/Input";
import { InputGroupDemo } from "./demos/InputGroup";
import { PasswordInputDemo } from "./demos/PasswordInput";
import { SearchInputDemo } from "./demos/SearchInput";
import { PinInputDemo } from "./demos/PinInput";
import { PhoneInputDemo } from "./demos/PhoneInput";
import { SelectDemo } from "./demos/Select";
import { TextareaDemo } from "./demos/Textarea";
import { CardDemo } from "./demos/Card";
import { AlertDemo } from "./demos/Alert";
import { ProgressDemo } from "./demos/Progress";
import { AvatarDemo } from "./demos/Avatar";
import { SkeletonDemo } from "./demos/Skeleton";
import { TableDemo } from "./demos/Table";
import { DividerDemo } from "./demos/Divider";
import { KbdDemo } from "./demos/Kbd";
import { TimestampDemo } from "./demos/Timestamp";
import { BreadcrumbDemo } from "./demos/Breadcrumb";
import { StatDemo } from "./demos/Stat";
import { StepsDemo } from "./demos/Steps";
import { JoinDemo } from "./demos/Join";
import { MenuDemo } from "./demos/Menu";
import { CollapseDemo } from "./demos/Collapse";
import { IndicatorDemo } from "./demos/Indicator";
import { LoadingDemo } from "./demos/Loading";
import { ProseDemo } from "./demos/Prose";
import { NavbarDemo } from "./demos/Navbar";
import { FooterDemo } from "./demos/Footer";
import { HeroDemo } from "./demos/Hero";
import { LinkDemo } from "./demos/Link";
import { MockupDemo } from "./demos/Mockup";
import { TimelineDemo } from "./demos/Timeline";
import { CarouselDemo } from "./demos/Carousel";
import { StackDemo } from "./demos/Stack";
import { RatingDemo } from "./demos/Rating";
import { RadialProgressDemo } from "./demos/RadialProgress";
import { PaginationDemo } from "./demos/Pagination";
import { AccordionDemo } from "./demos/Accordion";
import { ChatDemo } from "./demos/Chat";
import { RangeDemo } from "./demos/Range";
import { ToastDemo } from "./demos/Toast";
import { SwapDemo } from "./demos/Swap";
import { StatusDemo } from "./demos/Status";
import { CountdownDemo } from "./demos/Countdown";
import { NumberFieldDemo } from "./demos/NumberField";
import { DrawerDemo } from "./demos/Drawer";
import { ListDemo } from "./demos/List";
import { FileInputDemo } from "./demos/FileInput";
import { DockDemo } from "./demos/Dock";
import { FieldsetDemo } from "./demos/Fieldset";
import { LabelDemo } from "./demos/Label";
import { ValidatorDemo } from "./demos/Validator";
import { DiffDemo } from "./demos/Diff";
import { MaskDemo } from "./demos/Mask";
import { MeterDemo } from "./demos/Meter";
import { ScrollAreaDemo } from "./demos/ScrollArea";
import { PreviewCardDemo } from "./demos/PreviewCard";
import { ToolbarDemo } from "./demos/Toolbar";
import { NavigationMenuDemo } from "./demos/NavigationMenu";
import { MenubarDemo } from "./demos/Menubar";
import { ToggleGroupDemo } from "./demos/ToggleGroup";
import { FieldDemo } from "./demos/Field";
import { RadioGroupDemo } from "./demos/RadioGroup";
import { CheckboxGroupDemo } from "./demos/CheckboxGroup";
import { SliderDemo } from "./demos/Slider";
import { SwitchDemo } from "./demos/Switch";
import { CollapsibleDemo } from "./demos/Collapsible";
import { FilterDemo } from "./demos/Filter";
import { SelectMenuDemo } from "./demos/SelectMenu";
import { ComboboxDemo } from "./demos/Combobox";
import { MultiSelectDemo } from "./demos/MultiSelect";
import { OutlineDemo } from "./demos/Outline";
import { DateInputDemo } from "./demos/DateInput";
import { TimeInputDemo } from "./demos/TimeInput";
import { DateTimeInputDemo } from "./demos/DateTimeInput";
import { LightboxDemo } from "./demos/Lightbox";
import { OverlayDemo } from "./demos/Overlay";
import { OverflowListDemo } from "./demos/OverflowList";
import { MetadataListDemo } from "./demos/MetadataList";
import { ChatSuiteDemo } from "./demos/ChatSuite";
import { PowerSearchDemo } from "./demos/PowerSearch";
import { AppShellDemo } from "./demos/AppShell";
import { HooksDemo } from "./demos/Hooks";
import { CalendarDemo } from "./demos/Calendar";
import { DataTableDemo } from "./demos/DataTable";
import { EmptyStateDemo } from "./demos/EmptyState";
import { TagInputDemo } from "./demos/TagInput";
import { ChartDemo } from "./demos/Chart";
import { ColorPickerDemo } from "./demos/ColorPicker";
import { CommandPaletteDemo } from "./demos/CommandPalette";
import { TreeViewDemo } from "./demos/TreeView";
import { DropzoneDemo } from "./demos/Dropzone";
import { FileUploadDemo } from "./demos/FileUpload";
import { WizardDemo } from "./demos/Wizard";
import { RichTextEditorDemo } from "./demos/RichTextEditor";
import { SortableListDemo } from "./demos/SortableList";
import { ResizablePanelsDemo } from "./demos/ResizablePanels";
import { TooltipDemo } from "./demos/Tooltip";
import { DialogDemo } from "./demos/Dialog";
import { AlertDialogDemo } from "./demos/AlertDialog";
import { PopoverDemo } from "./demos/Popover";
import { DropdownDemo } from "./demos/Dropdown";
import { TabsDemo } from "./demos/Tabs";
import { CheckboxDemo } from "./demos/Checkbox";
import { RadioDemo } from "./demos/Radio";
import { ToggleDemo } from "./demos/Toggle";
import { WordmarkDemo } from "./demos/Wordmark";
import { SelectionListDemo } from "./demos/SelectionList";
import { SidebarDemo } from "./demos/Sidebar";
import { AnimationsDemo } from "./demos/Animations";

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
    { id: "typography", title: "Typography", Demo: TypographyDemo },
    { id: "button", title: "Button", Demo: ButtonDemo },
    { id: "badge", title: "Badge", Demo: BadgeDemo },
    { id: "input", title: "Input", Demo: InputDemo },
    { id: "input-group", title: "Input Group", Demo: InputGroupDemo },
    { id: "password-input", title: "Password Input", Demo: PasswordInputDemo },
    { id: "search-input", title: "Search Input", Demo: SearchInputDemo },
    { id: "pin-input", title: "Pin Input", Demo: PinInputDemo },
    { id: "phone-input", title: "Phone Input", Demo: PhoneInputDemo },
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
    { id: "timestamp", title: "Timestamp", Demo: TimestampDemo },
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
    { id: "multi-select", title: "Multi Select", Demo: MultiSelectDemo },
    { id: "outline", title: "Outline", Demo: OutlineDemo },
    { id: "date-input", title: "Date Input", Demo: DateInputDemo },
    { id: "time-input", title: "Time Input", Demo: TimeInputDemo },
    { id: "date-time-input", title: "Date Time Input", Demo: DateTimeInputDemo },
    { id: "lightbox", title: "Lightbox", Demo: LightboxDemo },
    { id: "overlay", title: "Overlay", Demo: OverlayDemo },
    { id: "overflow-list", title: "Overflow List", Demo: OverflowListDemo },
    { id: "metadata-list", title: "Metadata List", Demo: MetadataListDemo },
    { id: "chat-suite", title: "Chat Suite", Demo: ChatSuiteDemo },
    { id: "power-search", title: "Power Search", Demo: PowerSearchDemo },
    { id: "app-shell", title: "App Shell", Demo: AppShellDemo },
    { id: "hooks", title: "Hooks", Demo: HooksDemo },
    { id: "calendar", title: "Calendar", Demo: CalendarDemo },
    { id: "data-table", title: "Data Table", Demo: DataTableDemo },
    { id: "empty-state", title: "Empty State", Demo: EmptyStateDemo },
    { id: "tag-input", title: "Tag Input", Demo: TagInputDemo },
    { id: "chart", title: "Chart", Demo: ChartDemo },
    { id: "color-picker", title: "Color Picker", Demo: ColorPickerDemo },
    { id: "command-palette", title: "Command Palette", Demo: CommandPaletteDemo },
    { id: "tree-view", title: "Tree View", Demo: TreeViewDemo },
    { id: "dropzone", title: "Dropzone", Demo: DropzoneDemo },
    { id: "file-upload", title: "File Upload", Demo: FileUploadDemo },
    { id: "wizard", title: "Wizard", Demo: WizardDemo },
    { id: "rich-text-editor", title: "Rich Text Editor", Demo: RichTextEditorDemo },
    { id: "sortable-list", title: "Sortable List", Demo: SortableListDemo },
    { id: "resizable-panels", title: "Resizable Panels", Demo: ResizablePanelsDemo },
    { id: "tooltip", title: "Tooltip", Demo: TooltipDemo },
    { id: "dialog", title: "Dialog", Demo: DialogDemo },
    { id: "alert-dialog", title: "Alert Dialog", Demo: AlertDialogDemo },
    { id: "popover", title: "Popover", Demo: PopoverDemo },
    { id: "dropdown", title: "Dropdown", Demo: DropdownDemo },
    { id: "tabs", title: "Tabs", Demo: TabsDemo },
    { id: "checkbox", title: "Checkbox", Demo: CheckboxDemo },
    { id: "radio", title: "Radio", Demo: RadioDemo },
    { id: "toggle", title: "Toggle", Demo: ToggleDemo },
    { id: "wordmark", title: "Wordmark", Demo: WordmarkDemo },
    { id: "selection-list", title: "Selection List", Demo: SelectionListDemo },
    { id: "sidebar", title: "Sidebar", Demo: SidebarDemo },
    { id: "animations", title: "Animations", Demo: AnimationsDemo },
];
