/**
 * Custom rule: no DOM / storage globals inside a `useState` / `useReducer`
 * initializer.
 *
 * WHY THIS EXISTS. `eslint-plugin-ssr-friendly` is the obvious choice for this
 * and does not work here: it deliberately skips nested function expressions
 * (assuming they're event handlers or effect callbacks), which is exactly the
 * shape of a lazy state initializer. Both real bugs this repo shipped were
 * invisible to it:
 *
 *   useState(() => window.localStorage.getItem(key))   // lazy initializer
 *   const resolve = () => window...; useState(resolve) // nested helper
 *
 * WHY A `typeof window` GUARD DOESN'T HELP. Guarding stops the *crash*, not the
 * *mismatch*. The server has no storage and resolves one value; the client
 * reads a different one; React hydrates with a DOM that disagrees with the
 * markup. `ThemeController` shipped exactly this — the server rendered a Moon,
 * a client with "dark" stored rendered a Sun. So this rule reports the READ
 * regardless of any guard around it. A bare `typeof window !== "undefined"`
 * feature-test on its own is fine and is not reported.
 *
 * THE FIX is always the same: initialize to a value the server can also
 * compute, then adopt the real one in a `useEffect` after mount. See
 * `theme-controller.tsx` or `lib/use-theme.ts` for the reference shape.
 */

const DOM_GLOBALS = new Set([
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "navigator",
  "matchMedia",
  "screen",
  "location",
  "indexedDB",
]);

const STATE_HOOKS = new Set(["useState", "useReducer"]);

/** `useState(x)` / `React.useState(x)` → the hook name, else null. */
function hookName(callee) {
  if (callee.type === "Identifier") return callee.name;
  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier"
  ) {
    return callee.property.name;
  }
  return null;
}

/** Ranges of the argument(s) that React evaluates to produce initial state. */
function initializerArgs(node, name) {
  if (name === "useState") return node.arguments.slice(0, 1);
  // useReducer(reducer, initialArg, init?) — the reducer itself runs on
  // dispatch, not on mount, so only the last two matter.
  return node.arguments.slice(1, 3);
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow reading DOM or storage globals inside a useState/useReducer initializer, which produces an SSR hydration mismatch.",
    },
    schema: [],
    messages: {
      domInInitializer:
        "`{{name}}` is read inside a {{hook}} initializer{{via}}. The server can't read it, so the first client render disagrees with the server's markup — a hydration mismatch. A `typeof` guard prevents the crash but not the mismatch. Initialize to a value the server can also compute, then adopt the real one in a `useEffect` after mount (see lib/use-theme.ts).",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    /** @type {{from:number,to:number,hook:string,via:string}[]} */
    const dangerRanges = [];

    /**
     * Resolve an identifier used AS the initializer (`useState(resolveInitial)`)
     * back to the function it names, so its body counts as initializer code.
     */
    function resolveHelper(node, scope) {
      if (node.type !== "Identifier") return null;
      let s = scope;
      while (s) {
        const variable = s.variables.find((v) => v.name === node.name);
        if (variable) {
          for (const def of variable.defs) {
            if (def.node.type === "FunctionDeclaration") return def.node;
            if (
              def.node.type === "VariableDeclarator" &&
              def.node.init &&
              (def.node.init.type === "ArrowFunctionExpression" ||
                def.node.init.type === "FunctionExpression")
            ) {
              return def.node.init;
            }
          }
          return null;
        }
        s = s.upper;
      }
      return null;
    }

    return {
      CallExpression(node) {
        const name = hookName(node.callee);
        if (!name || !STATE_HOOKS.has(name)) return;

        const scope = sourceCode.getScope(node);
        for (const arg of initializerArgs(node, name)) {
          dangerRanges.push({
            from: arg.range[0],
            to: arg.range[1],
            hook: name,
            via: "",
          });
          const helper = resolveHelper(arg, scope);
          if (helper) {
            dangerRanges.push({
              from: helper.range[0],
              to: helper.range[1],
              hook: name,
              via: ` (via \`${arg.name}\`)`,
            });
          }
        }
      },

      "Program:exit"(program) {
        if (!dangerRanges.length) return;

        // Walking unresolved references rather than raw identifiers means a
        // locally-shadowed `window` (a parameter, an import) resolves to that
        // local variable and never reaches us — shadowing is handled for free.
        const globalScope = sourceCode.getScope(program);
        const unresolved = [
          ...globalScope.through,
          ...globalScope.childScopes.flatMap((s) =>
            s.type === "module" ? s.through : [],
          ),
        ];

        const seen = new Set();
        for (const ref of unresolved) {
          const id = ref.identifier;
          if (!DOM_GLOBALS.has(id.name)) continue;

          // A bare `typeof window` feature-test is fine — it's the READ that
          // diverges between server and client, not the existence check.
          const parent = id.parent;
          if (parent?.type === "UnaryExpression" && parent.operator === "typeof") {
            continue;
          }

          const hit = dangerRanges.find(
            (r) => id.range[0] >= r.from && id.range[1] <= r.to,
          );
          if (!hit) continue;

          const key = `${id.range[0]}`;
          if (seen.has(key)) continue;
          seen.add(key);

          context.report({
            node: id,
            messageId: "domInInitializer",
            data: { name: id.name, hook: hit.hook, via: hit.via },
          });
        }
      },
    };
  },
};
