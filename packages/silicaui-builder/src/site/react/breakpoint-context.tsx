/**
 * The ACTIVE AUTHORING BREAKPOINT — which container-query variant the semantic
 * Inspector controls write (doc 139 §1).
 *
 * CONTAINER QUERIES, NOT VIEWPORT ONES. Every prefix here is a Tailwind v4
 * container variant (`@3xl:`), never `md:`. The canvas is an element whose width
 * the device toggle sets, so a container variant reflows honestly when the
 * author switches device; a viewport variant resolves against the browser window
 * and would leave the canvas quietly lying about what mobile looks like.
 * `Editor.ensureContainer` guarantees the tree root is a container context, so a
 * node with no closer container measures the page — the width on screen.
 *
 * MOBILE-FIRST, SO BASE IS THE SMALLEST. Container variants are min-width, which
 * fixes the ladder: base applies everywhere, `@3xl:` adds at 768px and up,
 * `@5xl:` at 1024px and up. There is no arrangement where the largest device
 * writes the unprefixed value.
 *
 * WHICH IS WHY THIS IS ITS OWN CONTROL. Deriving the breakpoint from the device
 * toggle alone looks tidier and defaults wrong: the canvas opens on Desktop, so
 * every first edit an author made would land on `@5xl:` and silently do nothing
 * at any smaller size. So the breakpoint starts at BASE regardless of the device
 * the canvas opens on, and is shown, not inferred.
 *
 * The two still cooperate: CHANGING the device moves the breakpoint to match, so
 * the ordinary flow ("switch to tablet, adjust") is still one gesture. Only the
 * initial state is decoupled, which is the only place the inference was wrong.
 */
import * as React from "react";
import { BREAKPOINT_CHOICES } from "../class-tokens";

export interface BreakpointCtx {
  /** The variant prefix semantic controls write: "" (base) or `@3xl:`/`@5xl:`. */
  prefix: string;
  /** Human label for the current breakpoint. */
  label: string;
  /** Choose a breakpoint explicitly (the Inspector's selector). */
  setPrefix: (prefix: string) => void;
  /** Everything offerable, ascending — base first. */
  choices: readonly { prefix: string; label: string; hint: string }[];
}

// The ladder itself lives in `../class-tokens` — framework-neutral, because a
// host safelisting the canvas vocabulary needs it and `/vocab` must not pull in
// React. Re-exported here so the React side has one obvious import.
export { BREAKPOINT_CHOICES } from "../class-tokens";

const PREFIX_FOR_DEVICE: Record<string, string> = Object.fromEntries(
  BREAKPOINT_CHOICES.map((c) => [c.device, c.prefix]),
);

const Ctx = React.createContext<BreakpointCtx>({
  prefix: "",
  label: "All sizes",
  setPrefix: () => {},
  choices: BREAKPOINT_CHOICES,
});

export function BreakpointProvider({ device, children }: { device: string; children: React.ReactNode }) {
  const [prefix, setPrefix] = React.useState("");

  // Follow the device — but only on an actual CHANGE, never on mount. Mount is
  // exactly the case where the device (Desktop by default) is not a statement
  // about what the author wants to edit.
  const lastDevice = React.useRef(device);
  React.useEffect(() => {
    if (lastDevice.current === device) return;
    lastDevice.current = device;
    setPrefix(PREFIX_FOR_DEVICE[device] ?? "");
  }, [device]);

  const value = React.useMemo<BreakpointCtx>(
    () => ({
      prefix,
      label: BREAKPOINT_CHOICES.find((c) => c.prefix === prefix)?.label ?? "All sizes",
      setPrefix,
      choices: BREAKPOINT_CHOICES,
    }),
    [prefix],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The breakpoint every semantic Inspector control reads and writes at. */
export const useBreakpoint = (): BreakpointCtx => React.useContext(Ctx);
