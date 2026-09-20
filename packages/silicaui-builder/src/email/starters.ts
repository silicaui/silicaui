/**
 * Email starters — the shapes a person picks instead of starting from a blank
 * page.
 *
 * WHY THIS EXISTS. `addTemplate()` produced an empty document with one line of
 * placeholder text, and the panel offering it is called **Templates** — a word
 * that, in every email tool a marketing person has used, means "a design to
 * start from". Here it meant "one of the emails I have already made". So the
 * first thing someone who has sent a newsletter every week for four years does —
 * open the template list and pick one — had nothing to pick. Found by P04
 * (issues/063).
 *
 * The site builder has had exactly this for a while: shipped starters, a picker,
 * and a host seam to contribute more. This is that, for email, deliberately
 * mirroring `component-starters.ts` so the two do not drift into different
 * shapes for the same idea.
 *
 * A starter returns a WHOLE `EmailDocument`, not a node — because the choices
 * that make a newsletter a newsletter (body width, the background behind the
 * content, the subject line) live on the document, not inside it.
 *
 * The copy in here is deliberately STOCK and deliberately obvious. A starter
 * whose placeholder text reads like finished copy is how a stock address and
 * somebody else's unsubscribe line end up in a real send.
 */
import { DEFAULT_EMAIL_COLORS, EMAIL_BUTTON_PADDING } from "./schema";
import type {
  ButtonNode,
  ColumnsNode,
  DividerNode,
  EmailColorDefaults,
  EmailDocument,
  ImageNode,
  LinkNode,
  SectionNode,
  SpacerNode,
  TextNode,
} from "./schema";
import type { IconName } from "../shared/icons";

export interface EmailStarter {
  key: string;
  label: string;
  /** One line, in the words of somebody who sends email — not of the schema. */
  hint: string;
  icon: IconName;
  make: (makeId: () => string, colors: EmailColorDefaults) => EmailDocument;
}

export interface EmailStarterGroup {
  key: string;
  label: string;
  items: EmailStarter[];
}

/** What a host contributes. Same merge shape as the site builder's
 *  `StarterContribution`: `extend` adds, `hide` prunes by key. */
export interface EmailStarterContribution {
  extend?: EmailStarterGroup[];
  hide?: string[];
}

// ── small builders, matching the palette's own node shapes ───────────────────
// These mirror `EMAIL_PALETTE`'s factories on purpose. A starter that invents a
// slightly different Button is a starter that drifts from what Insert produces.

const text = (
  id: () => string,
  c: EmailColorDefaults,
  html: string,
  over: Partial<TextNode> = {},
): TextNode => ({
  id: id(),
  kind: "text",
  html,
  align: "left",
  color: c.baseContent,
  colorAuto: true,
  fontSize: 16,
  fontWeight: "normal",
  lineHeight: 24,
  ...over,
});

const button = (
  id: () => string,
  c: EmailColorDefaults,
  label: string,
  over: Partial<ButtonNode> = {},
): ButtonNode => ({
  id: id(),
  kind: "button",
  label,
  href: "",
  bg: c.primary,
  bgAuto: true,
  color: c.primaryContent,
  colorAuto: true,
  radius: 8,
  align: "center",
  paddingX: EMAIL_BUTTON_PADDING.x,
  paddingY: EMAIL_BUTTON_PADDING.y,
  ...over,
});

const image = (id: () => string, alt: string, width: number, over: Partial<ImageNode> = {}): ImageNode => ({
  id: id(),
  kind: "image",
  src: "",
  // A starter ships a real `alt` rather than an empty one: an image with no
  // alt text is invisible to every subscriber whose client blocks images, and
  // an empty string reads as "decorative, skip me" to a screen reader. Stock
  // alt is wrong copy; missing alt is a missing affordance.
  alt,
  width,
  align: "center",
  ...over,
});

const divider = (id: () => string, c: EmailColorDefaults): DividerNode => ({
  id: id(),
  kind: "divider",
  color: c.base300,
  colorAuto: true,
  thickness: 1,
});

const spacer = (id: () => string, height: number): SpacerNode => ({ id: id(), kind: "spacer", height });

const section = (
  id: () => string,
  c: EmailColorDefaults,
  children: SectionNode["children"],
  over: Partial<SectionNode> = {},
): SectionNode => ({
  id: id(),
  kind: "section",
  bg: c.base100,
  bgAuto: true,
  paddingX: 24,
  paddingY: 24,
  children,
  ...over,
});

