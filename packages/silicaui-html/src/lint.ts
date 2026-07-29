/**
 * The block linter (architecture spec §6.3, §10). Validates a block's class
 * strings against the banned surface so a conformant block is *guaranteed* to
 * pass a host's class gate — drift caught in @wizeworks/silicaui CI, not a consumer's.
 *
 * This enforces the security-load-bearing denylist (`fixed`, arbitrary `z-[…]`,
 * `content-[…]`, `url(…)`), bans viewport variants in blocks (the element-canvas
 * requires container queries), rejects inline `style`, and warns on lorem copy.
 */
import type { Node, Template } from "./schema";
import { walk } from "./tree";

export interface LintIssue {
  level: "error" | "warn";
  rule: string;
  message: string;
  node?: string;
}

const VIEWPORT: ReadonlySet<string> = new Set(["sm", "md", "lg", "xl", "2xl"]);

export interface ClassDenial {
  rule: string;
  message: string;
}

/**
 * The security-load-bearing denylist, factored out so it's ONE set of rules
 * shared by this build-time block linter AND the runtime `class-policy.ts`
 * floor a live builder enforces on every class-string commit — not two
 * independently-maintained copies. Viewport-variant banning stays linter-only
 * below (it's a blocks-authoring convention, not a live-editing security
 * concern — a live document isn't restricted to container queries).
 */
