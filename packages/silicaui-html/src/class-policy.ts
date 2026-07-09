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

/**
 * The declarative common case for a host's own policy — most hosts never need
 * to hand-write a validator function, just a list of additional blocked
 * prefixes/substrings/exact tokens. Always ANDs with `validateClassString`.
 */
export function buildClassValidator(config: { blocks: readonly AllowlistRule[] }): ClassValidator {
  return (cls) => {
    const floor = validateClassString(cls);
    if (!floor.ok) return floor;
    for (const token of cls.split(/\s+/).filter(Boolean)) {
      const hit = config.blocks.find((r) => ruleMatches(r, token));
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
