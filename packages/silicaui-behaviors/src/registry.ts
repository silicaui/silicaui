import { carousel } from "./behaviors/carousel";
import { disclosure } from "./behaviors/disclosure";
import { dismiss } from "./behaviors/dismiss";
import { form } from "./behaviors/form";
import { marquee } from "./behaviors/marquee";
import { menu } from "./behaviors/menu";
import { scrollspy, toc } from "./behaviors/scrollspy";
import { counter } from "./behaviors/counter";
import { tabs } from "./behaviors/tabs";
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
};
