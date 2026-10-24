/** Cuts the compiled site stylesheet at the `.sui-chunk-*` markers the plugin emits. */
const MARKER = /^\.sui-chunk-([\w-]+)\{--sui-chunk:1\}$/;

/** Top-level rules of a minified stylesheet body (braces and `;` aware, strings skipped). */
export function splitRules(body) {
  const rules = [];
  let depth = 0;
  let start = 0;
  let quote = "";
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = "";
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) (rules.push(body.slice(start, i + 1)), (start = i + 1));
    else if (c === ";" && depth === 0) (rules.push(body.slice(start, i + 1)), (start = i + 1));
  }
  if (start < body.length) rules.push(body.slice(start));
  return rules;
}

const layerBody = (rule) => rule.slice(rule.indexOf("{") + 1, -1);
const wrap = (rules) => (rules.length ? `@layer base{${rules.join("")}}` : "");

/** Groups the base layer's rules into the part before, each component, and the part after. */
function groupBase(inner) {
  const chunks = [];
  const pre = [];
  const post = [];
  let current = null;
  for (const rule of inner) {
    const name = MARKER.exec(rule)?.[1];
    if (name === "end") current = post;
    else if (name) chunks.push({ name, rules: (current = []) });
    else (current ?? pre).push(rule);
  }
  return { pre, chunks, post };
}

/** Returns `{ head, chunks: [{name, css}], tail }`; head + chunks + tail restores the cascade. */
export function cutStylesheet(css) {
  const top = splitRules(css);
  const at = top.findIndex((r) => r.startsWith("@layer base{"));
  if (at < 0) throw new Error("split-css: no @layer base in the stylesheet");
  const { pre, chunks, post } = groupBase(splitRules(layerBody(top[at])));
  if (!chunks.length) throw new Error("split-css: no .sui-chunk markers; set chunkmarkers: true in globals.css");
  return {
    head: top.slice(0, at).join("") + wrap(pre),
    chunks: chunks.map(({ name, rules }) => ({ name, css: wrap(rules) })),
    tail: wrap(post) + top.slice(at + 1).join(""),
  };
}

/** Class names a stylesheet has selectors for (over-inclusive on purpose: safe for matching). */
export function classesIn(css) {
  const out = new Set();
  for (const m of css.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) out.add(m[1]);
  return out;
}

/** Class tokens used by a page's markup. */
export function classesInHtml(html) {
  const out = new Set();
  for (const m of html.matchAll(/\sclass="([^"]*)"/g)) for (const t of m[1].split(/\s+/)) if (t) out.add(t);
  return out;
}

/** Splits a selector list at top-level commas (commas inside `:is(…)` stay put). */
function selectors(list) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i] === "(" || list[i] === "[") depth++;
    else if (list[i] === ")" || list[i] === "]") depth--;
    else if (list[i] === "," && depth === 0) (out.push(list.slice(start, i)), (start = i + 1));
  }
  return [...out, list.slice(start)];
}

/** True when a chunk styles bare elements (headings, …): no class marks where it applies. */
export function isGlobal(chunkCss) {
  const rules = splitRules(layerBody(chunkCss)).filter((r) => !r.startsWith("@"));
  return rules.some((r) => selectors(r.slice(0, r.indexOf("{"))).some((s) => !/\.[A-Za-z_-]/.test(s)));
}
