/**
 * Props helpers for components whose root is a void HTML element.
 *
 * React throws a hard, page-killing error when a void element (`<input>`,
 * `<img>`, `<br>`, …) is given `children`:
 *
 *   input is a void element tag and must neither have `children` nor
 *   use `dangerouslySetInnerHTML`
 *
 * `React.InputHTMLAttributes` permits `children`, so a wrapper that spreads
 * `...rest` onto an `<input>` type-checks fine and then crashes at runtime —
 * the worst possible split. `VoidElementProps` closes that gap at the type
 * level so the mistake is a red squiggle instead of a white screen.
 *
 * Note this matters even when the component's ROOT JSX is a `<div>`: what
 * counts is where `{...rest}` lands. `SearchInput` and `PasswordInput` both
 * render a wrapper div but spread onto the inner `<input>`, so they need this
 * exactly as much as bare `Input` does.
 *
 * Components where a caption is meaningful (`Checkbox`, `Radio`, `Toggle`)
 * deliberately do NOT use this — they accept `children` and wrap the control
 * in a `<label>`, matching what `silicaui-html` already lowers `CheckboxOption`
 * and `RadioOption` to.
 */

/** Strip `children` (and `dangerouslySetInnerHTML`) from a props type. */
export type VoidElementProps<P> = Omit<
  P,
  "children" | "dangerouslySetInnerHTML"
>;
