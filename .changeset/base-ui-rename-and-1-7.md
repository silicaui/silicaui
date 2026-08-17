---
"@wizeworks/silicaui-react": minor
---

Base UI moves to `@base-ui/react@^1.7.0` — off a deprecated release candidate

Every published version of `@base-ui-components/react` is deprecated with the same message: *"Package was renamed to `@base-ui/react`."* We were pinned to `1.0.0-rc.0` from **2025-12-04**, so the warning printed on every consumer's install while the library itself went 1.0 stable and shipped seven more minors. This moves to the live name at `^1.7.0`.

### It is transparent to consumers

Base UI is a regular `dependency` of `@wizeworks/silicaui-react`, not a peer, so nobody declares it and nobody has to change a package.json. Confirmed by measurement rather than assumption: the generated MCP catalog — every documented component, prop, and type — came out **byte-identical in content** after the swap. No prop was renamed, added, or removed.

**One case does need action.** If you install `@base-ui-components/react` yourself to use Base UI directly alongside Silica, you now have two different copies in the tree, and Base UI's React contexts won't cross between them — a `Field` from one package can't talk to a `Form` from the other. Rename your own dependency to `@base-ui/react` and the duplication goes away.

### What actually changed upstream

Four components became generic function components — `Form`, `Slider.Root`, `Toggle`, and `ToggleGroup`:

```ts
export declare const Form: {
  <FormValues extends Record<string, any> = Record<string, any>>(
    props: Form.Props<FormValues> & { ref?: React.Ref<HTMLFormElement> },
  ): React.JSX.Element;
};
```

That shape matters because `React.ComponentPropsWithoutRef<typeof X>` cannot extract props from a generic callable — it collapses, taking `children` and every callback parameter's type with it. Our wrappers were checked against this and the derived types still resolve; the `verify-form-focus` probe, which depends on Base UI's internal focus sequencing more than anything else we ship, passes unchanged.

`Form` also gained `validationMode`, `onFormSubmit`, and an `actionsRef` imperative handle. Silica doesn't surface those yet — the existing `errors` / `onSubmit` / `focusOnError` API is untouched.

### How this was verified

The risk in a nine-release jump isn't the compiler, it's silent breakage: a renamed data-attribute keeps typechecking and quietly stops matching CSS. So the 24 data-attributes and 13 CSS custom properties our stylesheets actually select on were extracted and diffed across versions — **none were dropped**. Twelve interactive components were then driven in a real browser (open, keyboard, hover, select, Escape) with zero console errors, confirming the attributes and variables are emitted in the states we style, including the ones our CSS positions things with: `--active-tab-left/-width` on the tabs indicator, `--anchor-width` on the select popup, `--transform-origin` on the popover.

Also fixed: the tsup `external` regexes in `silicaui-react` and `silicaui-demos` still matched `/^@base-ui-components\//`, which after the rename would have **bundled Base UI into the published output** instead of externalizing it — a duplicate copy for every consumer. Both now match `/^@base-ui\//`, verified against the built bundle.
