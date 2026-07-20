/**
 * RuleTester coverage for the local ESLint rules.
 *
 *   node eslint-rules/verify-rules.mjs
 *
 * The `invalid` cases are not hypotheticals — cases 1 and 2 are the exact
 * shapes of SSR bugs this repo shipped to npm (`ThemeController`'s nested
 * `resolveInitial` helper, and the lazy `useState(() => …)` initializer).
 * `eslint-plugin-ssr-friendly` reports neither, which is why this rule exists;
 * if someone later deletes it as redundant, these cases are the argument.
 */
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";
import rule from "./no-dom-in-state-initializer.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2023,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-dom-in-state-initializer", rule, {
  valid: [
    // A bare feature-test resolves the same on both sides — not a mismatch.
    "const [v] = React.useState(typeof window !== 'undefined');",
    // The correct shape: SSR-safe initial value, real value adopted post-mount.
    `const [v, setV] = React.useState(undefined);
     React.useEffect(() => { setV(window.localStorage.getItem('x')); }, []);`,
    // A locally-shadowed `window` is not the global one.
    "function C({ window }) { const [v] = React.useState(window.name); return v; }",
    // DOM access in an event handler is fine — it runs after mount.
    "function C() { const [v, setV] = React.useState(0); return <b onClick={() => setV(window.innerWidth)}>{v}</b>; }",
    // The reducer itself runs on dispatch, not on mount.
    "const [v, d] = React.useReducer((s) => window.innerWidth, 0);",
    // Plain state, no DOM anywhere.
    "const [v, setV] = React.useState('light');",
  ],

  invalid: [
    {
      name: "SHIPPED BUG: nested helper referenced as the initializer, typeof-guarded",
      code: `
        function C({ storageKey, defaultValue }) {
          const resolveInitial = () => {
            if (typeof window !== 'undefined') {
              const stored = window.localStorage.getItem(storageKey);
              if (stored) return stored;
            }
            return defaultValue;
          };
          const [t] = React.useState(resolveInitial);
          return t;
        }`,
      // Full data asserted here so the "via <helper>" attribution — the part
      // ssr-friendly structurally cannot produce — stays covered.
      errors: [
        {
          messageId: "domInInitializer",
          data: { name: "window", hook: "useState", via: " (via `resolveInitial`)" },
        },
      ],
    },
    {
      name: "SHIPPED BUG SHAPE: lazy inline initializer",
      code: "const [v] = React.useState(() => document.documentElement.dataset.theme);",
      errors: [{ messageId: "domInInitializer" }],
    },
    {
      name: "eager read in the initializer",
      code: "const [v] = React.useState(localStorage.getItem('x'));",
      errors: [{ messageId: "domInInitializer" }],
    },
    {
      name: "useReducer initial-state argument",
      code: "const [v, d] = React.useReducer((s) => s, window.innerWidth);",
      errors: [{ messageId: "domInInitializer" }],
    },
    {
      name: "useReducer lazy init argument",
      code: "const [v, d] = React.useReducer((s) => s, null, () => navigator.language);",
      errors: [{ messageId: "domInInitializer" }],
    },
    {
      name: "bare useState import (not React.useState)",
      code: "import { useState } from 'react'; const [v] = useState(() => window.matchMedia('(min-width:0px)').matches);",
      errors: [{ messageId: "domInInitializer" }],
    },
  ],
});

console.log("✓ eslint-rules: no-dom-in-state-initializer — 6 valid, 6 invalid cases pass");
