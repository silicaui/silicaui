// ESLint 9 flat config for the silicaui monorepo.
//
// Scope is deliberately narrow: correctness only. This repo has no formatter
// config, and lint is not allowed to argue about formatting — no stylistic
// rules live here, and none should be added.
//
// The two defect classes this config exists to catch:
//   1. SSR hydration bugs — `useState` initializers / render bodies touching
//      `document`, `window`, `localStorage` (eslint-plugin-ssr-friendly).
//   2. React hooks rule violations (eslint-plugin-react-hooks).

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import ssrFriendly from "eslint-plugin-ssr-friendly";
import noDomInStateInitializer from "./eslint-rules/no-dom-in-state-initializer.mjs";

// --- eslint-plugin-ssr-friendly ESLint 9 compatibility shim -------------
//
// eslint-plugin-ssr-friendly@1.3.0 is the only maintained plugin that catches
// the `useState`-initializer-reads-`document` class of SSR bug, but it has not
// been updated for ESLint 9: its rules call `context.getScope()` and
// `context.getFilename()`, both removed/deprecated in v9, so it crashes with
// "TypeError: context.getScope is not a function".
//
// Its `configs.recommended` is also still eslintrc-format (`plugins` as an
// array of strings), so it cannot be spread into a flat config — we register
// the plugin object and list its four rules explicitly instead.
//
// The rules themselves are fine. The plugin makes exactly one `getScope()`
// call, inside its `Program()` visitor, where the requested scope is the
// module/global scope of the AST root. `sourceCode.getScope(sourceCode.ast)`
// is the v9 equivalent, so this shim is behaviour-preserving rather than a
// substitute rule set. Remove it if upstream ships v9 support.
const withEslint9Compat = (plugin) => ({
  ...plugin,
  rules: Object.fromEntries(
    Object.entries(plugin.rules).map(([name, rule]) => [
      name,
      {
        ...rule,
        create(context) {
          const sourceCode = context.sourceCode ?? context.getSourceCode();
          const patched = Object.create(context, {
            getScope: { value: () => sourceCode.getScope(sourceCode.ast) },
            getFilename: { value: () => context.filename },
          });
          return rule.create(patched);
        },
      },
    ]),
  ),
});

export default tseslint.config(
  {
    // Build artifacts, vendored output, and generated data are never linted.
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/*.d.ts",
      "packages/silicaui-mcp/src/data/**",
    ],
  },

  {
    // Only source trees. Scripts, configs, and tests are out of scope for now.
    files: ["packages/*/src/**/*.{ts,tsx,js,jsx,mjs}", "apps/site/src/**/*.{ts,tsx,js,jsx,mjs}"],

    extends: [js.configs.recommended, ...tseslint.configs.recommended],

    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        // Intentionally NOT type-aware. Type-aware linting (and rules like
        // no-floating-promises) would need a project service across 13
        // packages and produces far more noise than signal here.
      },
    },

    plugins: {
      "react-hooks": reactHooks,
      "ssr-friendly": withEslint9Compat(ssrFriendly),
      silica: { rules: { "no-dom-in-state-initializer": noDomInStateInitializer } },
    },

    rules: {
      // --- React hooks ------------------------------------------------
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // --- SSR safety (the reason this config exists) -----------------
      // ssr-friendly covers DOM access in module scope and render bodies, but
      // structurally CANNOT see a lazy `useState` initializer (it skips nested
      // functions). Both SSR bugs this repo actually shipped were of that
      // shape, so the local rule below is the one that earns its keep.
      "silica/no-dom-in-state-initializer": "error",
      "ssr-friendly/no-dom-globals-in-module-scope": "error",
      "ssr-friendly/no-dom-globals-in-constructor": "error",
      "ssr-friendly/no-dom-globals-in-react-cc-render": "error",
      "ssr-friendly/no-dom-globals-in-react-fc": "error",

      // --- Turned off: noise, not signal ------------------------------
      // A component library legitimately uses `any` at generic-forwarding
      // boundaries; this fires in the hundreds and hides real findings.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      // Handled below with an underscore escape hatch instead.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // --- High-signal correctness ------------------------------------
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      eqeqeq: ["error", "smart"],
      "no-var": "error",
      "prefer-const": ["warn", { destructuring: "all" }],
    },
  },
);
