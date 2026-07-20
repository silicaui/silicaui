/**
 * Fractional sibling ordering (`Node.ord`) — the ordering key that makes
 * concurrent edits to one parent commute.
 *
 * An array index is not a stable address: "insert at 2" means something
 * different depending on what else landed first, so two authors inserting into
 * the same parent produce a result neither of them saw. A fractional index is a
 * string chosen to sort strictly BETWEEN its two neighbors, so an insert touches
 * only the inserted node — the parent is never rewritten and two concurrent
 * inserts can't collide.
 *
 * Keys are compared with plain lexicographic `<`. The digit alphabet is ordered
 * to match ASCII byte order, so string comparison, `Array.sort()`, and a
 * database `ORDER BY` all agree without a collation.
 *
 * The array in `children` remains the local render order; `ord` is the merge
 * key that travels on the wire. See `assignOrds` for why both exist.
 */
import type { Child, Node } from "./schema";

/** Ordered so lexicographic string comparison matches numeric digit order. */
const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const BASE = DIGITS.length;

/**
 * A key strictly between `a` and `b`, treating both as fractions in (0, 1).
 * `a === ""` means "the start", `b === null` means "the end".
 *
 * No key may end in the lowest digit ("0"): such a key has no room below it
 * within the same length, which would make the midpoint non-terminating. The
 * algorithm never produces one, so the guard only fires on a corrupt input.
 */
function midpoint(a: string, b: string | null): string {
  if (b !== null && a >= b) {
    throw new Error(`ord: cannot order between ${JSON.stringify(a)} and ${JSON.stringify(b)} — not ascending`);
  }
  if (a.endsWith("0") || (b !== null && b.endsWith("0"))) {
    throw new Error(`ord: malformed key (trailing "0") in ${JSON.stringify([a, b])}`);
  }
  // Shared prefix contributes nothing to the ordering — recurse past it.
  if (b !== null) {
    let n = 0;
    while ((a[n] ?? "0") === b[n]) n++;
    if (n > 0) return b.slice(0, n) + midpoint(a.slice(n), b.slice(n));
  }
  const digitA = a ? DIGITS.indexOf(a[0]!) : 0;
  const digitB = b !== null ? DIGITS.indexOf(b[0]!) : BASE;
  if (digitB - digitA > 1) {
    // Room for a digit in between — the common case, and the only one that
    // doesn't grow the key.
    return DIGITS[Math.round(0.5 * (digitA + digitB))]!;
  }
  // Digits are adjacent. If `b` has more to give, its own first digit already
  // sorts above `a` and below `b`; otherwise borrow a digit and go deeper.
  if (b !== null && b.length > 1) return b.slice(0, 1);
  return DIGITS[digitA]! + midpoint(a.slice(1), null);
}

/**
 * A key is an INTEGER part followed by an optional fractional part.
 *
 * The integer part is self-describing: its first character encodes both sign and
 * total length ("a" → 2 chars, "b" → 3, …; "Z" → 2, "Y" → 3, … going negative),
 * chosen so that plain lexicographic comparison of whole keys still gives
 * numeric order. Without it, appending would walk the fractional part toward its
 * ceiling and borrow a digit every time — 200 appends produced a 41-character
 * key. With it, an append usually just increments and keys stay ~2 characters.
 */
function integerLength(head: string): number {
  if (head >= "a" && head <= "z") return head.charCodeAt(0) - 97 + 2;
  if (head >= "A" && head <= "Z") return 90 - head.charCodeAt(0) + 2;
  throw new Error(`ord: invalid key head ${JSON.stringify(head)}`);
}

function integerPart(key: string): string {
  const len = integerLength(key[0]!);
  if (len > key.length) throw new Error(`ord: truncated key ${JSON.stringify(key)}`);
  return key.slice(0, len);
}

/** The smallest representable integer part — nothing may sort below it. */
const SMALLEST_INT = "A" + DIGITS[0]!.repeat(26);

function incrementInteger(x: string): string | null {
  const [head, ...digs] = x.split("");
  let carry = true;
  for (let i = digs.length - 1; carry && i >= 0; i--) {
    const d = DIGITS.indexOf(digs[i]!) + 1;
    if (d === BASE) digs[i] = DIGITS[0]!;
    else {
      digs[i] = DIGITS[d]!;
      carry = false;
    }
  }
  if (!carry) return head! + digs.join("");
  if (head === "Z") return "a" + DIGITS[0]!;
  if (head === "z") return null; // exhausted the positive range
  const h = String.fromCharCode(head!.charCodeAt(0) + 1);
  if (h > "a") digs.push(DIGITS[0]!);
  else digs.pop();
  return h + digs.join("");
}

function decrementInteger(x: string): string | null {
  const [head, ...digs] = x.split("");
  let borrow = true;
  for (let i = digs.length - 1; borrow && i >= 0; i--) {
    const d = DIGITS.indexOf(digs[i]!) - 1;
    if (d === -1) digs[i] = DIGITS[BASE - 1]!;
    else {
      digs[i] = DIGITS[d]!;
      borrow = false;
    }
  }
  if (!borrow) return head! + digs.join("");
  if (head === "a") return "Z" + DIGITS[BASE - 1]!;
  if (head === "A") return null; // exhausted the negative range
  const h = String.fromCharCode(head!.charCodeAt(0) - 1);
  if (h < "Z") digs.push(DIGITS[BASE - 1]!);
  else digs.pop();
  return h + digs.join("");
}

