/**
 * Behavioral probe for `Timestamp`'s tooltip.
 *
 * A relative label is a summary: "2 weeks ago" is easy to read and useless to
 * quote. Somebody chasing a late delivery has to say "you promised me the
 * 4th", so the exact moment has to be reachable — and the `title` is where
 * every other relative time on the web puts it.
 *
 * It used to be keyed on the FORMAT rather than on what got rendered:
 * `format="auto"` carried a title whether it landed on "2 minutes ago" or on
 * "Jul 8", and an explicit `format="relative"` carried none. So the one case
 * that always needs the absolute time was the one case without it, across 210
 * call sites in the consumers.
 *
 * Rendered markup only — no jsdom needed.
 *
 *   pnpm --filter @wizeworks/silicaui-react build && node verify-timestamp.mjs
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Timestamp } from "./dist/index.js";

const h = React.createElement;
let failures = 0;
function check(name, cond, detail) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}${cond || !detail ? "" : `\n      ${detail}`}`);
  if (!cond) failures++;
}

const markup = (props) => renderToStaticMarkup(h(Timestamp, props));
const hasTitle = (m) => / title="/.test(m);

const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
const aMinuteAgo = new Date(Date.now() - 60 * 1000);

console.log("Timestamp tooltip");

{
  const m = markup({ value: twoWeeksAgo, format: "relative" });
  check('format="relative" carries the absolute time in its title', hasTitle(m), `rendered ${m}`);
}

{
  const m = markup({ value: aMinuteAgo });
  check(
    'format="auto" landing on a relative label still carries one',
    hasTitle(m),
    `rendered ${m}`,
  );
}

{
  const m = markup({ value: twoWeeksAgo });
  check(
    'format="auto" landing on an absolute label carries none',
    !hasTitle(m),
    `the text is already the answer; rendered ${m}`,
  );
}

{
  const m = markup({ value: twoWeeksAgo, format: "absolute" });
  check('format="absolute" carries none', !hasTitle(m), `rendered ${m}`);
}

{
  // A caller's own title still wins — `{...rest}` is spread after.
  const m = markup({
    value: twoWeeksAgo,
    format: "relative",
    title: "Promised date",
  });
  check(
    "a caller's own title is not overwritten",
    m.includes('title="Promised date"'),
    `rendered ${m}`,
  );
}

{
  // Matched case-insensitively on purpose: React's server renderer emits this
  // one as `dateTime`, and HTML attribute names are ASCII case-insensitive, so
  // the parsed attribute is `datetime` either way.
  const m = markup({ value: twoWeeksAgo, format: "relative" });
  check(
    "the machine-readable datetime is there either way",
    new RegExp(`datetime="${twoWeeksAgo.toISOString()}"`, "i").test(m),
    `rendered ${m}`,
  );
}

console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