const columns = (id: () => string, widths: number[], children: ColumnsNode["children"][number]["children"][]): ColumnsNode => ({
  id: id(),
  kind: "columns",
  stackOnMobile: true,
  children: widths.map((widthPct, i) => ({
    id: id(),
    kind: "column" as const,
    widthPct,
    children: children[i] ?? [],
  })),
});

/**
 * A card whose WHOLE contents point at one URL — the shape a "pick of the week"
 * actually is. The three children each get their own inline anchor when the
 * document is projected (`renderLink` distributes the href rather than wrapping
 * the group, because an anchor around block content is invalid in the dialect
 * Outlook's Word engine parses and Outlook drops the link entirely).
 *
 * The picks used to be a bare `[image, text, text]`, so an author who set the
 * image's own Link URL got a card where ONLY THE COVER was clickable and the
 * title beside it was not — and people click titles. The palette has shipped a
 * `link-card` item described as "Image + title + price, all pointing at one URL
 * — the product/article card" the whole time; the starter just did not use it.
 * See P04/issues 070.
 *
 * `href` is deliberately empty: a starter cannot know a shop's URLs, and an
 * empty href links nothing at all rather than emitting `<a href="">`.
 */
const linkedCard = (
  id: () => string,
  c: EmailColorDefaults,
  alt: string,
  title: string,
  line: string,
): LinkNode => ({
  id: id(),
  kind: "link",
  href: "",
  children: [
    image(id, alt, 160),
    text(id, c, title, { fontWeight: "semibold" }),
    text(id, c, line, { fontSize: 14, lineHeight: 20 }),
  ],
});

/** The body every starter shares — one width, one background pair, one stack. */
const body = (
  id: () => string,
  c: EmailColorDefaults,
  subject: string,
  preheader: string,
  children: SectionNode[],
): EmailDocument => ({
  version: "1",
  subject,
  preheader,
  root: {
    id: id(),
    kind: "body",
    width: 600,
    bg: c.base200,
    bgAuto: true,
    contentBg: c.base100,
    contentBgAuto: true,
    fontFamily: "Arial, Helvetica, sans-serif",
    children,
  },
});

/**
 * The footer every starter ends with.
 *
 * It carries a real `{{unsubscribeUrl}}` merge token rather than a `#`, because
 * an unsubscribe link that does not work is the one defect in an email that is
 * also illegal in most of the world. The postal address is left as an obvious
 * blank for the same reason the copy is obviously stock — a plausible-looking
 * fake address is the thing that ships by accident.
 */
const footer = (id: () => string, c: EmailColorDefaults): SectionNode =>
  section(
    id,
    c,
    [
      divider(id, c),
      spacer(id, 8),
      text(id, c, "YOUR COMPANY · Your street address, town, postcode", {
        align: "center",
        fontSize: 14,
        lineHeight: 20,
      }),
      text(id, c, 'You are receiving this because you signed up. <a href="{{unsubscribeUrl}}">Unsubscribe</a>', {
        align: "center",
        fontSize: 14,
        lineHeight: 20,
      }),
    ],
    { bg: c.base200, bgAuto: true, paddingY: 16 },
  );

// ── the shipped starters ─────────────────────────────────────────────────────

const blank: EmailStarter = {
  key: "blank",
  label: "Blank email",
  hint: "One empty section. Start from nothing.",
  icon: "section",
  make: (id, c) =>
    body(id, c, "New email", "", [section(id, c, [text(id, c, "Start writing your email…")])]),
};

const newsletter: EmailStarter = {
  key: "newsletter",
  label: "Newsletter",
  hint: "A masthead, a lead story, three picks and a footer — the weekly-send shape",
  icon: "mail",
  make: (id, c) =>
    body(id, c, "Your newsletter subject line", "One line of preview text, shown next to the subject", [
      section(id, c, [image(id, "Your logo", 160), spacer(id, 8)], { paddingY: 20 }),
      section(id, c, [
        // NOT `Hello {{firstName}},`. A starter cannot know a host's reference
        // names, and `firstName` was a guess: no host in this repo resolves it,
        // so the out-of-the-box newsletter delivered the literal text
        // "Hello {{firstName}}," to every real subscriber. See P04/issues 066.
        // Stock copy must be correct when sent untouched; personalising it is
        // the author's move, and the Inspector's "Merge tokens" row tells him
        // what his own token will send the moment he types one.
        text(id, c, "Hello there,", { fontSize: 18, fontWeight: "semibold", lineHeight: 26 }),
        text(id, c, "A sentence introducing this issue. Replace this with what you actually want to say."),
      ], { paddingY: 8 }),
      section(id, c, [
        image(id, "Lead story image", 552),
        spacer(id, 12),
        text(id, c, "The lead story headline", { fontSize: 22, fontWeight: "bold", lineHeight: 30 }),
        text(id, c, "Two or three sentences about the lead story. This is the part most people read, so it is the part worth writing last."),
        spacer(id, 12),
        button(id, c, "Read more", { align: "left" }),
      ]),
      section(id, c, [divider(id, c), spacer(id, 8), text(id, c, "More this week", { fontSize: 18, fontWeight: "semibold", lineHeight: 26 })], { paddingY: 8 }),
      section(id, c, [
        columns(id, [33.33, 33.33, 33.34], [
          [linkedCard(id, c, "First pick", "First pick", "One line.")],
          [linkedCard(id, c, "Second pick", "Second pick", "One line.")],
          [linkedCard(id, c, "Third pick", "Third pick", "One line.")],
        ]),
      ]),
      footer(id, c),
    ]),
};

