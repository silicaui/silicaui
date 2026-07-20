import { carousel } from "./behaviors/carousel";
import { disclosure } from "./behaviors/disclosure";
import { dismiss } from "./behaviors/dismiss";
import { form } from "./behaviors/form";
import { marquee } from "./behaviors/marquee";
import { menu } from "./behaviors/menu";
import { scrollspy, toc } from "./behaviors/scrollspy";
import { counter } from "./behaviors/counter";
import { tabs } from "./behaviors/tabs";
import { sidebar } from "./behaviors/sidebar";
import { selectionList } from "./behaviors/selection-list";
import { modal } from "./behaviors/modal";
import { popover } from "./behaviors/popover";
import { combobox } from "./behaviors/combobox";
import { dateSegment } from "./behaviors/date-segment";
import { pinInput } from "./behaviors/pin-input";
import { calendar } from "./behaviors/calendar";
import { tree } from "./behaviors/tree";
import { wizard } from "./behaviors/wizard";
import { numberField } from "./behaviors/number-field";
import { toggleGroup } from "./behaviors/toggle-group";
import { scrollArea } from "./behaviors/scroll-area";
import { overflowList } from "./behaviors/overflow-list";
import { dropzone } from "./behaviors/dropzone";
import { slider } from "./behaviors/slider";
import { switchBehavior } from "./behaviors/switch";
import { rating } from "./behaviors/rating";
import { themeToggle } from "./behaviors/theme-toggle";
import { phoneInput } from "./behaviors/phone-input";
import { reveal } from "./behaviors/reveal";
import { countdown } from "./behaviors/countdown";
import type { BehaviorHandler, BehaviorType } from "./types";

/** The closed dispatch table — one handler per `BehaviorType` (architecture §7). */
export const HANDLERS: Record<BehaviorType, BehaviorHandler> = {
  carousel,
  disclosure,
  tabs,
  menu,
  marquee,
  scrollspy,
  counter,
  dismiss,
  toc,
  form,
  sidebar,
  "selection-list": selectionList,
  modal,
  popover,
  combobox,
  "date-segment": dateSegment,
  "pin-input": pinInput,
  calendar,
  tree,
  wizard,
  "number-field": numberField,
  "toggle-group": toggleGroup,
  "scroll-area": scrollArea,
  "overflow-list": overflowList,
  dropzone,
  slider,
  switch: switchBehavior,
  rating,
  "theme-toggle": themeToggle,
  "phone-input": phoneInput,
  reveal,
  countdown,
};
