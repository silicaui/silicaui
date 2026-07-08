/**
 * The block linter (architecture spec §6.3, §10). Validates a block's class
 * strings against the banned surface so a conformant block is *guaranteed* to
 * pass a host's class gate — drift caught in @wizeworks/silicaui CI, not a consumer's.
 *
 * This enforces the security-load-bearing denylist (`fixed`, arbitrary `z-[…]`,
 * `content-[…]`, `url(…)`), bans viewport variants in blocks (the element-canvas
 * requires container queries), rejects inline `style`, and warns on lorem copy.
 */
import type { Template } from "./schema";
import { walk } from "./tree";

export interface LintIssue {
  level: "error" | "warn";
  rule: string;
  message: string;
  node?: string;
}

const VIEWPORT: ReadonlySet<string> = new Set(["sm", "md", "lg", "xl", "2xl"]);

function lintClass(cls: string, hint: string, issues: LintIssue[]): void {
  for (const token of cls.split(/\s+/).filter(Boolean)) {
    const segs = token.split(":");
    const base = segs[segs.length - 1] ?? token;
    const variants = segs.slice(0, -1);

    if (base === "fixed") {
      issues.push({ level: "error", rule: "no-fixed", message: "`fixed` is banned (full-viewport overlay vector)", node: hint });
    }
    if (base.startsWith("z-[")) {
      issues.push({ level: "error", rule: "no-arbitrary-z", message: "arbitrary `z-[…]` is banned; use the named z-scale", node: hint });
    }
    if (base.startsWith("content-[")) {
      issues.push({ level: "error", rule: "no-content", message: "`content-[…]` is banned (injection vector)", node: hint });
    }
    if (/url\(/i.test(token)) {
      issues.push({ level: "error", rule: "no-url", message: "`url(…)` in a class is banned (external load / exfiltration)", node: hint });
    }
    for (const v of variants) {
      if (VIEWPORT.has(v)) {
        issues.push({ level: "error", rule: "no-viewport", message: `viewport variant \`${v}:\` is banned in blocks; use container queries (@…)`, node: hint });
      }
    }
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
