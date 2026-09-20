/**
 * Find (and replace) a piece of text across EVERY email in a project.
 *
 * Why this exists. P04 act 7: an offer code goes out wrong, and it has already
 * been duplicated for three shops. Counted honestly, it sat in twelve places —
 * four per email: the subject, the preview text, one sentence in the body, and
 * the query string on the button's link. Six of those twelve are on no screen
 * he was looking at: the subject and preview text live behind a tree row called
 * "Email", and a button's address is only visible once that button is selected.
 * The builder offered nothing at all for finding a word, so "fix it everywhere"
 * meant "remember everywhere", and the one he forgets goes to 4,100 people.
 *
 * Scope, stated rather than discovered:
 *
 * - **Exact text, capitals included.** No case folding, no wildcards, no
 *   regular expressions. An offer code, a date, a price and a URL are the
 *   things people actually hunt, and all four are typed exactly.
 * - **Only what a reader would see or follow** — the words, a button's label,
 *   a link's address, an image's description, and the author's own block names.
 *   Not the class names, colors, or sizes: those are the design, and a replace
 *   that rewrote `#18181b` because it contained `18` would be a disaster.
 * - **Never inside markup.** A text block stores HTML, so a naive replace of
 *   "a" would rewrite `<a href=…>` into nonsense. Matching and replacing
 *   happen in the text between the tags, never in a tag.
 */
import type { EmailDocument, EmailNode, EmailProject } from "./schema";
import { nodeName } from "./node-display";

/** One place a search term sits. A field, not a character offset: the author
 *  fixes a field, and a field is what the Inspector puts in front of him. */
export interface EmailTextMatch {
  templateId: string;
  templateName: string;
  /** Absent for the two that belong to the email itself (subject/preview text). */
  nodeId?: string;
  field: "subject" | "preheader" | "html" | "label" | "href" | "alt" | "src" | "name";
  /** Plain English, for a person who has never heard the word "node". */
  where: string;
  /** The words around the match, for recognising the right one at a glance. */
  excerpt: string;
  /** How many times the term appears in THIS field. */
  count: number;
}

/** Split an HTML fragment into alternating text and tags: parts at even indices
 *  are what a reader sees, odd ones are markup. */
function htmlParts(html: string): string[] {
  return html.split(/(<[^>]*>)/);
}

/** Occurrences of `find` in `hay`. Empty needle counts as none — otherwise
 *  every gap between characters is a match and the UI reports nonsense. */
function countOf(hay: string, find: string): number {
  return find ? hay.split(find).length - 1 : 0;
}

/** Count in the READABLE text of an HTML fragment only. */
export function countOutsideTags(html: string, find: string): number {
  let n = 0;
  const parts = htmlParts(html);
  for (let i = 0; i < parts.length; i += 2) n += countOf(parts[i]!, find);
  return n;
}

/** Replace in the READABLE text of an HTML fragment only — tags untouched. */
export function replaceOutsideTags(html: string, find: string, to: string): string {
  if (!find) return html;
  const parts = htmlParts(html);
  for (let i = 0; i < parts.length; i += 2) parts[i] = parts[i]!.split(find).join(to);
  return parts.join("");
}

/** Tags stripped, whitespace collapsed — what the excerpt is cut from. */
function plain(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

/** A window around the first match, so a long paragraph is recognisable without
 *  filling the rail. */
function excerptOf(text: string, find: string): string {
  const at = text.indexOf(find);
  if (at < 0) return text.length > 60 ? `${text.slice(0, 60)}…` : text;
  const from = Math.max(0, at - 24);
  const to = Math.min(text.length, at + find.length + 24);
  return `${from > 0 ? "…" : ""}${text.slice(from, to)}${to < text.length ? "…" : ""}`;
}

/** The fields worth searching on each kind, with the words a marketing lead
 *  would use for them. ONE table, so the finder and the replacer can never
 *  disagree about what is searchable. */
const FIELDS: Record<string, ReadonlyArray<{ field: EmailTextMatch["field"]; label: string }>> = {
  text: [{ field: "html", label: "the words" }],
  button: [
    { field: "label", label: "the button's words" },
    { field: "href", label: "the button's web address" },
  ],
  link: [{ field: "href", label: "the web address" }],
  image: [
    { field: "alt", label: "the image description" },
    { field: "src", label: "the image address" },
  ],
};

/** Every match in one document, in the order the Layers tree lists them. */
function findInDocument(doc: EmailDocument, templateId: string, templateName: string, find: string): EmailTextMatch[] {
  const out: EmailTextMatch[] = [];
  const base = { templateId, templateName };
  const meta = (field: "subject" | "preheader", label: string, value: string) => {
    const n = countOf(value, find);
    if (n) out.push({ ...base, field, where: label, excerpt: excerptOf(value, find), count: n });
  };
  meta("subject", "Subject", doc.subject);
  meta("preheader", "Preview text", doc.preheader);

  const visit = (node: EmailNode): void => {
    // The author's own name for a block — his label, so his words are in it.
    if (node.name) {
      const n = countOf(node.name, find);
      if (n) out.push({ ...base, nodeId: node.id, field: "name", where: "the block's name", excerpt: excerptOf(node.name, find), count: n });
    }
    for (const { field, label } of FIELDS[node.kind] ?? []) {
      const value = (node as unknown as Record<string, unknown>)[field];
      if (typeof value !== "string" || value === "") continue;
      const n = field === "html" ? countOutsideTags(value, find) : countOf(value, find);
      if (!n) continue;
      const text = field === "html" ? plain(value) : value;
      out.push({ ...base, nodeId: node.id, field, where: `${nodeName(node)} — ${label}`, excerpt: excerptOf(text, find), count: n });
    }
    for (const child of (node as { children?: readonly EmailNode[] }).children ?? []) visit(child);
  };
  visit(doc.root as EmailNode);
  return out;
}

/** Every match in every template, in roster order. */
export function findInProject(project: EmailProject, find: string): EmailTextMatch[] {
  if (!find) return [];
  return project.templates.flatMap((t) => findInDocument(t.document, t.id, t.name, find));
}

/** The patch that fixes one node, or undefined when it holds no match. Shares
 *  `FIELDS` with the finder, so what is listed is exactly what is changed. */
export function replacementFor(node: EmailNode, find: string, to: string): Record<string, string> | undefined {
  const patch: Record<string, string> = {};
  if (node.name && countOf(node.name, find)) patch.name = node.name.split(find).join(to);
  for (const { field } of FIELDS[node.kind] ?? []) {
    const value = (node as unknown as Record<string, unknown>)[field];
    if (typeof value !== "string" || value === "") continue;
    if (field === "html") {
      if (countOutsideTags(value, find)) patch[field] = replaceOutsideTags(value, find, to);
    } else if (countOf(value, find)) {
      patch[field] = value.split(find).join(to);
    }
  }
  return Object.keys(patch).length ? patch : undefined;
}
