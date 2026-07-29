/**
 * The runtime class-string security floor (builder-contract.md §9). The same
 * denylist the build-time block linter (`lint.ts`) enforces against authored
 * blocks, now callable per-class-string at LIVE edit time — a builder's
 * `setClass` call, paste, import, or AI-assist. One set of rules, not two.
 *
 * A host's own policy composes ON TOP via `buildClassValidator` / `composeValidators`;
 * it can only ADD restrictions, never lift this floor — the insecure state
 * (accidentally loosening the floor) is structurally unrepresentable.
 */
import { deniedToken } from "./lint";

export type ClassValidator = (cls: string) => { ok: true } | { ok: false; reason: string };

/** The floor alone. Every class-mutation call site runs this first. */
export const validateClassString: ClassValidator = (cls) => {
  for (const token of cls.split(/\s+/).filter(Boolean)) {
    const denial = deniedToken(token);
    if (denial) return { ok: false, reason: `"${token}": ${denial.message}` };
  }
  return { ok: true };
};

/** A declarative host rule — deliberately enumerated, never a free regex, to
 *  avoid ReDoS. `blocks` may only ADD restrictions; there is no "unblock" kind,
 *  so a tenant config can't loosen the floor even by accident. */
export type AllowlistRule = { kind: "prefix" | "exact" | "substring"; value: string };

function ruleMatches(rule: AllowlistRule, token: string): boolean {
  if (rule.kind === "exact") return token === rule.value;
  if (rule.kind === "prefix") return token.startsWith(rule.value);
  return token.includes(rule.value);
}

const VIEWPORT_VARIANTS: ReadonlySet<string> = new Set(["sm", "md", "lg", "xl", "2xl"]);

/**
 * Reject viewport variants (`md:`), pointing at the container equivalent.
 *
 * WHY THIS IS A POLICY AND NOT PART OF THE FLOOR. The floor in
 * `validateClassString` is security-load-bearing and, by design, un-liftable —
 * `composeValidators` lets a host only ADD. A viewport variant is not a security
 * problem: it's perfectly valid CSS that happens to be dishonest *in an
 * element-sized canvas*, because it resolves against the browser window and so
 * doesn't reflow when the device toggle changes. A host rendering into a context
 * where the page IS the viewport has every right to it.
 *
 * So it ships as a default a host can turn off, rather than a rule nobody can.
 * Putting it in the floor would have been the easy call and the wrong one: the
 * un-liftable set should contain only the things that are never legitimate.
 */
export const rejectViewportVariants: ClassValidator = (cls) => {
  for (const token of cls.split(/\s+/).filter(Boolean)) {
    for (const variant of token.split(":").slice(0, -1)) {
      if (VIEWPORT_VARIANTS.has(variant)) {
        return {
          ok: false,
          reason: `"${token}": viewport variant \`${variant}:\` doesn't reflow with the canvas — use the container variant \`@${variant}:\` instead`,
        };
      }
    }
  }
  return { ok: true };
};

/**
 * The declarative common case for a host's own policy — most hosts never need
 * to hand-write a validator function, just a list of additional blocked
 * prefixes/substrings/exact tokens. Always ANDs with `validateClassString`.
 *
 * `viewportVariants` defaults to `"reject"`, matching what the builder's canvas
 * can honestly render. Set it to `"allow"` for a host whose output really is
 * viewport-sized.
 */
export function buildClassValidator(config: {
  blocks?: readonly AllowlistRule[];
  viewportVariants?: "reject" | "allow";
}): ClassValidator {
  const blocks = config.blocks ?? [];
  const checkViewport = (config.viewportVariants ?? "reject") === "reject";
  return (cls) => {
    const floor = validateClassString(cls);
    if (!floor.ok) return floor;
    if (checkViewport) {
      const viewport = rejectViewportVariants(cls);
      if (!viewport.ok) return viewport;
    }
    for (const token of cls.split(/\s+/).filter(Boolean)) {
      const hit = blocks.find((r) => ruleMatches(r, token));
      if (hit) return { ok: false, reason: `"${token}" is blocked by host policy` };
    }
    return { ok: true };
  };
}

/** Compose the built-in floor with an optional host validator (a hand-written
 *  function, or one built by `buildClassValidator`) — the floor always runs
 *  first, and the host function can only add rejections, never remove them. */
export function composeValidators(host?: ClassValidator): ClassValidator {
  return (cls) => {
    const floor = validateClassString(cls);
    if (!floor.ok) return floor;
    return host ? host(cls) : { ok: true };
  };
}