function validateKey(key: string): void {
  if (key === SMALLEST_INT) throw new Error(`ord: reserved key ${JSON.stringify(key)}`);
  const int = integerPart(key);
  if (key.slice(int.length).endsWith(DIGITS[0]!)) {
    throw new Error(`ord: malformed key (trailing "${DIGITS[0]}") ${JSON.stringify(key)}`);
  }
}

/**
 * The ordering key for a node placed between `before` and `after`. Pass `null`
 * for either end: `(null, first)` prepends, `(last, null)` appends, and
 * `(null, null)` is the first child of an empty parent.
 *
 * This is the whole ordering contract — the engine calls it because it is the
 * side that holds the neighbors.
 */
export function generateKeyBetween(before: string | null, after: string | null): string {
  if (before !== null) validateKey(before);
  if (after !== null) validateKey(after);
  if (before !== null && after !== null && before >= after) {
    throw new Error(`ord: cannot order between ${JSON.stringify(before)} and ${JSON.stringify(after)} — not ascending`);
  }

  if (before === null) {
    if (after === null) return "a" + DIGITS[0]!; // integer zero
    const intB = integerPart(after);
    const fracB = after.slice(intB.length);
    if (intB === SMALLEST_INT) return intB + midpoint("", fracB);
    if (intB < after) return intB; // the bare integer already sorts below
    const dec = decrementInteger(intB);
    if (dec === null) throw new Error("ord: cannot prepend below the minimum key");
    return dec;
  }

  if (after === null) {
    const intA = integerPart(before);
    const fracA = before.slice(intA.length);
    const inc = incrementInteger(intA);
    return inc === null ? intA + midpoint(fracA, null) : inc;
  }

  const intA = integerPart(before);
  const fracA = before.slice(intA.length);
  const intB = integerPart(after);
  const fracB = after.slice(intB.length);
  if (intA === intB) return intA + midpoint(fracA, fracB);
  const inc = incrementInteger(intA);
  if (inc === null) throw new Error("ord: cannot increment past the maximum key");
  return inc < after ? inc : intA + midpoint(fracA, null);
}

/** Ascending comparator for two ordering keys — plain lexicographic order. */
export function compareOrd(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** A child that can carry an ordering key (text nodes and outlets cannot). */
function ordable(child: Child | undefined): child is Exclude<Node, { kind: "outlet" }> {
  return typeof child === "object" && child !== null && child.kind !== "outlet";
}

/**
 * The keys bracketing position `index` in `children`, skipping neighbors that
 * can't carry one (bare text, outlets) and any not yet backfilled. Feed the
 * result straight to `generateKeyBetween`.
 */
export function ordNeighbors(children: readonly Child[], index: number): [string | null, string | null] {
  let before: string | null = null;
  for (let i = index - 1; i >= 0; i--) {
    const c = children[i];
    if (ordable(c) && c.ord) {
      before = c.ord;
      break;
    }
  }
  let after: string | null = null;
  for (let i = index; i < children.length; i++) {
    const c = children[i];
    if (ordable(c) && c.ord) {
      after = c.ord;
      break;
    }
  }
  // A backfilled tree is always ascending, but a hand-authored or
  // partially-merged one may not be. Ordering between a non-ascending pair is
  // undefined, so drop the lower bound and land before `after` rather than throw.
  if (before !== null && after !== null && before >= after) before = null;
  return [before, after];
}

/**
 * The key for a node being placed at `index` among `children`.
 * `children` must NOT already contain the node being placed.
 */
export function ordAt(children: readonly Child[], index: number): string {
  const [before, after] = ordNeighbors(children, index);
  return generateKeyBetween(before, after);
}

/**
 * Backfill `ord` on every node in a tree that lacks one, in current array order,
 * so an existing site (authored before ordering keys existed) becomes orderable
 * without changing how it renders. Idempotent: a node that already has a key
 * keeps it, and a run of ord-less children is threaded between whatever keys
 * bracket it.
 *
 * Called once when the engine loads a site. It is deliberately NOT an op —
 * it is load-time normalization that happens before any op stream begins, and
 * it cannot change render order, so replaying it on another client is a no-op.
 */
export function assignOrds(node: Node): void {
  if (node.kind === "outlet") return;
  const children = node.children;
  if (children?.length) {
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      if (!ordable(c)) continue;
      if (!c.ord) {
        // `i + 1` so the scan brackets the node's OWN slot: it looks backward
        // from `i` (skipping self, which has no key yet) and forward from `i+1`,
        // so a run of key-less children threads between the keys around it
        // instead of colliding with the next one that already has a key.
        const [before, after] = ordNeighbors(children, i + 1);
        c.ord = generateKeyBetween(before, after);
      }
      assignOrds(c);
    }
  }
}

/** Deep-clone a subtree with every ordering key removed (authoring → published). */
export function stripOrds<T extends Node>(node: T): T {
  const clone = structuredClone(node);
  const drop = (n: Node): void => {
    if (n.kind === "outlet") return;
    delete n.ord;
    for (const c of n.children ?? []) if (typeof c !== "string") drop(c);
  };
  drop(clone);
  return clone;
}
