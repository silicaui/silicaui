"use client";

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@wizeworks/silicaui-react";
import { JsonLd } from "@/components/json-ld";
import { faqSchema } from "@/lib/schema";
import { Reveal } from "./reveal";

/**
 * The questions people actually ask an answer engine about a component library,
 * answered factually and quotably. One `FAQ_ITEMS` array drives both the
 * visible accordion and the FAQPage structured data, so they can't drift.
 *
 * Panels are `keepMounted` so every answer is present in the prerendered HTML
 * (not just the one that happens to be open) — a crawler reading the static
 * export sees the full text, and the JSON-LD carries it for answer engines that
 * read structured data instead.
 */
const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is SilicaUI?",
    a: "SilicaUI is an open-source component library for Tailwind CSS v4, built on Base UI. Components are styled with real CSS classes instead of runtime CSS-in-JS, and every color is an OKLCH design token — so declaring one named color re-tints every variant with no rebuild and no safelist. It ships in three synchronized layers: React, a framework-neutral HTML projection, and a zero-dependency vanilla behavior runtime.",
  },
  {
    q: "How is SilicaUI different from daisyUI?",
    a: "Both are Tailwind CSS component libraries with semantic class names, but SilicaUI adds a real behavior layer — Base UI in React and a vanilla runtime for static HTML — so interactive components like comboboxes, dialogs, and calendars are accessible out of the box, not just styled markup. Its colors are OKLCH tokens with automatically derived legible foregrounds, and any custom color you register gets full variant and utility support with no safelist.",
  },
  {
    q: "How is it different from shadcn/ui or Radix?",
    a: "shadcn/ui gives you copy-paste React components on Radix primitives. SilicaUI ships as versioned packages and works beyond React: the same components render as framework-neutral HTML and hydrate with a zero-dependency vanilla runtime, so static sites and server-rendered pages get the same accessible primitives without shipping a React bundle.",
  },
  {
    q: "Is SilicaUI accessible?",
    a: "Yes. Interactive components wrap Base UI, so focus management, keyboard navigation, and ARIA roles are built in. The non-React output is hydrated by silicaui-behaviors, which implements the same accessible interaction patterns with no framework dependency.",
  },
  {
    q: "Which frameworks does SilicaUI support?",
    a: "SilicaUI works with React 19+ via @wizeworks/silicaui-react, and in any HTML environment — static sites, server-rendered pages, or other frameworks — via @wizeworks/silicaui-html (a node tree that projects to HTML) together with @wizeworks/silicaui-behaviors (a vanilla runtime). The styling layer is a Tailwind CSS v4 plugin.",
  },
  {
    q: "Is SilicaUI free and open source?",
    a: "Yes — SilicaUI is MIT licensed and free to use in personal and commercial projects. The source is on GitHub and the packages are published to npm under the @wizeworks scope.",
  },
];

export function Faq() {
  return (
    <section className="border-t border-base-300 bg-base-100">
      <div className="mx-auto w-full max-w-3xl px-6 py-24 md:py-32">
        <JsonLd data={faqSchema(FAQ_ITEMS)} />
        <Reveal>
          <h2 className="text-4xl font-semibold tracking-tight text-base-content md:text-5xl">
            Questions, answered
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <Accordion
            multiple={false}
            defaultValue={[FAQ_ITEMS[0]!.q]}
            className="mt-10"
          >
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="text-lg text-base-content">
                  {item.q}
                </AccordionTrigger>
                <AccordionPanel keepMounted className="text-md text-base-content">
                  {item.a}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