const announcement: EmailStarter = {
  key: "announcement",
  label: "Announcement",
  hint: "One thing to say and one thing to press — a launch, a closure, a change of hours",
  icon: "send",
  make: (id, c) =>
    body(id, c, "Something worth one email", "The one line that makes them open it", [
      section(id, c, [image(id, "Your logo", 160)], { paddingY: 20 }),
      section(id, c, [
        text(id, c, "The one thing you are announcing", { align: "center", fontSize: 26, fontWeight: "bold", lineHeight: 34 }),
        spacer(id, 8),
        text(id, c, "Two sentences of detail. What is changing, and when it takes effect.", { align: "center" }),
        spacer(id, 16),
        button(id, c, "See the details"),
      ], { paddingY: 32 }),
      footer(id, c),
    ]),
};

const offer: EmailStarter = {
  key: "offer",
  label: "Offer",
  hint: "A promotion with a code and an end date",
  icon: "star",
  make: (id, c) =>
    body(id, c, "Your offer, in the subject line", "Include the discount and the deadline here too", [
      section(id, c, [image(id, "Your logo", 160)], { paddingY: 20 }),
      section(id, c, [
        text(id, c, "20% off everything", { align: "center", fontSize: 28, fontWeight: "bold", lineHeight: 36 }),
        spacer(id, 8),
        text(id, c, "Use code YOURCODE at the checkout. Ends Sunday.", { align: "center", fontSize: 18, lineHeight: 26 }),
        spacer(id, 16),
        button(id, c, "Shop the offer"),
        spacer(id, 8),
        text(id, c, "Terms: say here what the offer does not apply to.", { align: "center", fontSize: 14, lineHeight: 20 }),
      ], { bg: c.base200, bgAuto: true, paddingY: 32 }),
      footer(id, c),
    ]),
};

export const EMAIL_STARTER_GROUPS: EmailStarterGroup[] = [
  { key: "start", label: "Start from", items: [blank, newsletter, announcement, offer] },
];

/** Merge a host group in: into a same-keyed group if one exists (skipping keys
 *  already present), else appended. Same semantics as the site builder's
 *  `mergeStarterGroup`, so a host group lands predictably in both. */
function mergeGroup(groups: EmailStarterGroup[], incoming: EmailStarterGroup): void {
  const existing = groups.find((g) => g.key === incoming.key);
  if (!existing) {
    groups.push({ ...incoming, items: [...incoming.items] });
    return;
  }
  for (const item of incoming.items) {
    if (!existing.items.some((i) => i.key === item.key)) existing.items.push(item);
  }
}

/** The starter groups a picker should show: the shipped set, plus whatever the
 *  host contributes, minus whatever it hides. A group emptied by `hide` is
 *  dropped rather than left as a heading over nothing. */
export function emailStarterGroups(contribution?: EmailStarterContribution): EmailStarterGroup[] {
  const groups: EmailStarterGroup[] = EMAIL_STARTER_GROUPS.map((g) => ({ ...g, items: [...g.items] }));
  for (const g of contribution?.extend ?? []) mergeGroup(groups, g);
  const hidden = new Set(contribution?.hide ?? []);
  if (!hidden.size) return groups;
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !hidden.has(i.key)) }))
    .filter((g) => g.items.length);
}

/** Look one up by key across the merged set. */
export function emailStarterByKey(key: string, groups: EmailStarterGroup[]): EmailStarter | undefined {
  for (const g of groups) {
    const hit = g.items.find((i) => i.key === key);
    if (hit) return hit;
  }
  return undefined;
}