export function deniedToken(token: string): ClassDenial | undefined {
  const segs = token.split(":");
  const base = segs[segs.length - 1] ?? token;
  if (base === "fixed") {
    return { rule: "no-fixed", message: "`fixed` is banned (full-viewport overlay vector)" };
  }
  if (base.startsWith("z-[")) {
    return { rule: "no-arbitrary-z", message: "arbitrary `z-[…]` is banned; use the named z-scale" };
  }
  if (base.startsWith("content-[")) {
    return { rule: "no-content", message: "`content-[…]` is banned (injection vector)" };
  }
  if (/url\(/i.test(token)) {
    return { rule: "no-url", message: "`url(…)` in a class is banned (external load / exfiltration)" };
  }
  return undefined;
}

/**
 * A faded INK on a shipped block. House RULE #3: text a person is meant to read
 * gets a real ink token, never a `/opacity` one — faded ink is reserved for text
 * deliberately not meant to be read. A block can't know its own context well
 * enough to earn that exception, and the default palette is exactly where the
 * habit spreads from, so the rule is absolute here.
 *
 * Only INK is checked. A faded BACKGROUND is a judgement call a block can
 * legitimately make (a scrim over an image, say), and the same rule warns
 * against overusing it without being able to tell the cases apart.
 */
function fadedInk(token: string): boolean {
  const base = token.split(":").pop() ?? token;
  return /^text-[a-z0-9-]+\/\d+$/.test(base);
}

/**
 * A "kicker"/eyebrow: uppercase micro-caps used as an editorial label. House
 * RULE #2 bans the SLOT, not one piece of markup — so the signal we can see
 * from a class string is the styling that only ever dresses one.
 */
function microCaps(cls: string): boolean {
  const tokens = new Set(cls.split(/\s+/).filter(Boolean).map((t) => t.split(":").pop() ?? t));
  return tokens.has("uppercase") && (tokens.has("tracking-wide") || tokens.has("tracking-widest"));
}

function lintClass(cls: string, hint: string, issues: LintIssue[]): void {
  for (const token of cls.split(/\s+/).filter(Boolean)) {
    const segs = token.split(":");
    const variants = segs.slice(0, -1);

    const denial = deniedToken(token);
    if (denial) issues.push({ level: "error", rule: denial.rule, message: denial.message, node: hint });

    if (fadedInk(token)) {
      issues.push({
        level: "error",
        rule: "no-faded-ink",
        message: `\`${token}\`: readable text takes a real ink token, not a faded one (hierarchy comes from scale, weight, and color)`,
        node: hint,
      });
    }

    for (const v of variants) {
      if (VIEWPORT.has(v)) {
        issues.push({ level: "error", rule: "no-viewport", message: `viewport variant \`${v}:\` is banned in blocks; use container queries (@…)`, node: hint });
      }
    }
  }

  if (microCaps(cls)) {
    issues.push({
      level: "error",
      rule: "no-eyebrow",
      message: "uppercase micro-caps read as an eyebrow/kicker label; let the heading carry itself",
      node: hint,
    });
  }
}

/** Collect every lint issue in a block (empty = clean). */
export function lintBlock(template: Template): LintIssue[] {
  const issues: LintIssue[] = [];
  walk(template.root, (n) => {
    if (n.kind === "outlet") {
      issues.push({ level: "error", rule: "no-outlet", message: "Outlet is Frame-only; not allowed in a block", node: "outlet" });
      return;
    }
    const hint = n.kind === "element" ? n.tag : n.component;
    if (n.class) lintClass(n.class, hint, issues);
    if (n.slot && /^(eyebrow|kicker)$/i.test(n.slot.name)) {
      issues.push({
        level: "error",
        rule: "no-eyebrow",
        message: `slot "${n.slot.name}" is an eyebrow by name — the slot itself is the banned pattern, not its styling`,
        node: hint,
      });
    }
    if (n.kind === "element" && n.attrs && Object.prototype.hasOwnProperty.call(n.attrs, "style")) {
      issues.push({ level: "error", rule: "no-inline-style", message: "inline `style` is banned; use classes", node: hint });
    }
    for (const c of n.children ?? []) {
      if (typeof c === "string" && /lorem ipsum/i.test(c)) {
        issues.push({ level: "warn", rule: "no-lorem", message: "placeholder lorem ipsum — use realistic copy", node: hint });
      }
    }
  });
  return issues;
}

const CONTAINER_VARIANT_RE = /(^|:)@(?!container\b)[\w-]+:/;

/** Does this class string establish a container-query context? Both the bare
 *  `@container` and the named form (`@container/sidebar`). */
function establishesContainer(cls: string | undefined): boolean {
  return (cls ?? "")
    .split(/\s+/)
    .some((t) => t === "@container" || t.startsWith("@container/"));
}

/** Every container variant (`@md:`) in a class string, deduped. */
function containerVariants(cls: string | undefined): string[] {
  const out = new Set<string>();
  for (const token of (cls ?? "").split(/\s+/).filter(Boolean)) {
    if (CONTAINER_VARIANT_RE.test(token)) out.add(token);
  }
  return [...out];
}

/**
 * STRUCTURAL lint over a live tree: the checks that need the whole document, not
 * one class string.
 *
 * There is exactly one today, and it's the one a host provably cannot do. A
 * `ClassValidator` sees only the string being written, so it can confirm
 * `@2xl:grid-cols-2` is well-formed and has no way to know whether any ancestor
 * establishes a container — and a container variant with no container above it
 * compiles, ships, and silently does nothing. The engine knows the tree; this is
 * the only place the check can live.
 *
 * Reported as WARNINGS, not errors: an orphaned container query is inert, not
 * dangerous, and a subtree in mid-edit (or one pasted before its wrapper) hits
 * it legitimately. A builder badges the node; a publish pipeline can choose to
 * treat warnings as fatal.
 *
 * Pass `root` — a page body, a frame, a symbol master. Ancestors OUTSIDE `root`
 * are invisible to it, so a caller checking a fragment may see a warning that
 * the composed document wouldn't; check whole trees.
 */
export function lintTree(root: Node): LintIssue[] {
  const issues: LintIssue[] = [];

  const visit = (node: Node, hasContainer: boolean): void => {
    if (node.kind === "outlet") return;
    const hint = node.kind === "element" ? node.tag : node.component;

    if (!hasContainer) {
      const orphaned = containerVariants(node.class);
      if (orphaned.length > 0) {
        issues.push({
          level: "warn",
          rule: "orphan-container-query",
          message:
            `${orphaned.join(", ")} has no \`@container\` ancestor, so ${orphaned.length > 1 ? "they never match" : "it never matches"} — ` +
            "add `@container` to a wrapper (the editor does this for you when you author a breakpoint).",
          node: hint,
        });
      }
    }

    // A node establishing a container satisfies its DESCENDANTS, not itself: a
    // container query measures the nearest container ANCESTOR, never the element
    // the class sits on. `@container @md:grid-cols-2` on one node is the classic
    // version of this bug, and reads as obviously fine.
    const below = hasContainer || establishesContainer(node.class);
    for (const child of node.children ?? []) {
      if (typeof child !== "string") visit(child, below);
    }
  };

  visit(root, false);
  return issues;
}

/** Throw if a block has any error-level issues (warnings are allowed). */
export function assertBlockClean(template: Template): void {
  const errors = lintBlock(template).filter((i) => i.level === "error");
  if (errors.length > 0) {
    throw new Error(
      `Block "${template.key}" failed the linter:\n` +
        errors
          .map((e) => `  [${e.rule}] ${e.message}${e.node ? ` (<${e.node}>)` : ""}`)
          .join("\n"),
    );
  }
}
