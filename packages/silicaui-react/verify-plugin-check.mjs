/**
 * Behavioral probe for the dev-only "CSS plugin is not loaded" check.
 *
 * The check exists to catch a missing `@plugin` line, which is otherwise silent.
 * Its own contract says a false alarm is worse than silence. It raised one: on a
 * client-side route change the document has long since loaded, but the entered
 * route's stylesheet can still be on its way, so `--sui-plugin` read empty for a
 * moment on a correctly wired storefront and the error fired anyway.
 *
 * Two cases, each in a fresh copy of the module (it fires once per page):
 *   1. The sentinel arrives 400ms after the first component renders → no error.
 *   2. The sentinel never arrives → the error, once.
 *
 *   pnpm --filter @wizeworks/silicaui-react build && node verify-plugin-check.mjs
 */
import { JSDOM } from "jsdom";

let failures = 0;
function check(name, cond, detail) {
  console.log(
    `  ${cond ? "✓" : "✗"} ${name}${cond || !detail ? "" : `\n      ${detail}`}`
  );
  if (!cond) failures++;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** A loaded page whose root may or may not carry the sentinel, and a fresh module. */
async function scenario(label) {
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body></body></html>"
  );
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  const errors = [];
  const original = console.error;
  console.error = (...args) => errors.push(args.join(" "));
  const mod = await import(`./dist/lib/assert-plugin.js?${label}`);
  return {
    mod,
    errors,
    root: dom.window.document.documentElement,
    restore: () => {
      console.error = original;
    },
  };
}

console.log("CSS plugin check");

{
  const s = await scenario("late");
  // The route's stylesheet lands after the first Silica component has rendered.
  s.mod.assertPluginPresent();
  await wait(400);
  s.root.style.setProperty("--sui-plugin", "1");
  await wait(3500);
  s.restore();
  check(
    "styles that arrive after the first render raise no error",
    s.errors.length === 0,
    `got ${String(s.errors.length)}: ${s.errors[0]?.slice(0, 90) ?? ""}`
  );
}

{
  const s = await scenario("missing");
  s.mod.assertPluginPresent();
  s.mod.assertPluginPresent();
  await wait(3500);
  s.restore();
  check(
    "a plugin that never loads is still reported, once",
    s.errors.length === 1 && /CSS plugin is not loaded/.test(s.errors[0] ?? ""),
    `got ${String(s.errors.length)}`
  );
}

if (failures > 0) {
  console.error(`\n${String(failures)} check(s) failed`);
  process.exit(1);
}
console.log("\nall checks passed");
